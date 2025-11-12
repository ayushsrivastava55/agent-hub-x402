X402 Next.js Solana Template

A simple Next.js starter template with X402 payment protocol integration for Solana.

This template demonstrates a streamlined implementation of the X402 payment protocol using the x402-next package, making it easy to add cryptocurrency payment gates to your Next.js applications.

⚠️ Using on Mainnet? This template is configured for testnet (devnet) by default. To accept real payments on mainnet, you'll need to set up CDP API keys and configure a fee payer. See the CDP X402 Mainnet Documentation for complete setup instructions.

Table of Contents

What is X402?
Features
Getting Started
How It Works
Project Structure
Configuration
Usage
What is X402?

X402 is an open payment protocol that uses HTTP status code 402 "Payment Required" to enable seamless cryptocurrency payments for web content and APIs.

Key Benefits

Direct Payments - Accept cryptocurrency payments without third-party payment processors
No Accounts - No user registration or authentication required
Blockchain-Verified - Payments are verified directly on the Solana blockchain
Simple Integration - Add payment gates to any Next.js route with middleware
Flexible Pricing - Set different prices for different content
How It Works

1. User requests protected content
2. Server responds with 402 Payment Required
3. User makes payment via Coinbase Pay or crypto wallet
4. User proves payment with transaction signature
5. Server verifies on blockchain and grants access
Features

X402 Payment Middleware - Powered by x402-next package
Solana Integration - Uses Solana blockchain for payment verification
Multiple Price Tiers - Configure different prices for different routes
Session Management - Automatic session handling after payment
Type-Safe - Full TypeScript support with Viem types
Next.js 16 - Built on the latest Next.js App Router
Getting Started

Prerequisites

Node.js 18+ or Bun
pnpm, npm, or yarn
A Solana wallet address to receive payments
Installation

# Clone or create from template
npx create-solana-dapp my-app --template x402-template

# Navigate to project
cd my-app

# Install dependencies
pnpm install

# Run development server
pnpm dev
Visit http://localhost:3000 to see your app running.

Test the Payment Flow

Navigate to http://localhost:3000
Click on "Access Cheap Content" or "Access Expensive Content"
You'll be presented with a Coinbase Pay payment dialog
Complete the payment
Access is granted and you'll see the protected content
How It Works

This template uses the x402-next package which provides middleware to handle the entire payment flow.

Middleware Configuration

The core of the payment integration is in middleware.ts:

import { paymentMiddleware, Resource, Network } from 'x402-next'
import { NextRequest } from 'next/server'

// Your Solana wallet address that receives payments
const address = process.env.NEXT_PUBLIC_RECEIVER_ADDRESS as string
const network = process.env.NEXT_PUBLIC_NETWORK as Network
const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL as Resource
const cdpClientKey = process.env.NEXT_PUBLIC_CDP_CLIENT_KEY as string

const x402PaymentMiddleware = paymentMiddleware(
  address,
  {
    '/content/cheap': {
      price: '$0.01',
      config: {
        description: 'Access to cheap content',
      },
      network,
    },
    '/content/expensive': {
      price: '$0.25',
      config: {
        description: 'Access to expensive content',
      },
      network,
    },
  },
  {
    url: facilitatorUrl,
  },
  {
    cdpClientKey,
    appLogo: '/logos/x402-examples.png',
    appName: 'x402 Demo',
    sessionTokenEndpoint: '/api/x402/session-token',
  },
)

export const middleware = (req: NextRequest) => {
  const delegate = x402PaymentMiddleware as unknown as (
    request: NextRequest,
  ) => ReturnType<typeof x402PaymentMiddleware>
  return delegate(req)
}

export const config = {
  matcher: [
    // Exclude API and Next internals to avoid gating critical endpoints
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/',
  ],
}

What Happens Under the Hood

Request Interception - Middleware checks if the requested route requires payment
Payment Check - If the route is protected, middleware checks for valid payment session
402 Response - If no valid payment, returns 402 with payment requirements
Coinbase Pay Widget - User sees payment modal powered by Coinbase
Payment Verification - After payment, transaction is verified on Solana blockchain via facilitator
Session Creation - Valid payment creates a session token
Access Granted - User can now access protected content
Project Structure

