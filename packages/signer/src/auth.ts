import type { NextFunction, Request, Response } from 'express'

const API_KEY = process.env.SIGNER_API_KEY || ''

/**
 * Authentication middleware.
 * When SIGNER_API_KEY is set, all requests must include a matching
 * Authorization: Bearer <key> header.
 * When not set, authentication is disabled (dev mode).
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!API_KEY) {
    next()
    return
  }

  const authHeader = req.headers.authorization
  if (!authHeader) {
    res.status(401).json({ error: 'Missing Authorization header' })
    return
  }

  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (token !== API_KEY) {
    res.status(403).json({ error: 'Invalid API key' })
    return
  }

  next()
}

export function isApiKeyEnabled(): boolean {
  return !!API_KEY
}
