import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { createOtpService } from '@/lib/services/otp/OtpService'
import { establishAccountSession } from '@/lib/authFlow'
import { INDIA_MOBILE_RE, SESSION_COOKIE, SESSION_DAYS, toE164 } from '@/lib/constants'

const RESET_TOKEN_EXPIRY_MINUTES = 15

const VerifySchema = z.object({
  mobile: z.string(),
  code: z.string().regex(/^\d{4,8}$/, 'OTP must be 4 digits'),
  intent: z.enum(['login', 'register', 'forgot_password']),
  consent_terms: z.boolean().optional(),
  consent_privacy: z.boolean().optional(),
})

const OTP_REASON_MESSAGES: Record<string, string> = {
  expired: 'OTP has expired. Please request a new one.',
  max_attempts: 'Too many incorrect attempts. Request a new OTP.',
  invalid: 'Incorrect OTP. Please try again.',
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  const parsed = VerifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }

  const { mobile: rawMobile, code, intent, consent_terms, consent_privacy } = parsed.data
  const digits = rawMobile.replace(/\D/g, '')
  if (!INDIA_MOBILE_RE.test(digits)) {
    return NextResponse.json({ ok: false, message: 'Invalid mobile number' }, { status: 400 })
  }
  const mobile = toE164(digits)

  if (intent === 'register' && (!consent_terms || !consent_privacy)) {
    return NextResponse.json(
      { ok: false, message: 'You must accept the Terms of Service and Privacy Policy to register' },
      { status: 400 }
    )
  }

  if (intent === 'forgot_password') {
    // Verify OTP then return a one-time reset token — no session created
    try {
      const admin = await createAdminClient()
      const otpService = createOtpService()
      const verifyResult = await otpService.verify(mobile, code, admin)
      if (!verifyResult.valid) {
        const message = OTP_REASON_MESSAGES[verifyResult.reason ?? 'invalid'] ?? 'Invalid OTP'
        return NextResponse.json({ ok: false, message }, { status: 400 })
      }

      const { data: account } = await admin
        .from('accounts')
        .select('id, account_status')
        .eq('mobile', mobile)
        .is('deleted_at', null)
        .maybeSingle()

      if (!account || account.account_status === 'banned' || account.account_status === 'deleted') {
        return NextResponse.json(
          { ok: false, message: 'No active account found with this number.' },
          { status: 404 },
        )
      }

      if (account.account_status === 'suspended') {
        return NextResponse.json(
          { ok: false, message: 'This account is temporarily suspended. Contact support.' },
          { status: 403 },
        )
      }

      const resetToken = randomBytes(32).toString('hex')
      const resetTokenHash = createHash('sha256').update(resetToken).digest('hex')
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString()

      const { error: updateError } = await admin
        .from('accounts')
        .update({
          password_reset_token_hash: resetTokenHash,
          password_reset_expires_at: expiresAt,
        })
        .eq('id', account.id)

      if (updateError) {
        console.error('[otp/verify] forgot_password update error:', updateError.message)
        return NextResponse.json({ ok: false, message: 'Could not initiate password reset. Please try again.' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, reset_token: resetToken })
    } catch (err) {
      console.error('[otp/verify] forgot_password error:', err)
      return NextResponse.json({ ok: false, message: 'Server error. Please try again.' }, { status: 500 })
    }
  }

  try {
  const admin = await createAdminClient()
  const otpService = createOtpService()

  const verifyResult = await otpService.verify(mobile, code, admin)
  if (!verifyResult.valid) {
    const message = OTP_REASON_MESSAGES[verifyResult.reason ?? 'invalid'] ?? 'Invalid OTP'
    return NextResponse.json({ ok: false, message }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
             request.headers.get('x-real-ip') ??
             null
  const ua = request.headers.get('user-agent') ?? null

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

  const response = NextResponse.json({ ok: true, is_new: result.isNew, role: result.role })
  response.cookies.set(SESSION_COOKIE, result.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: '/',
  })
  return response
  } catch (err) {
    // Return a clear JSON error rather than an opaque empty 500.
    console.error('[otp/verify] unhandled error:', err)
    return NextResponse.json(
      { ok: false, message: 'Could not verify OTP right now. Please try again in a moment.' },
      { status: 500 },
    )
  }
}
