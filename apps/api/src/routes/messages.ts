/**
 * Messages API — private messaging between task creator & assigned agent.
 *
 * Messages are scoped to a task. Only the task's creator and assigned
 * agent can send and read messages. Identity is verified by checking
 * the task's on-chain data (or historical DB for closed tasks).
 *
 * POST /v1/messages            — send a message
 * GET  /v1/messages/:taskAddress — list messages for a task
 */

import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { taskMessages } from '../db/schema.js'
import { getTaskParticipants, isTaskParticipant } from '../lib/task-access.js'
import { ErrorSchema } from '../schemas/common.js'
import {
    MessagesListResponseSchema,
    SendMessageBodySchema,
    SendMessageResponseSchema,
} from '../schemas/messages.js'

const app = new OpenAPIHono()

// ────────────────────────────────────────────────────────────
// POST / — send a message
// ────────────────────────────────────────────────────────────

const sendRoute = createRoute({
    method: 'post',
    path: '/',
    tags: ['Messages'],
    summary: 'Send a private message',
    description:
        'Send a message in the context of a task. ' +
        'Only the task creator and assigned agent are allowed to send messages.',
    request: {
        body: {
            content: { 'application/json': { schema: SendMessageBodySchema } },
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: SendMessageResponseSchema } },
            description: 'Message sent successfully',
        },
        400: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: 'Invalid request body',
        },
        403: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: 'Access denied — sender is not a task participant',
        },
        404: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: 'Task not found',
        },
        500: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: 'Internal server error',
        },
    },
})

// @ts-expect-error - Hono OpenAPI type inference limitation
app.openapi(sendRoute, async (c) => {
    try {
        const body = c.req.valid('json')
        const { taskAddress, sender, content } = body

        // Verify the task exists and sender is a participant
        const participants = await getTaskParticipants(taskAddress)
        if (!participants) {
            return c.json({ error: 'Task not found' }, 404)
        }

        if (!isTaskParticipant(participants, sender)) {
            return c.json(
                { error: 'Access denied: only the task creator or assigned agent can send messages' },
                403
            )
        }

        // Task must be in an active state (not Open — agent not yet assigned)
        const ACTIVE_STATUSES = ['Claimed', 'Submitted', 'Rejected', 'Disputed']
        if (!ACTIVE_STATUSES.includes(participants.status)) {
            return c.json(
                {
                    error: `Cannot send messages when task is in '${participants.status}' status. ` +
                        'Messaging is available once an agent has claimed the task.',
                },
                400
            )
        }

        // Insert message
        const [inserted] = await db
            .insert(taskMessages)
            .values({ taskAddress, sender, content })
            .returning()

        return c.json({
            ok: true,
            message: {
                id: inserted.id,
                taskAddress: inserted.taskAddress,
                sender: inserted.sender,
                content: inserted.content,
                createdAt: inserted.createdAt.toISOString(),
            },
        })
    } catch (err) {
        console.error('[Messages] Failed to send:', err)
        return c.json(
            { error: err instanceof Error ? err.message : 'Failed to send message' },
            500
        )
    }
})

// ────────────────────────────────────────────────────────────
// GET /:taskAddress — list messages for a task
// ────────────────────────────────────────────────────────────

const listRoute = createRoute({
    method: 'get',
    path: '/{taskAddress}',
    tags: ['Messages'],
    summary: 'List messages for a task',
    description:
        'Get all private messages for a task. ' +
        'Requires ?requester=<pubkey> — must be the task creator or assigned agent.',
    responses: {
        200: {
            content: { 'application/json': { schema: MessagesListResponseSchema } },
            description: 'Messages listed',
        },
        403: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: 'Access denied',
        },
        404: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: 'Task not found',
        },
    },
})

// @ts-expect-error - Hono OpenAPI type inference limitation
app.openapi(listRoute, async (c) => {
    const taskAddress = c.req.param('taskAddress')
    const requester = c.req.query('requester')

    if (!requester) {
        return c.json(
            { error: 'Missing ?requester=<pubkey> query parameter for access verification' },
            403
        )
    }

    // Verify access
    const participants = await getTaskParticipants(taskAddress)
    if (!participants) {
        return c.json({ error: 'Task not found' }, 404)
    }

    if (!isTaskParticipant(participants, requester)) {
        return c.json(
            { error: 'Access denied: only the task creator or assigned agent can read messages' },
            403
        )
    }

    // Fetch messages ordered by time
    const rows = await db
        .select()
        .from(taskMessages)
        .where(eq(taskMessages.taskAddress, taskAddress))
        .orderBy(asc(taskMessages.createdAt))

    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(taskMessages)
        .where(eq(taskMessages.taskAddress, taskAddress))

    return c.json({
        taskAddress,
        messages: rows.map((r) => ({
            id: r.id,
            taskAddress: r.taskAddress,
            sender: r.sender,
            content: r.content,
            createdAt: r.createdAt.toISOString(),
        })),
        total: Number(countResult[0]?.count ?? 0),
    })
})

export default app