x402-template/
├── middleware.ts              # 🛡️  X402 payment middleware configuration
├── app/
│   ├── page.tsx              # 🏠 Homepage with links to protected content
│   ├── layout.tsx            # 📐 Root layout
│   ├── globals.css           # 🎨 Global styles
│   └── content/
│       └── [type]/
│           └── page.tsx      # 🔒 Protected content pages
├── components/
│   └── cats-component.tsx    # 🐱 Example content component
├── lib/                      # 📚 Utility functions (if needed)
├── public/                   # 📁 Static assets
└── package.json              # 📦 Dependencies
Configuration

Environment Variables

The template uses sensible defaults, but you can customize by creating a .env.local file:

# Your Solana wallet address (where payments go)
NEXT_PUBLIC_RECEIVER_ADDRESS=your_solana_address_here

# Network (solana-devnet or solana-mainnet-beta)
NEXT_PUBLIC_NETWORK=solana-devnet

# Coinbase Pay Client Key (get from Coinbase Developer Portal)
NEXT_PUBLIC_CDP_CLIENT_KEY=your_client_key_here

# Facilitator URL (service that verifies payments)
NEXT_PUBLIC_FACILITATOR_URL=https://x402.org/facilitator

Session Token Endpoint (Required)

Create an API route at app/api/x402/session-token/route.ts:

import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST() {
  const token = randomUUID()
  const res = NextResponse.json({ token })
  res.cookies.set({
    name: 'x402_session',
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
Customizing Routes and Prices

Edit middleware.ts to add or modify protected routes:

const x402PaymentMiddleware = paymentMiddleware(
  address,
  {
    '/premium': {
      price: '$1.00',
      config: {
        description: 'Premium content access',
      },
      network: 'solana-mainnet-beta',
    },
    '/api/data': {
      price: '$0.05',
      config: {
        description: 'API data access',
      },
      network: 'solana-mainnet-beta',
    },
  },
  // ... rest of config
)
Network Selection

You can use different networks:

solana-devnet - For testing (use test tokens)
solana-mainnet-beta - For production (real money!)
solana-testnet - Alternative test network
Usage

Creating Protected Content

Simply create pages under protected routes defined in your middleware:

// app/content/premium/page.tsx
export default async function PremiumPage() {
  return (
    <div>
      <h1>Premium Content</h1>
      <p>This content requires payment to access.</p>
      {/* Your protected content here */}
    </div>
  )
}
Adding New Price Tiers

Add the route configuration in middleware.ts
Create the corresponding page component
Users will automatically be prompted to pay when accessing the route
Testing with Devnet

When using solana-devnet:

Payments use test tokens (no real money)
Perfect for development and testing
Get test tokens from Solana Faucet
Going to Production

To accept real payments:

Change network to solana-mainnet-beta in middleware.ts
Update your wallet address to your production wallet
Test thoroughly before deploying!
Consider implementing additional security measures
Configure your domain in CDP Portal (Embedded Wallets → Domains)
Verify facilitator supports mainnet and add health/fallback monitoring
Dependencies

This template uses minimal dependencies:

{
  "dependencies": {
    "next": "16.0.0",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "viem": "^2.38.5",
    "x402-next": "^0.7.1"
  }
}
next - Next.js framework
react / react-dom - React library
viem - Type-safe Ethereum/Solana types
x402-next - X402 payment middleware (handles all payment logic)
Learn More

X402 Protocol

X402 Specification - Official protocol documentation
X402 Next Package - Middleware used in this template
Solana

Solana Documentation - Official Solana docs
Solana Explorer - View transactions on-chain
Coinbase Developer

CDP Docs - Coinbase Developer documentation
Troubleshooting

Payment Not Working

Check that your wallet address in middleware.ts is correct
Verify you're using the correct network (devnet vs mainnet)
Check browser console for errors
Ensure Coinbase Pay client key is valid
402 Errors Not Displaying

Check middleware matcher configuration in middleware.ts (ensure /api/** is excluded)
Verify route paths match your page structure
Clear Next.js cache: rm -rf .next && pnpm dev
Session Not Persisting

Check that cookies are enabled in your browser
Verify session token endpoint is configured
Check for CORS issues if using custom domains

---

## Hub Execute (Single-Protocol, No Fallbacks)

- The Hub executes only the selected `primaryProtocol` (`x402`, `atxp`, `ap2`, `acp`). No automatic fallbacks.
- Retries and per-attempt timeout are supported via `maxRetries` and `timeout` in the request body.
- Idempotency: send `Idempotency-Key` header; the Hub will return the cached response on repeat.

### x402 Happy Path (Solana)

1. Use the 402-gated routes in this Next app (middleware) to trigger a 402 and obtain an `xPaymentHeader` + `paymentRequirements`.
2. Go to `/execute`, choose `x402`, and paste those fields.
3. The Hub validates `/supported` with the facilitator, then calls `/verify` and `/settle`.

Environment (client):
- `NEXT_PUBLIC_NETWORK=solana-devnet`
- `NEXT_PUBLIC_RECEIVER_ADDRESS=<your_solana_address>`
- `NEXT_PUBLIC_FACILITATOR_URL=https://x402.org/facilitator` (or a Rapid402 URL)

### AP2 Mandate

- Choose `ap2` at `/execute` and provide `ap2Mandate` JSON (e.g. `{ "mandateId": "demo", "scope": "content:read" }`).
- Enable stricter validation by setting `AP2_STRICT_MANDATE=true` in Hub env (requires `issuer`, `issuedAt`, optional non-expired `expiresAt`).

### ACP (Stripe) - Optional Real Integration

- Set Hub env `STRIPE_SECRET_KEY` (test mode key starting with `sk_test_...`).
- With this set, the Hub uses Stripe PaymentIntents in test mode and confirms with `pm_card_visa`.
- Without this, ACP falls back to a stubbed success path.
- You can trigger ACP by selecting `acp` in `/execute`.

### ATXP - Connection String Workflow

- Run `npx atxp create my-project --template agent` to generate an ATXP connection string.
- Copy the URL (looks like `https://accounts.atxp.ai?connection_token=...`) into `ATXP_CONNECTION` inside `hub/.env.local`.
- Leave `ATXP_PROVIDER_URL` unset to keep the stubbed success path for dev/testing.
- (Advanced) point `ATXP_PROVIDER_URL` and `ATXP_PROVIDER_TOKEN` at a provider shim that speaks to your MCP deployment if you want real execution.

### Internal HMAC Proxy

- The `/api/hub/execute` route signs requests to the Hub if `HUB_API_SECRET` is set; otherwise it forwards unsigned (useful for local dev).
- Client never sees secrets.

### Facilitator Provider Switch

- Hub uses `FACILITATOR_URL` (defaults to `https://x402.org/facilitator`).
- To use Rapid402 (or your own), set `FACILITATOR_URL` accordingly in the Hub env.

### Rate Limiting (Hub)

- Configure via env:
  - `RATE_LIMIT_WINDOW_MS` (default `60000`)
  - `RATE_LIMIT_MAX` (default `120`)
  - Uses Redis when `REDIS_URL` is set (global across instances); falls back to in-memory per-instance limiter otherwise.

### Idempotency (Hub, Redis-backed)

- Set `REDIS_URL` to enable Redis-backed idempotency storage with TTL (default 10 minutes).
- Without `REDIS_URL`, Hub falls back to in-memory store (not shared across instances).
- Replays with the same `Idempotency-Key` within TTL return the cached response/status.
- Optional envs:
- `IDEMPOTENCY_TTL_MS` (default `600000`)
- `IDEMPOTENCY_LOCK_TTL_MS` (default `30000`) — protects in-flight duplicate executes.

### Circuit Breaker (Hub)

- Protects per-protocol execution when error rates/timeouts spike.
- Configure via env:
  - `CB_ERROR_THRESHOLD` (default `3`)
  - `CB_OPEN_MS` (default `30000`)
  - `CB_HALF_OPEN_MAX` (default `1`)
- Circuit states are exposed in `/protocols/status` under `circuit`.

### Webhooks (ACP / Stripe)

- Hub exposes `POST /webhooks/stripe` for PaymentIntent events.
- Env: `STRIPE_WEBHOOK_SECRET` to verify `stripe-signature` header. If not set, webhook is accepted in dev.
- Note: Raw body is handled by the Hub (no client changes needed).

### Transaction Log (Hub)

- Recent transactions are stored (Redis list when `REDIS_URL` is set, else in-memory).
- Env: `TXLOG_MAX` (default `100`).