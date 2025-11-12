# SolanaAgentHub: Multi-Protocol Payment Gateway PRD

**Version:** 1.0 (MVP)  
**Target Launch:** 8 weeks  
**Last Updated:** November 7, 2025  
**Status:** Ready for Development

---

## 🎯 Executive Summary

**SolanaAgentHub** is a unified payment gateway that enables autonomous AI agents to seamlessly transact across multiple payment protocols (x402, ATXP, AP2, ACP) with automatic protocol selection, real-time fee comparison, and intelligent routing.

### Hackathon Strategy
- **Event:** Solana x402 Hackathon
- **Target Tracks:** 
  - Best Multi-Protocol Agent ($10k ATXP)
  - Best x402 API Integration ($10k)
  - Best x402 Agent Application ($20k)
- **Maximum Prize Potential:** $40,000+

### The Big Idea
Make multi-protocol agent payments as simple as:
```javascript
const payment = await hub.pay({
  amount: "0.01",
  currency: "USDC",
  recipient: "AgentXYZ123",
  intent: "api_call"
});
```

### Error Schema

All error responses follow a consistent structure:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "requestId": "string",
    "details": {}
  }
}
```

Recommended headers:

- `Idempotency-Key`: Client-provided UUID to de-duplicate requests
- `Retry-After`: Seconds to wait before retrying (for 429/503)

### Example App Integration (Next.js)

Use the example app to call the Hub API for protocol selection and execution:

```ts
// app/actions/pay.ts (server action)
export async function pay(payload: {
  amount: string
  currency: string
  recipient: string
  priority?: 'speed' | 'cost' | 'privacy'
}) {
  const res = await fetch(process.env.HUB_URL + '/payments/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.HUB_API_KEY}`,
      'Idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify(payload),
    cache: 'no-store'
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message || 'Payment failed')
  }
  return res.json()
}
```

---

## 🚨 Problem Statement

### The Multi-Protocol Fragmentation Problem

The agent payment ecosystem is fragmenting across incompatible protocols:

1. **x402 (Coinbase)** - HTTP 402-based micropayments, ~200ms settlement, <$0.0001 costs on Solana
2. **ATXP (Circuit & Chisel)** - Agent transaction protocol for MCP servers, per-call pricing
3. **AP2 (Google)** - Secure agent-led payments with mandates and verifiable credentials
4. **ACP (Stripe)** - Instant Checkout integration for ChatGPT and Gemini

### Current Developer Experience

❌ Must integrate each protocol separately  
❌ No visibility into protocol performance differences  
❌ Manual selection based on guesswork  
❌ High development overhead duplicating payment logic  

### Impact

- Agents waste capital on suboptimal routing
- Developers abandon multi-protocol support
- Limited agent economy scalability

---

## 🎨 Product Vision

**Mission Statement:** "Build the infrastructure layer that lets AI agents transact globally without caring about which payment protocol to use."

### Why SolanaAgentHub Solves This

✅ **Single Integration** - One API for all protocols  
✅ **Intelligent Routing** - Automatic protocol selection based on transaction requirements  
✅ **Real-Time Intelligence** - Live fee/speed/privacy monitoring  
✅ **Developer-First** - SDKs, MCP servers, CLI tools  

### Platform Capabilities

- **Supported Protocols:** x402, ATXP, AP2, ACP
- **Supported Chains:** Solana (primary), Base, Ethereum
- **Settlement Time:** <500ms for fast paths, <2s for verified paths

---

## 🔧 Core Features (MVP)

### Feature 1: Unified Payment API

#### 1.1 Single Endpoint Payment Gateway

One API endpoint handles all protocol complexity:

```typescript
// TypeScript SDK Example
const payment = await hub.pay({
  amount: "0.01",
  currency: "USDC",
  recipient: "AgentXYZ123",
  intent: "api_call" | "data_purchase" | "compute"
});
```

#### 1.2 Automatic Protocol Selection

**Selection Logic (with weighting):**

- **Speed Priority** (time-sensitive operations): x402 (~200ms) > ATXP > AP2 > ACP
- **Cost Priority** (micropayments): x402 (<$0.0001) > ATXP > ACP > AP2
- **Privacy Priority** (sensitive transactions): AP2 (mandates) > ACP > ATXP > x402
- **Merchant Compatibility**: Use protocol merchant accepts
- **Fallback Strategy**: Try primary → secondary → tertiary → quaternary

**Machine Learning Enhancement (Future):**
- Learn from transaction success/failure patterns
- Optimize based on user's historical preferences
- Predict protocol availability

---

### Feature 2: Developer Experience Layer

#### 2.1 TypeScript/Python SDKs

**Installation:**
```bash
npm install @solana-agent-hub/sdk
# or
pip install solana-agent-hub
```

**SDK Capabilities:**
- Auto-generated from protocol specs
- Type-safe payment flows
- Built-in retry logic with exponential backoff
- Gas estimation across chains
- Transaction batching

**Usage Example:**
```typescript
import { SolanaAgentHub } from '@solana-agent-hub/sdk';

