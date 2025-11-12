import { NextRequest, NextResponse } from 'next/server'
import { createHmac, randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const hubUrl = process.env.HUB_API_URL || process.env.NEXT_PUBLIC_HUB_URL || 'http://localhost:8787'
    const body = await req.json()
    const payload = JSON.stringify(body || {})
    const method = 'POST'
    const path = '/payments/execute'
    const idem = req.headers.get('idempotency-key') || randomUUID()

    const secret = process.env.HUB_API_SECRET
    const headers: Record<string, string> = { 'content-type': 'application/json', 'idempotency-key': idem }
    if (secret) {
      const ts = Date.now().toString()
      const msg = `${method}\n${path}\n${ts}\n${payload}`
      const signature = createHmac('sha256', secret).update(msg).digest('hex')
      headers['x-timestamp'] = ts
      headers['x-signature'] = signature
    }

    const upstream = await fetch(`${hubUrl}${path}`, { method, headers, body: payload })

    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'internal_error', message: err?.message || 'Internal Error' } }, { status: 500 })
  }
}
