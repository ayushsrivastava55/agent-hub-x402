# SolanaAgentHub - Multi-Protocol Payment Gateway

**A unified payment gateway enabling autonomous AI agents to transact seamlessly across multiple payment protocols (x402, ATXP, AP2, ACP) with automatic protocol selection, real-time fee comparison, and intelligent routing.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

Built for the [Solana x402 Hackathon](https://solana.com/x402/hackathon) 🏆

---

## 🎯 Overview

SolanaAgentHub solves the multi-protocol fragmentation problem in agent payments by providing:

- **Unified API** - Single endpoint for all payment protocols
- **Intelligent Routing** - Automatic protocol selection based on cost, speed, or privacy
- **Real-Time Monitoring** - Live metrics and health checks for all protocols
- **Production-Ready** - Built-in rate limiting, idempotency, circuit breakers, and HMAC auth
- **Protocol Support**:
  - ✅ **x402** (Coinbase) - HTTP 402 micropayments on Solana (~185ms, ~$0.00008)
  - ✅ **ATXP** (Circuit & Chisel) - Agent Transaction Protocol for MCP servers (~320ms, ~$0.00001)
  - ✅ **AP2** (Google) - Secure agent-led payments with mandates (~600ms, ~$0.0002)
  - ✅ **ACP** (Stripe) - Instant Checkout for AI agents (~2100ms, ~$0.001)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│         AI Agents / Applications                │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼───┐   ┌────▼──┐   ┌────▼────┐
    │  SDK  │   │  CLI  │   │   MCP   │
    │       │   │       │   │  Server │
    └───┬───┘   └────┬──┘   └────┬────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────▼────────────┐
        │  SolanaAgentHub (API)   │
        │   - Payment Router      │
        │   - Protocol Selection  │
        │   - Monitoring          │
        └────────┬────────┬───────┘
                 │        │
        ┌────────┼────────┼────────┐
        │        │        │        │
    ┌───▼──┐ ┌──▼───┐ ┌──▼───┐ ┌──▼────┐
    │ x402 │ │ ATXP │ │ AP2  │ │  ACP  │
    │      │ │      │ │      │ │       │
    └───┬──┘ └──┬───┘ └──┬───┘ └──┬────┘
        │       │        │        │
        ▼       ▼        ▼        ▼
    Solana   MCP    Google   Stripe
             Servers Mandates
```

### Core Components

- **Payment Router** (`src/routes/payments.ts`) - Unified execute/estimate endpoints
- **Protocol Adapters** (`src/adapters/`) - Standardized interfaces for each protocol
- **Circuit Breaker** (`src/lib/circuitBreaker.ts`) - Automatic failure isolation
- **Monitoring** (`src/monitor/metrics.ts`) - Real-time protocol health checks
- **Authentication** (`src/lib/auth.ts`) - HMAC signatures + optional JWT
- **Rate Limiting** (`src/lib/rateLimit.ts`) - Redis-backed or in-memory

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended) or npm
- Redis server (optional, but recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/solana-x402.git
cd solana-x402/hub

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
nano .env.local
```

### Required Environment Variables

```bash
# Generate with: openssl rand -hex 32
HUB_API_SECRET=your-secret-key-here

# x402 facilitator (use PayAI for free Solana devnet)
FACILITATOR_URL=https://facilitator.payai.network

# Redis (optional but recommended)
REDIS_URL=redis://localhost:6379/0
```

### Start Development Server

```bash
# Start Redis (if not running)
redis-server

# Start Hub in watch mode
pnpm dev

# Hub runs on http://localhost:8787
```

### Verify Installation

```bash
# Health check
curl http://localhost:8787/health

# Protocol status
curl http://localhost:8787/protocols/status

# Get payment estimates
curl http://localhost:8787/payments/estimate?amount=0.01
```

---

## 📡 API Reference

### Base URL

- Development: `http://localhost:8787`
- Production: Your deployed URL

### Authentication

**Optional HMAC signing** (recommended for production):

```bash
# Generate signature
timestamp=$(date +%s000)
payload='{"amount":"0.01","currency":"USDC","recipient":"agent-bob","primaryProtocol":"atxp"}'
signature=$(echo -n "POST
/payments/execute
$timestamp
$payload" | openssl dgst -sha256 -hmac "$HUB_API_SECRET" | cut -d' ' -f2)

# Include in headers
curl -X POST http://localhost:8787/payments/execute \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $timestamp" \
  -H "x-signature: $signature" \
  -d "$payload"
```

### Endpoints

#### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "time": "2025-11-12T04:00:00.000Z"
}
```

---

#### `GET /protocols/status`

Get real-time metrics for all protocols.

**Response:**
```json
{
  "timestamp": "2025-11-12T04:00:00.000Z",
  "protocols": {
    "x402": {
      "avgTime": 185,
      "avgFee": "0.00008",
      "successRate": 0.992,
      "facilitatorHealth": "operational",
      "lastUpdate": "2025-11-12T04:00:00.000Z"
    },
    "atxp": {
      "avgTime": 320,
      "avgFee": "0.00001",
      "successRate": 0.988,
      "status": "operational",
      "lastUpdate": "2025-11-12T04:00:00.000Z"
    }
  }
}
```

---

#### `GET /payments/estimate`

Get cost and time estimates for all protocols.

**Query Parameters:**
- `amount` (required) - Payment amount as decimal string

**Response:**
```json
{
  "estimates": [
    {
      "protocol": "x402",
      "estimatedFee": "0.00008",
      "estimatedTime": 185,
      "successRate": 0.992
    },
    {
      "protocol": "atxp",
      "estimatedFee": "0.00001",
      "estimatedTime": 320,
      "successRate": 0.988
    }
  ]
}
```

---

#### `POST /payments/execute`

Execute a payment using specified protocol.

**Headers:**
- `Content-Type: application/json`
- `Idempotency-Key: <uuid>` (recommended)
- `x-timestamp: <unix_ms>` (if HMAC enabled)
- `x-signature: <hmac_sha256>` (if HMAC enabled)

**Request Body:**
```json
{
  "amount": "0.01",
  "currency": "USDC",
  "recipient": "agent-bob",
  "primaryProtocol": "atxp",
  "priority": "speed"
}
```

**Fields:**
- `amount` (required) - Payment amount
- `currency` (required) - Currency code
- `recipient` (required) - Payment recipient identifier
- `primaryProtocol` (required) - Protocol to use: `x402`, `atxp`, `ap2`, or `acp`
- `priority` (optional) - `speed`, `cost`, or `privacy`
- `xPaymentHeader` (x402 only) - HTTP 402 payment header
- `paymentRequirements` (x402 only) - Payment requirements object
- `ap2Mandate` (AP2 only) - Mandate object with `mandateId` and `scope`

**Response:**
```json
{
  "transactionId": "txn_1699564800000",
  "protocol": "atxp",
  "recipient": "agent-bob",
  "amount": "0.01",
  "actualFee": "0.00001",
  "estimatedTime": 320,
  "status": "settled",
  "hash": "atxp_tx_dummy_abc123",
  "url": null,
  "correlationId": "a2a_xyz789"
}
```

**Error Response:**
```json
{
  "error": {
    "code": "invalid_request",
    "message": "Missing required field: amount",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "details": {}
  }
}
```

**Error Codes:**
- `invalid_request` (400) - Missing or invalid parameters
- `unauthorized` (401) - HMAC signature validation failed
- `rate_limit_exceeded` (429) - Too many requests
- `protocol_unavailable` (503) - Protocol circuit breaker open
- `internal_error` (500) - Server error

---

## ⚙️ Configuration

### Full Environment Variables

```bash
# === REQUIRED ===
HUB_API_SECRET=your-secret-key-here
FACILITATOR_URL=https://facilitator.payai.network

