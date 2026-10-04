import { NextResponse, type NextRequest } from 'next/server'
import { KundliInputError } from '@/lib/astrology/birthChart'
import { computeJanamKundli } from '@/lib/astrology/janamKundli'
import { fieldErrors, janamKundliRequestSchema } from '@/lib/astrology/schema'
import { rateLimit } from '@/lib/astrology/server/rateLimit'

export const runtime = 'nodejs'

const NO_STORE = { 'Cache-Control': 'no-store' }

/**
 * POST /api/astrology/janam-kundli — public, no login. One birth chart with
 * navamsa, dasha and panchang, computed server-side. Nothing is stored and
 * birth details are never logged.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'janam-kundli', { limit: 40, windowMs: 5 * 60_000 })
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', message: 'Too many calculations in a short time — please wait a minute and try again.' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(limited.retryAfterSeconds) } },
    )
  }
  if (Number(request.headers.get('content-length') ?? 0) > 4_000) {
    return NextResponse.json({ ok: false, error: 'too_large', message: 'That request is too large.' }, { status: 413, headers: NO_STORE })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json', message: 'We could not read those details. Please try again.' }, { status: 400, headers: NO_STORE })
  }

  const parsed = janamKundliRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', message: 'Please check the highlighted details.', fields: fieldErrors(parsed.error) },
      { status: 400, headers: NO_STORE },
    )
  }

  try {
    return NextResponse.json({ ok: true, ...computeJanamKundli(parsed.data, new Date()) }, { headers: NO_STORE })
  } catch (e) {
    if (e instanceof KundliInputError) {
      return NextResponse.json(
        { ok: false, error: e.code, message: e.userMessage, ...(e.field ? { fields: { [e.field]: e.userMessage } } : {}) },
        { status: 422, headers: NO_STORE },
      )
    }
    console.error('[janam-kundli] calculation failed:', e instanceof Error ? e.message : 'unknown error')
    return NextResponse.json(
      { ok: false, error: 'calculation_failed', message: "We couldn't complete this calculation. Your details are still in the form — please try again in a moment." },
      { status: 500, headers: NO_STORE },
    )
  }
}
