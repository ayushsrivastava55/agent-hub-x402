'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({ protocols: 4, transactions: '10k+', uptime: '99.9%' })

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-green-500 rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                SolanaAgentHub
              </span>
            </div>
            <div className="flex space-x-4">
              <Link href="/status" className="text-slate-700 hover:text-slate-900 px-3 py-2 text-sm font-medium">
                Status
              </Link>
              <Link href="/estimate" className="text-slate-700 hover:text-slate-900 px-3 py-2 text-sm font-medium">
                Estimates
              </Link>
              <Link href="/execute" className="bg-gradient-to-r from-purple-600 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-95 transition-opacity">
                Execute Payment
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Stats Bar */}
        <div className={`grid grid-cols-3 gap-4 mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">{stats.protocols}</div>
            <div className="text-sm text-slate-600 mt-1">Protocols Supported</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">{stats.transactions}</div>
            <div className="text-sm text-slate-600 mt-1">Transactions</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">{stats.uptime}</div>
            <div className="text-sm text-slate-600 mt-1">Uptime</div>
          </div>
        </div>

        <div className={`text-center mb-16 transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-block mb-4 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-semibold">
            🏆 Solana x402 Hackathon Submission
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-green-600 bg-clip-text text-transparent animate-gradient">
              Multi-Protocol
            </span>
            <br />
            <span className="text-gray-900">Payment Gateway</span>
          </h1>
          <p className="text-xl text-slate-600 mb-4 max-w-2xl mx-auto leading-relaxed">
            Execute payments across <span className="font-semibold text-purple-600">x402</span>, <span className="font-semibold text-purple-600">ATXP</span>, <span className="font-semibold text-purple-600">ACP</span>, and <span className="font-semibold text-purple-600">AP2</span> protocols
          </p>
          <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
            Intelligent routing • Circuit breakers • Real-time monitoring
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/execute"
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-green-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl transition-all hover:scale-105 shadow-lg relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>Start Payment</span>
                <span className="group-hover:translate-x-1 transition-transform">⚡</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/status"
              className="group px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all hover:scale-105 shadow-lg border-2 border-gray-200 hover:border-purple-300"
            >
              <span className="flex items-center gap-2">
                <span>Live Status</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </span>
            </Link>
            <Link
              href="/estimate"
              className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all hover:scale-105 shadow-lg border-2 border-gray-200 hover:border-purple-300"
            >
              Compare Protocols 📊
            </Link>
          </div>
        </div>

        {/* Protocol Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* x402 Card */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border border-gray-100 hover:border-purple-200">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">x402 (Coinbase)</h3>
            <p className="text-slate-600 text-sm mb-4">
              HTTP 402 micropayments on Solana
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                ~185ms settlement
              </div>
              <div className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                &lt;$0.0001 fees
              </div>
            </div>
          </div>

          {/* ATXP Card */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border border-gray-100 hover:border-purple-200">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🔗</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">ATXP (Circuit)</h3>
            <p className="text-slate-600 text-sm mb-4">
              MCP payments for AI agents
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                ~320ms settlement
              </div>
              <div className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                ~$0.00001 fees
              </div>
            </div>
          </div>

          {/* ACP Card */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border border-gray-100 hover:border-purple-200">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">ACP (Stripe)</h3>
            <p className="text-slate-600 text-sm mb-4">
              Instant checkout integration
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                ~2100ms settlement
              </div>
              <div className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                ~$0.001 fees
              </div>
            </div>
          </div>

          {/* AP2 Card */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border border-gray-100 hover:border-purple-200">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">AP2 (Google)</h3>
            <p className="text-slate-600 text-sm mb-4">
              Mandated agent payments
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                ~600ms settlement
              </div>
              <div className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Privacy-first
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg mb-16 border border-gray-100 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">Production-Ready Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔄</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Circuit Breaker</h3>
              <p className="text-slate-600 text-sm">
                Automatic failover protection when protocols experience errors
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Idempotency</h3>
              <p className="text-slate-600 text-sm">
                Redis-backed deduplication prevents duplicate payments
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Real-time Monitoring</h3>
              <p className="text-slate-600 text-sm">
                Live protocol health checks and performance metrics
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/status" className="group">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all group-hover:scale-105 border border-gray-100">
              <h3 className="text-2xl font-bold mb-2 flex items-center text-slate-900">
                <span className="mr-3">🩺</span>
                Protocol Status
              </h3>
              <p className="text-slate-700 mb-4">
                Monitor real-time health, circuit breaker states, and performance metrics
              </p>
              <span className="text-purple-700 font-semibold group-hover:underline">
                View Dashboard →
              </span>
            </div>
          </Link>
          <Link href="/estimate" className="group">
            <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all group-hover:scale-105 border border-gray-100">
              <h3 className="text-2xl font-bold mb-2 flex items-center text-slate-900">
                <span className="mr-3">📊</span>
                Get Estimates
              </h3>
              <p className="text-slate-700 mb-4">
                Compare costs, speed, and features across all payment protocols
              </p>
              <span className="text-green-700 font-semibold group-hover:underline">
                Compare Now →
              </span>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-br from-gray-50 to-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-green-500 rounded-lg" />
                <span className="font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">SolanaAgentHub</span>
              </div>
              <p className="text-sm text-slate-600">Multi-protocol payment gateway for autonomous AI agents</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Technology</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Next.js 16 & TypeScript</li>
                <li>• Express.js Backend</li>
                <li>• Redis Caching</li>
                <li>• Solana x402</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Protocols</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• x402 (Coinbase)</li>
                <li>• ATXP (Circuit & Chisel)</li>
                <li>• ACP (Stripe)</li>
                <li>• AP2 (Google)</li>
              </ul>
            </div>
          </div>
          <div className="text-center text-slate-500 text-sm border-t border-gray-200 pt-6">
            <p>© 2025 SolanaAgentHub • Built for Solana x402 Hackathon</p>
            <p className="mt-2">Open source • MIT License</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
