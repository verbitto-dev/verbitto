import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

// Load .env from project root (2 levels up from src/)
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../../../.env'), override: true })

// Debug: log DATABASE_URL (masked)
if (process.env.DATABASE_URL) {
    const _masked = process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
}

import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { rateLimiter } from 'hono-rate-limiter'
import { testConnection } from './db/index.js'
import { migrateDb } from './db/migrate.js'
import { loadStore } from './lib/event-store.js'
import agentsRoutes from './routes/agents.js'
import descriptionsRoutes from './routes/descriptions.js'
import historyRoutes from './routes/history.js'
import idlRoutes from './routes/idl.js'
import messagesRoutes from './routes/messages.js'
import platformRoutes from './routes/platform.js'
import tasksRoutes from './routes/tasks.js'
import txRoutes from './routes/tx.js'
import webhookRoutes from './routes/webhook.js'

const app = new OpenAPIHono()

// Initialize database and load event store (only on first request in serverless)
let initialized = false
async function initialize() {
    if (!initialized) {
        await testConnection()
        await migrateDb()
        await loadStore()
        initialized = true
    }
}

// Middleware to ensure initialization
app.use('*', async (c, next) => {
    await initialize()
    await next()
})

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use(
    '*',
    cors({
        origin: (origin) => {
            const allowedOrigins = process.env.CORS_ORIGIN
                ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
                : ['*'];

            if (allowedOrigins.includes('*')) return '*';
            if (!origin) return allowedOrigins[0];
            if (allowedOrigins.includes(origin)) return origin;
            return allowedOrigins[0];
        },
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
app.route('/v1/platform', platformRoutes)
app.route('/v1/tasks', tasksRoutes)
app.route('/v1/agents', agentsRoutes)
app.route('/v1/tx', txRoutes)
app.route('/v1/idl', idlRoutes)
app.route('/v1/webhook', webhookRoutes)
app.route('/v1/history', historyRoutes)
app.route('/v1/descriptions', descriptionsRoutes)
app.route('/v1/messages', messagesRoutes)

// OpenAPI JSON
app.doc('/v1/openapi.json', {
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
app.get('/v1/docs', swaggerUI({ url: '/v1/openapi.json' }))

// Root redirect to docs
app.get('/', (c) => {
    return c.redirect('/v1/docs')
})

export default app
