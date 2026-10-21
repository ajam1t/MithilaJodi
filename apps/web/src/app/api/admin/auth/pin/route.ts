import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/astrology/server/rateLimit'
import { PIN_COOKIE, PIN_TTL_SECONDS, checkPin, pinPassToken } from '@/lib/adminPin'

/**
 * POST /api/admin/auth/pin { pin } — the first step of the Command Centre
 * sign-in. A correct PIN sets the short-lived pass the password step requires.
 * Five tries per 15 minutes, with the same answer for every wrong PIN.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'admin-pin', { limit: 5, windowMs: 15 * 60_000 })
  if (!limited.ok) {
    return NextResponse.json({ ok: false, message: 'Too many wrong PINs. Please wait 15 minutes.' }, { status: 429 })
  }
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, message: 'Invalid request.' }, { status: 400 }) }
  const pin = typeof body.pin === 'string' ? body.pin.trim() : ''

  if (!(await checkPin(pin))) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 200))
    return NextResponse.json({ ok: false, message: 'That PIN is not right.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(PIN_COOKIE, pinPassToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: PIN_TTL_SECONDS,
    path: '/api/admin/auth',
  })
  return response
}