# === REDIS (Optional but recommended) ===
REDIS_URL=redis://localhost:6379/0

# === PROTOCOLS ===

# ACP (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ATXP (Circuit & Chisel)
ATXP_CONNECTION=https://accounts.atxp.ai?connection_token=...
# Optional provider shim override
# ATXP_PROVIDER_URL=https://localhost:4005
# ATXP_PROVIDER_TOKEN=...

# AP2 (Google)
AP2_STRICT_MANDATE=false
AP2_MANDATE_JWKS=https://www.googleapis.com/oauth2/v3/certs
AP2_MANDATE_ISSUER=https://accounts.google.com

# === OPTIONAL CONFIGURATION ===

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120

# Idempotency cache TTL
IDEMPOTENCY_TTL_MS=600000

# Circuit breaker
CB_ERROR_THRESHOLD=50

# x402 timeouts
X402_TIMEOUT_VERIFY_MS=30000
X402_TIMEOUT_SETTLE_MS=30000
X402_TIMEOUT_SUPPORTED_MS=30000

# Server port
PORT=8787
```

See [ENV_VARIABLES_GUIDE.md](../ENV_VARIABLES_GUIDE.md) for detailed setup instructions.

---

## 🧪 Testing

### Run E2E Tests

```bash
# With Hub running on localhost:8787
pnpm test:e2e

