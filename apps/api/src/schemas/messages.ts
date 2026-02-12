import { z } from '@hono/zod-openapi'

// ── Send a message ─────────────────────────────────────────

export const SendMessageBodySchema = z
  .object({
    taskAddress: z.string().openapi({
      example: '8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR9',
      description: 'Task PDA address the message belongs to',
    }),
    sender: z.string().openapi({
      example: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
      description: 'Sender public key (must be task creator or assigned agent)',
    }),
    content: z.string().min(1).max(4000).openapi({
      example: 'I have a question about the requirements...',
      description: 'Message text (max 4000 chars)',
    }),
  })
  .openapi('SendMessageBody')

// ── Message response ───────────────────────────────────────

export const MessageSchema = z
  .object({
    id: z.number(),
    taskAddress: z.string(),
    sender: z.string(),
    content: z.string(),
    createdAt: z.string(),
  })
  .openapi('Message')

export const MessagesListResponseSchema = z
  .object({
    taskAddress: z.string(),
    messages: z.array(MessageSchema),
    total: z.number(),
  })
  .openapi('MessagesListResponse')

export const SendMessageResponseSchema = z
  .object({
    ok: z.boolean(),
    message: MessageSchema,
  })
  .openapi('SendMessageResponse')
