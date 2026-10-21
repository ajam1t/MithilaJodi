import 'server-only'
import { NextResponse } from 'next/server'
import { getSessionAccount, refuseWhileImpersonating } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { canViewPhotos, filterPhotoViewable, normalisePhotoVisibility } from '@/lib/photoAccess'
import { notify } from '@/lib/notifications'
import { signPhotos } from '@/lib/photoWeb'

/* eslint-disable @typescript-eslint/no-explicit-any */

/*
 * Photos on request, and contact details on request — one flow, two tables
 * (migration 20261022000001). A member (the requester) asks another (the
 * owner); the owner approves, declines, or later revokes; the requester may
 * cancel while it is still pending. The routes under /api/photo-requests and
 * /api/contact-requests are thin wrappers around the handlers here, so the
 * rules cannot drift apart between the two.
 *
 *   photo    the owner's photo visibility is 'on_request', the requester can
 *            see the owner's profile (active, discoverable, no block either
 *            way) and cannot already see the photos. Approval is read by
 *            lib/photoAccess.ts.
 *   contact  only between matched members (an accepted interest either way).
 *            Approval lets the requester read the owner's contact projection
 *            (lib/contactDetails) through /api/contact-requests/contact.
 *
 * Both: one pending/approved request per pair; after a decline (or a revoke)
 * the same pair waits 30 days; at most 20 new requests a day per requester;
 * every block check fails closed; nothing is created or approved while an
 * admin is signed in as the member. A block revokes everything between the
 * pair (api/blocks). Until the migration runs, every handler answers 503
 * "This feature is not switched on yet." and the pages hide the UI.
 */

export type RequestKind = 'photo' | 'contact'
export type RequestStatus = 'pending' | 'approved' | 'declined' | 'revoked'
export type RequestRow = { id: string; status: RequestStatus; created_at: string; decided_at: string | null }

const TABLE: Record<RequestKind, string> = { photo: 'photo_requests', contact: 'contact_requests' }
const DAILY_LIMIT = 20
export const REQUEST_COOLDOWN_MS = 30 * 86_400_000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** PostgREST reports a missing table as PGRST205 (schema cache) or 42P01. */
export function tableMissing(error: { code?: string } | null | undefined): boolean {
  return error?.code === '42P01' || error?.code === 'PGRST205'
}

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v)
}

function reply(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, message, ...extra }, { status })
}
export const featureOff = () => reply(503, 'This feature is not switched on yet.', { code: 'FEATURE_OFF' })
const tryAgain = () => reply(503, 'Something went wrong — please try again.')

/** A declined or revoked request: when the same pair may ask again (null = now). */
export function askAgainAt(row: Pick<RequestRow, 'status' | 'decided_at'> | null): string | null {
  if (!row || (row.status !== 'declined' && row.status !== 'revoked') || !row.decided_at) return null
  const at = Date.parse(row.decided_at) + REQUEST_COOLDOWN_MS
  return at > Date.now() ? new Date(at).toISOString() : null
}

function firstName(p: { first_name?: string | null }): string {
  return (p.first_name ?? '').trim() || 'A member'
}

async function loadMe(admin: any, accountId: string) {
  const { data, error } = await admin
    .from('profiles')
    .select('id, account_id, first_name, last_name, profile_status')
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .neq('profile_status', 'deleted')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return 'error' as const
  return data as { id: string; account_id: string; first_name: string; last_name: string | null; profile_status: string } | null
}

/** True when either has blocked the other; 'error' when it cannot be told. */
export async function blockedBetween(admin: any, a: string, b: string): Promise<boolean | 'error'> {
  const { data, error } = await admin
    .from('blocks')
    .select('blocker_id')
    .or(`and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`)
    .limit(1)
    .maybeSingle()
  if (error) { console.error('[requests] blocks query error:', error.message); return 'error' }
  return !!data
}

