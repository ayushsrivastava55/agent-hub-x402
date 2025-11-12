import { Router, type Request, type Response } from 'express'
import { getMetrics } from '../monitor/metrics'
import { getStates } from '../lib/circuitBreaker'

const router = Router()

router.get('/status', (_req: Request, res: Response) => {
  const metrics = getMetrics()
  const circuit = getStates()
  return res.json({ ...metrics, circuit })
})

export default router
