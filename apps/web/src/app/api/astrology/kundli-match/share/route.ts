import { NextResponse, type NextRequest } from 'next/server'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { z } from 'zod'
import { computeKundliMatch, KundliInputError } from '@/lib/astrology/engine'
import { shareRequestSchema } from '@/lib/astrology/schema'
import { toSharedSummary } from '@/lib/astrology/share'
import { rateLimit } from '@/lib/astrology/server/rateLimit'
import { createAdminClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants'
import type { MatchResult } from '@/lib/astrology/types'

export const runtime = 'nodejs'

const NO_STORE = { 'Cache-Control': 'no-store' }
const SHARE_DAYS = 90
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

function unavailable() {
  return NextResponse.json(
    { ok: false, error: 'sharing_unavailable', message: 'Sharing is not switched on yet. You can still download the PDF.' },
    { status: 503, headers: NO_STORE },
  )
}

/** PostgREST reports a missing table as PGRST205 (schema cache) or 42P01. */
const tableMissing = (code?: string) => code === 'PGRST205' || code === '42P01'

/**
 * POST — create a share link.
 *
 * The client sends the same birth details it calculated with; the server
 * recomputes the result itself. Accepting a finished result from the client
 * would let anyone publish a forged score under the Mithila Jodi name.
 * Only the privacy-safe projection is stored; the birth details are discarded.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'kundli-share', { limit: 10, windowMs: 60 * 60_000 })
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', message: 'You have created several links already — please try again later.' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(limited.retryAfterSeconds) } },
    )
  }

  const parsed = shareRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'validation', message: 'We could not create a link for this result.' }, { status: 400, headers: NO_STORE })
  }
  const { request: matchRequest, includeNames, scenario } = parsed.data

  let result: MatchResult | undefined
  try {
    const computed = computeKundliMatch(matchRequest, new Date())
    if (computed.kind === 'result') result = computed.result
    else if (computed.kind === 'scenarios' && scenario) {
      result = computed.scenarios.find(s => s.brideSegment === scenario.brideSegment && s.groomSegment === scenario.groomSegment)?.result
    }
  } catch (e) {
    if (e instanceof KundliInputError) {
      return NextResponse.json({ ok: false, error: e.code, message: e.userMessage }, { status: 422, headers: NO_STORE })
    }
    console.error('[kundli-share] recompute failed:', e instanceof Error ? e.message : 'unknown error')
    return NextResponse.json({ ok: false, error: 'calculation_failed', message: 'We could not create a link right now.' }, { status: 500, headers: NO_STORE })
  }
  if (!result) {
    return NextResponse.json({ ok: false, error: 'scenario_required', message: 'Please choose which possibility to share.' }, { status: 422, headers: NO_STORE })
  }

  const token = randomBytes(18).toString('base64url')
  const manageKey = randomBytes(24).toString('base64url')
  const expiresAt = new Date(Date.now() + SHARE_DAYS * 86_400_000).toISOString()

  const admin = await createAdminClient()
  const { error } = await admin.from('kundli_match_shares').insert({
    token,
    manage_key_hash: sha256(manageKey),
    summary: toSharedSummary(result, includeNames),
    methodology_version: result.methodologyVersion,
    expires_at: expiresAt,
  })
  if (error) {
    if (tableMissing(error.code)) return unavailable()
    console.error('[kundli-share] insert failed:', error.code)
    return NextResponse.json({ ok: false, error: 'share_failed', message: 'We could not create a link right now.' }, { status: 500, headers: NO_STORE })
  }

  return NextResponse.json(
    { ok: true, token, manageKey, expiresAt, url: `${SITE_URL}/astrology/kundli-match/result/${token}` },
    { status: 201, headers: NO_STORE },
  )
}

const revokeSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/),
  manageKey: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/),
})

/** DELETE — revoke a link. Requires the manage key handed out at creation. */
export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request, 'kundli-share-revoke', { limit: 30, windowMs: 60 * 60_000 })
  if (!limited.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429, headers: NO_STORE })

  const parsed = revokeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'validation' }, { status: 400, headers: NO_STORE })

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('kundli_match_shares')
    .select('id, manage_key_hash, revoked_at')
    .eq('token', parsed.data.token)
    .maybeSingle()
  if (error) {
    if (tableMissing(error.code)) return unavailable()
    return NextResponse.json({ ok: false, error: 'revoke_failed' }, { status: 500, headers: NO_STORE })
  }
  const given = Buffer.from(sha256(parsed.data.manageKey), 'hex')
  const stored = data ? Buffer.from(String(data.manage_key_hash), 'hex') : Buffer.alloc(32)
  if (!data || stored.length !== given.length || !timingSafeEqual(stored, given)) {
    return NextResponse.json({ ok: false, error: 'not_found', message: 'That link was not found.' }, { status: 404, headers: NO_STORE })
  }
  if (!data.revoked_at) {
    const { error: upErr } = await admin.from('kundli_match_shares').update({ revoked_at: new Date().toISOString() }).eq('id', data.id)
    if (upErr) return NextResponse.json({ ok: false, error: 'revoke_failed' }, { status: 500, headers: NO_STORE })
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE })
}
