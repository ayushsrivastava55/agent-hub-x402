import express, { Request, Response } from 'express'
import cors from 'cors'
import 'dotenv/config'

/**
 * ATXP Provider Shim
 * 
 * This is a lightweight provider service that demonstrates ATXP integration.
 * In a real deployment, this would connect to Circuit & Chisel's MCP infrastructure.
 * 
 * For the hackathon, this shim:
 * - Validates ATXP_CONNECTION is present
 * - Provides /estimate and /execute endpoints
 * - Simulates successful payments with proper response format
 * - Can be extended to call real ATXP APIs
 */

const app = express()

app.use(cors())
app.use(express.json())

// Validate ATXP connection is configured
const ATXP_CONNECTION = process.env.ATXP_CONNECTION
if (!ATXP_CONNECTION) {
  console.warn('[atxp-provider] WARNING: ATXP_CONNECTION not set. Provider will work in demo mode.')
}

// Optional auth token for Hub to authenticate with this provider
const PROVIDER_TOKEN = process.env.ATXP_PROVIDER_TOKEN || ''

// Simple auth middleware
function requireAuth(req: Request, res: Response, next: Function) {
  if (!PROVIDER_TOKEN) return next() // Skip auth if no token configured
  
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  
  if (token !== PROVIDER_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  next()
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'atxp-provider-shim',
    atxpConfigured: !!ATXP_CONNECTION,
    time: new Date().toISOString()
  })
})

// Estimate endpoint
app.post('/estimate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { amount, recipient } = req.body
    
    if (!amount || !recipient) {
      return res.status(400).json({
        error: 'Missing required fields: amount, recipient'
      })
    }
    
    console.log(`[atxp-provider] Estimate request: ${amount} for ${recipient}`)
    
    // In a real implementation, this would:
    // 1. Parse ATXP_CONNECTION to get account details
    // 2. Call Circuit & Chisel APIs to get real estimates
    // 3. Return actual fee structure based on MCP server pricing
    
    // For now, return realistic simulated estimates
    const estimatedFee = '0.00001' // ATXP has very low fees
    const estimatedTime = Math.floor(Math.random() * 100) + 300 // 300-400ms
    
    res.json({
      estimatedFee,
      estimatedTime,
      recipient,
      amount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[atxp-provider] Estimate error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Execute endpoint
app.post('/execute', requireAuth, async (req: Request, res: Response) => {
  try {
    const { amount, currency, recipient, priority } = req.body
    
    if (!amount || !currency || !recipient) {
      return res.status(400).json({
        error: 'Missing required fields: amount, currency, recipient'
      })
    }
    
    console.log(`[atxp-provider] Execute request: ${amount} ${currency} to ${recipient} (priority: ${priority})`)
    
    // In a real implementation, this would:
    // 1. Parse ATXP_CONNECTION to extract wallet/account info
    // 2. Use @atxp/client SDK to initiate payment
    // 3. Call MCP server with payment proof
    // 4. Return actual transaction hash from blockchain
    
    // For hackathon demo, simulate successful execution
    await new Promise(resolve => setTimeout(resolve, 350)) // Simulate network delay
    
    const txHash = `atxp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    
    res.json({
      success: true,
      txHash,
      amount,
      currency,
      recipient,
      priority: priority || 'speed',
      timestamp: new Date().toISOString(),
      // Include ATXP-specific metadata
      atxp: {
        connectionUsed: ATXP_CONNECTION ? 'configured' : 'demo',
        mcpServer: 'simulated',
        toolCall: null
      }
    })
  } catch (error) {
    console.error('[atxp-provider] Execute error:', error)
    res.status(500).json({
      success: false,
      txHash: null,
      error: 'Execution failed'
    })
  }
})

// Start server
const PORT = Number(process.env.PORT || 4005)
app.listen(PORT, () => {
  console.log(`[atxp-provider] Listening on http://localhost:${PORT}`)
  console.log(`[atxp-provider] ATXP_CONNECTION: ${ATXP_CONNECTION ? '✓ configured' : '✗ not set'}`)
  console.log(`[atxp-provider] Auth: ${PROVIDER_TOKEN ? 'enabled' : 'disabled'}`)
})
