import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { audit, requireAdminApi, type AdminPerm } from '@/lib/adminAuth'
import { refreshPublicShowcase } from '@/lib/showcaseCache'
import { syncDiscoverability } from '@/lib/discoverability'

/*
 * Member actions from Admin → Members → member.
 *
 * The member is the [id] in the URL (an account id); nothing about the target
 * or the actor is taken from the request body except the action and an
 * optional reason. Every action checks its own permission server-side, only
 * applies to ordinary member accounts (never an admin, moderator or the system
 * account), and is written to the append-only audit log.
 *
 * "Delete" is a soft delete: the account and profile are marked deleted,
 * sessions are signed out and shared links revoked. Data is retained, as the
 * member's own deactivation does — permanent erasure is not done from here.
 */

type Action = 'suspend' | 'enable' | 'hide' | 'show' | 'revoke_dp' | 'delete'

const PERM: Record<Action, AdminPerm> = {
  suspend: 'moderate',
  enable: 'moderate',
  hide: 'manage_members',
  show: 'manage_members',
  revoke_dp: 'manage_members',
  delete: 'delete_members',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, message: 'Invalid request.' }, { status: 400 }) }
  const action = body.action as Action
  if (!(action in PERM) || !UUID.test(id)) return NextResponse.json({ ok: false, message: 'Unknown action.' }, { status: 400 })

  const guard = await requireAdminApi(PERM[action])
  if (guard.error) return guard.error
  const actor = guard.session

  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) || null : null
  const admin = await createAdminClient()

  const { data: account } = await admin
    .from('accounts')
    .select('id, role, mobile, account_status, deleted_at')
    .eq('id', id)
    .maybeSingle()
  if (!account || account.role !== 'user' || account.mobile === '0000000000') {
    return NextResponse.json({ ok: false, message: 'Member not found.' }, { status: 404 })
  }
  if (account.account_status === 'deleted' && action !== 'revoke_dp') {
    return NextResponse.json({ ok: false, message: 'This member was deleted. Deleted members cannot be changed here.' }, { status: 409 })
  }
  const { data: profile } = await admin.from('profiles').select('id, discoverable, profile_status, visibility').eq('account_id', id).is('deleted_at', null).maybeSingle()
  const now = new Date().toISOString()
  const fail = (what: string, err: { message: string } | null) => {
    console.error(`[admin members ${action}] ${what}:`, err?.message)
    return NextResponse.json({ ok: false, message: 'The change could not be saved. Nothing was changed — please try again.' }, { status: 500 })
  }

  switch (action) {
    case 'suspend': {
      const { error } = await admin.from('accounts').update({ account_status: 'suspended', status_reason: reason ?? 'Suspended by admin' }).eq('id', id)
      if (error) return fail('update account', error)
      // A suspended member is signed out everywhere, not just blocked at next login.
      await admin.from('account_sessions').update({ revoked_at: now }).eq('account_id', id).is('revoked_at', null)
      await audit(actor.id, 'member_suspended', { type: 'account', id }, { reason, previous: account.account_status }, request)
      break
    }
    case 'enable': {
      const { error } = await admin.from('accounts').update({ account_status: 'active', status_reason: null, failed_login_attempts: 0, locked_until: null }).eq('id', id)
      if (error) return fail('update account', error)
      await audit(actor.id, 'member_enabled', { type: 'account', id }, { reason, previous: account.account_status }, request)
      break
    }
    case 'hide':
    case 'show': {
      if (!profile) return NextResponse.json({ ok: false, message: 'This member has no profile yet.' }, { status: 409 })
      // Hide is sticky (admin_hidden survives the member's next save). Show only
      // lifts the admin hide — a member who chose Private, or a new member who
      // has not finished joining, stays hidden.
      const { error } = action === 'hide'
        ? await admin.from('profiles').update({ discoverable: false, admin_hidden: true }).eq('id', profile.id)
        // Restore the member's own choice; the sync then applies the onboarding
        // rule (which leaves pre-redesign members visible).
        : await admin.from('profiles').update({ admin_hidden: false, discoverable: profile.visibility !== 'private' }).eq('id', profile.id)
      if (error) return fail('update profile', error)
      let discoverable = false
      if (action === 'show') {
        await syncDiscoverability(admin, id)
        const { data: after } = await admin.from('profiles').select('discoverable').eq('id', profile.id).maybeSingle()
        discoverable = !!after?.discoverable
      }
      await audit(actor.id, 'member_visibility', { type: 'profile', id: profile.id }, { discoverable, reason }, request)
      break
    }
    case 'revoke_dp': {
      if (!profile) return NextResponse.json({ ok: false, message: 'This member has no profile yet.' }, { status: 409 })
      const { data: revoked, error } = await admin.from('profile_shares').update({ revoked_at: now }).eq('profile_id', profile.id).is('revoked_at', null).select('id')
      if (error) return fail('revoke shares', error)
      await audit(actor.id, 'member_dp_revoked', { type: 'profile', id: profile.id }, { links: revoked?.length ?? 0, reason }, request)
      break
    }
    case 'delete': {
      if (body.confirm !== 'DELETE') return NextResponse.json({ ok: false, message: 'Type DELETE to confirm.' }, { status: 400 })
      const { error } = await admin.from('accounts').update({ account_status: 'deleted', deleted_at: now, status_reason: reason ?? 'Deleted by admin' }).eq('id', id)
      if (error) return fail('update account', error)
      if (profile) {
        await admin.from('profiles').update({ profile_status: 'deleted', discoverable: false, deleted_at: now, status_reason: reason ?? 'Deleted by admin' }).eq('id', profile.id)
        await admin.from('profile_shares').update({ revoked_at: now }).eq('profile_id', profile.id).is('revoked_at', null)
        await admin.from('public_showcase').delete().eq('profile_id', profile.id)
      }
      await admin.from('account_sessions').update({ revoked_at: now }).eq('account_id', id).is('revoked_at', null)
      await audit(actor.id, 'member_deleted', { type: 'account', id }, { reason, profile_id: profile?.id ?? null, soft: true }, request)
      break
    }
  }
  refreshPublicShowcase()
  return NextResponse.json({ ok: true })
}
