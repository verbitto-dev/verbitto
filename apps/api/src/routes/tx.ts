import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  type TransactionInstruction,
} from '@solana/web3.js'
import {
  decodePlatform,
  getAgentProfilePda,
  getCreatorCounterPda,
  getDisputePda,
  getPlatformPda,
  getTaskPda,
  getVotePda,
  PROGRAM_ID,
} from '@verbitto/program'
import BN from 'bn.js'
import { getConnection } from '../lib/solana.js'
import { ErrorSchema } from '../schemas/common.js'
import {
  BuildTransactionRequestSchema,
  BuildTransactionResponseSchema,
  SendTransactionRequestSchema,
  SendTransactionResponseSchema,
} from '../schemas/tx.js'

const app = new OpenAPIHono()

// Dummy wallet for building unsigned transactions
const dummyKeypair = Keypair.generate()

// Load IDL from local file
function loadIdl() {
  try {
    // Try multiple possible paths
    const possiblePaths = [
      join(process.cwd(), 'target/idl/task_escrow.json'), // Running from root
      join(process.cwd(), '../../target/idl/task_escrow.json'), // Running from apps/api
    ]

    for (const idlPath of possiblePaths) {
      try {
        const idlData = readFileSync(idlPath, 'utf-8')
        return JSON.parse(idlData)
      } catch { }
    }

    throw new Error('IDL not found in any expected location')
  } catch (err) {
    throw new Error(`IDL file not found. Run 'anchor build' first. Error: ${err}`)
  }
}

async function getProgram() {
  const connection = getConnection()
  const provider = new AnchorProvider(connection, new Wallet(dummyKeypair), {
    commitment: 'confirmed',
  })

  const idl = loadIdl()
  return { program: new Program(idl, provider), connection }
}

const buildTransactionRoute = createRoute({
  method: 'post',
  path: '/build',
  tags: ['Transactions'],
  summary: 'Build an unsigned transaction',
  description:
    'Build an unsigned transaction for various instructions. Sign locally then submit via /api/v1/tx/send',
  request: {
    body: {
      content: {
        'application/json': {
          schema: BuildTransactionRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: BuildTransactionResponseSchema,
        },
      },
      description: 'Unsigned transaction built successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Invalid request parameters',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Internal server error',
    },
  },
})

