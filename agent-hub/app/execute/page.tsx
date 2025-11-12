"use client"

import { useState } from 'react'
import Link from 'next/link'

const PROTOCOL_ACCENTS = {
  blue: {
    border: 'border-blue-500',
    background: 'bg-blue-50',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
  },
  purple: {
    border: 'border-purple-500',
    background: 'bg-purple-50',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
  },
  green: {
    border: 'border-emerald-500',
    background: 'bg-emerald-50',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
  },
  pink: {
    border: 'border-pink-500',
    background: 'bg-pink-50',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-700',
  },
}

type AccentKey = keyof typeof PROTOCOL_ACCENTS

const PROTOCOL_INFO: Record<'x402' | 'atxp' | 'acp' | 'ap2', { icon: string; name: string; accent: AccentKey; desc: string }> = {
  x402: { icon: '⚡', name: 'x402', accent: 'blue', desc: 'Fast & cheap HTTP payments' },
  atxp: { icon: '🔗', name: 'ATXP', accent: 'purple', desc: 'MCP tool payments' },
  acp: { icon: '💳', name: 'ACP', accent: 'green', desc: 'Stripe-powered checkout' },
  ap2: { icon: '🔐', name: 'AP2', accent: 'pink', desc: 'Privacy-focused payments' },
}

