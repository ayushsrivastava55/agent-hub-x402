import express, { type Request, type Response, type NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { randomUUID } from 'crypto'
import paymentsRouter from './routes/payments'
import protocolsRouter from './routes/protocols'
import walletsRouter from './routes/wallets'
import webhooksRouter from './routes/webhooks'
import { rateLimit } from './lib/rateLimit'
import { requireHmac } from './lib/auth'
import { startMonitor } from './monitor/metrics'
import { sendError } from './lib/errors'
import { requireJwt } from './lib/jwt'

const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors())
// Mount webhooks BEFORE json parser to preserve raw body for signature verification
app.use('/webhooks', webhooksRouter)
app.use(express.json({ limit: '1mb' }))
const RL_WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000)
const RL_MAX = Number(process.env.RATE_LIMIT_MAX || 120)
app.use(rateLimit({ windowMs: RL_WINDOW, max: RL_MAX }))

// Attach a requestId to each response for tracing
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.requestId = req.headers['x-request-id'] || randomUUID()
  next()
})

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

const paymentsMiddlewares: Array<(req: Request, res: Response, next: NextFunction) => void> = []
if (process.env.HUB_JWT_SECRET || process.env.HUB_JWT_PUBLIC_KEY) {
  paymentsMiddlewares.push(requireJwt())
}
if (process.env.HUB_API_SECRET) {
  paymentsMiddlewares.push(requireHmac())
}
app.use('/payments', ...paymentsMiddlewares, paymentsRouter)
app.use('/protocols', protocolsRouter)
app.use('/wallets', walletsRouter)

// Start background monitor for protocol metrics
startMonitor()

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[hub] error', err)
  return sendError(res, 'internal_error', 'Internal Server Error', 500)
})

const port = Number(process.env.PORT || 8787)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[hub] listening on http://localhost:${port}`)
})
