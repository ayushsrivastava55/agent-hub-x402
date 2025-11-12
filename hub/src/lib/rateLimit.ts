import type { Request, Response, NextFunction } from 'express'
import Redis from 'ioredis'

type Entry = { count: number; resetAt: number }

export function rateLimit({ windowMs = 60_000, max = 60 }: { windowMs?: number; max?: number }) {
  const store = new Map<string, Entry>()
  const KEY_PREFIX = 'rl:'
  let redis: Redis | null = null

  function getRedis(): Redis | null {
    if (redis) return redis
    const url = process.env.REDIS_URL
    if (!url) return null
    try {
      redis = new Redis(url)
    } catch {
      redis = null
    }
    return redis
  }

  function key(req: Request) {
    // Prefer forwarded header if behind a proxy; fall back to remoteAddress
    const xfwd = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    return xfwd || req.ip || (req.socket && (req.socket as any).remoteAddress) || 'unknown'
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const k = key(req)
    const now = Date.now()
    const r = getRedis()

    if (r) {
      ;(async () => {
        try {
          const rk = KEY_PREFIX + k
          const count = Number(await r.incr(rk))
          if (count === 1) await r.pexpire(rk, windowMs)
          if (count <= max) return next()
          const ttl = await r.pttl(rk)
          res.setHeader('Retry-After', Math.ceil(((ttl > 0 ? ttl : windowMs) as number) / 1000))
          return res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests', requestId: res.locals.requestId } })
        } catch {
          // fall through to in-memory on redis errors
          const entry = store.get(k)
          if (!entry || entry.resetAt <= now) {
            store.set(k, { count: 1, resetAt: now + windowMs })
            return next()
          }
          if (entry.count < max) {
            entry.count += 1
            return next()
          }
          res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000))
          return res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests', requestId: res.locals.requestId } })
        }
      })()
      return
    }

    const entry = store.get(k)

    if (!entry || entry.resetAt <= now) {
      store.set(k, { count: 1, resetAt: now + windowMs })
      return next()
    }

    if (entry.count < max) {
      entry.count += 1
      return next()
    }

    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000))
    return res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests', requestId: res.locals.requestId } })
  }
}
