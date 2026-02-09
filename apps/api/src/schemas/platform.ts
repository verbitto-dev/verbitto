import { z } from '@hono/zod-openapi'

export const PlatformResponseSchema = z
  .object({
    address: z.string().openapi({ example: '8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR9' }),
    authority: z.string().openapi({ example: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS' }),
    treasury: z.string().openapi({ example: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy' }),
    feeBps: z.number().openapi({ example: 250 }),
    feePercent: z.string().openapi({ example: '2.5%' }),
    minBountyLamports: z.string().openapi({ example: '50000000' }),
    minBountySol: z.number().openapi({ example: 0.05 }),
    taskCount: z.string().openapi({ example: '42' }),
    templateCount: z.string().openapi({ example: '5' }),
    totalSettledLamports: z.string().openapi({ example: '5000000000' }),
    totalSettledSol: z.number().openapi({ example: 5.0 }),
    isPaused: z.boolean().openapi({ example: false }),
    disputeVotingPeriod: z.string().openapi({ example: '604800' }),
    disputeMinVotes: z.number().openapi({ example: 3 }),
    minVoterReputation: z.string().openapi({ example: '100' }),
    claimGracePeriod: z.string().openapi({ example: '86400' }),
  })
  .openapi('PlatformResponse')