const hub = new SolanaAgentHub({
  apiKey: 'hub_xxx',
  environment: 'mainnet'
});

// Create wallet for agent
const wallet = await hub.wallet.create({
  agentName: 'my-agent',
  supportedChains: ['solana', 'base']
});

// Execute payment
const payment = await hub.payments.execute({
  amount: '0.01',
  currency: 'USDC',
  recipient: 'alice@agents',
  priority: 'speed'
});

console.log(`Paid ${payment.amount} via ${payment.protocol}`);
console.log(`Settlement time: ${payment.actualTime}ms`);
console.log(`Fee: $${payment.actualFee}`);
```

#### 2.2 CLI Tool

```bash
# Pay once
agentpay --amount 0.01 --protocol auto --recipient alice@agents.sol

# Create agent wallet
agentpay wallet create --name my-agent

# Check balance
agentpay balance --address 0xabc123

# Monitor transaction
agentpay tx status 0x123abc
```

#### 2.3 MCP Server

**Purpose:** Expose payment tools to any LLM/AI framework

**Tools Provided:**
- `execute_payment` - Pay with automatic protocol selection
- `estimate_cost` - Get fee estimates across protocols
- `check_balance` - Query wallet balance
- `approve_spending` - Create spending limits
- `get_supported_protocols` - List available protocols

**Usage Example (Claude, Gemini, etc.):**
```
Agent: "I need to purchase this dataset. Let me check costs."
[Calls MCP tool: estimate_cost for all protocols]

MCP: "x402: $0.0002 (fastest), ATXP: $0.0001 (cheapest)"

