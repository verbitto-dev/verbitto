// Vercel Serverless Function entry point (JavaScript)
// Use standard Vercel handler instead of @hono/node-server
import app from '../dist/app.js'

// Standard Vercel handler - Hono supports Vercel natively
export default app.fetch.bind(app)
