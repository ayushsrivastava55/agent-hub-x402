export const dynamic = 'force-dynamic'

async function getEstimates() {
  const hubUrl = process.env.HUB_URL || process.env.NEXT_PUBLIC_HUB_URL || 'http://localhost:8787'
  const url = `${hubUrl}/payments/estimate?amount=0.01&currency=USDC&recipient=test&priority=speed`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Hub estimate failed: ${res.status}`)
  return res.json() as Promise<{ amount: string; estimates: { protocol: string; estimatedFee: string; estimatedTime: number; success_rate: number }[] }>
}

export default async function EstimatePage() {
  const data = await getEstimates()

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-16 px-6 bg-white dark:bg-black sm:items-start">
        <h1 className="text-3xl font-bold mb-4">Protocol Estimates</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Amount: {data.amount}</p>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2">Protocol</th>
                <th className="px-4 py-2">Estimated Fee</th>
                <th className="px-4 py-2">Estimated Time (ms)</th>
                <th className="px-4 py-2">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.estimates.map((e) => (
                <tr key={e.protocol} className="border-t border-gray-200 dark:border-gray-800">
                  <td className="px-4 py-2">{e.protocol}</td>
                  <td className="px-4 py-2">{e.estimatedFee}</td>
                  <td className="px-4 py-2">{e.estimatedTime}</td>
                  <td className="px-4 py-2">{(e.success_rate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
