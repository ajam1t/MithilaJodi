import 'server-only'
import { cookies, headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { hashSessionToken } from '@/lib/session'
import { SESSION_COOKIE } from '@/lib/constants'

export type SessionAccount = {
  id: string
  mobile: string
  role: string
  account_status: string
  session_id: string
  /** The account is admin/moderator, even if this session is a member session. */
  staff: boolean
  /** Set when an admin is signed in as this member from the Admin Console: the admin's account id. */
  impersonatedBy: string | null
  /** Admin approval of the account: only 'approved' members reach member features (lib/approval). */
  approval: 'pending' | 'approved' | 'rejected'
}

/**
 * "Sign in as this member" sessions are ordinary member sessions marked in
 * device_hash, as Admin Console sessions are marked 'admin-console'. They last
 * 30 minutes and are created only by POST /api/admin/members/[id]/impersonate.
 */
export const IMPERSONATION_PREFIX = 'impersonation:'
export const IMPERSONATION_MINUTES = 30

/**
 * What an admin acting as a member may not do: read private messages, change
 * the password, or export, deactivate or delete the account. Returns the
 * response to send, or null when the request may go ahead.
 */
export function refuseWhileImpersonating(session: Pick<SessionAccount, 'impersonatedBy'> | null): Response | null {
  if (!session?.impersonatedBy) return null
  return Response.json(
    { ok: false, message: 'Not available while signed in as this member from the Command Centre.' },
    { status: 403 },
  )
}

export async function getSessionAccount(): Promise<SessionAccount | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const tokenHash = hashSessionToken(token)
  const admin = await createAdminClient()

  // Step 1: look up the session by token hash
  const { data: session, error: sessionError } = await admin
    .from('account_sessions')
    .select('id, account_id, expires_at, revoked_at, device_hash')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .single()

  if (sessionError) {
    if (sessionError.code !== 'PGRST116') {
      console.error('[auth] session lookup error:', sessionError.code, sessionError.message)
    }
    return null
  }
  if (!session) return null
  if (new Date(session.expires_at) < new Date()) return null

  // Step 2: look up the account
  // approval_status arrives with migration 20261112000001; until then every
  // account counts as approved, so sign-in keeps working before it is applied.
  let { data: acct, error: accountError } = await admin
    .from('accounts')
    .select('id, mobile, role, account_status, deleted_at, approval_status')
    .eq('id', session.account_id)
    .single()
  if (accountError?.code === '42703') {
    ({ data: acct, error: accountError } = await admin
      .from('accounts')
      .select('id, mobile, role, account_status, deleted_at')
      .eq('id', session.account_id)
      .single())
  }

  if (accountError) {
    console.error('[auth] account lookup error:', accountError.message)
    return null
  }
  if (!acct || acct.deleted_at) return null
  // Only usable accounts hold a session. Suspended, banned, deactivated and
  // deleted accounts are signed out at the next request — a suspension used to
  // leave every existing cookie fully working.
  if (acct.account_status !== 'active' && acct.account_status !== 'pending_verification') return null

  const impersonatedBy = typeof session.device_hash === 'string' && session.device_hash.startsWith(IMPERSONATION_PREFIX)
    ? session.device_hash.slice(IMPERSONATION_PREFIX.length)
    : null

  // Bump last_seen (fire-and-forget) — not for an admin acting as the member,
  // which would make the member look active when they are not.
  if (!impersonatedBy) {
    admin
      .from('account_sessions')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', session.id)
      .then(() => {})
  }

  // Admin rights travel only with an Admin Console session (/admin/login:
  // 12-hour, rate-limited, audited). A staff account signed in through the
  // member login is treated as an ordinary member everywhere, so a stolen or
  // long-lived member cookie can never reach admin APIs.
  const staff = acct.role === 'admin' || acct.role === 'moderator'
  const role = staff && session.device_hash !== 'admin-console' ? 'user' : acct.role

  const approval = (['pending', 'rejected'].includes(acct.approval_status) ? acct.approval_status : 'approved') as SessionAccount['approval']

  // An account awaiting approval (or rejected) is signed in, but only for the
  // few endpoints it needs to finish its profile, see its status and manage or
  // close its account. For every other API this returns null — exactly as if
  // signed out — so no member feature can be reached by calling it directly.
  // Middleware stamps the real request path (x-mj-path), overwriting anything
  // a client sends. Staff accounts are never gated.
  if (approval !== 'approved' && !staff) {
    const path = (await headers()).get('x-mj-path') ?? ''
    if (path.startsWith('/api/') && !allowedWhileUnapproved(path)) return null
  }

  return {
    id: acct.id,
    mobile: acct.mobile,
    role,
    account_status: acct.account_status,
    session_id: session.id,
    staff,
    impersonatedBy,
    approval,
  }
}

/** APIs an account awaiting approval may use: finishing its profile and photos, its notifications, its account. A trailing '/*' covers sub-paths. */
export const UNAPPROVED_API = [
  '/api/auth/*', '/api/account', '/api/account/*', '/api/onboarding', '/api/onboarding/*',
  '/api/profile', '/api/profile/photos', '/api/profile/photos/*', '/api/profile/preferences',
  '/api/options', '/api/locations', '/api/pincode', '/api/legal/*', '/api/notifications', '/api/notifications/*',
]
export function allowedWhileUnapproved(path: string): boolean {
  return UNAPPROVED_API.some(p => p.endsWith('/*') ? path.startsWith(p.slice(0, -1)) : path === p)
}
