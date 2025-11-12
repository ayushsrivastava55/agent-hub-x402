import { getConfig } from '../lib/config'

export type PaymentRequirements = {
  scheme: string
  network: string
  maxAmountRequired: string
  resource: string
  description: string
  mimeType: string
  payTo: string
  maxTimeoutSeconds: number
  asset: string | null
  extra: Record<string, unknown> | null
}

export type VerifyRequest = {
  x402Version: number
  paymentHeader: string
  paymentRequirements: PaymentRequirements
}

export type VerifyResponse = {
  isValid: boolean
  invalidReason: string | null
}

export type SettleResponse = {
  success: boolean
  error: string | null
  txHash: string | null
  networkId: string | null
}

function timeoutMs(name: 'supported' | 'verify' | 'settle') {
  if (name === 'supported') return Number(process.env.X402_TIMEOUT_SUPPORTED_MS || 5000)
  if (name === 'verify') return Number(process.env.X402_TIMEOUT_VERIFY_MS || 8000)
  return Number(process.env.X402_TIMEOUT_SETTLE_MS || 12000)
}

async function fetchJson(url: string, init: RequestInit & { timeout?: number } = {}) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), init.timeout ?? 5000)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    if (!res.ok) throw new Error(`facilitator ${new URL(url).pathname} failed: ${res.status}`)
    return res.json()
  } finally {
    clearTimeout(t)
  }
}

export async function getSupported() {
  const { facilitatorUrl } = getConfig()
  const data = await fetchJson(`${facilitatorUrl}/supported`, { method: 'GET', timeout: timeoutMs('supported') })
  return data as { kinds: { scheme: string; network: string }[] }
}

export async function verify(req: VerifyRequest) {
  const { facilitatorUrl } = getConfig()
  const data = await fetchJson(`${facilitatorUrl}/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
    timeout: timeoutMs('verify'),
  })
  return data as VerifyResponse
}

export async function settle(req: VerifyRequest) {
  const { facilitatorUrl } = getConfig()
  const data = await fetchJson(`${facilitatorUrl}/settle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
    timeout: timeoutMs('settle'),
  })
  return data as SettleResponse
}
