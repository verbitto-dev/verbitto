import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { loadIdl } from '../lib/idl.js'
import { ErrorSchema } from '../schemas/common.js'

const app = new OpenAPIHono()

const getIdlRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['IDL'],
  summary: 'Get program IDL',
  description: 'Returns the Interface Definition Language (IDL) JSON for the Verbitto program',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            address: z.string(),
            metadata: z.object({
              name: z.string(),
              version: z.string(),
              spec: z.string(),
              description: z.string(),
            }),
            instructions: z.array(z.any()),
            accounts: z.array(z.any()),
            types: z.array(z.any()),
          }),
        },
      },
      description: 'Program IDL JSON',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'IDL not found',
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

app.openapi(getIdlRoute, async (c) => {
  try {
    const idl = loadIdl()
    return c.json(idl)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to load IDL' }, 500)
  }
})

export default app
