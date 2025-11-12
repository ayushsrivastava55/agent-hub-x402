import Stripe from 'stripe'

export type ACPEstimate = { estimatedFee: string; estimatedTime: number }
export type ACPExecuteResult = { success: boolean; txHash: string | null }

export async function estimate(_amount: string, _recipient: string): Promise<ACPEstimate> {
  return { estimatedFee: '0.001', estimatedTime: 2100 }
}

export async function execute(payload: {
  amount: string
  currency: string
  recipient: string
  priority: 'speed' | 'cost' | 'privacy'
}): Promise<ACPExecuteResult> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    await new Promise((r) => setTimeout(r, 400))
    return { success: true, txHash: 'acp_tx_dummy_' + Date.now().toString(36) }
  }

  const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any })
  const cents = Math.max(1, Math.round(parseFloat(payload.amount) * 100))
  const pi = await stripe.paymentIntents.create({
    amount: cents,
    currency: 'usd',
    payment_method: 'pm_card_visa',
    confirm: true,
    description: `ACP payment to ${payload.recipient}`,
    metadata: { recipient: payload.recipient, currency: payload.currency },
  })
  const ok = pi.status === 'succeeded'
  return { success: ok, txHash: pi.id }
}
