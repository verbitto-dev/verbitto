import { z } from '@hono/zod-openapi'

export const StoreDescriptionBodySchema = z
    .object({
        descriptionHash: z.string().openapi({
            example: 'a1b2c3d4e5f6...',
            description: 'SHA-256 hex hash of the description text',
        }),
        content: z.string().openapi({
            example: 'Build a Solana dApp that integrates with...',
            description: 'Full description text',
        }),
        taskAddress: z.string().optional().openapi({
            example: '8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR9',
            description: 'Task PDA address (optional, for linking)',
        }),
        creator: z.string().optional().openapi({
            example: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
            description: 'Creator public key',
        }),
    })
    .openapi('StoreDescriptionBody')

export const DescriptionResponseSchema = z
    .object({
        descriptionHash: z.string(),
        content: z.string(),
        taskAddress: z.string().nullable(),
        creator: z.string().nullable(),
    })
    .openapi('DescriptionResponse')
