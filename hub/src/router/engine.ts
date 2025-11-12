export type Protocol = 'x402' | 'atxp' | 'ap2' | 'acp'

export type SelectionInput = {
  priority: 'speed' | 'cost' | 'privacy'
  primary?: 'auto' | Protocol
  fallback: Protocol[]
}

export type SelectionResult = {
  protocol: Protocol
  tried: Protocol[]
}

import { getMetrics } from '../monitor/metrics'

export function selectProtocol(input: SelectionInput): SelectionResult {
  const metrics = getMetrics().protocols

  // Supported protocols for now
  const supported: Protocol[] = ['x402', 'atxp', 'ap2', 'acp']

  // If explicit primary (not auto), honor it
  if (input.primary && input.primary !== 'auto') {
    const tried = [input.primary, ...input.fallback]
    return { protocol: input.primary, tried }
  }

  // Weights by priority
  const weights =
    input.priority === 'speed'
      ? { time: 0.6, fee: 0.2, success: 0.2 }
      : input.priority === 'cost'
        ? { time: 0.2, fee: 0.6, success: 0.2 }
        : { time: 0.2, fee: 0.2, success: 0.6 } // privacy: favor reliability until AP2 implemented

  // Build arrays for normalization
  const times = supported.map((p) => metrics[p]?.avgTime ?? 999999)
  const fees = supported.map((p) => Number(metrics[p]?.avgFee ?? '999999'))
  const succs = supported.map((p) => metrics[p]?.successRate ?? 0)

  const maxTime = Math.max(...times)
  const maxFee = Math.max(...fees)
  const maxSucc = Math.max(...succs, 1)

  function score(p: Protocol) {
    const m = metrics[p]
    const t = m?.avgTime ?? maxTime
    const f = Number(m?.avgFee ?? maxFee)
    const s = m?.successRate ?? 0
    const nt = maxTime > 0 ? t / maxTime : 1
    const nf = maxFee > 0 ? f / maxFee : 1
    const ns = s / maxSucc
    // Higher is better: success; Lower is better: time/fee -> subtract
    return weights.success * ns - weights.time * nt - weights.fee * nf
  }

  let best: Protocol = supported[0]
  let bestScore = -Infinity
  for (const p of supported) {
    const s = score(p)
    if (s > bestScore) {
      bestScore = s
      best = p
    }
  }

  // Privacy requested: prefer AP2 if available
  if (input.priority === 'privacy' && supported.includes('ap2')) {
    best = 'ap2'
  }

  const tried: Protocol[] = [best, ...input.fallback]
  return { protocol: best, tried }
}
