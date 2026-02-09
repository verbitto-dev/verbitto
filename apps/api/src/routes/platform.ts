import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { decodePlatform, getPlatformPda } from '@verbitto/program'
import { getConnection } from '../lib/solana.js'
import { ErrorSchema } from '../schemas/common.js'
import { PlatformResponseSchema } from '../schemas/platform.js'

const app = new OpenAPIHono()

const getPlatformRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Platform'],
  summary: 'Get platform configuration',
  description: 'Retrieves platform configuration including fees, limits, and state',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PlatformResponseSchema,
        },
      },
      description: 'Platform configuration',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Platform not initialized',
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
app.openapi(getPlatformRoute, async (c) => {
  const connection = getConnection()
  const pda = getPlatformPda()

  try {
    const info = await connection.getAccountInfo(pda)

    if (!info) {
      return c.json({ error: 'Platform not initialized' }, 404)
    }

    const platform = decodePlatform(Buffer.from(info.data))

    return c.json({
      address: pda.toBase58(),
      authority: platform.authority.toBase58(),
      treasury: platform.treasury.toBase58(),
      feeBps: platform.feeBps,
      feePercent: `${platform.feeBps / 100}%`,
      minBountyLamports: platform.minBountyLamports.toString(),
      minBountySol: Number(platform.minBountyLamports) / 1e9,
      taskCount: platform.taskCount.toString(),
      templateCount: platform.templateCount.toString(),
      totalSettledLamports: platform.totalSettledLamports.toString(),
      totalSettledSol: Number(platform.totalSettledLamports) / 1e9,
      isPaused: platform.isPaused,
      disputeVotingPeriod: platform.disputeVotingPeriod.toString(),
      disputeMinVotes: platform.disputeMinVotes,
      minVoterReputation: platform.minVoterReputation.toString(),
      claimGracePeriod: platform.claimGracePeriod.toString(),
    })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500)
  }
})

export default app
