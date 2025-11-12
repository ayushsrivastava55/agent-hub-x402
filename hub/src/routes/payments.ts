import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { sendError, asyncHandler } from '../lib/errors'
import { selectProtocol } from '../router/engine'
import { verify as x402Verify, settle as x402Settle, getSupported as x402Supported } from '../adapters/x402'
import * as atxp from '../adapters/atxp'
import * as acp from '../adapters/acp'
import * as ap2 from '../adapters/ap2'
import { getIdempotent, setIdempotent, acquireInFlight, releaseInFlight } from '../lib/idempotency'
import { checkAllowed, recordFailure, recordSuccess } from '../lib/circuitBreaker'

const router = Router()

type ExecResult = {
  transactionId: string
  protocol: 'x402' | 'atxp' | 'acp' | 'ap2'
  recipient: string
  amount: string
  actualFee: string
  estimatedTime: number
  status: 'settled'
  hash: string | null
  url: string | null
  correlationId: string | null
}

const ExecuteSchema = z
  .object({
    amount: z.string().min(1),
    currency: z.string().min(1),
    recipient: z.string().min(1),
    priority: z.enum(['speed', 'cost', 'privacy']).optional(),
    primaryProtocol: z.enum(['auto', 'x402', 'atxp', 'ap2', 'acp']).default('auto'),
    metadata: z.record(z.any()).optional(),
    a2aCorrelationId: z.string().optional(),
    ap2Mandate: z.record(z.any()).optional(),
    xPaymentHeader: z.string().optional(),
    paymentRequirements: z
      .object({
        scheme: z.string(),
        network: z.string(),
        maxAmountRequired: z.string(),
        resource: z.string(),
        description: z.string(),
        mimeType: z.string(),
        payTo: z.string(),
        maxTimeoutSeconds: z.number(),
        asset: z.string().nullable(),
        extra: z.record(z.any()).nullable(),
      })
      .optional(),
    // Optional robustness controls
    maxRetries: z.number().int().min(0).max(3).optional(),
    timeout: z.number().int().min(100).max(30_000).optional(), // per-attempt timeout ms
  })
  .strict()

