/**
 * History API — query historical (closed-account) tasks from the event index.
 *
 * These tasks had their PDA accounts closed via Anchor `close` constraints
 * (Approved, Cancelled, Expired, DisputeResolved). The data is reconstructed
 * from Anchor events ingested via the Helius webhook.
 *
 * GET /api/v1/history/tasks          — paginated list of closed tasks
 * GET /api/v1/history/tasks/:address — single historical task with events
 * GET /api/v1/history/stats          — indexer statistics
 */

import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import {
    queryHistoricalTasks,
    getHistoricalTask,
    getEventsByTask,
    getIndexerStats,
} from '../lib/event-store.js'
import { ErrorSchema } from '../schemas/common.js'
import {
    HistoricalTasksListSchema,
    HistoricalTaskDetailSchema,
    HistoryQuerySchema,
    IndexerStatsSchema,
} from '../schemas/history.js'

const app = new OpenAPIHono()

// ────────────────────────────────────────────────────────────
// Serializer
// ────────────────────────────────────────────────────────────

function serializeHistoricalTask(t: ReturnType<typeof getHistoricalTask>) {
    if (!t) return null
    return {
        address: t.address,
        creator: t.creator,
        taskIndex: t.taskIndex,
        bountyLamports: t.bountyLamports,
        bountySol: Number(t.bountyLamports) / 1e9,
        deadline: t.deadline,
        finalStatus: t.finalStatus,
        agent: t.agent,
        payoutLamports: t.payoutLamports,
        feeLamports: t.feeLamports,
        refundedLamports: t.refundedLamports,
        createdAt: t.createdAt,
        closedAt: t.closedAt,
    }
}

// ────────────────────────────────────────────────────────────
// GET /tasks — list historical tasks
// ────────────────────────────────────────────────────────────

const listHistoricalRoute = createRoute({
    method: 'get',
    path: '/tasks',
    tags: ['History'],
    summary: 'List historical (closed) tasks',
    description:
        'Returns tasks whose accounts were closed on-chain. ' +
        'Data is reconstructed from indexed Anchor events.',
    request: {
        query: HistoryQuerySchema,
    },
    responses: {
        200: {
            content: { 'application/json': { schema: HistoricalTasksListSchema } },
            description: 'Paginated list of historical tasks',
        },
        500: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: 'Internal server error',
        },
    },
})

// @ts-expect-error - Hono OpenAPI type inference limitation
app.openapi(listHistoricalRoute, async (c) => {
    try {
        const q = c.req.query()
        const result = queryHistoricalTasks({
            status: q.status,
            creator: q.creator,
            agent: q.agent,
            limit: q.limit ? parseInt(q.limit, 10) : undefined,
            offset: q.offset ? parseInt(q.offset, 10) : undefined,
        })

        return c.json({
            tasks: result.tasks.map(serializeHistoricalTask),
            total: result.total,
            limit: result.limit,
            offset: result.offset,
        })
    } catch (error) {
        return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500)
    }
})

// ────────────────────────────────────────────────────────────
// GET /tasks/:address — single historical task with events
// ────────────────────────────────────────────────────────────

const getHistoricalTaskRoute = createRoute({
    method: 'get',
    path: '/tasks/{address}',
    tags: ['History'],
    summary: 'Get a historical task by address',
    description: 'Retrieve a single closed task with its full event trail.',
    request: {
        params: HistoryQuerySchema.pick({}), // We define address inline
    },
    responses: {
        200: {
            content: { 'application/json': { schema: HistoricalTaskDetailSchema } },
            description: 'Historical task with events',
        },
        404: {
            content: { 'application/json': { schema: ErrorSchema } },
            description: 'Task not found in history',
        },
    },
})

// @ts-expect-error - Hono OpenAPI type inference limitation
app.openapi(getHistoricalTaskRoute, async (c) => {
    const address = c.req.param('address')
    const task = getHistoricalTask(address)

    if (!task) {
        return c.json({ error: 'Task not found in history index' }, 404)
    }

    const events = getEventsByTask(address)
    const serialized = serializeHistoricalTask(task)

    return c.json({ ...serialized, events })
})

// ────────────────────────────────────────────────────────────
// GET /stats — indexer statistics
// ────────────────────────────────────────────────────────────

const statsRoute = createRoute({
    method: 'get',
    path: '/stats',
    tags: ['History'],
    summary: 'Indexer statistics',
    description: 'Returns event indexer health and aggregated counts.',
    responses: {
        200: {
            content: { 'application/json': { schema: IndexerStatsSchema } },
            description: 'Indexer statistics',
        },
    },
})

app.openapi(statsRoute, async (c) => {
    const stats = getIndexerStats()
    return c.json({
        ...stats,
        approvedCount: stats.byStatus['Approved'] ?? 0,
        cancelledCount: stats.byStatus['Cancelled'] ?? 0,
        expiredCount: stats.byStatus['Expired'] ?? 0,
        disputeResolvedCount: stats.byStatus['DisputeResolved'] ?? 0,
    })
})

export default app