export default function ExecutePage() {
  const [amount, setAmount] = useState('1')
  const [currency, setCurrency] = useState('USD')
  const [recipient, setRecipient] = useState('recipient-wallet-address')
  const [priority, setPriority] = useState<'speed' | 'cost' | 'privacy'>('speed')
  const [protocol, setProtocol] = useState<'x402' | 'atxp' | 'ap2' | 'acp'>('atxp')
  const [ap2Mandate, setAp2Mandate] = useState<string>('')
  const [xPaymentHeader, setXPaymentHeader] = useState<string>('')
  const [paymentRequirements, setPaymentRequirements] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/hub/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          amount,
          currency,
          recipient,
          priority,
          primaryProtocol: protocol,
          ...(protocol === 'ap2' && ap2Mandate
            ? { ap2Mandate: (() => { try { return JSON.parse(ap2Mandate) } catch { return undefined } })() }
            : {}),
          ...(protocol === 'x402' && xPaymentHeader ? { xPaymentHeader } : {}),
          ...(protocol === 'x402' && paymentRequirements
            ? { paymentRequirements: (() => { try { return JSON.parse(paymentRequirements) } catch { return undefined } })() }
            : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`)
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const info = PROTOCOL_INFO[protocol]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-green-500 rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                SolanaAgentHub
              </span>
            </Link>
            <div className="flex space-x-4">
              <Link href="/status" className="text-slate-700 hover:text-slate-900 px-3 py-2 text-sm font-medium">
                Status
              </Link>
              <Link href="/estimate" className="text-slate-700 hover:text-slate-900 px-3 py-2 text-sm font-medium">
                Estimates
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-purple-800 hover:text-purple-900 text-sm font-semibold mb-2 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-slate-900">Execute Payment</h1>
          <p className="text-lg text-slate-700">Send a payment through your selected protocol</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-8">
              {/* Protocol Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-slate-800">Choose Protocol</label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(PROTOCOL_INFO) as Array<keyof typeof PROTOCOL_INFO>).map((p) => {
                    const proto = PROTOCOL_INFO[p]
                    const isSelected = protocol === p
                    const accent = PROTOCOL_ACCENTS[proto.accent]
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProtocol(p)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? `${accent.border} ${accent.background}`
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-2xl mb-1">{proto.icon}</div>
                        <div className="font-semibold text-sm text-slate-900">{proto.name}</div>
                        <div className="text-xs text-slate-700 mt-1">{proto.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-800">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 placeholder:text-slate-500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-800">Currency</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="USD">USD</option>
                      <option value="USDC">USDC</option>
                      <option value="SOL">SOL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-800">Recipient Address</label>
                  <input
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm text-slate-900 placeholder:text-slate-500"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Wallet address or identifier"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-800">Priority</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                  >
                    <option value="speed">Speed (Fastest execution)</option>
                    <option value="cost">Cost (Lowest fees)</option>
                    <option value="privacy">Privacy (Maximum privacy)</option>
                  </select>
                </div>

                {/* Protocol-specific fields */}
                {protocol === 'ap2' && (
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-800">
                      AP2 Mandate (JSON)
                      <span className="text-gray-600 text-xs ml-2">Optional</span>
                    </label>
                    <textarea
                      className="w-full border border-slate-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 placeholder:text-slate-600"
                      rows={4}
                      value={ap2Mandate}
                      onChange={(e) => setAp2Mandate(e.target.value)}
                      placeholder='{"mandateId":"demo","scope":"content:read","issuer":"google"}'
                    />
                  </div>
                )}

                {protocol === 'x402' && (
                  <>
                    <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                      <strong>Note:</strong> x402 requires payment headers from the 402 flow. For testing, these fields are optional.
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-800">X-Payment Header</label>
                      <input
                        className="w-full border border-slate-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 placeholder:text-slate-500"
                        value={xPaymentHeader}
                        onChange={(e) => setXPaymentHeader(e.target.value)}
                        placeholder="Payment signature header"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-800">Payment Requirements (JSON)</label>
                      <textarea
                        className="w-full border border-slate-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 placeholder:text-slate-500"
                        rows={4}
                        value={paymentRequirements}
                        onChange={(e) => setPaymentRequirements(e.target.value)}
                        placeholder='{"scheme":"x402","network":"solana-devnet","facilitator":"https://facilitator.payai.network"}'
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-purple-600 to-emerald-600 text-white rounded-xl font-semibold text-lg hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Execute with ${info.name} ⚡`
                )}
              </button>
            </form>

            {/* Error Display */}
            {error && (
              <div className="mt-6 bg-red-100 border border-red-200 rounded-xl p-4">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">❌</span>
                  <div>
                    <h3 className="font-semibold text-red-900">Payment Failed</h3>
                    <p className="text-red-800 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <div className="flex items-start mb-4">
                  <span className="text-3xl mr-3">✅</span>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-900">Payment Successful!</h3>
                    <p className="text-emerald-700 text-sm mt-1">Transaction completed via {result.protocol}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500 text-xs uppercase">Transaction ID</div>
                      <div className="font-mono text-xs mt-1 break-all">{result.transactionHash || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs uppercase">Amount</div>
                      <div className="font-semibold mt-1">{amount} {currency}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs uppercase">Protocol</div>
                      <div className="font-semibold mt-1">{result.protocol}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs uppercase">Status</div>
                      <div className="font-semibold mt-1 text-emerald-600">{result.status}</div>
                    </div>
                  </div>
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
                    View Full Response
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-x-auto border border-gray-200">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Protocol Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">{info.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-900">{info.name}</h3>
                  <p className="text-sm text-slate-700">{info.desc}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-800">
                <div className="flex justify-between">
                  <span>Estimated Time</span>
                  <span className="font-medium text-slate-900">~3s</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Fee</span>
                  <span className="font-medium text-slate-900">$0.01</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                    <span className="font-medium text-emerald-600">Available</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold mb-4 text-slate-900">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/status" className="block text-sm text-purple-800 hover:text-purple-900">
                  → Protocol Status
                </Link>
                <Link href="/estimate" className="block text-sm text-purple-800 hover:text-purple-900">
                  → Compare Estimates
                </Link>
                <Link href="/" className="block text-sm text-purple-800 hover:text-purple-900">
                  → Back to Home
                </Link>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-6 border border-purple-100">
              <h3 className="font-bold mb-3 flex items-center text-slate-900">
                <span className="mr-2">💡</span>
                Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-slate-800">
                <li>• Use "Cost" priority for lowest fees</li>
                <li>• x402 is fastest for micro-payments</li>
                <li>• ACP supports traditional cards</li>
                <li>• AP2 provides best privacy</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