router.post(
  '/execute',
  asyncHandler(async (req: Request, res: Response) => {
    // Idempotency first
    const idemKey = (req.header('Idempotency-Key') as string | undefined) || undefined
    const cached = idemKey ? await getIdempotent(idemKey) : null
    if (cached) {
      return res.status(cached.status).json(cached.body)
    }
    let lockAcquired = false
    if (idemKey) {
      lockAcquired = await acquireInFlight(idemKey)
      if (!lockAcquired) {
        res.setHeader('Retry-After', 1)
        const body = { error: { code: 'inflight', message: 'Request with same Idempotency-Key is in progress', requestId: res.locals.requestId } }
        return res.status(409).json(body)
      }
    }

    async function tryAP2(): Promise<ExecResult> {
      if (!payload.ap2Mandate) throw new Error('ap2_missing_mandate')
      const exec = await ap2.execute({ amount: payload.amount, currency: payload.currency, recipient: payload.recipient, priority: (payload.priority || 'privacy') as any, mandate: payload.ap2Mandate as any })
      if (!exec.success) throw new Error('ap2_failed')
      return {
        transactionId: `txn_${Date.now()}`,
        protocol: 'ap2' as const,
        recipient: payload.recipient,
        amount: payload.amount,
        actualFee: '0.0002',
        estimatedTime: 600,
        status: 'settled' as const,
        hash: exec.txHash,
        url: null as string | null,
        correlationId: a2aId,
      }
    }

    const parse = ExecuteSchema.safeParse(req.body)
    if (!parse.success) return sendError(res, 'invalid_request', 'Invalid execute payload', 400, parse.error.flatten())

    const payload = parse.data
    const decision = selectProtocol({
      priority: payload.priority || 'speed',
      primary: payload.primaryProtocol,
      fallback: [],
    })

    const proto = decision.protocol as 'x402' | 'atxp' | 'acp' | 'ap2'
    const attempts: Array<{ try: number; error?: string }> = []
    const perAttemptTimeout = payload.timeout ?? 5_000
    const maxRetries = payload.maxRetries ?? 1
    const a2aId = (req.header('x-a2a-id') as string | undefined) || payload.a2aCorrelationId || null

    const gate = checkAllowed(proto)
    if (!gate.allowed) {
      if (gate.retryAfter) res.setHeader('Retry-After', gate.retryAfter)
      const body = { error: { code: 'circuit_open', message: `Protocol ${proto} temporarily unavailable`, requestId: res.locals.requestId, details: { retryAfter: gate.retryAfter || null } } }
      if (idemKey) await setIdempotent(idemKey, 503, body)
      if (lockAcquired && idemKey) await releaseInFlight(idemKey)
      return res.status(503).json(body)
    }

    // Pre-validate per-protocol required fields (no fallbacks)
    if (proto === 'x402') {
      if (!payload.xPaymentHeader || !payload.paymentRequirements) {
        if (lockAcquired && idemKey) await releaseInFlight(idemKey)
        return sendError(res, 'invalid_request', 'x402 requires xPaymentHeader and paymentRequirements', 400)
      }
      // Validate scheme/network against facilitator /supported
      try {
        const supported = await x402Supported()
        const pr = payload.paymentRequirements
        const ok = supported.kinds?.some((k) => k.scheme === pr.scheme && k.network === pr.network)
        if (!ok) return sendError(res, 'invalid_request', 'x402 network or scheme unsupported by facilitator', 400)
      } catch (e: any) {
        if (lockAcquired && idemKey) await releaseInFlight(idemKey)
        return sendError(res, 'facilitator_unavailable', e?.message || 'Failed to query facilitator /supported', 502)
      }
    }
    if (proto === 'ap2') {
      if (!payload.ap2Mandate) {
        if (lockAcquired && idemKey) await releaseInFlight(idemKey)
        return sendError(res, 'invalid_request', 'AP2 requires ap2Mandate', 400)
      }
      const ok = await ap2.validateMandate(payload.ap2Mandate as any)
      if (!ok) {
        if (lockAcquired && idemKey) await releaseInFlight(idemKey)
        return sendError(res, 'invalid_request', 'AP2 mandate invalid', 400)
      }
    }

    async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
      return await new Promise<T>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`${label}_timeout`)), ms)
        p.then((v) => {
          clearTimeout(t)
          resolve(v)
        }).catch((e) => {
          clearTimeout(t)
          reject(e)
        })
      })
    }

    async function tryX402(): Promise<ExecResult> {
      if (!payload.xPaymentHeader || !payload.paymentRequirements) throw new Error('x402_missing_payment_header')
      const verifyResp = await x402Verify({ x402Version: 1, paymentHeader: payload.xPaymentHeader, paymentRequirements: payload.paymentRequirements })
      if (!verifyResp.isValid) throw new Error(verifyResp.invalidReason || 'x402_invalid')
      const settleResp = await x402Settle({ x402Version: 1, paymentHeader: payload.xPaymentHeader, paymentRequirements: payload.paymentRequirements })
      if (!settleResp.success) throw new Error(settleResp.error || 'x402_settlement_failed')
      return {
        transactionId: `txn_${Date.now()}`,
        protocol: 'x402' as const,
        recipient: payload.recipient,
        amount: payload.amount,
        actualFee: '0.00008',
        estimatedTime: 200,
        status: 'settled' as const,
        hash: settleResp.txHash,
        url: null as string | null,
        correlationId: a2aId,
      }
    }

    async function tryATXP(): Promise<ExecResult> {
      const exec = await atxp.execute({ amount: payload.amount, currency: payload.currency, recipient: payload.recipient, priority: (payload.priority || 'speed') as any })
      if (!exec.success) throw new Error('atxp_failed')
      return {
        transactionId: `txn_${Date.now()}`,
        protocol: 'atxp' as const,
        recipient: payload.recipient,
        amount: payload.amount,
        actualFee: '0.00001',
        estimatedTime: 350,
        status: 'settled' as const,
        hash: exec.txHash,
        url: null as string | null,
        correlationId: a2aId,
      }
    }

    async function tryACP(): Promise<ExecResult> {
      const exec = await acp.execute({ amount: payload.amount, currency: payload.currency, recipient: payload.recipient, priority: (payload.priority || 'speed') as any })
      if (!exec.success) throw new Error('acp_failed')
      return {
        transactionId: `txn_${Date.now()}`,
        protocol: 'acp' as const,
        recipient: payload.recipient,
        amount: payload.amount,
        actualFee: '0.001',
        estimatedTime: 2100,
        status: 'settled' as const,
        hash: exec.txHash,
        url: null as string | null,
        correlationId: a2aId,
      }
    }

    function tryImpl(name: 'x402' | 'atxp' | 'ap2' | 'acp'): Promise<ExecResult> {
      if (name === 'x402') return tryX402()
      if (name === 'atxp') return tryATXP()
      if (name === 'ap2') return tryAP2()
      if (name === 'acp') return tryACP()
      return Promise.reject(new Error(`${name}_not_implemented`))
    }

    // Attempt only the selected protocol (no fallbacks)
    for (let i = 0; i < Math.max(1, maxRetries); i++) {
      try {
        // structured log: attempt start
        console.log(JSON.stringify({ msg: 'execute_attempt_start', requestId: res.locals.requestId, protocol: proto, attempt: i + 1, timeout: perAttemptTimeout, a2aId }))
        const result = await withTimeout<ExecResult>(tryImpl(proto), perAttemptTimeout, `${proto}`)
        recordSuccess(proto)
        // structured log: success
        console.log(JSON.stringify({ msg: 'execute_success', requestId: res.locals.requestId, protocol: proto, attempt: i + 1, a2aId }))
        if (idemKey) await setIdempotent(idemKey, 200, result)
        if (lockAcquired && idemKey) await releaseInFlight(idemKey)
        return res.status(200).json(result)
      } catch (e: any) {
        recordFailure(proto)
        const errMsg = String(e?.message || e)
        attempts.push({ try: i + 1, error: errMsg })
        // structured log: failure
        console.log(JSON.stringify({ msg: 'execute_attempt_error', requestId: res.locals.requestId, protocol: proto, attempt: i + 1, error: errMsg, a2aId }))
      }
    }

    const body = { error: { code: 'execution_failed', message: `Execution failed for protocol ${proto}`, requestId: res.locals.requestId, details: { attempts } } }
    if (idemKey) await setIdempotent(idemKey, 502, body)
    if (lockAcquired && idemKey) await releaseInFlight(idemKey)
    return res.status(502).json(body)
  }),
)

