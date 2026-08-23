import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createOtpService } from '@/lib/services/otp/OtpService'
import { INDIA_MOBILE_RE, toE164 } from '@/lib/constants'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  const raw = (body as Record<string, unknown>)?.mobile
  if (typeof raw !== 'string') {
    return NextResponse.json({ ok: false, message: 'Mobile number required' }, { status: 400 })
  }

  const digits = raw.replace(/\D/g, '')
  if (!INDIA_MOBILE_RE.test(digits)) {
    return NextResponse.json(
      { ok: false, message: 'Enter a valid 10-digit Indian mobile number starting with 6–9' },
      { status: 400 }
    )
  }

  const mobile = toE164(digits)

  try {
    const admin = await createAdminClient()

    // ── Rate limit (per mobile) ─────────────────────────────────────────────
    // Prevents OTP/SMS flooding once real SMS is enabled. Uses the existing
    // otp_challenges rows (created_at) as the counter — no extra table needed.
    const now = Date.now()
    const { data: recentRows } = await admin
      .from('otp_challenges')
      .select('created_at')
      .eq('mobile', mobile)
      .gte('created_at', new Date(now - 60 * 60 * 1000).toISOString())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recent = (recentRows ?? []) as any[]
    const lastMinute = recent.filter(r => new Date(r.created_at).getTime() > now - 45 * 1000).length
    if (lastMinute >= 1) {
      return NextResponse.json(
        { ok: false, message: 'Please wait a moment before requesting another OTP.' },
        { status: 429 },
      )
    }
    if (recent.length >= 5) {
      return NextResponse.json(
        { ok: false, message: 'Too many OTP requests. Please try again later.' },
        { status: 429 },
      )
    }

    const otpService = createOtpService()

    const { sent, error } = await otpService.challenge(mobile, admin)
    if (!sent) {
      console.error('[otp/challenge] provider error:', error)
      return NextResponse.json({ ok: false, message: 'Could not send OTP. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, expires_in: 600 })
  } catch (err) {
    // Surface a clear JSON error instead of an opaque empty 500 (which the
    // client shows as a generic "Network error"). Common causes: missing
    // Supabase env vars on the server, or a DB/provider failure.
    console.error('[otp/challenge] unhandled error:', err)
    return NextResponse.json(
      { ok: false, message: 'Could not send OTP right now. Please try again in a moment.' },
      { status: 500 },
    )
  }
}
