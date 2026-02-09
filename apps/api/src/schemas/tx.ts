import { z } from '@hono/zod-openapi'

export const BuildTransactionRequestSchema = z
  .object({
    instruction: z
      .enum([
        'registerAgent',
        'claimTask',
        'submitDeliverable',
        'createTask',
        'openDispute',
        'castVote',
        'updateAgentSkills',
        'approveAndSettle',
        'rejectSubmission',
        'cancelTask',
      ])
      .openapi({
        example: 'registerAgent',
        description: 'The instruction type to build',
      }),
    signer: z.string().openapi({
      example: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
      description: 'The signer public key (base58)',
    }),
    params: z
      .record(z.string(), z.any())
      .optional()
      .openapi({
        example: { skillTags: 5 },
        description: 'Instruction-specific parameters',
      }),
  })
  .openapi('BuildTransactionRequest')

export const BuildTransactionResponseSchema = z
  .object({
    transaction: z.string().openapi({
      example:
        'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQABAgMEBQYHCAkKCwwNDg8Q...',
      description: 'Base64 encoded unsigned transaction',
    }),
    message: z.string().openapi({
      example:
        'Unsigned registerAgent transaction. Sign with your wallet, then POST to /api/v1/tx/send.',
    }),
  })
  .openapi('BuildTransactionResponse')

export const SendTransactionRequestSchema = z
  .object({
    signedTransaction: z.string().openapi({
      example:
        'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQABAgMEBQYHCAkKCwwNDg8Q...',
      description: 'Base64 encoded signed transaction',
    }),
  })
  .openapi('SendTransactionRequest')

export const SendTransactionResponseSchema = z
  .object({
    signature: z.string().openapi({
      example:
        '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW',
    }),
    explorer: z.string().openapi({
      example:
        'https://explorer.solana.com/tx/5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW?cluster=devnet',
    }),
  })
  .openapi('SendTransactionResponse')