Agent: "Execute payment with ATXP"
[Calls MCP tool: execute_payment with ATXP]
```

---

### Feature 3: Multi-Protocol Orchestration

#### 3.1 Protocol Adapters

Each protocol has a standardized adapter:

```typescript
interface ProtocolAdapter {
  name: "x402" | "atxp" | "ap2" | "acp";
  estimate(amount: bigint, recipient: string): Promise<CostEstimate>;
  execute(payload: PaymentPayload): Promise<TransactionResult>;
  verify(txHash: string): Promise<VerificationResult>;
  metadata: ProtocolMetadata;
}
```

**Adapter Implementation:**
- **x402 Adapter** - Wraps Corbits SDK + Coinbase facilitators
- **ATXP Adapter** - Direct integration with Circuit & Chisel APIs
- **AP2 Adapter** - Google's reference implementation + state management
- **ACP Adapter** - Stripe/Instant Checkout bridges

#### 3.2 Real-Time Protocol Monitoring

**Metrics Tracked:**
- Settlement time (actual vs. expected)
- Success rate by protocol
- Current fees
- Network congestion
- Facilitator health

**Data Sources:**
- Protocol RPC nodes
- Facilitator health endpoints
- Onchain transaction data
- Community crowdsourced reports

**Update Frequency:** Every 30 seconds

**Example Dashboard:**
```
x402:  avg 185ms ✓  $0.00008  success: 99.2%
ATXP:  avg 320ms ✓  $0.00001  success: 98.8%
AP2:   avg 750ms ✓  $0.0005   success: 99.7%
ACP:   avg 2100ms ⚠ $0.001    success: 97.2%
```

#### 3.3 Intelligent Fallback Routing

```typescript
// If primary protocol fails, automatically try secondary
const payment = await hub.pay({
  amount: "0.01",
  recipient: "agent-bob",
  primaryProtocol: "x402",
  fallback: ["atxp", "ap2"], // Try in order
  maxRetries: 3,
  timeout: 5000 // 5 second total timeout
});
```

**Fallback Behavior:**
1. Try primary protocol
2. If failed, try first fallback
3. If failed, try second fallback
4. If all failed, throw error with detailed log
5. Automatically refund any partial payments

---

### Feature 4: Agent Wallet Management

#### 4.1 CDP Embedded Wallet Integration

**Wallet Creation Flow:**
1. Agent requests wallet creation
2. Generate email identifier (`agent-{uuid}@hub.solana`)
3. Create CDP embedded wallet
4. Return address + signing capabilities
5. Store in encrypted key management service

**Benefits:**
- <500ms wallet creation
- <200ms signing latency
- Multi-chain support (Solana + EVM)
- No seed phrases
- Policy engine for transaction limits

#### 4.2 Identity & Reputation

**Agent DID (Decentralized Identity):**
```
did:solana:agent-{uuid}
```

**Tracked Metrics:**
- Transaction history
- Success rate
- Total value transacted
- Reputation score (0-100)

**Reputation Scoring:**
- Transaction success rate: 40%
- Payment timeliness: 30%
- Volume traded: 20%
- Community votes: 10%

**Integration:** Use Switchboard oracle for attestations

---

### Feature 5: Monitoring & Analytics

#### 5.1 Transaction Dashboard

Real-time view of:
- Protocol usage distribution
- Average settlement times
- Cost savings vs. single-protocol baseline
- Success/failure rates
- Top merchants/recipients

#### 5.2 Developer Metrics

Per-developer tracking:
- Total volume
- Cost vs. estimate
- Protocol preferences
- Error logs with context
- Performance benchmarks

---

## 🏗️ Technical Architecture

### High-Level System Design

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
        │  Payment Router Engine  │
        │  (Protocol Selection)   │
        └────────┬────────┬───────┘
                 │        │
        ┌────────┼────────┼────────┐
        │        │        │        │
    ┌───▼──┐ ┌──▼───┐ ┌──▼───┐ ┌──▼────┐
    │ x402 │ │ ATXP │ │ AP2  │ │  ACP  │
    │Adapt.│ │Adapt.│ │Adapt.│ │Adapt. │
    └───┬──┘ └──┬───┘ └──┬───┘ └──┬────┘
        │       │        │        │
        └───────┼────────┼────────┘
                │        │
        ┌───────▼────────▼────────┐
        │   Protocol Networks     │
        │  (Solana/Base/ETH)      │
        └─────────────────────────┘
```

### Core Modules

#### Module 1: Payment Router

**Responsibility:** Analyze transaction and select optimal protocol

**Inputs:**
- Payment amount
- Recipient address
- Merchant protocol acceptance
- Priority (speed/cost/privacy)
- Network preferences

**Output:**
- Selected protocol
- Estimated time/cost
- Alternative options

**Algorithm Pseudocode:**
```python
FUNCTION selectProtocol(payment: PaymentRequest):
  FOR each protocol in ENABLED_PROTOCOLS:
    metrics = getRealtimeMetrics(protocol)
    score = calculateScore(payment, metrics)
  ENDFOR
  
  # Weighted scoring
  bestProtocol = maxBy(score)
  
  # Check merchant acceptance
  IF !isMerchantAccepted(bestProtocol):
    bestProtocol = selectByConstraint(MERCHANT_PROTOCOLS)
  ENDIF
  
  RETURN { protocol: bestProtocol, alternatives: [...] }
```

