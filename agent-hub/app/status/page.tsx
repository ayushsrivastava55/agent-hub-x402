import Link from 'next/link'

export const dynamic = 'force-dynamic'

const PROTOCOL_ICONS: Record<string, string> = {
  x402: '⚡',
  atxp: '🔗',
  acp: '💳',
  ap2: '🔐',
}

async function getStatus() {
  const hubUrl = process.env.HUB_URL || process.env.NEXT_PUBLIC_HUB_URL || 'http://localhost:3001'
  const res = await fetch(`${hubUrl}/protocols/status`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Hub status failed: ${res.status}`)
  return res.json() as Promise<{
    timestamp: string
    protocols: Record<string, { avgTime: number; avgFee: string; successRate: number; facilitatorHealth?: string; status?: string; lastUpdate: string }>
    circuitBreaker?: Record<string, { state: string; failures: number; lastFailure?: string; }>
  }>
}

export default async function StatusPage() {
  const data = await getStatus()
  const protocols = Object.entries(data.protocols)
  const circuitBreakers = data.circuitBreaker || {}

  function getStatusColor(successRate: number): string {
    if (successRate >= 0.95) return 'green'
    if (successRate >= 0.75) return 'yellow'
    return 'red'
  }

  function getCircuitBreakerColor(state: string): string {
    if (state === 'closed') return 'green'
    if (state === 'half_open') return 'yellow'
    return 'red'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-green-500 rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                SolanaAgentHub
              </span>
            </Link>
            <div className="flex space-x-4">
              <Link href="/estimate" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Estimates
              </Link>
              <Link href="/execute" className="bg-gradient-to-r from-purple-600 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                Execute Payment
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-purple-600 hover:text-purple-700 text-sm font-medium mb-2 inline-block">
            ← Back to Home
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Protocol Status Dashboard</h1>
              <p className="text-gray-600">Real-time monitoring of all payment protocols</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Last Updated</div>
              <div className="text-lg font-semibold">{new Date(data.timestamp).toLocaleTimeString()}</div>
              <div className="text-xs text-gray-400">{new Date(data.timestamp).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Protocol Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {protocols.map(([name, p]) => {
            const color = getStatusColor(p.successRate)
            const icon = PROTOCOL_ICONS[name] || '📡'
            const cbState = circuitBreakers[name]?.state || 'unknown'
            const cbColor = getCircuitBreakerColor(cbState)
            
            return (
              <div key={name} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{icon}</span>
                    <div>
                      <h3 className="font-bold text-lg">{name.toUpperCase()}</h3>
                      <div className="flex items-center mt-1">
                        <span className={`w-2 h-2 bg-${color}-500 rounded-full mr-2`}></span>
                        <span className={`text-xs font-medium text-${color}-600`}>
                          {p.successRate >= 0.95 ? 'Healthy' : p.successRate >= 0.75 ? 'Degraded' : 'Down'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-semibold">{(p.successRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Time</span>
                    <span className="font-semibold">{p.avgTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Fee</span>
                    <span className="font-semibold">{p.avgFee}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600">Circuit Breaker</span>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${cbColor}-100 text-${cbColor}-700 font-semibold`}>
                      {cbState}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detailed Status Table */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Detailed Metrics</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 text-left">
                  <th className="pb-3 px-4 font-semibold">Protocol</th>
                  <th className="pb-3 px-4 font-semibold">Avg Time</th>
                  <th className="pb-3 px-4 font-semibold">Avg Fee</th>
                  <th className="pb-3 px-4 font-semibold">Success Rate</th>
                  <th className="pb-3 px-4 font-semibold">Health</th>
                  <th className="pb-3 px-4 font-semibold">Circuit</th>
                  <th className="pb-3 px-4 font-semibold">Last Update</th>
                </tr>
              </thead>
              <tbody>
                {protocols.map(([name, p]) => {
                  const color = getStatusColor(p.successRate)
                  const cbState = circuitBreakers[name]?.state || 'unknown'
                  const cbColor = getCircuitBreakerColor(cbState)
                  
                  return (
                    <tr key={name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{PROTOCOL_ICONS[name] || '📡'}</span>
                          <span className="font-semibold">{name.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-sm">{p.avgTime}ms</td>
                      <td className="py-4 px-4 font-semibold">{p.avgFee}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-${color}-500`}
                                style={{ width: `${p.successRate * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="ml-3 font-semibold text-sm">{(p.successRate * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-sm font-medium text-${color}-600`}>
                          {p.facilitatorHealth || p.status || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-3 py-1 rounded-full bg-${cbColor}-100 text-${cbColor}-700 font-semibold`}>
                          {cbState}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(p.lastUpdate).toLocaleTimeString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Circuit Breaker Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">🔄</span>
              Circuit Breaker Status
            </h3>
            <div className="space-y-3">
              {Object.entries(circuitBreakers).map(([name, cb]) => (
                <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">{name.toUpperCase()}</div>
                    <div className="text-xs text-gray-600">Failures: {cb.failures}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    cb.state === 'closed' ? 'bg-green-100 text-green-700' :
                    cb.state === 'half_open' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {cb.state}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-purple-100">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">📊</span>
              System Overview
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Total Protocols</span>
                <span className="font-bold text-lg">{protocols.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Healthy Protocols</span>
                <span className="font-bold text-lg text-green-600">
                  {protocols.filter(([_, p]) => p.successRate >= 0.95).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Degraded Protocols</span>
                <span className="font-bold text-lg text-yellow-600">
                  {protocols.filter(([_, p]) => p.successRate >= 0.75 && p.successRate < 0.95).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Down Protocols</span>
                <span className="font-bold text-lg text-red-600">
                  {protocols.filter(([_, p]) => p.successRate < 0.75).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
