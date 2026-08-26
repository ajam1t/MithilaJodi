import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSessionToken, hashSessionToken, sessionExpiresAt } from '@/lib/session'
import { INDIA_MOBILE_RE, SESSION_COOKIE, SESSION_DAYS, toE164 } from '@/lib/constants'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ ok: false, message: 'Incorrect mobile or password' }, { status: 401 })
    }

    if (account.account_status === 'suspended') {
      return NextResponse.json(
        { ok: false, message: 'This account is temporarily suspended. Contact support.' },
        { status: 403 },
      )
    }

    if (account.locked_until && new Date(account.locked_until as string) > new Date()) {
      const lockedUntil = new Date(account.locked_until as string)
      const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { ok: false, message: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.` },
        { status: 429 },
      )
    }

    if (!account.password_hash) {
      return NextResponse.json(
        { ok: false, message: 'This account uses OTP login. Use "Login with OTP" instead.' },
        { status: 400 },
      )
    }

    const valid = await bcrypt.compare(password, account.password_hash as string)

    if (!valid) {
      const attempts = (account.failed_login_attempts as number ?? 0) + 1
      const updates: Record<string, unknown> = { failed_login_attempts: attempts }
      if (attempts >= MAX_ATTEMPTS) {
        updates.locked_until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
      }
      await admin.from('accounts').update(updates).eq('id', account.id)

      const remaining = Math.max(0, MAX_ATTEMPTS - attempts)
      const msg = attempts >= MAX_ATTEMPTS
        ? `Too many failed attempts. Account locked for ${LOCK_MINUTES} minutes.`
        : `Incorrect mobile or password.${remaining > 0 ? ` ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` : ''}`

      return NextResponse.json({ ok: false, message: msg }, { status: 401 })
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
