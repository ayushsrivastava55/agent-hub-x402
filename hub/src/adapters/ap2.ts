import { z } from 'zod'
import { jwtVerify, createRemoteJWKSet } from 'jose'

export type AP2Mandate = Record<string, unknown>
export type AP2Estimate = { estimatedFee: string; estimatedTime: number }
export type AP2ExecuteResult = { success: boolean; txHash: string | null }

const BaseMandateSchema = z
  .object({
    mandateId: z.string().min(1),
    scope: z.union([z.string().min(1), z.array(z.string().min(1)).nonempty()]),
  })
  .passthrough()

const StrictExtras = z.object({
  issuer: z.string().min(1),
  issuedAt: z.union([z.string().min(1), z.number()]),
  expiresAt: z.union([z.string().min(1), z.number()]).optional(),
})

export async function validateMandate(mandate: AP2Mandate): Promise<boolean> {
  const strict = String(process.env.AP2_STRICT_MANDATE || '').toLowerCase() === 'true'
  const schema = strict ? BaseMandateSchema.and(StrictExtras) : BaseMandateSchema
  const parsed = schema.safeParse(mandate)
  if (!parsed.success) return false
  if (strict) {
    const m = parsed.data as any
    if (m.expiresAt) {
      const exp = typeof m.expiresAt === 'number' ? m.expiresAt : Date.parse(m.expiresAt)
      if (!Number.isFinite(exp) || Date.now() > exp) return false
    }
  }
  // Optional: verify signed mandate JWT if configured
  const jwksUrl = process.env.AP2_MANDATE_JWKS
  const issuer = process.env.AP2_MANDATE_ISSUER
  const jwt = (mandate as any)?.jwt as string | undefined
  if (jwksUrl && jwt) {
    try {
      const JWKS = createRemoteJWKSet(new URL(jwksUrl))
      const { payload } = await jwtVerify(jwt, JWKS, issuer ? { issuer } : {})
      // If payload includes claims, ensure they match the provided mandate basics
      const m = mandate as any
      if (payload.mandateId && payload.mandateId !== m.mandateId) return false
      if (payload.scope) {
        const s = Array.isArray(m.scope) ? m.scope : [m.scope]
        const ps = Array.isArray(payload.scope) ? payload.scope : [payload.scope]
        for (const v of ps) if (!s.includes(v as any)) return false
      }
    } catch {
      return false
    }
  }
  return true
}

export async function estimate(_amount: string, _recipient: string): Promise<AP2Estimate> {
  return { estimatedFee: '0.0002', estimatedTime: 600 }
}

export async function execute(_payload: {
  amount: string
  currency: string
  recipient: string
  priority: 'speed' | 'cost' | 'privacy'
  mandate: AP2Mandate
}): Promise<AP2ExecuteResult> {
  await new Promise((r) => setTimeout(r, 250))
  return { success: true, txHash: 'ap2_tx_dummy_' + Date.now().toString(36) }
}