#### Module 2: Protocol Adapters

**Template for each adapter:**
```typescript
class X402Adapter implements ProtocolAdapter {
  async estimate(amount: bigint, recipient: string) {
    // Call Corbits SDK
    // Calculate gas + protocol fees
    // Return { amount, fee, time }
  }
  
  async execute(payload: PaymentPayload) {
    // Sign transaction
    // Call facilitator.settle()
    // Poll for confirmation
    // Return txHash
  }
  
  async verify(txHash: string) {
    // Query blockchain
    // Check transaction status
    // Verify funds transferred
  }
}
```

#### Module 3: Wallet Manager

**Responsibility:** Create, manage, and secure agent wallets

**Uses:** Coinbase CDP Embedded Wallets

**Features:**
- Generate deterministic email for each agent
- Create CDP wallet
- Store in encrypted database
- Provide signing interface
- Enforce spending policies

#### Module 4: Monitoring Service

**Responsibility:** Real-time metrics collection

**Data Collection:**
- Query protocol RPC endpoints
- Parse onchain transactions
- Call facilitator health endpoints
- Aggregate statistics

**Storage:** Time-series database (InfluxDB)

---

## 🔌 API Specification

### REST API Endpoints

#### POST /payments/execute

Execute a payment across all protocols

**Request:**
```json
{
  "amount": "0.01",
  "currency": "USDC",
  "recipient": "agent-bob@solana",
  "priority": "speed" | "cost" | "privacy",
  "primaryProtocol": "auto" | "x402" | "atxp" | "ap2" | "acp",
  "fallback": ["atxp", "ap2"],
  "metadata": {
    "intent": "api_call",
    "merchant": "openai.com"
  }
}
```

**Response:**
```json
{
  "transactionId": "txn_123abc",
  "protocol": "x402",
  "recipient": "0xabc123...",
  "amount": "0.01",
  "actualFee": "0.00008",
  "estimatedTime": 250,
  "status": "pending",
  "hash": "0x123abc...",
  "url": "https://solscan.io/tx/0x123..."
}
```

#### GET /payments/estimate

Get cost/time estimates across protocols

**Request:**
```
GET /payments/estimate?amount=0.01&currency=USDC&recipient=agent-bob&priority=speed
```

**Response:**
```json
{
  "amount": "0.01",
  "estimates": [
    {
      "protocol": "x402",
      "estimatedFee": "0.00008",
      "estimatedTime": 200,
      "success_rate": 0.992
    },
    {
      "protocol": "atxp",
      "estimatedFee": "0.00001",
      "estimatedTime": 350,
      "success_rate": 0.988
    }
  ]
}
```

#### POST /wallets/create

Create a new agent wallet

**Request:**
```json
{
  "agentName": "my-agent",
  "supportedChains": ["solana", "base"],
  "spendingLimit": "1.0"
}
```

**Response:**
```json
{
  "walletId": "wallet_123",
  "did": "did:solana:agent-xyz",
  "addresses": {
    "solana": "7Y9ABC123...",
    "base": "0xabc123..."
  },
  "created_at": "2025-11-07T01:45:00Z"
}
```

#### GET /protocols/status

Real-time protocol metrics

