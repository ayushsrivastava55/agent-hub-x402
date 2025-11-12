import type { Request, Response, NextFunction } from 'express'
import { createHmac, timingSafeEqual } from 'crypto'
import { sendError } from './errors'

const DEFAULT_TOLERANCE_MS = 5 * 60 * 1000 // 5 minutes

function constantTimeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a, 'hex')
  const bBuf = Buffer.from(b, 'hex')
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

export function requireHmac(toleranceMs = DEFAULT_TOLERANCE_MS) {
  return (req: Request, res: Response, next: NextFunction) => {
    const secret = process.env.HUB_API_SECRET
    if (!secret) return sendError(res, 'server_misconfigured', 'HUB_API_SECRET not set', 500)

    const ts = req.header('x-timestamp')
    const sig = req.header('x-signature')
    if (!ts || !sig) return sendError(res, 'unauthorized', 'Missing signature headers', 401)

    const now = Date.now()
    const tsMs = Number(ts)
    if (!Number.isFinite(tsMs)) return sendError(res, 'unauthorized', 'Invalid timestamp', 401)
    if (Math.abs(now - tsMs) > toleranceMs) return sendError(res, 'unauthorized', 'Timestamp out of tolerance', 401)

    const method = req.method.toUpperCase()
    const path = req.originalUrl.split('?')[0]
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
    const msg = `${method}\n${path}\n${ts}\n${payload}`

    const expected = createHmac('sha256', secret).update(msg).digest('hex')
    const ok = constantTimeEqual(expected, sig)
    if (!ok) return sendError(res, 'unauthorized', 'Invalid signature', 401)

    next()
  }
}
