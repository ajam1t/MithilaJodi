import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import type { z } from 'zod'
import { KundliInputError } from '../birthChart'
import { fieldErrors } from '../schema'
import { rateLimit } from './rateLimit'
import { recordServerEvent } from '@/lib/serverEvents'

const NO_STORE = { 'Cache-Control': 'no-store' }

/**
 * The shared shape of every public astrology calculation endpoint: rate limit,
 * size cap, schema validation, a pure compute call, and user-facing errors.
 * Nothing is stored and birth details are never logged.
 */
export async function astrologyPost<S extends z.ZodTypeAny>(
  request: NextRequest,
  scope: string,
  schema: S,
  compute: (input: z.infer<S>, now: Date) => object,
): Promise<NextResponse> {
  const limited = rateLimit(request, scope, { limit: 40, windowMs: 5 * 60_000 })
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', message: 'Too many calculations in a short time — please wait a minute and try again.' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(limited.retryAfterSeconds) } },
    )
  }
  if (Number(request.headers.get('content-length') ?? 0) > 8_000) {
    return NextResponse.json({ ok: false, error: 'too_large', message: 'That request is too large.' }, { status: 413, headers: NO_STORE })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json', message: 'We could not read those details. Please try again.' }, { status: 400, headers: NO_STORE })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', message: 'Please check the highlighted details.', fields: fieldErrors(parsed.error) },
      { status: 400, headers: NO_STORE },
    )
  }

  try {
    const result = compute(parsed.data, new Date()) as { kind?: string }
    // One calculation counts once: the "which part of the day?" step is a
    // question back to the visitor, not a result.
    if (result.kind !== 'needs_moon_choice') recordServerEvent('astrology_tool_used', scope)
    return NextResponse.json({ ok: true, ...result }, { headers: NO_STORE })
  } catch (e) {
    if (e instanceof KundliInputError) {
      return NextResponse.json(
        { ok: false, error: e.code, message: e.userMessage, ...(e.field ? { fields: { [e.field]: e.userMessage } } : {}) },
        { status: 422, headers: NO_STORE },
      )
    }
    console.error(`[${scope}] calculation failed:`, e instanceof Error ? e.message : 'unknown error')
    return NextResponse.json(
      { ok: false, error: 'calculation_failed', message: "We couldn't complete this calculation. Your details are still in the form — please try again in a moment." },
      { status: 500, headers: NO_STORE },
    )
  }
}
