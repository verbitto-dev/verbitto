import { z } from '@hono/zod-openapi'

export const ErrorSchema = z.object({
  error: z.string().openapi({
    example: 'An error occurred',
  }),
})

export const PaginationQuerySchema = z.object({
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

export const AddressParamSchema = z.object({
  address: z.string().openapi({
    param: { name: 'address', in: 'path' },
    example: '8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR9',
    description: 'Solana public key address',
  }),
})