/** An accepted interest in either direction (the Inbox's "match"). */
export async function matchedWith(admin: any, a: string, b: string): Promise<boolean | 'error'> {
  const { data, error } = await admin
    .from('interests')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(from_profile.eq.${a},to_profile.eq.${b}),and(from_profile.eq.${b},to_profile.eq.${a})`)
    .limit(1)
    .maybeSingle()
  if (error) { console.error('[requests] interests query error:', error.message); return 'error' }
  return !!data
}

/** A profile whose account is usable; for photos it must also be discoverable, as on /profile/[id]. */
async function loadLiveProfile(admin: any, profileId: string, mustBeDiscoverable: boolean) {
  const { data: p, error } = await admin
    .from('profiles')
    .select('id, account_id, first_name, last_name, profile_status, discoverable')
    .eq('id', profileId)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) return 'error' as const
  if (!p || p.profile_status !== 'active' || (mustBeDiscoverable && p.discoverable !== true)) return null
  const { data: acct, error: acctError } = await admin
    .from('accounts')
    .select('account_status, deleted_at')
    .eq('id', p.account_id)
    .maybeSingle()
  if (acctError) return 'error' as const
  if (!acct || acct.deleted_at || acct.account_status !== 'active') return null
  return p as { id: string; account_id: string; first_name: string; last_name: string | null }
}

/** The request `requester` sent `owner`, for the profile page. 'off' before the migration. */
export async function requestBetween(admin: any, kind: RequestKind, requester: string, owner: string): Promise<RequestRow | null | 'off' | 'error'> {
  const { data, error } = await admin
    .from(TABLE[kind])
    .select('id, status, created_at, decided_at')
    .eq('requester_profile', requester)
    .eq('owner_profile', owner)
    .maybeSingle()
  if (error) return tableMissing(error) ? 'off' : 'error'
  return (data as RequestRow | null) ?? null
}

async function notifyOwner(admin: any, kind: RequestKind, ownerAccountId: string, me: { id: string; first_name: string }) {
  const name = firstName(me)
  await notify(admin, kind === 'photo' ? {
    accountId: ownerAccountId,
    type: 'photo_request_received',
    icon: 'user',
    title: 'A request to see your photos',
    message: `${name} asked to see your photos.`,
    ctaLabel: 'Respond',
    ctaUrl: '/inbox?tab=requests',
    payload: { from_profile_id: me.id },
    // Cancel-and-ask-again within a day is one request, not two.
    dedupeKey: `photo_request:${me.id}`,
    cooldownHours: 24,
  } : {
    accountId: ownerAccountId,
    type: 'contact_request_received',
    icon: 'user',
    title: 'A request for your contact details',
    message: `${name} asked for your contact details.`,
    ctaLabel: 'Respond',
    ctaUrl: '/inbox?tab=requests',
    payload: { from_profile_id: me.id },
    dedupeKey: `contact_request:${me.id}`,
    cooldownHours: 24,
  })
}

async function notifyRequester(admin: any, kind: RequestKind, requesterAccountId: string, owner: { id: string; first_name: string }) {
  const name = firstName(owner)
  await notify(admin, kind === 'photo' ? {
    accountId: requesterAccountId,
    type: 'photo_request_approved',
    icon: 'check',
    title: 'Photos shared with you',
    message: `${name} shared their photos with you.`,
    ctaLabel: 'View Photos',
    ctaUrl: `/profile/${owner.id}`,
    payload: { owner_profile_id: owner.id },
    dedupeKey: `photo_request_approved:${owner.id}`,
    cooldownHours: 24,
  } : {
    accountId: requesterAccountId,
    type: 'contact_request_approved',
    icon: 'check',
    title: 'Contact details shared with you',
    message: `${name} shared their contact details with you.`,
    ctaLabel: 'View Contact',
    ctaUrl: `/profile/${owner.id}#contact-details`,
    payload: { owner_profile_id: owner.id },
    dedupeKey: `contact_request_approved:${owner.id}`,
    cooldownHours: 24,
  })
}

// ─── POST: ask ───────────────────────────────────────────────────────────────

