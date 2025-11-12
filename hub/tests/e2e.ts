import { createHmac } from 'crypto'

const HUB_URL = process.env.HUB_URL || 'http://localhost:8787'

function hmacSign(secret: string, method: string, path: string, ts: string, payload: string) {
  return createHmac('sha256', secret).update(`${method}\n${path}\n${ts}\n${payload}`).digest('hex')
}

async function http(method: string, path: string, body?: any, headers: Record<string, string> = {}) {
  const url = `${HUB_URL}${path}`
  const res = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data: any = null
  try {
    data = await res.json()
  } catch {}
  return { res, data }
}

let passed = 0
let failed = 0
const results: string[] = []

function pass(name: string) {
  passed++
  results.push(`PASS ${name}`)
}
function fail(name: string, err: any) {
  failed++
  results.push(`FAIL ${name} -> ${err}`)
}

try {
  const { res, data } = await http('GET', '/health')
  if (res.ok && data?.ok === true) pass('health')
  else fail('health', `status=${res.status}`)
} catch (e) {
  fail('health', e)
}

try {
  const { res, data } = await http('GET', '/protocols/status')
  if (res.ok && data?.protocols?.x402 && data?.protocols?.atxp) pass('protocols/status')
  else fail('protocols/status', `status=${res.status}`)
} catch (e) {
  fail('protocols/status', e)
}

try {
  const { res, data } = await http('GET', '/payments/estimate?amount=0.01')
  const names = (data?.estimates || []).map((e: any) => e.protocol)
  if (res.ok && names.includes('x402') && names.includes('atxp')) pass('payments/estimate')
  else fail('payments/estimate', `status=${res.status}`)
} catch (e) {
  fail('payments/estimate', e)
}

try {
  const payload = { amount: '0.01', currency: 'USDC', recipient: 'agent-bob', primaryProtocol: 'atxp' }
  const idem = `idem_${Date.now()}`
  const { res, data } = await http('POST', '/payments/execute', payload, { 'Idempotency-Key': idem })
  if (!res.ok || data?.status !== 'settled' || data?.protocol !== 'atxp') throw new Error(`status=${res.status}`)
  const { res: res2, data: data2 } = await http('POST', '/payments/execute', payload, { 'Idempotency-Key': idem })
  if (!res2.ok || JSON.stringify(data2) !== JSON.stringify(data)) throw new Error('idempotency mismatch')
  pass('execute_atxp_idempotent')
} catch (e) {
  fail('execute_atxp_idempotent', e)
}

try {
  const payload = { amount: '0.01', currency: 'USDC', recipient: 'agent-bob', primaryProtocol: 'x402' }
  const { res, data } = await http('POST', '/payments/execute', payload)
  if (res.status === 400 && data?.error?.code === 'invalid_request') pass('x402_requires_headers')
  else fail('x402_requires_headers', `status=${res.status}`)
} catch (e) {
  fail('x402_requires_headers', e)
}

try {
  const payload = { amount: '0.01', currency: 'USDC', recipient: 'agent-bob', primaryProtocol: 'ap2' }
  const { res, data } = await http('POST', '/payments/execute', payload)
  if (res.status === 400 && data?.error?.code === 'invalid_request') pass('ap2_requires_mandate')
  else fail('ap2_requires_mandate', `status=${res.status}`)
} catch (e) {
  fail('ap2_requires_mandate', e)
}

try {
  const payload = { amount: '0.01', currency: 'USDC', recipient: 'agent-bob', primaryProtocol: 'ap2', ap2Mandate: { mandateId: 'demo', scope: 'content:read' } }
  const { res, data } = await http('POST', '/payments/execute', payload)
  if (res.ok && data?.protocol === 'ap2' && data?.status === 'settled') pass('ap2_execute_success')
  else fail('ap2_execute_success', `status=${res.status}`)
} catch (e) {
  fail('ap2_execute_success', e)
}

try {
  const payload = { amount: '0.01', currency: 'USDC', recipient: 'agent-bob', primaryProtocol: 'atxp' }
  const { res } = await http('POST', '/payments/execute', payload)
  if (res.status === 401) {
    const secret = process.env.HUB_API_SECRET
    if (!secret) throw new Error('HUB_API_SECRET not provided for signed test')
    const ts = Date.now().toString()
    const sig = hmacSign(secret, 'POST', '/payments/execute', ts, JSON.stringify(payload))
    const signed = await http('POST', '/payments/execute', payload, { 'x-timestamp': ts, 'x-signature': sig })
    if (signed.res.ok) pass('hmac_signed_execute')
    else fail('hmac_signed_execute', `status=${signed.res.status}`)
  } else {
    pass('hmac_optional_mode')
  }
} catch (e) {
  fail('hmac_signed_execute', e)
}

// Optional: ACP (Stripe) real execute if STRIPE_SECRET_KEY is provided
try {
  if (process.env.STRIPE_SECRET_KEY) {
    const payload = { amount: '0.01', currency: 'USD', recipient: 'agent-alice', primaryProtocol: 'acp' }
    const { res, data } = await http('POST', '/payments/execute', payload)
    if (res.ok && data?.protocol === 'acp' && data?.status === 'settled') pass('acp_execute_stripe')
    else fail('acp_execute_stripe', `status=${res.status}`)
  } else {
    pass('acp_execute_stripe_skipped')
  }
} catch (e) {
  fail('acp_execute_stripe', e)
}

// Optional: ATXP provider execute if a provider override is configured
try {
  if (process.env.ATXP_PROVIDER_URL) {
    const payload = { amount: '0.01', currency: 'USD', recipient: 'agent-alice', primaryProtocol: 'atxp' }
    const { res, data } = await http('POST', '/payments/execute', payload)
    if (res.ok && data?.protocol === 'atxp' && data?.status === 'settled') pass('atxp_execute_provider')
    else fail('atxp_execute_provider', `status=${res.status}`)
  } else {
    pass('atxp_execute_provider_skipped')
  }
} catch (e) {
  fail('atxp_execute_provider', e)
}

// Optional: x402 happy-path if provided with real header and requirements
try {
  const hdr = process.env.X402_HEADER
  const reqJson = process.env.X402_REQ
  if (hdr && reqJson) {
    const req = JSON.parse(reqJson)
    const body = {
      amount: '0.01',
      currency: 'USDC',
      recipient: 'agent-bob',
      primaryProtocol: 'x402',
      xPaymentHeader: hdr,
      paymentRequirements: req,
    }
    const { res, data } = await http('POST', '/payments/execute', body)
    if (res.ok && data?.protocol === 'x402' && data?.status === 'settled') pass('x402_happy_path')
    else fail('x402_happy_path', `status=${res.status}`)
  } else {
    pass('x402_happy_path_skipped')
  }
} catch (e) {
  fail('x402_happy_path', e)
}

for (const r of results) console.log(r)
console.log(`\nResult: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
