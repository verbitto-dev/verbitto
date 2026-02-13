// Vercel Serverless Function catch-all entry point
import { handle } from '@hono/node-server/vercel'
import app from '../dist/app.js'

export default handle(app)
