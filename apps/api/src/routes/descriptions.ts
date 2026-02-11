/**
 * Descriptions API — store and retrieve task description text.
 *
 * Descriptions are stored by their SHA-256 hash (which is also
 * recorded on-chain in the task PDA). This serves as a pre-IPFS
 * content-addressed store.
 *
 * POST /api/v1/descriptions       — store a description
 * GET  /api/v1/descriptions/:hash — fetch description by hash
 */

import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { deliverableDescriptions, taskDescriptions } from '../db/schema.js'
import { ErrorSchema } from '../schemas/common.js'
import { DescriptionResponseSchema, StoreDescriptionBodySchema } from '../schemas/descriptions.js'

const app = new OpenAPIHono()

// ────────────────────────────────────────────────────────────
// POST / — store a task description
// ────────────────────────────────────────────────────────────

const storeRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Descriptions'],
  summary: 'Store a task description',
  description:
    'Store the full text of a task description, keyed by its SHA-256 hash. ' +
    'Idempotent — re-posting the same hash is a no-op.',
  request: {
    body: {
      content: { 'application/json': { schema: StoreDescriptionBodySchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: DescriptionResponseSchema } },
      description: 'Description stored successfully',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid request body',
    },
    500: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Internal server error',
    },
  },
})

// @ts-expect-error - Hono OpenAPI type inference limitation
app.openapi(storeRoute, async (c) => {
  try {
    const body = c.req.valid('json')

    await db
      .insert(taskDescriptions)
      .values({
        descriptionHash: body.descriptionHash,
        content: body.content,
        taskAddress: body.taskAddress ?? null,
        creator: body.creator ?? null,
      })
      .onConflictDoUpdate({
        target: taskDescriptions.descriptionHash,
        set: {
          content: body.content,
          taskAddress: body.taskAddress ?? null,
          creator: body.creator ?? null,
        },
      })

    return c.json({
      descriptionHash: body.descriptionHash,
      content: body.content,
      taskAddress: body.taskAddress ?? null,
      creator: body.creator ?? null,
    })
  } catch (err) {
    console.error('[Descriptions] Failed to store:', err)
    return c.json(
      { error: err instanceof Error ? err.message : 'Failed to store description' },
      500
    )
  }
})

// ────────────────────────────────────────────────────────────
// GET /:hash — fetch description by hash
// ────────────────────────────────────────────────────────────

const getRoute = createRoute({
  method: 'get',
  path: '/{hash}',
  tags: ['Descriptions'],
  summary: 'Get a description by hash',
  description: 'Retrieve the full text of a task description by its SHA-256 hash.',
  responses: {
    200: {
      content: { 'application/json': { schema: DescriptionResponseSchema } },
      description: 'Description found',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Description not found',
    },
  },
})

// @ts-expect-error - Hono OpenAPI type inference limitation
app.openapi(getRoute, async (c) => {
  const hash = c.req.param('hash')

  const rows = await db
    .select()
    .from(taskDescriptions)
    .where(eq(taskDescriptions.descriptionHash, hash))
    .limit(1)

  if (rows.length === 0) {
    return c.json({ error: 'Description not found' }, 404)
  }

  const row = rows[0]
  return c.json({
    descriptionHash: row.descriptionHash,
    content: row.content,
    taskAddress: row.taskAddress,
    creator: row.creator,
  })
})

// ────────────────────────────────────────────────────────────
// POST /deliverables — store a deliverable description
// ────────────────────────────────────────────────────────────

const storeDeliverableRoute = createRoute({
  method: 'post',
  path: '/deliverables',
  tags: ['Descriptions'],
  summary: 'Store a deliverable description',
  description:
    'Store the full text of a deliverable description, keyed by its SHA-256 hash. ' +
    'Idempotent — re-posting the same hash is a no-op.',
  request: {
    body: {
      content: { 'application/json': { schema: StoreDescriptionBodySchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: DescriptionResponseSchema } },
      description: 'Deliverable description stored successfully',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid request body',
    },
    500: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Internal server error',
    },
  },
})

// @ts-expect-error - Hono OpenAPI type inference limitation
app.openapi(storeDeliverableRoute, async (c) => {
  try {
    const body = c.req.valid('json')

    await db
      .insert(deliverableDescriptions)
      .values({
        deliverableHash: body.descriptionHash,
        content: body.content,
        taskAddress: body.taskAddress ?? null,
        agent: body.creator ?? null,
      })
      .onConflictDoUpdate({
        target: deliverableDescriptions.deliverableHash,
        set: {
          content: body.content,
          taskAddress: body.taskAddress ?? null,
          agent: body.creator ?? null,
        },
      })

    return c.json({
      descriptionHash: body.descriptionHash,
      content: body.content,
      taskAddress: body.taskAddress ?? null,
      creator: body.creator ?? null,
    })
  } catch (err) {
    console.error('[Descriptions] Failed to store deliverable:', err)
    return c.json(
      { error: err instanceof Error ? err.message : 'Failed to store deliverable description' },
      500
    )
  }
})

// ────────────────────────────────────────────────────────────
// GET /deliverables/:hash — fetch deliverable description by hash
// ────────────────────────────────────────────────────────────

const getDeliverableRoute = createRoute({
  method: 'get',
  path: '/deliverables/{hash}',
  tags: ['Descriptions'],
  summary: 'Get a deliverable description by hash',
  description: 'Retrieve the full text of a deliverable description by its SHA-256 hash.',
  responses: {
    200: {
      content: { 'application/json': { schema: DescriptionResponseSchema } },
      description: 'Deliverable description found',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Deliverable description not found',
    },
  },
})

// @ts-expect-error - Hono OpenAPI type inference limitation
app.openapi(getDeliverableRoute, async (c) => {
  const hash = c.req.param('hash')

  const rows = await db
    .select()
    .from(deliverableDescriptions)
    .where(eq(deliverableDescriptions.deliverableHash, hash))
    .limit(1)

  if (rows.length === 0) {
    return c.json({ error: 'Deliverable description not found' }, 404)
  }

  const row = rows[0]
  return c.json({
    descriptionHash: row.deliverableHash,
    content: row.content,
    taskAddress: row.taskAddress,
    creator: row.agent,
  })
})

export default app
