import express, { Router, type Request, type Response } from 'express'
import Stripe from 'stripe'
import { append } from '../lib/txlog'

const router = Router()

// Stripe Webhook: must be mounted with raw body to verify signature
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    // Accept silently in dev if no secret configured
    return res.status(200).json({ ok: true })
  }

  const sig = req.headers['stripe-signature'] as string | undefined
  if (!sig) return res.status(400).json({ error: { code: 'missing_signature', message: 'Missing stripe-signature header' } })

  let event: Stripe.Event
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' as any })
    event = stripe.webhooks.constructEvent((req as any).body, sig, secret)
  } catch (err: any) {
    return res.status(400).json({ error: { code: 'invalid_signature', message: err?.message || 'Invalid signature' } })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const amountUsd = ((pi.amount_received ?? pi.amount ?? 0) / 100).toFixed(2)
        await append({
          id: pi.id,
          protocol: 'acp',
          status: 'settled',
          recipient: String(pi.metadata?.recipient || ''),
          amount: amountUsd,
          requestId: undefined,
          at: Date.now(),
        })
        break
      }
      default:
        // ignore
        break
    }
  } catch (e) {
    // swallow errors to avoid webhook retries storms for non-critical logging
  }

  return res.status(200).json({ received: true })
})

export default router