export async function createRequest(kind: RequestKind, request: Request): Promise<Response> {
  const session = await getSessionAccount()
  if (!session) return reply(401, 'Unauthorized')
  const refused = refuseWhileImpersonating(session)
  if (refused) return refused

  let body: any
  try { body = await request.json() } catch { return reply(400, 'Invalid request body') }
  const ownerId = body?.owner_profile_id
  if (!isUuid(ownerId)) return reply(400, 'owner_profile_id is required')

  const admin = await createAdminClient()
  const me = await loadMe(admin, session.id)
  if (me === 'error') return tryAgain()
  if (!me) return reply(404, 'Profile not found')
  if (me.profile_status !== 'active') return reply(403, 'Your profile needs to be active before you can send requests.')
  if (me.id === ownerId) return reply(400, 'You cannot send a request to yourself.')

  // Before anything else: is the feature switched on, and what is there already?
  const existing = await requestBetween(admin, kind, me.id, ownerId)
  if (existing === 'off') return featureOff()
  if (existing === 'error') return tryAgain()

  const owner = await loadLiveProfile(admin, ownerId, kind === 'photo')
  if (owner === 'error') return tryAgain()
  if (!owner) return reply(404, 'This profile is not available.')

  // Fail closed: an unreadable block list is never "nobody blocked".
  const blocked = await blockedBetween(admin, me.id, owner.id)
  if (blocked === 'error') return tryAgain()
  if (blocked) return reply(404, 'This profile is not available.')

  if (kind === 'photo') {
    const { data: priv, error: privError } = await admin
      .from('profile_private')
      .select('photo_visibility')
      .eq('profile_id', owner.id)
      .maybeSingle()
    if (privError) return tryAgain()
    if (normalisePhotoVisibility(priv?.photo_visibility) !== 'on_request') {
      return reply(409, `${firstName(owner)}'s photos are not shared on request.`, { code: 'NOT_ON_REQUEST' })
    }
    if (await canViewPhotos(admin, me.id, owner.id)) {
      return reply(409, `You can already see ${firstName(owner)}'s photos.`, { code: 'ALREADY_VISIBLE' })
    }
  } else {
    const matched = await matchedWith(admin, me.id, owner.id)
    if (matched === 'error') return tryAgain()
    if (!matched) return reply(403, 'Contact details can be requested once you are matched.', { code: 'NOT_MATCHED' })
  }

  if (existing?.status === 'pending') return reply(409, 'You have already asked. They will see your request in their Inbox.', { code: 'ALREADY_PENDING' })
  if (existing?.status === 'approved') return reply(409, 'This has already been shared with you.', { code: 'ALREADY_APPROVED' })
  if (askAgainAt(existing)) {
    return reply(409, 'You can ask again a while after an earlier request was not taken forward.', { code: 'RECENTLY_DECLINED', ask_again_at: askAgainAt(existing) })
  }

  // A daily ceiling, so requests stay considered rather than sprayed.
  const { count, error: countError } = await admin
    .from(TABLE[kind])
    .select('id', { count: 'exact', head: true })
    .eq('requester_profile', me.id)
    .gte('created_at', new Date(Date.now() - 86_400_000).toISOString())
  if (countError) return tryAgain()
  if ((count ?? 0) >= DAILY_LIMIT) {
    return reply(429, `You can send up to ${DAILY_LIMIT} requests a day. Please try again tomorrow.`, { code: 'DAILY_LIMIT' })
  }

  const now = new Date().toISOString()
  let row: RequestRow | null = null
  if (existing) {
    // An old decline or revoke, past its wait: the same row is asked again.
    const { data, error } = await admin
      .from(TABLE[kind])
      .update({ status: 'pending', created_at: now, decided_at: null })
      .eq('id', existing.id)
      .eq('status', existing.status)
      .select('id, status, created_at, decided_at')
      .maybeSingle()
    if (error) { console.error(`[${kind} requests POST] revive error:`, error.message); return tryAgain() }
    if (!data) return reply(409, 'This request has just changed. Please refresh the page.')
    row = data
  } else {
    const { data, error } = await admin
      .from(TABLE[kind])
      .insert({ requester_profile: me.id, owner_profile: owner.id, status: 'pending' })
      .select('id, status, created_at, decided_at')
      .single()
    if (error) {
      if (error.code === '23505') return reply(409, 'You have already asked. They will see your request in their Inbox.', { code: 'ALREADY_PENDING' })
      console.error(`[${kind} requests POST] insert error:`, error.message)
      return tryAgain()
    }
    row = data
  }

  await notifyOwner(admin, kind, owner.account_id, me)
  return NextResponse.json({ ok: true, request: row }, { status: 201 })
}

// ─── GET: received / sent ────────────────────────────────────────────────────

