type Tx = {
  id: string
  protocol: 'x402' | 'atxp' | 'acp' | 'ap2'
  status: 'settled' | 'failed'
  recipient: string
  amount: string
  requestId: string | undefined
  at: number
}

import Redis from 'ioredis'

const KEY_LIST = 'txlog:list'
const MAX = Number(process.env.TXLOG_MAX || 100)

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

const mem: Tx[] = []

export async function append(tx: Tx) {
  const r = getRedis()
  const payload = JSON.stringify(tx)
  if (r) {
    try {
      await r.lpush(KEY_LIST, payload)
      await r.ltrim(KEY_LIST, 0, MAX - 1)
      return
    } catch {}
  }
  mem.unshift(tx)
  if (mem.length > MAX) mem.pop()
}

export async function recent(limit = 20): Promise<Tx[]> {
  const r = getRedis()
  if (r) {
    try {
      const arr = await r.lrange(KEY_LIST, 0, Math.max(0, limit - 1))
      return arr.map((s) => JSON.parse(s))
    } catch {}
  }
  return mem.slice(0, limit)
}
