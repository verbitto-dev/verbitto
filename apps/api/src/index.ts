import 'dotenv/config'
import { serve } from '@hono/node-server'
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import agentsRoutes from './routes/agents.js'
import idlRoutes from './routes/idl.js'
import platformRoutes from './routes/platform.js'
import tasksRoutes from './routes/tasks.js'
import txRoutes from './routes/tx.js'

const app = new OpenAPIHono()

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
      url: process.env.API_BASE_URL || 'http://localhost:5000',
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

const port = parseInt(process.env.API_PORT || '5000', 10)

serve({
  fetch: app.fetch,
  port,
})

console.log(`🚀 API Server running at:`)
console.log(`   - Local:   http://localhost:${port}`)
console.log(`   - Docs:    http://localhost:${port}/api/v1/docs`)
console.log(`   - OpenAPI: http://localhost:${port}/api/v1/openapi.json`)
