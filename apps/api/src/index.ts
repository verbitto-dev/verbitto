import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Load .env from project root (2 levels up from src/)
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../../../.env'), override: true })

// Debug: log DATABASE_URL (masked)
if (process.env.DATABASE_URL) {
  const masked = process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
  console.log('[ENV] DATABASE_URL loaded:', masked)
} else {
  console.log('[ENV] DATABASE_URL is not set!')
}

import { serve } from '@hono/node-server'
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { rateLimiter } from 'hono-rate-limiter'
import agentsRoutes from './routes/agents.js'
import idlRoutes from './routes/idl.js'
import platformRoutes from './routes/platform.js'
import tasksRoutes from './routes/tasks.js'
import txRoutes from './routes/tx.js'
import webhookRoutes from './routes/webhook.js'
import historyRoutes from './routes/history.js'
import descriptionsRoutes from './routes/descriptions.js'
import { loadStore } from './lib/event-store.js'
import { testConnection } from './db/index.js'
import { migrateDb } from './db/migrate.js'

const app = new OpenAPIHono()

// Initialize database and load event store
await testConnection()
await migrateDb()
await loadStore()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
)

// Rate limiting — 100 requests per 60 seconds per IP
app.use(
  '/api/*',
  rateLimiter({
    windowMs: 60 * 1000,
    limit: parseInt(process.env.RATE_LIMIT || '100', 10),
    standardHeaders: 'draft-6',
    keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
  })
)

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.route('/api/v1/platform', platformRoutes)
app.route('/api/v1/tasks', tasksRoutes)
app.route('/api/v1/agents', agentsRoutes)
app.route('/api/v1/tx', txRoutes)
app.route('/api/v1/idl', idlRoutes)
app.route('/api/v1/webhook', webhookRoutes)
app.route('/api/v1/history', historyRoutes)
app.route('/api/v1/descriptions', descriptionsRoutes)

// OpenAPI JSON
app.doc('/api/v1/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Verbitto API',
    description: 'Decentralized Task Escrow for AI Agents on Solana',
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:3001',
      description: 'API Server',
    },
  ],
})

// Swagger UI
app.get('/api/v1/docs', swaggerUI({ url: '/api/v1/openapi.json' }))

// Root redirect to docs
app.get('/', (c) => {
  return c.redirect('/api/v1/docs')
})

const port = parseInt(process.env.API_PORT || '3001', 10)

serve({
  fetch: app.fetch,
  port,
})

console.log(`🚀 API Server running at:`)
console.log(`   - Local:   http://localhost:${port}`)
console.log(`   - Docs:    http://localhost:${port}/api/v1/docs`)
console.log(`   - OpenAPI: http://localhost:${port}/api/v1/openapi.json`)
