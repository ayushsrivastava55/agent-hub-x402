# Solana x402 - Multi-Protocol AI Agent Payment Platform

**A complete payment infrastructure for autonomous AI agents supporting multiple payment protocols (x402, ATXP, AP2, ACP) with intelligent routing, real-time monitoring, and seamless developer experience.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

Built for the [Solana x402 Hackathon](https://solana.com/x402/hackathon) 🏆

---

## 🎯 What is This?

This monorepo provides a complete solution for AI agents to make and receive payments across multiple protocols:

- **`hub/`** - Backend payment gateway with unified API and intelligent protocol routing
- **`agent-hub/`** - Next.js frontend demonstrating payment flows with x402 integration
- **`atxp-provider/`** - ATXP protocol provider implementation

### Why This Matters

AI agents need to transact autonomously, but the payment protocol landscape is fragmented. This platform solves that by:

1. **Unifying Protocols** - Single API for x402, ATXP, AP2, and ACP
2. **Intelligent Routing** - Automatic protocol selection based on cost, speed, or privacy
3. **Production Ready** - Built-in rate limiting, circuit breakers, HMAC auth, idempotency
4. **Developer Friendly** - Clean APIs, comprehensive docs, example implementations

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         AI Agents / Applications                │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼───┐   ┌────▼──┐   ┌────▼────┐
    │  SDK  │   │  CLI  │   │   Web   │
    │       │   │       │   │   App   │
    └───┬───┘   └────┬──┘   └────┬────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────▼────────────┐
        │     Payment Hub API      │
        │   (hub/)                 │
        │   - Protocol Router      │
        │   - Fee Optimization     │
        │   - Monitoring           │
        └────────┬────────┬────────┘
                 │        │
        ┌────────┼────────┼────────┐
        │        │        │        │
    ┌───▼──┐ ┌──▼───┐ ┌──▼───┐ ┌──▼────┐
    │ x402 │ │ ATXP │ │ AP2  │ │  ACP  │
    └───┬──┘ └──┬───┘ └──┬───┘ └──┬────┘
        │       │        │        │
        ▼       ▼        ▼        ▼
    Solana   MCP    Google   Stripe
             Servers Mandates
```

---

## 📦 Project Structure

```
solana-x402/
├── hub/                    # Backend Payment Gateway
│   ├── src/
│   │   ├── adapters/      # Protocol implementations
│   │   ├── routes/        # API endpoints
│   │   ├── lib/           # Auth, rate limiting, circuit breakers
│   │   └── monitor/       # Real-time metrics
│   ├── tests/             # E2E test suite
│   └── README.md          # Hub documentation
│
├── agent-hub/              # Next.js Frontend Demo
│   ├── app/               # Next.js app router
│   ├── components/        # React components
│   ├── middleware.ts      # x402 payment middleware
│   └── README.md          # Frontend documentation
│
├── atxp-provider/          # ATXP Provider Implementation
│   └── src/               # Provider logic
│
└── README.md               # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ or Bun
- **pnpm** (recommended) or npm
- **Redis** server (optional but recommended for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/solana-x402.git
cd solana-x402

# Install dependencies for both projects
cd hub && pnpm install && cd ..
cd agent-hub && pnpm install && cd ..
```

### Start the Backend Hub

```bash
cd hub

# Copy environment template
cp .env.example .env.local

# Edit with your configuration
nano .env.local

# Start Redis (if using)
redis-server

# Start the hub
pnpm dev
```

Hub runs on `http://localhost:8787`

### Start the Frontend Demo

```bash
cd agent-hub

# Start Next.js dev server
pnpm dev
```

Frontend runs on `http://localhost:3000`

### Verify Installation

```bash
# Check hub health
curl http://localhost:8787/health

# Get protocol status
curl http://localhost:8787/protocols/status

# Visit the frontend
open http://localhost:3000
```

---

## 🎨 Features

### Payment Hub (`hub/`)

- ✅ **Unified Payment API** - Single endpoint for all protocols
- ✅ **Intelligent Routing** - Cost, speed, or privacy optimization
- ✅ **Real-Time Monitoring** - Live metrics and health checks
- ✅ **Circuit Breakers** - Automatic failure isolation
- ✅ **Rate Limiting** - Redis-backed or in-memory
- ✅ **Idempotency** - Prevent duplicate payments
- ✅ **HMAC Authentication** - Secure API access
- ✅ **Protocol Support**:
  - **x402** (Coinbase) - HTTP 402 micropayments (~185ms, ~$0.00008)
  - **ATXP** (Circuit & Chisel) - Agent Transaction Protocol (~320ms, ~$0.00001)
  - **AP2** (Google) - Mandate-based payments (~600ms, ~$0.0002)
  - **ACP** (Stripe) - Instant checkout (~2100ms, ~$0.001)

### Frontend Demo (`agent-hub/`)

- ✅ **x402 Payment Gates** - Protect content with cryptocurrency payments
- ✅ **Coinbase Pay Integration** - Seamless payment experience
- ✅ **Session Management** - Automatic access after payment
- ✅ **Multiple Price Tiers** - Different pricing for different content
- ✅ **Solana Blockchain Verification** - Direct on-chain verification
- ✅ **Type-Safe** - Full TypeScript support

---

## 📡 API Usage

### Execute a Payment

```bash
curl -X POST http://localhost:8787/payments/execute \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "amount": "0.01",
    "currency": "USDC",
    "recipient": "agent-bob",
    "primaryProtocol": "atxp",
    "priority": "speed"
  }'
```

### Get Cost Estimates

```bash
curl http://localhost:8787/payments/estimate?amount=0.01
```

### Check Protocol Status

```bash
curl http://localhost:8787/protocols/status
```

See [hub/README.md](./hub/README.md) for complete API documentation.

---

## 🔧 Configuration

### Backend Hub Environment

```bash
# Required
HUB_API_SECRET=your-secret-key-here
FACILITATOR_URL=https://facilitator.payai.network

# Optional
REDIS_URL=redis://localhost:6379/0
STRIPE_SECRET_KEY=sk_test_...
ATXP_CONNECTION=https://accounts.atxp.ai?connection_token=...
```

### Frontend Environment

```bash
# Optional customization
NEXT_PUBLIC_WALLET_ADDRESS=your_solana_address_here
NEXT_PUBLIC_NETWORK=solana-devnet
NEXT_PUBLIC_CDP_CLIENT_KEY=your_client_key_here
```

See individual README files for detailed configuration:
- [Hub Configuration](./hub/README.md#configuration)
- [Frontend Configuration](./agent-hub/README.md#configuration)

---

## 🧪 Testing

### Backend E2E Tests

```bash
cd hub

# With hub running
pnpm test:e2e

# With HMAC auth
HUB_API_SECRET=your-secret pnpm test:e2e

# With real Stripe
STRIPE_SECRET_KEY=sk_test_... pnpm test:e2e
```

### Frontend Testing

```bash
cd agent-hub

# Start dev server
pnpm dev

# Visit http://localhost:3000
# Test payment flows with devnet tokens
```

---

## 🚢 Deployment

### Deploy Backend Hub

**Recommended platforms:**
- Render (with Redis addon)
- Fly.io (global edge)
- Railway (Redis built-in)
- Helius (Solana-optimized)

```bash
# Example: Deploy to Fly.io
cd hub
fly launch --name solana-agent-hub
fly secrets set HUB_API_SECRET=$(openssl rand -hex 32)
fly deploy
```

### Deploy Frontend

**Recommended platform:** Vercel

```bash
cd agent-hub

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

See detailed deployment guides:
- [Hub Deployment](./hub/README.md#deployment)
- [Frontend Deployment](./agent-hub/README.md)

---

## 📊 Protocol Comparison

| Protocol | Avg Time | Avg Fee    | Best For          |
|----------|----------|------------|-------------------|
| x402     | ~185ms   | ~$0.00008  | Micropayments     |
| ATXP     | ~320ms   | ~$0.00001  | Agent-to-agent    |
| AP2      | ~600ms   | ~$0.0002   | Mandated payments |
| ACP      | ~2100ms  | ~$0.001    | Checkout flows    |

---

## 🛡️ Security

- **HMAC Authentication** - Prevent unauthorized access
- **Rate Limiting** - Protect against abuse
- **Idempotency** - Prevent duplicate payments
- **Circuit Breakers** - Isolate failing protocols
- **Environment Variables** - Never commit secrets
- **HTTPS Only** - TLS in production

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📚 Documentation

- [Hub API Reference](./hub/README.md) - Complete backend documentation
- [Frontend Guide](./agent-hub/README.md) - Next.js integration guide
- [Environment Setup](./hub/README.md#configuration) - Configuration guide
- [Deployment Guide](./hub/README.md#deployment) - Production deployment

---

## 🏆 Hackathon

Built for **Solana x402 Hackathon**

**Tracks:**
- Best x402 API Integration
- Best Multi-Protocol Agent

**Features:**
- ✅ x402 protocol integration with Coinbase Pay
- ✅ Multi-protocol support (x402, ATXP, AP2, ACP)
- ✅ Intelligent routing and fee optimization
- ✅ Production-ready infrastructure
- ✅ Comprehensive documentation

---

## 🙏 Acknowledgments

- [Coinbase x402 Team](https://docs.cdp.coinbase.com/x402/) - x402 protocol
- [Circuit & Chisel](https://docs.atxp.ai/) - ATXP protocol
- [Solana Foundation](https://solana.com/) - Hackathon & blockchain
- [PayAI](https://facilitator.payai.network/) - Free Solana facilitator
- All protocol maintainers and contributors

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/solana-x402/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/solana-x402/discussions)
- **Email**: [your-email@example.com]

---

**Made with ❤️ for the autonomous agent economy**

*Empowering AI agents to transact freely across payment protocols*
