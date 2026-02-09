import { z } from '@hono/zod-openapi'

export const TaskResponseSchema = z
  .object({
    address: z.string().openapi({ example: '8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR9' }),
    title: z.string().openapi({ example: 'Label 1000 images' }),
    status: z.string().openapi({ example: 'Open' }),
    creator: z.string().openapi({ example: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS' }),
    agent: z.string().openapi({ example: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy' }),
    bountyLamports: z.string().openapi({ example: '1000000000' }),
    bountySol: z.number().openapi({ example: 1.0 }),
    deadline: z.number().openapi({ example: 1735689600 }),
    deadlineIso: z.string().openapi({ example: '2025-01-01T00:00:00.000Z' }),
    createdAt: z.number().openapi({ example: 1704067200 }),
    reputationReward: z.number().openapi({ example: 100 }),
    descriptionHash: z.string().openapi({ example: 'abc123...' }),
    deliverableHash: z.string().openapi({ example: 'def456...' }),
    taskIndex: z.string().openapi({ example: '1' }),
    rejectionCount: z.number().openapi({ example: 0 }),
  })
  .openapi('TaskResponse')

export const TasksListResponseSchema = z
  .object({
    tasks: z.array(TaskResponseSchema),
    total: z.number().openapi({ example: 42 }),
    limit: z.number().openapi({ example: 100 }),
    offset: z.number().openapi({ example: 0 }),
  })
  .openapi('TasksListResponse')

export const TasksQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .openapi({
      param: { name: 'status', in: 'query' },
      example: 'Open',
      description: 'Filter by task status (Open, Claimed, Submitted, etc.)',
    }),
  minBounty: z
    .string()
    .optional()
    .openapi({
      param: { name: 'minBounty', in: 'query' },
      example: '0.5',
      description: 'Minimum bounty in SOL',
    }),
  creator: z
    .string()
    .optional()
    .openapi({
      param: { name: 'creator', in: 'query' },
      example: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
      description: 'Filter by creator public key',
    }),
  agent: z
    .string()
    .optional()
    .openapi({
      param: { name: 'agent', in: 'query' },
      example: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
      description: 'Filter by agent public key',
    }),
  active: z
    .string()
    .optional()
    .openapi({
      param: { name: 'active', in: 'query' },
      example: 'true',
      description: 'Only show tasks before deadline',
    }),
  limit: z
    .string()
    .optional()
    .openapi({
      param: { name: 'limit', in: 'query' },
      example: '100',
      description: 'Maximum number of results (max 500)',
    }),
  offset: z
    .string()
    .optional()
    .openapi({
      param: { name: 'offset', in: 'query' },
      example: '0',
      description: 'Number of results to skip',
    }),
})