**Response:**
```json
{
  "timestamp": "2025-11-07T01:45:30Z",
  "protocols": {
    "x402": {
      "avgTime": 185,
      "avgFee": "0.00008",
      "successRate": 0.992,
      "facilitatorHealth": "operational",
      "lastUpdate": "2025-11-07T01:45:25Z"
    },
    "atxp": {
      "avgTime": 320,
      "avgFee": "0.00001",
      "successRate": 0.988,
      "status": "operational"
    }
  }
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: MVP (Weeks 1-4)

**Core Infrastructure:**
- [x] Protocol adapter framework
- [x] x402 adapter (via Corbits)
- [x] ATXP adapter (via Circuit & Chisel)
- [x] Basic routing logic
- [x] CDP wallet integration

**Developer Tools:**
- [x] TypeScript SDK (core)
- [x] REST API (3 endpoints)
- [ ] MCP server (basic)

### Phase 2: Polish (Weeks 5-6)

**Robustness:**
- [ ] Fallback routing & retry logic
- [ ] Real-time protocol monitoring
- [ ] Comprehensive error handling
- [ ] Rate limiting & DDoS protection

**User Experience:**
- [ ] Dashboard
- [ ] Documentation & examples

### Phase 3: Optimization (Weeks 7-8)

**Advanced Features:**
- [ ] Python SDK
- [ ] CLI tool
- [ ] Advanced MCP tools
- [ ] ML-based routing

**Production Readiness:**
- [ ] Performance benchmarking
- [ ] Security audit
- [ ] Mainnet deployment

---

## 🎯 Success Criteria (Hackathon Judging)

### Technical Criteria

✓ Multi-protocol support (x402, ATXP, AP2, ACP)  
✓ Automatic protocol selection logic  
✓ <3 minute integration time for developers  
✓ Solana devnet deployment  
✓ Live demo showing protocol switching  
✓ Open-source code on GitHub  

### Innovation Criteria

✓ First unified gateway across all agent payment protocols  
✓ Intelligent routing algorithm  
✓ Proven cost savings vs. single-protocol approach  

### Demo Video (3 min max)

1. **Intro (30s):** Show the problem (protocol fragmentation)
2. **Single Integration (60s):** Dev adds `@solana-agent-hub/sdk`, 10-line integration
3. **Live Routing Demo (90s):**
   - Three agents make payments simultaneously
   - Dashboard shows auto-routing to different protocols
   - Show cost/time comparisons in real-time
4. **Metrics Dashboard (30s):** Show aggregated performance data

### Acceptance Tests (MVP)

- Protocol selection returns x402 for speed and cost priorities on devnet
- Fallback: simulate x402 failure and auto-route to ATXP with success
- `/payments/estimate` returns consistent fee/time ranges across adapters
- Wallet creation < 500ms; signing < 200ms (mock acceptable)
- Monitoring shows live metrics updates within 30s

---

## 🛠️ Technology Stack

### Backend

- **Runtime:** Node.js 22+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL + InfluxDB (time-series)
- **Blockchain Interaction:**
  - Corbits SDK (x402)
  - @solana/web3.js
  - ethers.js
- **Deployment:** Vercel (API) + Docker (monitoring service)

### Frontend (Dashboard)

- **Framework:** React 18+
- **UI:** Shadcn/ui
- **Charts:** Recharts
- **State:** TanStack Query

### Development Tools

- **Testing:** Jest + Vitest
- **Linting:** ESLint + Prettier
- **CI/CD:** GitHub Actions
- **Documentation:** Nextra + Markdown

---

## 🔒 Security Considerations

### API Security

✓ JWT authentication with API keys  
✓ Rate limiting (100 req/min per key)  
✓ Request signing with HMAC-SHA256  
✓ CORS allowlist  

### Wallet Security

✓ Private keys never leave CDP enclave  
✓ All signatures happen in TEE  
✓ Spending limits enforced at adapter level  
✓ Multi-device wallet support  

### Smart Contract Safety

✓ No custom smart contracts (use protocol specs only)  
✓ All transactions verified before execution  
✓ Rollback capability for failed transactions  

### Data Privacy

✓ No transaction metadata stored server-side  
✓ Analytics aggregated only  
✓ Developer API keys never logged in plaintext  

---

## 📊 Monitoring & Observability

### Key Metrics

- Request latency (p50, p95, p99)
- Protocol success rates
- Cost per transaction by protocol
- API error rates
- Wallet creation time

### Alerts

- Protocol adapter failures
- High error rates (>5%)
- Network congestion detected
- API response time > 1s
- Facilitator health issues

### Logging

- All transactions logged with context
- Error logs with stack traces
- Audit logs for sensitive operations

---

## 📈 Competitor Analysis

| Feature | SolanaAgentHub | x402 Solo | ATXP Solo | AP2 Solo | ACP Solo |
|---------|----------------|-----------|-----------|----------|----------|
| Multi-protocol | ✓ | - | - | - | - |
| Auto routing | ✓ | - | - | - | - |
| Cost comparison | ✓ | - | - | - | - |
| Fallback routing | ✓ | - | - | - | - |
| SDK | ✓ | Limited | Limited | No | No |
| MCP server | ✓ | No | Yes | No | No |
| Dashboard | ✓ | Partial | No | No | No |

---

## 💰 Financial Projections (Post-Hackathon)

### Revenue Model

1. **Developer Tier:** Free for <$100/month volume
2. **Business Tier:** 0.1% transaction fee or $99/month (whichever is greater)
3. **Enterprise Tier:** Custom pricing

### Cost Structure

- Protocol facilitator fees: pass-through
- Infrastructure: ~$2,000/month (at scale)
- Team: 2 engineers minimum

---

## 🗺️ Post-Launch Roadmap

### Q1 2026

- Mainnet expansion to Ethereum + Arbitrum
- Mobile SDK (React Native)
- Web3 wallet discovery (WAGMI integration)
- Advanced ML routing

### Q2 2026

- Compliance layer (AML/KYC)
- Plugin marketplace
- Protocol aggregator partnerships

### Q3 2026

- Cross-chain atomic swaps
- DEX routing integration
- Agent marketplace

---

## 📚 Documentation & Resources

### Protocol Documentation

#### x402
- **Whitepaper:** https://www.x402.org/x402-whitepaper.pdf
- **Coinbase Docs:** https://docs.cdp.coinbase.com/x402/core-concepts/http-402
- **GitHub:** https://github.com/coinbase/x402
- **Corbits Quickstart:** https://corbits.dev/quickstart

#### ATXP
- **Docs:** https://docs.atxp.ai
- **GitHub:** https://github.com/Circuit-Chisel/atxp
- **Announcement:** https://www.prnewswire.com/news-releases/circuit--chisel-secures-19-2-million-and-launches-atxp-302562331.html

#### AP2
- **Google Blog:** https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol
- **Spec:** https://agentpaymentsprotocol.info
- **GitHub:** https://github.com/google/agent-payments-protocol

#### ACP
- **Stripe:** https://stripe.com/instant-checkout
- **Documentation:** (integrated into Stripe docs)

---

### Phase 2 Implementation Status (Robustness)

- Single-Protocol Execution: The Hub executes only the selected `primaryProtocol` (no fallbacks). Retries/timeout supported; idempotency via `Idempotency-Key`.
- Protocols: x402 (facilitator `/supported` pre-check + `/verify`/`/settle`), ATXP (connection string via `ATXP_CONNECTION`; optional provider shim via `ATXP_PROVIDER_URL`/`ATXP_PROVIDER_TOKEN`, stub fallback when unset), AP2 (mandate with optional strict validation), ACP (Stripe PaymentIntents via `STRIPE_SECRET_KEY`, stub fallback).
- Monitoring: Real-time metrics and `/protocols/status`.
- Error Handling: Unified schema `{ error: { code, message, requestId, details } }`.
- Rate Limiting: Configurable via env (see below).
- Idempotency: Redis-backed when `REDIS_URL` is set; falls back to in-memory per-instance store.
- Security: HMAC-signed proxy in Next (`/api/hub/execute`). Optional JWT (disabled unless env set).

#### How-To

- x402 Happy Path (Solana)
  1. Trigger 402 flow in Next to obtain `xPaymentHeader` + `paymentRequirements`.
  2. Use `/execute` page, select `x402`, paste fields. Hub validates `/supported`, then `/verify` + `/settle`.

- AP2 Mandate
  - Select `ap2` and pass `ap2Mandate` JSON (e.g. `{ "mandateId": "demo", "scope": "content:read" }`).

- Facilitator Selection
  - Hub uses `FACILITATOR_URL` (default `https://x402.org/facilitator`). Set to Rapid402 or custom as needed.