function computeAge(dob: string): number | null {
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export type RequestListItem = RequestRow & {
  kind: RequestKind
  profile: { id: string; display_name: string; age: number | null; current_loc_name: string | null; photo_url: string | null }
}

export async function listRequests(kind: RequestKind, request: Request): Promise<Response> {
  const session = await getSessionAccount()
  if (!session) return reply(401, 'Unauthorized')

  const box = new URL(request.url).searchParams.get('box') === 'sent' ? 'sent' : 'received'
  const admin = await createAdminClient()
  const me = await loadMe(admin, session.id)
  if (me === 'error') return tryAgain()
  if (!me) return reply(404, 'Profile not found')

  // Received: what is waiting for an answer, and what has been shared (so it
  // can be revoked). Sent: everything, with its status.
  let q = admin
    .from(TABLE[kind])
    .select('id, requester_profile, owner_profile, status, created_at, decided_at')
    .order('created_at', { ascending: false })
    .limit(100)
  q = box === 'received' ? q.eq('owner_profile', me.id).in('status', ['pending', 'approved']) : q.eq('requester_profile', me.id)
  const { data: rows, error } = await q
  if (error) return tableMissing(error) ? featureOff() : tryAgain()

  const otherOf = (r: any) => (box === 'received' ? r.requester_profile : r.owner_profile) as string
  let list: any[] = rows ?? []
  const ids = [...new Set(list.map(otherOf))]

  const profileMap = new Map<string, RequestListItem['profile']>()
  if (ids.length > 0) {
    // Leave out anyone on either side of a block, and anyone whose profile or
    // account is gone — as the interests list does.
    const [{ data: blk, error: blkError }, { data: people }] = await Promise.all([
      admin
        .from('blocks')
        .select('blocker_id, blocked_id')
        .or(`and(blocker_id.eq.${me.id},blocked_id.in.(${ids.join(',')})),and(blocked_id.eq.${me.id},blocker_id.in.(${ids.join(',')}))`),
      admin
        .from('profiles')
        .select('id, first_name, last_name, dob, current_loc_id, deleted_at, profile_status, accounts!inner(account_status, deleted_at)')
        .in('id', ids),
    ])
    // Fail closed: an unreadable block list must not be read as "nobody blocked".
    if (blkError) { console.error(`[${kind} requests GET] blocks query error:`, blkError.message); return tryAgain() }
    const gone = new Set<string>()
    for (const b of (blk ?? []) as any[]) gone.add(b.blocker_id === me.id ? b.blocked_id : b.blocker_id)
    const live: any[] = []
    for (const r of (people ?? []) as any[]) {
      const acct = Array.isArray(r.accounts) ? r.accounts[0] : r.accounts
      if (r.deleted_at || r.profile_status === 'deleted' || r.profile_status === 'deactivated' || !acct || acct.deleted_at || acct.account_status !== 'active') gone.add(r.id)
      else if (!gone.has(r.id)) live.push(r)
    }
    const liveIds = live.map(r => r.id as string)

    // Place names, and the primary photo only where the normal photo rules
    // already let this member see it.
    const locIds = [...new Set(live.map(r => r.current_loc_id).filter((x: any) => x != null))]
    const [{ data: locs }, photoOk, { data: photoRows }] = await Promise.all([
      locIds.length ? admin.from('india_locations').select('id, name_en').in('id', locIds) : Promise.resolve({ data: [] }),
      liveIds.length ? filterPhotoViewable(admin, me.id, liveIds) : Promise.resolve(new Set<string>()),
      liveIds.length
        ? admin.from('profile_photos').select('profile_id, storage_path').in('profile_id', liveIds).eq('is_primary', true).eq('status', 'approved')
        : Promise.resolve({ data: [] }),
    ])
    const locMap = new Map<number, string>((locs ?? []).map((l: any) => [l.id as number, l.name_en as string]))
    const pathBy = new Map<string, string>()
    for (const ph of (photoRows ?? []) as any[]) if (photoOk.has(ph.profile_id) && !pathBy.has(ph.profile_id)) pathBy.set(ph.profile_id, ph.storage_path)
    const urlBy = new Map<string, string | null>()
    const entries = [...pathBy.entries()]
    if (entries.length > 0) {
      try {
        const { data: signed } = await signPhotos(admin, entries.map(([, p]) => p))
        entries.forEach(([pid], i) => urlBy.set(pid, (signed ?? [])[i]?.signedUrl ?? null))
      } catch (err) {
        console.error(`[${kind} requests GET] sign error:`, err)
      }
    }
    for (const r of live) {
      profileMap.set(r.id, {
        id: r.id,
        display_name: [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Member',
        age: r.dob ? computeAge(r.dob) : null,
        current_loc_name: r.current_loc_id != null ? locMap.get(r.current_loc_id) ?? null : null,
        photo_url: urlBy.get(r.id) ?? null,
      })
    }
    list = list.filter(r => profileMap.has(otherOf(r)))
  }

  const items: RequestListItem[] = list.map(r => ({
    id: r.id, kind, status: r.status, created_at: r.created_at, decided_at: r.decided_at ?? null,
    profile: profileMap.get(otherOf(r))!,
  }))
  return NextResponse.json({ ok: true, kind, box, items })
}

// ─── PATCH: approve / decline / revoke (owner) ───────────────────────────────

const TRANSITION: Record<'approve' | 'decline' | 'revoke', { from: RequestStatus; to: RequestStatus }> = {
  approve: { from: 'pending', to: 'approved' },
  decline: { from: 'pending', to: 'declined' },
  revoke: { from: 'approved', to: 'revoked' },
}

export async function decideRequest(kind: RequestKind, id: string, request: Request): Promise<Response> {
  const session = await getSessionAccount()
  if (!session) return reply(401, 'Unauthorized')
  const refused = refuseWhileImpersonating(session)
  if (refused) return refused

  let body: any
  try { body = await request.json() } catch { return reply(400, 'Invalid request body') }
  const action = body?.action
  if (action !== 'approve' && action !== 'decline' && action !== 'revoke') return reply(400, 'action must be approve, decline or revoke')
  if (!isUuid(id)) return reply(404, 'Request not found')

  const admin = await createAdminClient()
  const me = await loadMe(admin, session.id)
  if (me === 'error') return tryAgain()
  if (!me) return reply(404, 'Profile not found')

  const { data: row, error } = await admin
    .from(TABLE[kind])
    .select('id, requester_profile, owner_profile, status')
    .eq('id', id)
    .maybeSingle()
  if (error) return tableMissing(error) ? featureOff() : tryAgain()
  // Only the owner answers; to anyone else the request does not exist.
  if (!row || row.owner_profile !== me.id) return reply(404, 'Request not found')

  const t = TRANSITION[action as keyof typeof TRANSITION]
  if (row.status !== t.from) return reply(409, 'This request has already been answered.', { status_now: row.status })

  let requester: Awaited<ReturnType<typeof loadLiveProfile>> = null
  if (action === 'approve') {
    // Sharing needs the same standing as asking: no block either way (fail
    // closed), the requester still a live member, and for contact still a match.
    const blocked = await blockedBetween(admin, me.id, row.requester_profile)
    if (blocked === 'error') return tryAgain()
    if (blocked) return reply(409, 'This request can no longer be approved.')
    requester = await loadLiveProfile(admin, row.requester_profile, false)
    if (requester === 'error') return tryAgain()
    if (!requester) return reply(409, 'This member is no longer available.')
    if (kind === 'contact') {
      const matched = await matchedWith(admin, me.id, row.requester_profile)
      if (matched === 'error') return tryAgain()
      if (!matched) return reply(409, 'Contact details can be shared only with a match.')
    }
  }

  const { data: updated, error: updError } = await admin
    .from(TABLE[kind])
    .update({ status: t.to, decided_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('status', t.from)
    .select('id, status, created_at, decided_at')
    .maybeSingle()
  if (updError) { console.error(`[${kind} requests PATCH] update error:`, updError.message); return tryAgain() }
  if (!updated) return reply(409, 'This request has already been answered.')

  if (action === 'approve' && requester) await notifyRequester(admin, kind, requester.account_id, me)
  return NextResponse.json({ ok: true, request: updated })
}

// ─── DELETE: cancel (requester, while pending) ───────────────────────────────

export async function cancelRequest(kind: RequestKind, id: string): Promise<Response> {
  const session = await getSessionAccount()
  if (!session) return reply(401, 'Unauthorized')
  const refused = refuseWhileImpersonating(session)
  if (refused) return refused
  if (!isUuid(id)) return reply(404, 'Request not found')

  const admin = await createAdminClient()
  const me = await loadMe(admin, session.id)
  if (me === 'error') return tryAgain()
  if (!me) return reply(404, 'Profile not found')

  const { data: deleted, error } = await admin
    .from(TABLE[kind])
    .delete()
    .eq('id', id)
    .eq('requester_profile', me.id)
    .eq('status', 'pending')
    .select('id')
  if (error) return tableMissing(error) ? featureOff() : tryAgain()
  if (!deleted || deleted.length === 0) return reply(409, 'Only a request that is still waiting can be cancelled.')
  return NextResponse.json({ ok: true })
}

// ─── Blocks ──────────────────────────────────────────────────────────────────

/**
 * A block ends every request between the pair, in both directions, at once:
 * approved photos and contact stop being shared, and pending ones close.
 * Missing tables (migration not run) are not an error.
 */
export async function revokeRequestsBetween(admin: any, a: string, b: string): Promise<void> {
  const now = new Date().toISOString()
  await Promise.all((Object.keys(TABLE) as RequestKind[]).map(async kind => {
    const { error } = await admin
      .from(TABLE[kind])
      .update({ status: 'revoked', decided_at: now })
      .in('status', ['pending', 'approved'])
      .or(`and(requester_profile.eq.${a},owner_profile.eq.${b}),and(requester_profile.eq.${b},owner_profile.eq.${a})`)
    if (error && !tableMissing(error)) console.error(`[blocks] revoke ${kind} requests failed:`, error.message)
  }))
}