# With custom Hub URL
HUB_URL=https://your-hub.com pnpm test:e2e

# With HMAC authentication
HUB_API_SECRET=your-secret pnpm test:e2e

# Test with real Stripe
STRIPE_SECRET_KEY=sk_test_... pnpm test:e2e

# Test with real x402 flow
X402_HEADER="..." X402_REQ="{...}" pnpm test:e2e
```

### Manual Testing

```bash
# Test ATXP execution
curl -X POST http://localhost:8787/payments/execute \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "amount": "0.01",
    "currency": "USDC",
    "recipient": "agent-alice",
    "primaryProtocol": "atxp"
  }'

# Test AP2 with mandate
curl -X POST http://localhost:8787/payments/execute \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "0.01",
    "currency": "USDC",
    "recipient": "agent-bob",
    "primaryProtocol": "ap2",
    "ap2Mandate": {
      "mandateId": "demo",
      "scope": "content:read"
    }
  }'
```

---

## 🚢 Deployment

### Recommended Platforms

- **Render** - Easy Express deployment with Redis addon
- **Fly.io** - Global edge deployment
- **Railway** - Simple deployment with Redis built-in
- **Helius** - Solana-optimized infrastructure

### Deploy to Render

```bash
# 1. Create render.yaml
cat > render.yaml << 'EOF'
services:
  - type: web
    name: solana-agent-hub
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8787
      - key: HUB_API_SECRET
        sync: false
      - key: FACILITATOR_URL
        value: https://facilitator.payai.network
      - key: REDIS_URL
        fromService:
          type: redis
          name: solana-hub-redis
          property: connectionString

  - type: redis
    name: solana-hub-redis
    plan: starter
EOF

# 2. Push to GitHub and connect to Render
git add render.yaml
git commit -m "Add Render deployment config"
git push

# 3. In Render dashboard, create new Web Service from your repo
```

### Deploy to Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch --name solana-agent-hub

# Set secrets
fly secrets set HUB_API_SECRET=$(openssl rand -hex 32)
fly secrets set FACILITATOR_URL=https://facilitator.payai.network

# Deploy
fly deploy
```

### Environment Setup for Production

```bash
# Generate secure secret
openssl rand -hex 32

# Set all required environment variables in your platform
# Refer to .env.example for complete list
```

---

## 🔧 Development

### Project Structure