- Rate Limiting (Hub)
  - `RATE_LIMIT_WINDOW_MS` (default `60000`)
  - `RATE_LIMIT_MAX` (default `120`)

- Integrations (Optional)
  - ATXP: set `ATXP_API_URL` (+ `ATXP_API_KEY`) to enable real provider calls.
  - ACP: set `STRIPE_SECRET_KEY` (test key) to enable real Stripe PaymentIntents.
  - AP2: set `AP2_STRICT_MANDATE=true` to enforce issuer/issuedAt/expiry on mandates.

Next Steps: Redis-backed rate limits, circuit breaker, x402 happy-path E2E with real header, real ATXP/ACP integrations.

### SDK & Framework Documentation

#### CDP Embedded Wallets
- **Docs:** https://docs.cdp.coinbase.com/embedded-wallets/welcome
- **Quickstart:** https://docs.cdp.coinbase.com/embedded-wallets/quickstart
- **React Hooks:** https://docs.cdp.coinbase.com/embedded-wallets/hooks

#### Solana
- **Web3.js:** https://github.com/solana-labs/solana-web3.js
- **Devnet Setup:** https://docs.solana.com/developers
- **Faucet:** https://faucet.solana.com

#### MCP
- **Spec:** https://modelcontextprotocol.io
- **Anthropic Guide:** https://github.com/anthropics/model-context-protocol
- **Examples:** https://github.com/anthropics/model-context-protocol/tree/main/examples

