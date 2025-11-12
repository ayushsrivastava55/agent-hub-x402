import Redis from 'ioredis'

type Entry = { status: number; body: any; storedAt: number; expiresAt: number }

const store = new Map<string, Entry>()
const KEY_PREFIX = 'idem:'
const KEY_PREFIX_LOCK = 'idemlk:'
const DEFAULT_TTL = Number(process.env.IDEMPOTENCY_TTL_MS || 10 * 60 * 1000)
const DEFAULT_LOCK_TTL = Number(process.env.IDEMPOTENCY_LOCK_TTL_MS || 30_000)

const lockStore = new Map<string, number>() // key -> expiresAt

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

export async function getIdempotent(key?: string | null): Promise<Entry | null> {
  if (!key) return null
  const r = getRedis()
  if (r) {
    try {
      const raw = await r.get(KEY_PREFIX + key)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Entry
      return parsed
    } catch {
      // fall back to in-memory store on errors
    }
  }
  const e = store.get(key)
  if (!e) return null
  if (Date.now() > e.expiresAt) {
    store.delete(key)
    return null
  }
  return e
}

export async function setIdempotent(
  key: string,
  status: number,
  body: any,
  ttlMs = DEFAULT_TTL,
): Promise<void> {
  const now = Date.now()
  const entry: Entry = { status, body, storedAt: now, expiresAt: now + ttlMs }
  const r = getRedis()
  if (r) {
    try {
      await r.set(KEY_PREFIX + key, JSON.stringify(entry), 'PX', ttlMs)
      return
    } catch {
      // fall back to in-memory store on errors
    }
  }
  store.set(key, entry)
}

export async function acquireInFlight(key: string, ttlMs = DEFAULT_LOCK_TTL): Promise<boolean> {
  const r = getRedis()
  if (r) {
    try {
      const res = await (r as any).set(KEY_PREFIX_LOCK + key, '1', 'PX', ttlMs, 'NX')
      return res === 'OK'
    } catch {
      // fall back
    }
  }
  const now = Date.now()
  const exp = lockStore.get(key)
  if (exp && exp > now) return false
  lockStore.set(key, now + ttlMs)
  return true
}

export async function releaseInFlight(key: string): Promise<void> {
  const r = getRedis()
  if (r) {
    try {
      await r.del(KEY_PREFIX_LOCK + key)
      return
    } catch {
      // fall back
    }
  }
  lockStore.delete(key)
}
