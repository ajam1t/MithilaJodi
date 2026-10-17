import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { hashSessionToken } from '@/lib/session'
import { SESSION_COOKIE } from '@/lib/constants'
import { audit } from '@/lib/adminAuth'
import type { SessionAccount } from '@/lib/auth'

/**
 * "Sign in as this member" — an admin opens the website as a member, for up
 * to 30 minutes, to help a family who cannot do it themselves (creating and
 * sharing their Digital Profile). No password is involved: the admin gets an
 * ordinary member session, marked as theirs (lib/auth IMPERSONATION_PREFIX).
 *
 * Admin and member sessions share one cookie, so starting this would sign the
 * admin out of the console. The admin's own session token is kept in
 * ADMIN_RETURN_COOKIE (httpOnly) and put back when they exit.
 * ACTING_AS_COOKIE is readable by the page only to show the banner — every
 * permission decision comes from the session row, never from it.
 */

export const ADMIN_RETURN_COOKIE = 'mj-admin-return'
export const ACTING_AS_COOKIE = 'mj-acting-as'

const secure = process.env.NODE_ENV === 'production'
export const cookieOpts = (maxAge: number, httpOnly = true) => ({ httpOnly, secure, sameSite: 'lax' as const, path: '/', maxAge })

/**
 * End an impersonation: revoke the member session, audit it, and restore the
 * admin's console session if it is still live. Returns the response to send.
 */
export async function endImpersonation(request: NextRequest, session: SessionAccount): Promise<NextResponse> {
  const admin = await createAdminClient()
  await admin.from('account_sessions').update({ revoked_at: new Date().toISOString() }).eq('id', session.session_id)
  await audit(session.impersonatedBy, 'member_impersonation_ended', { type: 'account', id: session.id }, {}, request)

  // Only ever restore the same admin's own, still-valid console session.
  const back = request.cookies.get(ADMIN_RETURN_COOKIE)?.value ?? ''
  let restoreFor = 0
  if (back) {
    const { data } = await admin
      .from('account_sessions')
      .select('account_id, device_hash, expires_at, revoked_at')
      .eq('token_hash', hashSessionToken(back))
      .maybeSingle()
    const left = data ? Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000) : 0
    if (data && data.account_id === session.impersonatedBy && data.device_hash === 'admin-console' && !data.revoked_at && left > 0) {
      restoreFor = left
    }
  }

  const res = NextResponse.json({ ok: true, redirect: restoreFor ? `/admin/members/${session.id}` : '/admin/login' })
  res.cookies.set(SESSION_COOKIE, restoreFor ? back : '', cookieOpts(restoreFor))
  res.cookies.set(ADMIN_RETURN_COOKIE, '', cookieOpts(0))
  res.cookies.set(ACTING_AS_COOKIE, '', cookieOpts(0, false))
  return res
}
