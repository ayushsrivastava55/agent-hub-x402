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
