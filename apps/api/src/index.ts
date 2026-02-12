// Local development server entry point
import { serve } from '@hono/node-server'
import app from './app.js'

const port = parseInt(process.env.API_PORT || '3001', 10)

serve({
  fetch: app.fetch,
  port,
})
