import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSessionToken, hashSessionToken, sessionExpiresAt } from '@/lib/session'
import { INDIA_MOBILE_RE, SESSION_COOKIE, SESSION_DAYS, toE164 } from '@/lib/constants'
import { rateLimit } from '@/lib/astrology/server/rateLimit'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

const GENERIC = 'Incorrect mobile number or password. If you have not set a password yet, use “Forgot password”.'

export async function POST(request: NextRequest) {
  // Per-IP ceiling so one client cannot spray guesses or lock many accounts.
  const limited = rateLimit(request, 'password-login', { limit: 20, windowMs: 15 * 60_000 })
  if (!limited.ok) {
    return NextResponse.json({ ok: false, message: 'Too many sign-in attempts. Please wait a few minutes.' }, { status: 429 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  const { mobile: rawMobile, password } = (body ?? {}) as Record<string, unknown>

  if (typeof rawMobile !== 'string' || !rawMobile) {
    return NextResponse.json({ ok: false, message: 'Mobile number required' }, { status: 400 })
  }
  if (typeof password !== 'string' || !password) {
    return NextResponse.json({ ok: false, message: 'Password required' }, { status: 400 })
  }

  const digits = rawMobile.replace(/\D/g, '')
  if (!INDIA_MOBILE_RE.test(digits)) {
    return NextResponse.json({ ok: false, message: 'Invalid mobile number' }, { status: 400 })
  }
  const mobile = toE164(digits)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
             request.headers.get('x-real-ip') ?? null
  const ua = request.headers.get('user-agent') ?? null

  try {
    const admin = await createAdminClient()

    const { data: account } = await admin
      .from('accounts')
      .select('id, account_status, role, password_hash, failed_login_attempts, locked_until')
      .eq('mobile', mobile)
      .is('deleted_at', null)
      .maybeSingle()

    // Return the same message whether account exists or not (anti-enumeration)
    if (!account || account.account_status === 'banned' || account.account_status === 'deleted') {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 200)) // timing parity
      return NextResponse.json({ ok: false, message: GENERIC }, { status: 401 })
    }


    if (account.locked_until && new Date(account.locked_until as string) > new Date()) {
      const lockedUntil = new Date(account.locked_until as string)
      const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { ok: false, message: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.` },
        { status: 429 },
      )
    }

    // No password set yet: the same answer as a wrong password, so this page
    // cannot be used to learn how (or whether) a number is registered.
    if (!account.password_hash) {
      await bcrypt.compare(password, '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.l1eUrS6.Ck/E4mxKn7Ul6KqxNz0a')
      return NextResponse.json({ ok: false, message: GENERIC }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, account.password_hash as string)

    if (!valid) {
      // Atomic increment (migration 20261008000003): parallel wrong guesses can
      // no longer slip past the lockout by all reading the same count.
      const { data: attempts } = await admin.rpc('register_failed_login', { p_account: account.id, p_max: MAX_ATTEMPTS, p_lock_minutes: LOCK_MINUTES })
      const msg = Number(attempts) >= MAX_ATTEMPTS
        ? `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes, or reset your password.`
        : GENERIC
      return NextResponse.json({ ok: false, message: msg }, { status: 401 })
    }

    // Suspended accounts cannot sign in (checked only after the password, so
    // the status of a number is never revealed to someone who doesn't own it).
    if (account.account_status === 'suspended') {
      return NextResponse.json(
        { ok: false, message: 'This account is temporarily suspended. Contact support.' },
        { status: 403 },
      )
    }

    // Success — reset rate limit counters
    await admin
      .from('accounts')
      .update({ failed_login_attempts: 0, locked_until: null })
      .eq('id', account.id)

    const token = generateSessionToken()
    const tokenHash = hashSessionToken(token)
    const expiresAt = sessionExpiresAt()

    const { error: sessionError } = await admin.from('account_sessions').insert({
      account_id: account.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      user_agent: ua,
      ip_address: ip,
    })

    if (sessionError) {
      console.error('[password/login] session error:', sessionError.message)
      return NextResponse.json({ ok: false, message: 'Could not create session. Please try again.' }, { status: 500 })
    }

    const response = NextResponse.json({ ok: true, role: account.role })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DAYS * 24 * 60 * 60,
      path: '/',
    })
    return response
  } catch (err) {
    console.error('[password/login] error:', err)
    return NextResponse.json({ ok: false, message: 'Server error. Please try again.' }, { status: 500 })
  }
}
