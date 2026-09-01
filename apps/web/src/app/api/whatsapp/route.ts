import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { findOwnProfileId } from '@/lib/ownProfile'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Privacy-first WhatsApp connection.
 *
 * A mobile number is revealed ONLY when all of these hold:
 *   • the two profiles have a mutually ACCEPTED interest,
 *   • the number's owner has opted in to WhatsApp sharing, and
 *   • the owner has explicitly APPROVED that specific requester.
 *
 * Numbers are never returned for pending, declined or revoked requests, and
 * never appear in any public projection.
 */

/** Do these two profiles have an accepted interest in either direction? */
async function hasAcceptedInterest(admin: any, a: string, b: string): Promise<boolean> {
  const { data } = await admin
    .from('interests')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(from_profile.eq.${a},to_profile.eq.${b}),and(from_profile.eq.${b},to_profile.eq.${a})`)
    .limit(1)
  return Array.isArray(data) && data.length > 0
}

// ── GET: my WhatsApp state ──────────────────────────────────────────────────
export async function GET() {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const myProfileId = await findOwnProfileId(admin, session.id)
  if (!myProfileId) {
    return NextResponse.json({ ok: true, optIn: false, incoming: [], outgoing: [] })
  }

  const { data: acct } = await admin
    .from('accounts')
    .select('whatsapp_opt_in')
    .eq('id', session.id)
    .maybeSingle()

  // Requests where I must approve/decline.
  const { data: incomingRows } = await admin
    .from('whatsapp_requests')
    .select('id, requester_profile_id, status, requested_at')
    .eq('owner_profile_id', myProfileId)
    .order('requested_at', { ascending: false })

  // Requests I have made.
  const { data: outgoingRows } = await admin
    .from('whatsapp_requests')
    .select('id, owner_profile_id, status, requested_at')
    .eq('requester_profile_id', myProfileId)
    .order('requested_at', { ascending: false })

  const incoming: any[] = incomingRows ?? []
  const outgoing: any[] = outgoingRows ?? []

  // Names for display (no contact details).
  const ids = [
    ...incoming.map((r) => r.requester_profile_id),
    ...outgoing.map((r) => r.owner_profile_id),
  ]
  const nameById = new Map<string, string>()
  if (ids.length > 0) {
    const { data: profs } = await admin
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', [...new Set(ids)])
    for (const p of (profs ?? []) as any[]) {
      nameById.set(p.id, [p.first_name, p.last_name].filter(Boolean).join(' '))
    }
  }

  // Reveal the number ONLY for approved outgoing requests.
  const approvedOwnerIds = outgoing.filter((r) => r.status === 'approved').map((r) => r.owner_profile_id)
  const numberByProfile = new Map<string, string>()
  if (approvedOwnerIds.length > 0) {
    const { data: owners } = await admin
      .from('profiles')
      .select('id, account_id')
      .in('id', approvedOwnerIds)
    const acctIds = (owners ?? []).map((o: any) => o.account_id)
    const { data: accts } = await admin
      .from('accounts')
      .select('id, mobile, whatsapp_opt_in')
      .in('id', acctIds)
    const mobileByAccount = new Map<string, { mobile: string; optIn: boolean }>()
    for (const a of (accts ?? []) as any[]) {
      mobileByAccount.set(a.id, { mobile: a.mobile, optIn: a.whatsapp_opt_in === true })
    }
    for (const o of (owners ?? []) as any[]) {
      const rec = mobileByAccount.get(o.account_id)
      // Opting out withdraws sharing even if an old approval exists.
      if (rec?.optIn && rec.mobile) numberByProfile.set(o.id, rec.mobile)
    }
  }

  return NextResponse.json({
    ok: true,
    optIn: (acct as any)?.whatsapp_opt_in === true,
    incoming: incoming.map((r) => ({
      id: r.id,
      profileId: r.requester_profile_id,
      name: nameById.get(r.requester_profile_id) ?? 'A member',
      status: r.status,
      requestedAt: r.requested_at,
    })),
    outgoing: outgoing.map((r) => ({
      id: r.id,
      profileId: r.owner_profile_id,
      name: nameById.get(r.owner_profile_id) ?? 'A member',
      status: r.status,
      requestedAt: r.requested_at,
      // present only when approved AND the owner is still opted in
      whatsappNumber: r.status === 'approved' ? numberByProfile.get(r.owner_profile_id) ?? null : null,
    })),
  })
}

// ── POST: request WhatsApp contact from a member ────────────────────────────
const RequestSchema = z.object({ to_profile_id: z.string().uuid() })

export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'A valid profile is required' }, { status: 422 })
  }
  const ownerProfileId = parsed.data.to_profile_id

  const admin = await createAdminClient()
  const myProfileId = await findOwnProfileId(admin, session.id)
  if (!myProfileId) {
    return NextResponse.json({ ok: false, message: 'Create your profile first' }, { status: 422 })
  }
  if (myProfileId === ownerProfileId) {
    return NextResponse.json({ ok: false, message: 'That is your own profile' }, { status: 422 })
  }

  // Gate: only after an interest between the two has been accepted.
  if (!(await hasAcceptedInterest(admin, myProfileId, ownerProfileId))) {
    return NextResponse.json(
      { ok: false, message: 'You can request WhatsApp only after an interest has been accepted.' },
      { status: 403 }
    )
  }

  // Blocked either way → no contact requests.
  const { data: blocks } = await admin
    .from('blocks')
    .select('blocker_id')
    .or(`and(blocker_id.eq.${myProfileId},blocked_id.eq.${ownerProfileId}),and(blocker_id.eq.${ownerProfileId},blocked_id.eq.${myProfileId})`)
    .limit(1)
  if (Array.isArray(blocks) && blocks.length > 0) {
    return NextResponse.json({ ok: false, message: 'This request is not available' }, { status: 403 })
  }

  // Re-requesting after a decline resets to pending; an existing approval stands.
  const { data: existing } = await admin
    .from('whatsapp_requests')
    .select('id, status')
    .eq('requester_profile_id', myProfileId)
    .eq('owner_profile_id', ownerProfileId)
    .limit(1)
    .maybeSingle()

  if (existing) {
    const status = (existing as any).status as string
    if (status === 'approved') {
      return NextResponse.json({ ok: true, status: 'approved', message: 'Already approved' })
    }
    const { error } = await admin
      .from('whatsapp_requests')
      .update({ status: 'pending', requested_at: new Date().toISOString(), responded_at: null, revoked_at: null })
      .eq('id', (existing as any).id)
    if (error) {
      console.error('[whatsapp POST] update:', error.message)
      return NextResponse.json({ ok: false, message: 'Could not send the request' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, status: 'pending' })
  }

  const { error } = await admin.from('whatsapp_requests').insert({
    requester_profile_id: myProfileId,
    owner_profile_id: ownerProfileId,
    status: 'pending',
  })
  if (error) {
    console.error('[whatsapp POST] insert:', error.message)
    return NextResponse.json({ ok: false, message: 'Could not send the request' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, status: 'pending' })
}

// ── PATCH: toggle my own WhatsApp opt-in ────────────────────────────────────
const OptInSchema = z.object({ opt_in: z.boolean() })

export async function PATCH(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }
  const parsed = OptInSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'opt_in must be true or false' }, { status: 422 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('accounts')
    .update({ whatsapp_opt_in: parsed.data.opt_in })
    .eq('id', session.id)
  if (error) {
    console.error('[whatsapp PATCH] opt-in:', error.message)
    return NextResponse.json({ ok: false, message: 'Could not update the setting' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, optIn: parsed.data.opt_in })
}
