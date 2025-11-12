# ATXP Provider Shim

A lightweight provider service demonstrating ATXP (Agent Transaction Protocol) integration for the SolanaAgentHub.

## Purpose

This shim enables the Hub to move from stubbed ATXP responses to provider-backed execution. In production, this would connect to Circuit & Chisel's MCP infrastructure. For the hackathon, it demonstrates:

- ATXP connection string handling
- Provider API contract (`/estimate` and `/execute`)
- Optional authentication with bearer tokens
- Realistic timing and fee simulation

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Add your ATXP connection string (from npx atxp create)
nano .env

# Start provider
pnpm dev

# Provider runs on http://localhost:4005
```

## Configuration

```bash
# .env
ATXP_CONNECTION=https://accounts.atxp.ai?connection_token=...
ATXP_PROVIDER_TOKEN=optional_secret  # For Hub authentication
PORT=4005
```

## API Endpoints

### POST /estimate

Get payment estimate.

**Request:**
```json
{
  "amount": "0.01",
  "recipient": "agent-alice"
}
```

**Response:**
```json
{
  "estimatedFee": "0.00001",
  "estimatedTime": 350,
  "recipient": "agent-alice",
  "amount": "0.01",
  "timestamp": "2025-11-12T04:00:00.000Z"
}
```

### POST /execute

Execute payment.

**Request:**
```json
{
  "amount": "0.01",
  "currency": "USDC",
  "recipient": "agent-bob",
  "priority": "speed"
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "atxp_abc123def456",
  "amount": "0.01",
  "currency": "USDC",
  "recipient": "agent-bob",
  "priority": "speed",
  "timestamp": "2025-11-12T04:00:00.000Z",
  "atxp": {
    "connectionUsed": "configured",
    "mcpServer": "simulated",
    "toolCall": null
  }
}
```

## Connecting to Hub

Update `hub/.env.local`:

```bash
ATXP_PROVIDER_URL=http://localhost:4005
ATXP_PROVIDER_TOKEN=optional_secret  # Must match provider
```

Hub adapter will now use this provider instead of stub mode.

## Testing

```bash
# Health check
curl http://localhost:4005/health

# Test estimate
curl -X POST http://localhost:4005/estimate \
  -H "Content-Type: application/json" \
  -d '{"amount":"0.01","recipient":"agent-test"}'

# Test execute
curl -X POST http://localhost:4005/execute \
  -H "Content-Type: application/json" \
  -d '{"amount":"0.01","currency":"USDC","recipient":"agent-test","priority":"speed"}'

# With authentication
curl -X POST http://localhost:4005/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"amount":"0.01","currency":"USDC","recipient":"agent-test"}'
```

## Production Integration

For real ATXP payments, this shim would be extended to:

1. Parse `ATXP_CONNECTION` to extract account details
2. Use `@atxp/client` SDK to make actual payments
3. Connect to MCP servers with `requirePayment` middleware
4. Return real on-chain transaction hashes
5. Handle payment failures and retries

See [ATXP docs](https://docs.atxp.ai/) for full integration details.

## Architecture

```
┌─────────────┐
│     Hub     │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐
│   ATXP      │
│  Provider   │──────► ATXP_CONNECTION
│   Shim      │        (account details)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Circuit &  │
│   Chisel    │
│  MCP APIs   │
└─────────────┘
```

## License

MIT
