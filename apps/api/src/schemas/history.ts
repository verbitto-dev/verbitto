import { z } from '@hono/zod-openapi'

// ── Historical Task (closed accounts served from event index) ──

export const HistoricalTaskSchema = z
  .object({
    address: z.string().openapi({ example: '8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR9' }),
    title: z.string().openapi({ example: 'Build a Solana dApp' }),
    descriptionHash: z.string().optional(),
    description: z.string().nullable().optional(),
    deliverableHash: z.string().optional(),
    deliverable: z.string().nullable().optional(),
    creator: z.string().openapi({ example: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS' }),
    taskIndex: z.string().openapi({ example: '3' }),
    bountyLamports: z.string().openapi({ example: '1000000000' }),
    bountySol: z.number().openapi({ example: 1.0 }),
    deadline: z.number().openapi({ example: 1735689600 }),
    finalStatus: z.string().openapi({ example: 'Approved' }),
    agent: z.string().openapi({ example: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy' }),
    payoutLamports: z.string().openapi({ example: '950000000' }),
    feeLamports: z.string().openapi({ example: '50000000' }),
    refundedLamports: z.string().openapi({ example: '0' }),
    createdAt: z.number().openapi({ example: 1704067200 }),
    closedAt: z.number().openapi({ example: 1704153600 }),
  })
  .openapi('HistoricalTask')

export const HistoricalTaskDetailSchema = HistoricalTaskSchema.extend({
  events: z.array(
    z.object({
      signature: z.string(),
      slot: z.number(),
      blockTime: z.number(),
      eventName: z.string(),
      data: z.record(z.string(), z.string()),
    })
  ),
}).openapi('HistoricalTaskDetail')

export const HistoricalTasksListSchema = z
  .object({
    tasks: z.array(HistoricalTaskSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  })
  .openapi('HistoricalTasksList')

export const HistoryQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .openapi({
      param: { name: 'status', in: 'query' },
      example: 'Approved',
      description: 'Filter by terminal status (Approved, Cancelled, Expired, DisputeResolved)',
    }),
  creator: z
    .string()
    .optional()
    .openapi({
      param: { name: 'creator', in: 'query' },
      description: 'Filter by creator public key',
    }),
  agent: z
    .string()
    .optional()
    .openapi({
      param: { name: 'agent', in: 'query' },
      description: 'Filter by agent public key',
    }),
  limit: z
    .string()
    .optional()
    .openapi({
      param: { name: 'limit', in: 'query' },
      example: '100',
      description: 'Max results (max 500)',
    }),
  offset: z
    .string()
    .optional()
    .openapi({
      param: { name: 'offset', in: 'query' },
      example: '0',
    }),
})

export const IndexerStatsSchema = z
  .object({
    totalEvents: z.number(),
    totalHistoricalTasks: z.number(),
    byStatus: z.record(z.string(), z.number()),
    lastEventTime: z.number().nullable(),
    approvedCount: z.number(),
    cancelledCount: z.number(),
    expiredCount: z.number(),
    disputeResolvedCount: z.number(),
  })
  .openapi('IndexerStats')
