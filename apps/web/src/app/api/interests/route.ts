import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { getInterestAllowance } from '@/lib/membership'

function toDisplayName(firstName: string, lastName: string | null): string {
  if (lastName) return `${firstName} ${lastName}`
  return firstName
}

/** Age in whole years from a YYYY-MM-DD dob string (dob itself is never returned). */
function computeAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export async function GET() {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  const { data: myProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', session.id)
    .is('deleted_at', null)
    .neq('profile_status', 'deleted')
    .limit(1)
    .maybeSingle()

  if (!myProfile) return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myId = (myProfile as any).id as string

  const [receivedRes, sentRes, mutualRes] = await Promise.all([
    admin
      .from('interests')
      .select('id, from_profile, to_profile, status, message, sent_at, responded_at')
      .eq('to_profile', myId)
      .eq('status', 'sent'),
    admin
      .from('interests')
      .select('id, from_profile, to_profile, status, message, sent_at, responded_at')
      .eq('from_profile', myId),
    admin
      .from('interests')
      .select('id, from_profile, to_profile, status, message, sent_at, responded_at')
      .eq('status', 'accepted')
      .or(`from_profile.eq.${myId},to_profile.eq.${myId}`),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const received: any[] = receivedRes.data ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sent: any[] = sentRes.data ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mutual: any[] = mutualRes.data ?? []

  const otherIds = new Set<string>()
  for (const r of received) otherIds.add(r.from_profile as string)
  for (const s of sent) otherIds.add(s.to_profile as string)
  for (const m of mutual) {
    otherIds.add(m.from_profile === myId ? m.to_profile : m.from_profile)
  }

  // ── Batch-fetch display data for the other profiles ──
  type OtherProfile = {
    id: string
    display_name: string
    age: number | null
    gender: string
    caste: string | null
    current_loc_name: string | null
    photo_url: string | null
  }
  const profileMap = new Map<string, OtherProfile>()

  if (otherIds.size > 0) {
    const idList = [...otherIds]
    const { data: rows } = await admin
      .from('profiles')
      .select('id, first_name, last_name, dob, gender, caste, current_loc_id')
      .in('id', idList)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileRows: any[] = rows ?? []

    // Resolve location names
    const locIds = new Set<number>()
    for (const r of profileRows) if (r.current_loc_id != null) locIds.add(r.current_loc_id as number)
    const locMap = new Map<number, string>()
    if (locIds.size > 0) {
      const { data: locRows } = await admin
        .from('india_locations')
        .select('id, name_en')
        .in('id', [...locIds])
      for (const l of (locRows ?? [])) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loc = l as any
        locMap.set(loc.id as number, loc.name_en as string)
      }
    }

    // Primary approved photos → signed URLs
    const { data: photoRows } = await admin
      .from('profile_photos')
      .select('profile_id, storage_path')
      .in('profile_id', idList)
      .eq('is_primary', true)
      .eq('status', 'approved')
    const pathByProfile = new Map<string, string>()
    for (const ph of (photoRows ?? [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = ph as any
      if (!pathByProfile.has(p.profile_id as string)) pathByProfile.set(p.profile_id as string, p.storage_path as string)
    }
    const signedByProfile = new Map<string, string | null>()
    for (const [pid, path] of pathByProfile.entries()) {
      try {
        const { data: signed } = await admin.storage.from('profile-photos').createSignedUrl(path, 3600)
        signedByProfile.set(pid, signed?.signedUrl ?? null)
      } catch {
        signedByProfile.set(pid, null)
      }
    }

    for (const r of profileRows) {
      profileMap.set(r.id as string, {
        id: r.id as string,
        display_name: toDisplayName(r.first_name as string, (r.last_name as string | null) ?? null),
        age: r.dob ? computeAge(r.dob as string) : null,
        gender: r.gender as string,
        caste: (r.caste as string | null) ?? null,
        current_loc_name: r.current_loc_id != null ? (locMap.get(r.current_loc_id as number) ?? null) : null,
        photo_url: signedByProfile.get(r.id as string) ?? null,
      })
    }
  }

  const fallback = (id: string): OtherProfile => ({
    id, display_name: 'Member', age: null, gender: '', caste: null, current_loc_name: null, photo_url: null,
  })

  // Map partner profile id → conversation id (for mutual matches, so the UI can
  // link straight into the chat thread).
  const convByPartner = new Map<string, string>()
  if (mutual.length > 0) {
    const { data: convRows } = await admin
      .from('conversations')
      .select('id, profile_a, profile_b')
      .or(`profile_a.eq.${myId},profile_b.eq.${myId}`)
    for (const c of (convRows ?? [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cv = c as any
      const partnerId = cv.profile_a === myId ? cv.profile_b : cv.profile_a
      convByPartner.set(partnerId as string, cv.id as string)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function toCard(interest: any, otherProfileId: string) {
    return {
      interest_id: interest.id as string,
      status: interest.status as string,
      created_at: (interest.sent_at ?? interest.responded_at) as string,
      message: (interest.message ?? null) as string | null,
      conversation_id: convByPartner.get(otherProfileId) ?? null,
      profile: profileMap.get(otherProfileId) ?? fallback(otherProfileId),
    }
  }

  return NextResponse.json({
    ok: true,
    received: received.map((r) => toCard(r, r.from_profile)),
    sent: sent.map((s) => toCard(s, s.to_profile)),
    mutual: mutual.map((m) => toCard(m, m.from_profile === myId ? m.to_profile : m.from_profile)),
  })
}

export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { to_profile_id, message } = body as any

  if (!to_profile_id || typeof to_profile_id !== 'string') {
    return NextResponse.json({ ok: false, message: 'to_profile_id is required' }, { status: 400 })
  }

  // Interest allowance gate — enforced server-side
  const allowance = await getInterestAllowance(session.id)
  if (!allowance.allowed) {
    if (allowance.reason === 'limit_reached') {
      return NextResponse.json(
        {
          ok: false,
          message: `You have used all ${allowance.limit} interests for this membership year.`,
          code: 'INTEREST_LIMIT_REACHED',
          remaining: 0,
        },
        { status: 429 },
      )
    }
    return NextResponse.json(
      { ok: false, message: 'A paid membership is required to send interests', code: 'NO_MEMBERSHIP' },
      { status: 403 },
    )
  }

  const admin = await createAdminClient()

  const { data: myProfile } = await admin
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('account_id', session.id)
    .is('deleted_at', null)
    .neq('profile_status', 'deleted')
    .limit(1)
    .maybeSingle()

  if (!myProfile) return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const me = myProfile as any

  if (me.id === to_profile_id) {
    return NextResponse.json({ ok: false, message: 'Cannot send interest to yourself' }, { status: 400 })
  }

  const { data: targetProfile } = await admin
    .from('profiles')
    .select('id, account_id, profile_status, discoverable')
    .eq('id', to_profile_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!targetProfile) return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target = targetProfile as any

  // `discoverable` is false for any profile set to 'private', so this one
  // condition covers the private case too.
  if (target.profile_status !== 'active' || !target.discoverable) {
    return NextResponse.json({ ok: false, message: 'This profile is not available' }, { status: 422 })
  }

  const { data: blockRow } = await admin
    .from('blocks')
    .select('blocker_id')
    .or(
      `and(blocker_id.eq.${me.id},blocked_id.eq.${to_profile_id}),and(blocker_id.eq.${to_profile_id},blocked_id.eq.${me.id})`,
    )
    .limit(1)
    .maybeSingle()

  if (blockRow) {
    return NextResponse.json({ ok: false, message: 'Unable to send interest' }, { status: 422 })
  }

  // Cap free-text message length to prevent oversized/garbage storage.
  const cleanMessage =
    typeof message === 'string' && message.trim().length > 0
      ? message.trim().slice(0, 500)
      : null

  const { data: newInterest, error: insertError } = await admin
    .from('interests')
    .insert({
      from_profile: me.id,
      to_profile: to_profile_id,
      status: 'sent',
      message: cleanMessage,
    })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      // A row already exists (UNIQUE from_profile+to_profile). If the prior
      // interest was declined or withdrawn, allow the sender to re-send by
      // resetting it to 'sent'. If it is still pending or accepted, block.
      const { data: existing } = await admin
        .from('interests')
        .select('id, status')
        .eq('from_profile', me.id)
        .eq('to_profile', to_profile_id)
        .maybeSingle()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ex = existing as any
      if (ex && (ex.status === 'declined' || ex.status === 'withdrawn')) {
        const { data: revived, error: reviveError } = await admin
          .from('interests')
          .update({ status: 'sent', message: cleanMessage, responded_at: null, sent_at: new Date().toISOString() })
          .eq('id', ex.id)
          .select('id')
          .single()

        if (reviveError || !revived) {
          console.error('[interests POST] revive error:', reviveError?.message)
          return NextResponse.json({ ok: false, message: 'Failed to send interest' }, { status: 500 })
        }

        // Increment interests_sent counter when plan has a limit
        if (allowance.membershipId && allowance.limit !== null) {
          await admin
            .from('memberships')
            .update({ interests_sent: (allowance.remaining !== null ? allowance.limit - allowance.remaining : 0) + 1 })
            .eq('id', allowance.membershipId)
        }

        await admin.from('notifications').insert({
          account_id: target.account_id,
          type: 'interest_received',
          payload: {
            from_profile_id: me.id,
            from_name: toDisplayName(me.first_name, me.last_name ?? null),
          },
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ ok: true, interest_id: (revived as any).id }, { status: 201 })
      }

      return NextResponse.json({ ok: false, message: 'Interest already sent' }, { status: 409 })
    }
    console.error('[interests POST] insert error:', insertError.message)
    return NextResponse.json({ ok: false, message: 'Failed to send interest' }, { status: 500 })
  }

  // Increment interests_sent counter when plan has a limit
  if (allowance.membershipId && allowance.limit !== null) {
    await admin
      .from('memberships')
      .update({ interests_sent: (allowance.remaining !== null ? allowance.limit - allowance.remaining : 0) + 1 })
      .eq('id', allowance.membershipId)
  }

  await admin.from('notifications').insert({
    account_id: target.account_id,
    type: 'interest_received',
    payload: {
      from_profile_id: me.id,
      from_name: toDisplayName(me.first_name, me.last_name ?? null),
    },
  })

  return NextResponse.json({
    ok: true,
    interest_id: newInterest.id,
    remaining: allowance.remaining !== null ? allowance.remaining - 1 : null,
  }, { status: 201 })
}