// @ts-expect-error - Hono OpenAPI type inference limitation with multiple status codes
app.openapi(buildTransactionRoute, async (c) => {
  const body = c.req.valid('json')
  const { instruction, signer, params } = body

  if (!instruction || !signer) {
    return c.json({ error: 'Missing required fields: instruction, signer' }, 400)
  }

  let signerKey: PublicKey
  try {
    signerKey = new PublicKey(signer)
  } catch {
    return c.json({ error: 'Invalid signer address' }, 400)
  }

  try {
    const { program, connection } = await getProgram()

    let ix: TransactionInstruction
    switch (instruction) {
      case 'registerAgent': {
        const skillTags = params?.skillTags ?? 0
        ix = await program.methods
          .registerAgent(skillTags)
          .accounts({
            agentProfile: getAgentProfilePda(signerKey),
            authority: signerKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction()
        break
      }

      case 'claimTask': {
        if (!params?.task) {
          return c.json({ error: 'Missing params.task' }, 400)
        }
        const taskPda = new PublicKey(params.task)
        ix = await program.methods
          .claimTask()
          .accounts({
            task: taskPda,
            platform: getPlatformPda(),
            agentProfile: getAgentProfilePda(signerKey),
            agent: signerKey,
          })
          .instruction()
        break
      }

      case 'submitDeliverable': {
        if (!params?.task || !params?.deliverableHash) {
          return c.json({ error: 'Missing params.task or params.deliverableHash' }, 400)
        }
        const taskPda = new PublicKey(params.task as string)
        const hash = Array.from(Buffer.from(params.deliverableHash as string, 'hex'))
        ix = await program.methods
          .submitDeliverable(hash)
          .accounts({
            task: taskPda,
            platform: getPlatformPda(),
            agent: signerKey,
          })
          .instruction()
        break
      }

      case 'createTask': {
        if (!params?.title || !params?.bountyLamports || !params?.deadline) {
          return c.json({ error: 'Missing required params: title, bountyLamports, deadline' }, 400)
        }

        const counterPda = getCreatorCounterPda(signerKey)
        let taskIndex = 0n
        try {
          const info = await connection.getAccountInfo(counterPda)
          if (info) {
            taskIndex = Buffer.from(info.data).readBigUInt64LE(8 + 32)
          }
        } catch {
          /* first task */
        }

        const taskPda = getTaskPda(signerKey, taskIndex)
        const descHash = params.descriptionHash
          ? Array.from(Buffer.from(params.descriptionHash as string, 'hex'))
          : Array.from(Buffer.alloc(32))

        ix = await program.methods
          .createTask(
            params.title as string,
            descHash,
            new BN(params.bountyLamports as string | number),
            new BN(taskIndex.toString()),
            new BN(params.deadline as string | number),
            new BN((params.reputationReward as number) ?? 50)
          )
          .accounts({
            task: taskPda,
            platform: getPlatformPda(),
            creatorCounter: counterPda,
            creator: signerKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction()
        break
      }

      case 'openDispute': {
        if (!params?.task) {
          return c.json({ error: 'Missing params.task' }, 400)
        }
        const taskPda = new PublicKey(params.task as string)
        const disputePda = getDisputePda(taskPda)
        const reason = params.reason ?? { qualityIssue: {} }
        const evidenceHash = params.evidenceHash
          ? Array.from(Buffer.from(params.evidenceHash as string, 'hex'))
          : Array.from(Buffer.alloc(32))

        ix = await program.methods
          .openDispute(reason, evidenceHash)
          .accounts({
            task: taskPda,
            dispute: disputePda,
            initiator: signerKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction()
        break
      }

      case 'castVote': {
        if (!params?.task || !params?.ruling) {
          return c.json({ error: 'Missing params.task or params.ruling' }, 400)
        }
        const taskPda = new PublicKey(params.task)
        const disputePda = getDisputePda(taskPda)
        const votePda = getVotePda(disputePda, signerKey)

        ix = await program.methods
          .castVote(params.ruling)
          .accounts({
            dispute: disputePda,
            task: taskPda,
            arbitratorProfile: getAgentProfilePda(signerKey),
            arbitrator: signerKey,
            vote: votePda,
            systemProgram: SystemProgram.programId,
          })
          .instruction()
        break
      }

      case 'updateAgentSkills': {
        const skillTags = params?.skillTags ?? 0
        ix = await program.methods
          .updateAgentSkills(skillTags)
          .accounts({
            agentProfile: getAgentProfilePda(signerKey),
            authority: signerKey,
          })
          .instruction()
        break
      }

      case 'approveAndSettle': {
        if (!params?.task || !params?.agent) {
          return c.json({ error: 'Missing params.task or params.agent' }, 400)
        }
        const taskPda = new PublicKey(params.task)
        const agentKey = new PublicKey(params.agent)
        const platform = getPlatformPda()

        // Fetch treasury from platform account
        const platformInfo = await connection.getAccountInfo(platform)
        let treasury = signerKey
        if (platformInfo) {
          const platformData = decodePlatform(Buffer.from(platformInfo.data))
          treasury = platformData.treasury
        }

        ix = await program.methods
          .approveAndSettle()
          .accounts({
            task: taskPda,
            platform,
            creator: signerKey,
            agent: agentKey,
            agentProfile: getAgentProfilePda(agentKey),
            treasury,
          })
          .instruction()
        break
      }

      case 'rejectSubmission': {
        if (!params?.task) {
          return c.json({ error: 'Missing params.task' }, 400)
        }
        const taskPda = new PublicKey(params.task as string)
        const reasonHash = params.reasonHash
          ? Array.from(Buffer.from(params.reasonHash as string, 'hex'))
          : Array.from(Buffer.alloc(32))

        ix = await program.methods
          .rejectSubmission(reasonHash)
          .accounts({
            task: taskPda,
            creator: signerKey,
          })
          .instruction()
        break
      }

      case 'cancelTask': {
        if (!params?.task) {
          return c.json({ error: 'Missing params.task' }, 400)
        }
        const taskPda = new PublicKey(params.task)

        ix = await program.methods
          .cancelTask()
          .accounts({
            task: taskPda,
            creator: signerKey,
          })
          .instruction()
        break
      }

      default:
        return c.json({ error: `Unknown instruction: ${instruction}` }, 400)
    }

    const tx = new Transaction().add(ix)
    tx.feePayer = signerKey
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })

    return c.json({
      transaction: serialized.toString('base64'),
      message: `Unsigned ${instruction} transaction. Sign with your wallet, then POST to /api/v1/tx/send.`,
    })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500)
  }
})

const sendTransactionRoute = createRoute({
  method: 'post',
  path: '/send',
  tags: ['Transactions'],
  summary: 'Submit a signed transaction',
  description: 'Submit a base64 encoded signed transaction to the Solana network',
  request: {
    body: {
      content: {
        'application/json': {
          schema: SendTransactionRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SendTransactionResponseSchema,
        },
      },
      description: 'Transaction submitted successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Missing or invalid transaction',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Transaction failed',
    },
  },
})

// @ts-expect-error - Hono OpenAPI type inference limitation with multiple status codes
app.openapi(sendTransactionRoute, async (c) => {
  const body = c.req.valid('json')
  const { signedTransaction } = body

  if (!signedTransaction) {
    return c.json({ error: 'Missing signedTransaction (base64 encoded)' }, 400)
  }

  try {
    const connection = getConnection()
    const txBuffer = Buffer.from(signedTransaction, 'base64')
    const _tx = Transaction.from(txBuffer)

    const signature = await connection.sendRawTransaction(txBuffer, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    })

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed')

    return c.json({
      signature,
      explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Transaction failed' }, 500)
  }
})

export default app