router.get(
  '/estimate',
  asyncHandler(async (req: Request, res: Response) => {
    const amount = String(req.query.amount || '0.01')
    // Live metrics snapshot
    const { getMetrics } = await import('../monitor/metrics')
    const m = getMetrics().protocols as any
    // Adapter estimates (stubbed for atxp for now)
    const atxpEst = await atxp.estimate(amount, String(req.query.recipient || ''))
    const ap2Est = await ap2.estimate(amount, String(req.query.recipient || ''))
    const acpEst = await acp.estimate(amount, String(req.query.recipient || ''))

    const estimates = [
      {
        protocol: 'x402',
        estimatedFee: String(m?.x402?.avgFee ?? '0.00008'),
        estimatedTime: Number(m?.x402?.avgTime ?? 200),
        success_rate: Number(m?.x402?.successRate ?? 0.99),
      },
      {
        protocol: 'atxp',
        estimatedFee: atxpEst.estimatedFee,
        estimatedTime: atxpEst.estimatedTime,
        success_rate: Number(m?.atxp?.successRate ?? 0.98),
      },
      {
        protocol: 'ap2',
        estimatedFee: ap2Est.estimatedFee,
        estimatedTime: ap2Est.estimatedTime,
        success_rate: Number(m?.ap2?.successRate ?? 0.985),
      },
      {
        protocol: 'acp',
        estimatedFee: acpEst.estimatedFee,
        estimatedTime: acpEst.estimatedTime,
        success_rate: Number(m?.acp?.successRate ?? 0.97),
      },
    ]
    return res.json({ amount, estimates })
  }),
)

export default router