---

### Agent & AI Frameworks

#### Switchboard Oracles
- **Docs:** https://docs.switchboard.xyz
- **Solana Program:** `SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f`
- **Attestations:** https://docs.switchboard.xyz/attestation

#### Solana Agent Kit
- **GitHub:** https://github.com/solana-foundation/solana-agent-kit
- **Docs:** https://docs.agent-kit.solana.com

#### LangChain
- **Docs:** https://python.langchain.com
- **Solana Integration:** https://python.langchain.com/docs/modules/tools/

#### Claude API
- **Documentation:** https://claude.ai/docs
- **MCP Specification:** https://github.com/anthropics/model-context-protocol

---

### Deployment & Infrastructure

#### Vercel
- **Docs:** https://vercel.com/docs
- **Edge Functions:** https://vercel.com/docs/edge-functions/overview

#### Docker
- **Getting Started:** https://docs.docker.com/get-started/
- **Solana Container:** https://hub.docker.com/_/solana

#### GitHub Actions
- **Workflows:** https://docs.github.com/en/actions/using-workflows

---

## 📋 Appendix: Protocol Comparison Table

### Performance Metrics

| Aspect | x402 | ATXP | AP2 | ACP |
|--------|------|------|-----|-----|
| Settlement Time | ~200ms | ~350ms | ~750ms | ~2100ms |
| Typical Fee | $0.00008 | $0.00001 | $0.0005 | $0.001 |
| Use Cases | Micropayments, APIs | MCP tools | Retail, Mandates | ChatGPT integration |
| Chain Support | Multi | Multi | Multi | Limited |
| KYC Required | No | No | Optional | Yes |
| Privacy | Low | Medium | High | Medium |
| Standardization | Informal | Emerging | W3C | Stripe-led |
| Developer Adoption | Growing | Early | Enterprise | ChatGPT Users |

---



**Document Version:** 1.0  
**Status:** Ready for Development  
**Contact:** [Your contact information]

---

*Built for the Solana x402 Hackathon*