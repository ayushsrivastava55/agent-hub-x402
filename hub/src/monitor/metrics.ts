import { getConfig } from '../lib/config'

export type ProtocolMetrics = {
  avgTime: number
  avgFee: string
  successRate: number
  facilitatorHealth?: 'operational' | 'degraded' | 'down'
  status?: 'operational' | 'degraded' | 'down'
  lastUpdate: string
}

export type MetricsSnapshot = {
  timestamp: string
  protocols: Record<string, ProtocolMetrics>
}

const state: MetricsSnapshot = {
  timestamp: new Date().toISOString(),
  protocols: {
    x402: { avgTime: 185, avgFee: '0.00008', successRate: 0.992, facilitatorHealth: 'operational', lastUpdate: new Date().toISOString() },
    atxp: { avgTime: 320, avgFee: '0.00001', successRate: 0.988, status: 'operational', lastUpdate: new Date().toISOString() },
    acp: { avgTime: 2100, avgFee: '0.001', successRate: 0.972, status: 'operational', lastUpdate: new Date().toISOString() },
    ap2: { avgTime: 600, avgFee: '0.0002', successRate: 0.985, status: 'operational', lastUpdate: new Date().toISOString() },
  },
}

async function probeX402() {
  const { facilitatorUrl } = getConfig()
  try {
    const res = await fetch(`${facilitatorUrl}/supported`, { method: 'GET' })
    const ok = res.ok
    state.protocols.x402.facilitatorHealth = ok ? 'operational' : 'degraded'
    state.protocols.x402.lastUpdate = new Date().toISOString()
  } catch {
    state.protocols.x402.facilitatorHealth = 'down'
    state.protocols.x402.lastUpdate = new Date().toISOString()
  }
}

async function tick() {
  await Promise.all([probeX402()])
  state.timestamp = new Date().toISOString()
}

let started = false
let interval: NodeJS.Timeout | null = null

export function startMonitor(periodMs = 30_000) {
  if (started) return
  started = true
  // First run immediately
  tick().catch(() => {})
  interval = setInterval(() => tick().catch(() => {}), periodMs)
}

export function stopMonitor() {
  if (interval) clearInterval(interval)
  started = false
}

export function getMetrics(): MetricsSnapshot {
  return JSON.parse(JSON.stringify(state))
}
