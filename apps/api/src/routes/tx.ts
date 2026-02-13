import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import {
  Connection,
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
  getTemplatePda,
  getVotePda,
} from '@verbitto/program'
import BN from 'bn.js'
import { loadIdl } from '../lib/idl.js'
import { getConnection, getLatestBlockhashWithTimeout } from '../lib/solana.js'
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

// Cache program instance to avoid repeated initialization
let cachedProgram: Program | null = null
let cachedConnection: Connection | null = null

async function getProgram() {
  if (cachedProgram && cachedConnection) {
    return { program: cachedProgram, connection: cachedConnection }
  }

  console.log('[getProgram] Creating new program instance...')
  const startTime = Date.now()

  const connection = getConnection()
  const provider = new AnchorProvider(connection, new Wallet(dummyKeypair), {
    commitment: 'confirmed',
  })

  const idl = loadIdl()
  console.log(`[getProgram] IDL loaded in ${Date.now() - startTime}ms`)

  cachedProgram = new Program(idl, provider)
  cachedConnection = connection
  console.log(`[getProgram] Program initialized in ${Date.now() - startTime}ms`)

  return { program: cachedProgram, connection: cachedConnection }
}

const buildTransactionRoute = createRoute({
  method: 'post',
  path: '/build',
  tags: ['Transactions'],
  summary: 'Build an unsigned transaction',
  description:
    'Build an unsigned transaction for various instructions. Sign locally then submit via /v1/tx/send',
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
  console.log('[tx/build] Handler entered')
  
  // Bypass validation issues - parse body manually
  let body: any
  try {
    body = await c.req.json()
    console.log('[tx/build] Body parsed:', JSON.stringify(body))
  } catch (err) {
    console.error('[tx/build] Body parse error:', err)
    return c.json({ error: 'Invalid JSON body' }, 400)
  }
  
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
    console.log(`[tx/build] Starting build for instruction: ${instruction}`)
    const startTime = Date.now()

    // Timeout protection for the entire build process
    const buildPromise = (async () => {
      const { program, connection } = await getProgram()
      console.log(`[tx/build] Got program in ${Date.now() - startTime}ms`)

      let ix: TransactionInstruction
      switch (instruction) {
        case 'registerAgent': {
          const skillTags = params?.skillTags ?? 0
          console.log(`[tx/build] Building registerAgent instruction...`)
          const ixStartTime = Date.now()
          ix = await program.methods
            .registerAgent(skillTags)
            .accounts({
              agentProfile: getAgentProfilePda(signerKey),
              authority: signerKey,
              systemProgram: SystemProgram.programId,
            })
            .instruction()
          console.log(`[tx/build] Instruction built in ${Date.now() - ixStartTime}ms`)
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
              task: taskPda,
              dispute: disputePda,
              platform: getPlatformPda(),
              vote: votePda,
              voterProfile: getAgentProfilePda(signerKey),
              voter: signerKey,
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

        case 'expireTask': {
          if (!params?.task) {
            return c.json({ error: 'Missing params.task' }, 400)
          }
          const taskPda = new PublicKey(params.task as string)

          // Fetch task to get creator
          const taskInfo = await connection.getAccountInfo(taskPda)
          if (!taskInfo) {
            return c.json({ error: 'Task account not found' }, 400)
          }
          // creator pubkey is at offset 8 (after discriminator)
          const taskCreator = new PublicKey(taskInfo.data.subarray(8, 40))

          ix = await program.methods
            .expireTask()
            .accounts({
              task: taskPda,
              creator: taskCreator,
              platform: getPlatformPda(),
              caller: signerKey,
            })
            .instruction()
          break
        }

        case 'resolveDispute': {
          if (!params?.task) {
            return c.json({ error: 'Missing params.task' }, 400)
          }
          const taskPda = new PublicKey(params.task as string)
          const disputePda = getDisputePda(taskPda)
          const platform = getPlatformPda()

          // Fetch task to get creator and agent
          const taskAcct = await connection.getAccountInfo(taskPda)
          if (!taskAcct) {
            return c.json({ error: 'Task account not found' }, 400)
          }
          const taskCreatorKey = new PublicKey(taskAcct.data.subarray(8, 40))
          // agent is at offset 57 (disc:8 + creator:32 + taskIndex:8 + bounty:8 + status:1)
          const taskAgentKey = new PublicKey(taskAcct.data.subarray(57, 89))

          // Fetch treasury from platform
          const platInfo = await connection.getAccountInfo(platform)
          let treasuryKey = signerKey
          if (platInfo) {
            const platData = decodePlatform(Buffer.from(platInfo.data))
            treasuryKey = platData.treasury
          }

          ix = await program.methods
            .resolveDispute()
            .accounts({
              dispute: disputePda,
              task: taskPda,
              platform,
              creator: taskCreatorKey,
              agent: taskAgentKey,
              agentProfile: getAgentProfilePda(taskAgentKey),
              treasury: treasuryKey,
              caller: signerKey,
            })
            .instruction()
          break
        }

        case 'createTemplate': {
          if (!params?.title || !params?.category) {
            return c.json({ error: 'Missing required params: title, category' }, 400)
          }
          const platform = getPlatformPda()

          // Fetch template count from platform
          const platAcct = await connection.getAccountInfo(platform)
          let templateIndex = 0n
          if (platAcct) {
            const platData = decodePlatform(Buffer.from(platAcct.data))
            templateIndex = platData.templateCount
          }

          const templatePda = getTemplatePda(signerKey, templateIndex)
          const descHash = params.descriptionHash
            ? Array.from(Buffer.from(params.descriptionHash as string, 'hex'))
            : Array.from(Buffer.alloc(32))
          const defaultBounty = new BN((params.defaultBountyLamports as string | number) ?? 0)

          ix = await program.methods
            .createTemplate(params.title as string, descHash, defaultBounty, params.category)
            .accounts({
              template: templatePda,
              platform,
              creator: signerKey,
              systemProgram: SystemProgram.programId,
            })
            .instruction()
          break
        }

        case 'deactivateTemplate': {
          if (!params?.template) {
            return c.json({ error: 'Missing params.template' }, 400)
          }
          const templatePda = new PublicKey(params.template as string)

          ix = await program.methods
            .deactivateTemplate()
            .accounts({
              template: templatePda,
              platform: getPlatformPda(),
              creator: signerKey,
            })
            .instruction()
          break
        }

        case 'reactivateTemplate': {
          if (!params?.template) {
            return c.json({ error: 'Missing params.template' }, 400)
          }
          const templatePda = new PublicKey(params.template as string)

          ix = await program.methods
            .reactivateTemplate()
            .accounts({
              template: templatePda,
              platform: getPlatformPda(),
              creator: signerKey,
            })
            .instruction()
          break
        }

        case 'createTaskFromTemplate': {
          if (!params?.template || !params?.bountyLamports || !params?.deadline) {
            return c.json(
              { error: 'Missing required params: template, bountyLamports, deadline' },
              400
            )
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
          const templatePda = new PublicKey(params.template as string)

          ix = await program.methods
            .createTaskFromTemplate(
              new BN(params.bountyLamports as string | number),
              new BN(params.deadline as string | number),
              new BN((params.reputationReward as number) ?? 50),
              new BN(taskIndex.toString())
            )
            .accounts({
              task: taskPda,
              creatorCounter: counterPda,
              template: templatePda,
              platform: getPlatformPda(),
              creator: signerKey,
              systemProgram: SystemProgram.programId,
            })
            .instruction()
          break
        }

        default:
          return c.json({ error: `Unknown instruction: ${instruction}` }, 400)
      }

      const tx = new Transaction().add(ix)
      tx.feePayer = signerKey

      try {
        const { blockhash } = await getLatestBlockhashWithTimeout(connection, 10000)
        tx.recentBlockhash = blockhash
      } catch (error) {
        console.error('Failed to get blockhash:', error)
        return c.json(
          {
            error: 'Failed to get latest blockhash from Solana RPC. The RPC endpoint may be slow or unavailable.',
          },
          500
        )
      }

      const serialized = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      })

      return c.json({
        transaction: serialized.toString('base64'),
        message: `Unsigned ${instruction} transaction. Sign with your wallet, then POST to /v1/tx/send.`,
      })
    })() // End of buildPromise

    // Race against timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Transaction build timeout - exceeded 20s')), 20000)
    })

    await Promise.race([buildPromise, timeoutPromise])
  } catch (error) {
    console.error('[tx/build] Error:', error)
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

// WORKAROUND: Plain POST route to bypass Hono OpenAPI issues in Vercel
app.post('/build-plain', async (c) => {
  console.log('[tx/build-plain] Plain handler entered')
  
  let body: any
  try {
    body = await c.req.json()
    console.log('[tx/build-plain] Body parsed:', JSON.stringify(body))
  } catch (err) {
    console.error('[tx/build-plain] Body parse error:', err)
    return c.json({ error: 'Invalid JSON body' }, 400)
  }
  
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
    console.log(`[tx/build-plain] Starting build for instruction: ${instruction}`)
    const startTime = Date.now()

    const { program, connection } = await getProgram()
    console.log(`[tx/build-plain] Got program in ${Date.now() - startTime}ms`)

    let ix: TransactionInstruction
    
    if (instruction === 'registerAgent') {
      const skillTags = params?.skillTags ?? 0
      console.log(`[tx/build-plain] Building registerAgent instruction...`)
      const ixStartTime = Date.now()
      ix = await program.methods
        .registerAgent(skillTags)
        .accounts({
          agentProfile: getAgentProfilePda(signerKey),
          authority: signerKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
      console.log(`[tx/build-plain] Instruction built in ${Date.now() - ixStartTime}ms`)
    } else {
      return c.json({ error: `Instruction ${instruction} not supported in plain route` }, 400)
    }

    const latestBlockhash = await getLatestBlockhashWithTimeout(connection, 10000)
    const tx = new Transaction({
      feePayer: signerKey,
      ...latestBlockhash,
    }).add(ix)

    const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false })
    const base64Tx = Buffer.from(serialized).toString('base64')

    console.log(`[tx/build-plain] Total time: ${Date.now() - startTime}ms`)

    return c.json({
      transaction: base64Tx,
      message: `Unsigned ${instruction} transaction. Sign with your wallet, then POST to /v1/tx/send.`,
    })
  } catch (error) {
    console.error('[tx/build-plain] Error:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Build failed' }, 500)
  }
})

export default app
