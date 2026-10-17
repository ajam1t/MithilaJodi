import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { audit, requireAdminApi } from '@/lib/adminAuth'
import { generateSessionToken, hashSessionToken } from '@/lib/session'
import { IMPERSONATION_MINUTES, IMPERSONATION_PREFIX } from '@/lib/auth'
import { ACTING_AS_COOKIE, ADMIN_RETURN_COOKIE, cookieOpts } from '@/lib/impersonation'
import { SESSION_COOKIE } from '@/lib/constants'
import { DIGITAL_PROFILE_PATH } from '@/lib/digitalProfile'

/**
 * POST /api/admin/members/[id]/impersonate — "Sign in as this member".
 *
 * Admins only (manage_members), active ordinary members only. Creates a
 * 30-minute member session marked with the admin's id, keeps the admin's own
 * console session aside to return to, and records the start in the audit log.
 * While it lasts, messages, password changes and account export/deletion are
 * refused (lib/auth refuseWhileImpersonating). See lib/impersonation.ts.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ ok: false, message: 'Member not found.' }, { status: 404 })
  const guard = await requireAdminApi('manage_members')
  if (guard.error) return guard.error
  const actor = guard.session

  const admin = await createAdminClient()
  const { data: account } = await admin
    .from('accounts')
    .select('id, role, mobile, account_status, deleted_at')
    .eq('id', id)
    .maybeSingle()
  if (!account || account.role !== 'user' || account.mobile === '0000000000') {
    return NextResponse.json({ ok: false, message: 'Member not found.' }, { status: 404 })
  }
  if (account.deleted_at || account.account_status !== 'active') {
    return NextResponse.json({ ok: false, message: 'Only active members can be signed in as. Re-enable the account first.' }, { status: 409 })
  }

  const adminToken = request.cookies.get(SESSION_COOKIE)?.value
  if (!adminToken) return NextResponse.json({ ok: false, message: 'Please sign in to the Admin Console again.' }, { status: 401 })

  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + IMPERSONATION_MINUTES * 60_000)
  const { data: created, error } = await admin.from('account_sessions').insert({
    account_id: id,
    token_hash: hashSessionToken(token),
    expires_at: expiresAt.toISOString(),
    device_hash: `${IMPERSONATION_PREFIX}${actor.id}`,
    user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
  }).select('id').single()
  if (error || !created) {
    console.error('[admin impersonate] session insert:', error?.message)
    return NextResponse.json({ ok: false, message: 'Could not start. Nothing was changed — please try again.' }, { status: 500 })
  }

  const { data: profile } = await admin.from('profiles').select('first_name, last_name').eq('account_id', id).is('deleted_at', null).maybeSingle()
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || `member ••••${account.mobile.slice(-4)}`
  await audit(actor.id, 'member_impersonation_started', { type: 'account', id }, {
    session_id: created.id, expires_at: expiresAt.toISOString(),
  }, request)

  const seconds = IMPERSONATION_MINUTES * 60
  const res = NextResponse.json({ ok: true, redirect: DIGITAL_PROFILE_PATH })
  res.cookies.set(SESSION_COOKIE, token, cookieOpts(seconds))
  res.cookies.set(ADMIN_RETURN_COOKIE, adminToken, cookieOpts(seconds))
  res.cookies.set(ACTING_AS_COOKIE, encodeURIComponent(name), cookieOpts(seconds, false))
  return res
}
