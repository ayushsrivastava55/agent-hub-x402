import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'crypto'

const router = Router()

router.post('/create', (_req: Request, res: Response) => {
  const id = `wallet_${Date.now()}`
  const did = `did:solana:agent-${randomUUID()}`
  return res.status(201).json({
    walletId: id,
    did,
    addresses: {
      solana: '7Y9ABC123...',
      base: '0xabc123...'
    },
    created_at: new Date().toISOString()
  })
})

export default router
