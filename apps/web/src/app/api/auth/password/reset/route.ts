import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSessionToken, hashSessionToken, sessionExpiresAt } from '@/lib/session'
import { SESSION_COOKIE, SESSION_DAYS } from '@/lib/constants'
import { isPasswordValid } from '@/lib/password'

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  const { reset_token, password } = (body ?? {}) as Record<string, unknown>

  if (typeof reset_token !== 'string' || !reset_token) {
    return NextResponse.json({ ok: false, message: 'Reset token required' }, { status: 400 })
  }
  if (typeof password !== 'string' || !password) {
    return NextResponse.json({ ok: false, message: 'New password required' }, { status: 400 })
  }
  if (!isPasswordValid(password)) {
    return NextResponse.json(
      { ok: false, message: 'Password must be at least 8 characters with uppercase, lowercase, and a number.' },
      { status: 400 },
    )
  }

  const tokenHash = createHash('sha256').update(reset_token).digest('hex')
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
             request.headers.get('x-real-ip') ?? null
  const ua = request.headers.get('user-agent') ?? null

  try {
    const admin = await createAdminClient()

    const { data: account } = await admin
      .from('accounts')
      .select('id, account_status, password_reset_token_hash, password_reset_expires_at')
      .eq('password_reset_token_hash', tokenHash)
      .is('deleted_at', null)
      .maybeSingle()

    if (!account) {
      return NextResponse.json(
        { ok: false, message: 'This reset link is invalid or has already been used.' },
        { status: 400 },
      )
    }

    if (new Date(account.password_reset_expires_at as string) < new Date()) {
      return NextResponse.json(
        { ok: false, message: 'This reset link has expired. Please start the forgot password flow again.' },
        { status: 400 },
      )
    }

    if (account.account_status !== 'active' && account.account_status !== 'pending_verification') {
      return NextResponse.json({ ok: false, message: 'Account is not available.' }, { status: 403 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { error: updateError } = await admin
      .from('accounts')
      .update({
        password_hash: passwordHash,
        password_reset_token_hash: null,
        password_reset_expires_at: null,
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq('id', account.id)

    if (updateError) {
      console.error('[password/reset] update error:', updateError.message)
      return NextResponse.json({ ok: false, message: 'Could not reset password. Please try again.' }, { status: 500 })
    }

    // Everywhere else is signed out: a reset is often how someone recovers an
    // account another person was using.
    await admin.from('account_sessions').update({ revoked_at: new Date().toISOString() }).eq('account_id', account.id).is('revoked_at', null)

    const token = generateSessionToken()
    const sessionTokenHash = hashSessionToken(token)
    const expiresAt = sessionExpiresAt()

    const { error: sessionError } = await admin.from('account_sessions').insert({
      account_id: account.id,
      token_hash: sessionTokenHash,
      expires_at: expiresAt.toISOString(),
      user_agent: ua,
      ip_address: ip,
    })

    if (sessionError) {
      console.error('[password/reset] session error:', sessionError.message)
      return NextResponse.json({ ok: false, message: 'Password reset but could not log in. Please log in manually.' }, { status: 500 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DAYS * 24 * 60 * 60,
      path: '/',
    })
    return response
  } catch (err) {
    console.error('[password/reset] error:', err)
    return NextResponse.json({ ok: false, message: 'Server error. Please try again.' }, { status: 500 })
  }
}
