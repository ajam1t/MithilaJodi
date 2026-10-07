import 'server-only'
import { NextResponse } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { getSessionAccount, type SessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

/*
 * Admin authorization — enforced on the server for every admin page and API.
 *
 * The role comes from the accounts row behind the session cookie
 * (getSessionAccount), never from anything the browser sends. A signed-in
 * member who opens /admin gets a plain 404, so the console does not even
 * confirm it exists; a signed-out visitor is sent to the admin sign-in.
 *
 * Roles are the two the schema has. "Admin" can do everything; "Moderator"
 * reviews and moderates but cannot delete, change settings, edit community
 * links or manage security.
 */

export type AdminPerm =
  | 'view' // dashboards, analytics, member directory
  | 'moderate' // photos, reports, flags, suspend/enable
  | 'manage_members' // edit, visibility, revoke Digital Profile links
  | 'delete_members'
  | 'manage_content' // Journal
  | 'manage_community' // WhatsApp community and social links
  | 'manage_settings'
  | 'security' // sessions, audit log, admin access

const ROLE_PERMS: Record<string, readonly AdminPerm[]> = {
  admin: ['view', 'moderate', 'manage_members', 'delete_members', 'manage_content', 'manage_community', 'manage_settings', 'security'],
  moderator: ['view', 'moderate', 'manage_content'],
}

export const ROLE_LABEL: Record<string, string> = { admin: 'Admin', moderator: 'Moderator' }

export function isAdminRole(role: string | undefined | null): boolean {
  return !!role && role in ROLE_PERMS
}

export function can(session: Pick<SessionAccount, 'role'> | null, perm: AdminPerm): boolean {
  return !!session && (ROLE_PERMS[session.role] ?? []).includes(perm)
}

/** For server components: the admin session, or redirect/404. */
export async function requireAdminPage(perm: AdminPerm = 'view'): Promise<SessionAccount> {
  const session = await getSessionAccount()
  if (!session) redirect('/admin/login')
  if (!isAdminRole(session.role)) notFound()
  if (!can(session, perm)) redirect('/admin?denied=1')
  return session
}

/** For route handlers: `{ session }` or a 401/403 response to return as-is. */
export async function requireAdminApi(
  perm: AdminPerm,
): Promise<{ session: SessionAccount; error?: undefined } | { session?: undefined; error: NextResponse }> {
  const session = await getSessionAccount()
  if (!session) return { error: NextResponse.json({ ok: false, message: 'Please sign in again.' }, { status: 401 }) }
  if (!can(session, perm)) {
    return { error: NextResponse.json({ ok: false, message: 'Your admin role does not allow this action.' }, { status: 403 }) }
  }
  return { session }
}

/** Append-only audit entry. Failures are logged, never thrown. */
export async function audit(
  actorId: string | null,
  action: string,
  target: { type: string; id?: string | null } | null,
  payload: Record<string, unknown> = {},
  request?: Request,
): Promise<void> {
  try {
    const admin = await createAdminClient()
    const ip = request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request?.headers.get('x-real-ip') ?? null
    await admin.from('admin_audit_logs').insert({
      actor_id: actorId,
      action,
      target_type: target?.type ?? null,
      target_id: target?.id ?? null,
      payload,
      ip_address: ip,
      user_agent: request?.headers.get('user-agent')?.slice(0, 300) ?? null,
    })
  } catch (e) {
    console.error('[admin audit] insert failed:', e instanceof Error ? e.message : 'unknown')
  }
}
