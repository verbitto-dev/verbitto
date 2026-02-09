import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { PublicKey } from '@solana/web3.js'
import { PROGRAM_ID } from '@verbitto/program'
import { getConnection } from '../lib/solana.js'
import { AgentResponseSchema } from '../schemas/agent.js'
import { AddressParamSchema, ErrorSchema } from '../schemas/common.js'

const app = new OpenAPIHono()

function decodeAgentProfile(pubkey: PublicKey, data: Buffer) {
  let offset = 8

  const authority = new PublicKey(data.subarray(offset, offset + 32))
  offset += 32
  const reputationScore = data.readBigInt64LE(offset)
  offset += 8
  const tasksCompleted = data.readBigUInt64LE(offset)
  offset += 8
  const tasksDisputed = data.readBigUInt64LE(offset)
  offset += 8
  const disputesWon = data.readBigUInt64LE(offset)
  offset += 8
  const totalEarnedLamports = data.readBigUInt64LE(offset)
  offset += 8
  const skillTags = data.readUInt8(offset)
  offset += 1

  const skills = [
    'DataLabeling',
    'LiteratureReview',
    'CodeReview',
    'Translation',
    'Analysis',
    'Research',
    'Other',
  ].filter((_, i) => (skillTags & (1 << i)) !== 0)

  return {
    address: pubkey.toBase58(),
    authority: authority.toBase58(),
    reputationScore: reputationScore.toString(),
    tasksCompleted: tasksCompleted.toString(),
    tasksDisputed: tasksDisputed.toString(),
    disputesWon: disputesWon.toString(),
    totalEarnedLamports: totalEarnedLamports.toString(),
    totalEarnedSol: Number(totalEarnedLamports) / 1e9,
    skillTags,
    skills,
    winRate:
      Number(tasksDisputed) > 0
        ? `${((Number(disputesWon) / Number(tasksDisputed)) * 100).toFixed(1)}%`
        : 'N/A',
  }
}

const getAgentRoute = createRoute({
  method: 'get',
  path: '/{address}',
  tags: ['Agents'],
  summary: 'Get agent profile',
  description: 'Retrieve agent profile by wallet address',
  request: {
    params: AddressParamSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: AgentResponseSchema,
        },
      },
      description: 'Agent profile',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Invalid address',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Agent profile not found',
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
app.openapi(getAgentRoute, async (c) => {
  const { address } = c.req.valid('param')
  const connection = getConnection()

  let walletKey: PublicKey
  try {
    walletKey = new PublicKey(address)
  } catch {
    return c.json({ error: 'Invalid address' }, 400)
  }

  try {
    // Derive agent profile PDA from wallet address
    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), walletKey.toBuffer()],
      PROGRAM_ID
    )

    const info = await connection.getAccountInfo(profilePda)
    if (!info) {
      return c.json({ error: 'Agent profile not found' }, 404)
    }

    const profile = decodeAgentProfile(profilePda, Buffer.from(info.data))

    // Also get SOL balance
    const balance = await connection.getBalance(walletKey)

    return c.json({
      ...profile,
      walletAddress: address,
      balanceLamports: balance.toString(),
      balanceSol: balance / 1e9,
    })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500)
  }
})

export default app
