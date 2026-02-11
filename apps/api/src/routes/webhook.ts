/**
 * Helius Webhook Route — receives transaction data from Helius,
 * parses Anchor events, and stores them in the event store.
 *
 * POST /api/v1/webhook/helius
 *
 * Authentication: Bearer token in Authorization header or
 *   ?token= query parameter (Helius supports both).
 */

import { OpenAPIHono } from '@hono/zod-openapi'
import { parseHeliusPayload } from '../lib/event-parser.js'
import { getIndexerStats, getRecentEvents, ingestEvents } from '../lib/event-store.js'

const WEBHOOK_SECRET = process.env.HELIUS_WEBHOOK_SECRET || ''

const app = new OpenAPIHono()

// ────────────────────────────────────────────────────────────
// Auth middleware for webhook
// ────────────────────────────────────────────────────────────

function isAuthorized(c: {
  req: { header: (name: string) => string | undefined; query: (name: string) => string | undefined }
}): boolean {
  // Skip auth if no secret configured (dev mode)
  if (!WEBHOOK_SECRET) return true

  // Check Authorization: Bearer <token>
  const authHeader = c.req.header('authorization')
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (token === WEBHOOK_SECRET) return true
  }

  // Check query parameter ?token=<token>
  const queryToken = c.req.query('token')
  if (queryToken === WEBHOOK_SECRET) return true

  return false
}

// ────────────────────────────────────────────────────────────
// POST /helius — receive Helius webhook payload
// ────────────────────────────────────────────────────────────

app.post('/helius', async (c) => {
  if (!isAuthorized(c)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = await c.req.json()
    const events = parseHeliusPayload(payload)
    const ingested = await ingestEvents(events)

    console.log(
      `[Webhook] Received ${Array.isArray(payload) ? payload.length : 1} txn(s), ` +
        `parsed ${events.length} event(s), ingested ${ingested} new event(s)`
    )

    return c.json({
      ok: true,
      parsed: events.length,
      ingested,
    })
  } catch (err) {
    console.error('[Webhook] Error processing payload:', err)
    return c.json({ error: 'Failed to process webhook' }, 500)
  }
})

// ────────────────────────────────────────────────────────────
// GET /status — indexer health / stats
// ────────────────────────────────────────────────────────────

app.get('/status', async (c) => {
  const stats = await getIndexerStats()
  return c.json({
    ok: true,
    ...stats,
    webhookConfigured: !!WEBHOOK_SECRET,
  })
})

// ────────────────────────────────────────────────────────────
// GET /events — recent events (for debugging)
// ────────────────────────────────────────────────────────────

app.get('/events', async (c) => {
  const limitStr = c.req.query('limit')
  const limit = Math.min(parseInt(limitStr ?? '50', 10), 200)
  return c.json({ events: await getRecentEvents(limit) })
})

export default app
