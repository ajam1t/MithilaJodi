import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSessionToken, hashSessionToken } from '@/lib/session'
import { INDIA_MOBILE_RE, SESSION_COOKIE, toE164 } from '@/lib/constants'
import { rateLimit } from '@/lib/astrology/server/rateLimit'
import { audit, isAdminRole } from '@/lib/adminAuth'

/*
 * Admin Console sign-in. Same accounts and password hashes as the member
 * login, but:
 *   - only admin/moderator accounts can sign in here — a member's correct
 *     password gets the same generic error as a wrong one, so this page cannot
 *     be used to probe member accounts;
 *   - it accepts the account's email or its mobile number;
 *   - admin sessions last 12 hours, not 30 days;
 *   - every success and every failed attempt on an admin account is audited.
 * There is no way to create an account here.
 */

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15
const ADMIN_SESSION_HOURS = 12
const GENERIC = 'Incorrect email/mobile or password.'

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'admin-login', { limit: 10, windowMs: 15 * 60_000 })
  if (!limited.ok) {
    return NextResponse.json({ ok: false, message: 'Too many sign-in attempts. Please wait a few minutes.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, message: 'Invalid request.' }, { status: 400 }) }
  const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!identifier || !password || identifier.length > 200 || password.length > 200) {
    return NextResponse.json({ ok: false, message: 'Enter your email or mobile number and your password.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  let query = admin
    .from('accounts')
    .select('id, role, account_status, password_hash, failed_login_attempts, locked_until')
    .is('deleted_at', null)
  if (identifier.includes('@')) {
    query = query.ilike('email', identifier)
  } else {
    const digits = identifier.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
    if (!INDIA_MOBILE_RE.test(digits)) return NextResponse.json({ ok: false, message: GENERIC }, { status: 401 })
    query = query.eq('mobile', toE164(digits))
  }
  const { data: account } = await query.maybeSingle()

  // Unknown, non-admin, or not active: one answer, with timing parity.
  if (!account || !isAdminRole(account.role) || account.account_status !== 'active' || !account.password_hash) {
    if (account?.password_hash) await bcrypt.compare(password, account.password_hash)
    else await new Promise(r => setTimeout(r, 250 + Math.random() * 150))
    return NextResponse.json({ ok: false, message: GENERIC }, { status: 401 })
  }

  if (account.locked_until && new Date(account.locked_until) > new Date()) {
    await audit(account.id, 'admin_login_blocked', { type: 'account', id: account.id }, { reason: 'locked' }, request)
    return NextResponse.json({ ok: false, message: 'Too many failed attempts. Try again later.' }, { status: 429 })
  }

  const valid = await bcrypt.compare(password, account.password_hash)
  if (!valid) {
    const attempts = (account.failed_login_attempts ?? 0) + 1
    const updates: Record<string, unknown> = { failed_login_attempts: attempts }
    if (attempts >= MAX_ATTEMPTS) updates.locked_until = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
    await admin.from('accounts').update(updates).eq('id', account.id)
    await audit(account.id, 'admin_login_failed', { type: 'account', id: account.id }, { attempts, locked: attempts >= MAX_ATTEMPTS }, request)
    return NextResponse.json({ ok: false, message: GENERIC }, { status: 401 })
  }

  await admin.from('accounts').update({ failed_login_attempts: 0, locked_until: null }).eq('id', account.id)

  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_HOURS * 3_600_000)
  const { error } = await admin.from('account_sessions').insert({
    account_id: account.id,
    token_hash: hashSessionToken(token),
    expires_at: expiresAt.toISOString(),
    user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? null,
    device_hash: 'admin-console',
  })
  if (error) {
    console.error('[admin login] session insert failed:', error.message)
    return NextResponse.json({ ok: false, message: 'Could not sign you in. Please try again.' }, { status: 500 })
  }
  await audit(account.id, 'admin_login', { type: 'account', id: account.id }, { via: identifier.includes('@') ? 'email' : 'mobile' }, request)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_HOURS * 3600,
    path: '/',
  })
  return response
}
