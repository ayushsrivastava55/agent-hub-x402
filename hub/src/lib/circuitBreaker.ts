type State = 'closed' | 'open' | 'half_open'

type Entry = {
  state: State
  failures: number
  openedAt: number
  trials: number
}

const states = new Map<string, Entry>()

function cfg() {
  const threshold = Number(process.env.CB_ERROR_THRESHOLD || 3)
  const openMs = Number(process.env.CB_OPEN_MS || 30_000)
  const halfOpenMax = Number(process.env.CB_HALF_OPEN_MAX || 1)
  return { threshold, openMs, halfOpenMax }
}

function now() {
  return Date.now()
}

function get(proto: string): Entry {
  let e = states.get(proto)
  if (!e) {
    e = { state: 'closed', failures: 0, openedAt: 0, trials: 0 }
    states.set(proto, e)
  }
  return e
}

export function checkAllowed(proto: string): { allowed: boolean; retryAfter?: number } {
  const { openMs, halfOpenMax } = cfg()
  const e = get(proto)
  if (e.state === 'open') {
    const elapsed = now() - e.openedAt
    if (elapsed >= openMs) {
      e.state = 'half_open'
      e.trials = 0
    } else {
      const retryAfter = Math.ceil((openMs - elapsed) / 1000)
      return { allowed: false, retryAfter }
    }
  }
  if (e.state === 'half_open') {
    if (e.trials >= halfOpenMax) return { allowed: false, retryAfter: 1 }
    e.trials += 1
  }
  return { allowed: true }
}

export function recordSuccess(proto: string) {
  const e = get(proto)
  e.state = 'closed'
  e.failures = 0
  e.openedAt = 0
  e.trials = 0
}

export function recordFailure(proto: string) {
  const { threshold } = cfg()
  const e = get(proto)
  e.failures += 1
  if (e.state === 'half_open' || e.failures >= threshold) {
    e.state = 'open'
    e.openedAt = now()
    e.trials = 0
  }
}

export function getStates(): Record<string, State> {
  const out: Record<string, State> = {}
  for (const [k, v] of states.entries()) out[k] = v.state
  return out
}
