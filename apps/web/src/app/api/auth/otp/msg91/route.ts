import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { establishAccountSession } from '@/lib/authFlow'
import { INDIA_MOBILE_RE, SESSION_COOKIE, SESSION_DAYS, toE164 } from '@/lib/constants'

// MSG91 server-side access-token verification endpoint (from the MSG91 dashboard).
const MSG91_VERIFY_URL = 'https://control.msg91.com/api/v5/widget/verifyAccessToken'

const VerifySchema = z.object({
  mobile: z.string(),
  accessToken: z.string().min(10),
  intent: z.enum(['login', 'register']),
  consent_terms: z.boolean().optional(),
  consent_privacy: z.boolean().optional(),
})

/**
 * Verifies a MSG91 OTP-widget access token server-side, then establishes the
 * account/session. The MSG91 Authkey is read ONLY from process.env and is never
 * sent to, or exposed in, the browser. The frontend-supplied access token is not
 * trusted until MSG91 confirms it here.
 */
export async function POST(request: NextRequest) {
  const authkey = process.env.MSG91_AUTHKEY
  if (!authkey) {
    console.error('[otp/msg91] MSG91_AUTHKEY is not configured on the server')
    return NextResponse.json(
      { ok: false, message: 'OTP verification is unavailable right now. Please try again later.' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  const parsed = VerifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Invalid request' }, { status: 400 })
  }

  const { mobile: rawMobile, accessToken, intent, consent_terms, consent_privacy } = parsed.data

  const digits = rawMobile.replace(/\D/g, '')
  if (!INDIA_MOBILE_RE.test(digits)) {
    return NextResponse.json({ ok: false, message: 'Invalid mobile number' }, { status: 400 })
  }
  const mobile = toE164(digits)

  if (intent === 'register' && (!consent_terms || !consent_privacy)) {
    return NextResponse.json(
      { ok: false, message: 'You must accept the Terms of Service and Privacy Policy to register' },
      { status: 400 },
    )
  }

  // ── Server-side MSG91 access-token verification ─────────────────────────────
  let verifiedIdentifier: string | null = null
  try {
    const res = await fetch(MSG91_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authkey, 'access-token': accessToken }),
      cache: 'no-store',
    })

    const data = (await res.json().catch(() => null)) as
      | { type?: string; message?: string }
      | null

    if (!res.ok || !data || data.type !== 'success') {
      // Never log the token or authkey. Generic user-facing message.
      return NextResponse.json(
        { ok: false, message: 'OTP verification failed. Please request a new code and try again.' },
        { status: 400 },
      )
    }

    verifiedIdentifier = typeof data.message === 'string' ? data.message : null
  } catch (err) {
    console.error('[otp/msg91] verifyAccessToken request failed:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json(
      { ok: false, message: 'Could not verify OTP right now. Please try again in a moment.' },
      { status: 502 },
    )
  }

  // Hardening: if MSG91 echoes the verified number, ensure it matches the one the
  // client submitted (prevents pairing a valid token with a different mobile).
  if (verifiedIdentifier) {
    const verifiedLast10 = verifiedIdentifier.replace(/\D/g, '').slice(-10)
    if (verifiedLast10 && verifiedLast10 !== digits) {
      console.warn('[otp/msg91] verified identifier does not match submitted mobile')
      return NextResponse.json(
        { ok: false, message: 'OTP verification failed. Please try again.' },
        { status: 400 },
      )
    }
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null
  const ua = request.headers.get('user-agent') ?? null

  try {
    const admin = await createAdminClient()
    const result = await establishAccountSession({
      admin,
      mobile,
      intent,
      consentTerms: consent_terms,
      consentPrivacy: consent_privacy,
      ip,
      ua,
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: result.status })
    }

    const response = NextResponse.json({ ok: true, is_new: result.isNew })
    response.cookies.set(SESSION_COOKIE, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DAYS * 24 * 60 * 60,
      path: '/',
    })
    return response
  } catch (err) {
    console.error('[otp/msg91] unhandled error:', err)
    return NextResponse.json(
      { ok: false, message: 'Could not complete sign-in right now. Please try again in a moment.' },
      { status: 500 },
    )
  }
}
