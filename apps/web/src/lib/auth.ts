import 'server-only'
import { cookies } from 'next/headers'
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
  const { data: acct, error: accountError } = await admin
    .from('accounts')
    .select('id, mobile, role, account_status, deleted_at')
    .eq('id', session.account_id)
    .single()

  if (accountError) {
    console.error('[auth] account lookup error:', accountError.message)
    return null
  }
  if (!acct || acct.deleted_at) return null
  // Only usable accounts hold a session. Suspended, banned, deactivated and
  // deleted accounts are signed out at the next request — a suspension used to
  // leave every existing cookie fully working.
  if (acct.account_status !== 'active' && acct.account_status !== 'pending_verification') return null

  // Bump last_seen (fire-and-forget)
  admin
    .from('account_sessions')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', session.id)
    .then(() => {})

  // Admin rights travel only with an Admin Console session (/admin/login:
  // 12-hour, rate-limited, audited). A staff account signed in through the
  // member login is treated as an ordinary member everywhere, so a stolen or
  // long-lived member cookie can never reach admin APIs.
  const staff = acct.role === 'admin' || acct.role === 'moderator'
  const role = staff && session.device_hash !== 'admin-console' ? 'user' : acct.role

  return {
    id: acct.id,
    mobile: acct.mobile,
    role,
    account_status: acct.account_status,
    session_id: session.id,
    staff,
  }
}