```
hub/
├── src/
│   ├── adapters/          # Protocol adapters
│   │   ├── x402.ts        # x402 (Coinbase)
│   │   ├── atxp.ts        # ATXP (Circuit & Chisel)
│   │   ├── ap2.ts         # AP2 (Google)
│   │   └── acp.ts         # ACP (Stripe)
│   ├── lib/               # Utilities
│   │   ├── auth.ts        # HMAC + JWT
│   │   ├── circuitBreaker.ts
│   │   ├── errors.ts      # Error handling
│   │   ├── idempotency.ts
│   │   ├── jwt.ts
│   │   ├── rateLimit.ts
│   │   └── redis.ts
│   ├── monitor/           # Metrics
│   │   └── metrics.ts     # Protocol monitoring
│   ├── routes/            # API routes
│   │   ├── payments.ts    # Main payment endpoints
│   │   ├── protocols.ts   # Status endpoint
│   │   ├── wallets.ts     # Wallet management
│   │   └── webhooks.ts    # Stripe webhooks
│   └── index.ts           # Server entry point
├── tests/
│   └── e2e.ts             # E2E test suite
├── .env.example           # Environment template
├── package.json
└── tsconfig.json
```

### Adding a New Protocol

1. Create adapter in `src/adapters/your-protocol.ts`:

```typescript
export async function estimate(amount: string, recipient: string) {
  // Return { estimatedFee: string, estimatedTime: number }
}

export async function execute(payload: PaymentPayload) {
  // Return { success: boolean, txHash: string | null }
}
```

2. Register in `src/routes/payments.ts`:

```typescript
import * as yourProtocol from '../adapters/your-protocol'

// Add to protocol map
const protocols = {
  x402, atxp, ap2, acp,
  yourProtocol  // Add here
}
```

3. Add metrics in `src/monitor/metrics.ts`

4. Update tests in `tests/e2e.ts`

### Code Style

```bash
# We use TypeScript strict mode
# Format: 2 spaces, single quotes, no semicolons (except where required)
# Follow existing patterns in the codebase
```

---

## 📊 Monitoring

### Metrics Available

- **avgTime** - Average settlement time (ms)
- **avgFee** - Average transaction fee
- **successRate** - Success rate (0-1)
- **facilitatorHealth** - x402 facilitator status
- **status** - Protocol operational status
- **lastUpdate** - Last metrics update timestamp

### Circuit Breaker

Protocols are automatically disabled if error rate exceeds threshold (default 50%):

```bash
# Configure threshold
CB_ERROR_THRESHOLD=30  # Open circuit at 30% errors
```

---

## 🛡️ Security

### Best Practices

1. **HMAC Authentication** - Enable in production with `HUB_API_SECRET`
2. **Rate Limiting** - Configure appropriate limits for your use case
3. **Idempotency** - Always include `Idempotency-Key` header
4. **HTTPS Only** - Use TLS in production
5. **Environment Variables** - Never commit `.env.local` or secrets
6. **Redis** - Use password-protected Redis in production

### Vulnerability Reporting

Report security issues to: [security@your-domain.com]

---

## 📚 Additional Documentation

- [Environment Variables Guide](../ENV_VARIABLES_GUIDE.md) - Complete setup instructions
- [Facilitator Setup](../FACILITATOR_SETUP.md) - x402 facilitator options
- [Frontend Integration](../agent-hub/setup.md) - Next.js frontend guide
- [PRD](../agent-hub/prd.md) - Product requirements and architecture

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

## 🏆 Hackathon Submission

Built for **Solana x402 Hackathon**
- **Track**: Best x402 API Integration + Best Multi-Protocol Agent
- **Demo**: [Link to demo video]
- **Live URL**: [Your deployed URL]

---

## 🙏 Acknowledgments

- [Coinbase x402 Team](https://docs.cdp.coinbase.com/x402/) for the x402 protocol
- [Circuit & Chisel](https://docs.atxp.ai/) for ATXP
- [Solana Foundation](https://solana.com/) for the hackathon
- [PayAI](https://facilitator.payai.network/) for free Solana facilitator
- All protocol maintainers and contributors

---

**Made with ❤️ for the agent economy**
