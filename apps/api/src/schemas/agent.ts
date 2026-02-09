import { z } from '@hono/zod-openapi'

export const AgentResponseSchema = z
  .object({
    address: z.string().openapi({ example: '8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR9' }),
    authority: z.string().openapi({ example: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS' }),
    reputationScore: z.string().openapi({ example: '500' }),
    tasksCompleted: z.string().openapi({ example: '10' }),
    tasksDisputed: z.string().openapi({ example: '2' }),
    disputesWon: z.string().openapi({ example: '1' }),
    totalEarnedLamports: z.string().openapi({ example: '2000000000' }),
    totalEarnedSol: z.number().openapi({ example: 2.0 }),
    skillTags: z.number().openapi({ example: 5 }),
    skills: z.array(z.string()).openapi({ example: ['DataLabeling', 'Translation'] }),
    winRate: z.string().openapi({ example: '50.0%' }),
    walletAddress: z
      .string()
      .optional()
      .openapi({ example: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS' }),
    balanceLamports: z.string().optional().openapi({ example: '5000000000' }),
    balanceSol: z.number().optional().openapi({ example: 5.0 }),
  })
  .openapi('AgentResponse')
