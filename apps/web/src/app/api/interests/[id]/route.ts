import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { notify } from '@/lib/notifications'
import { openMatch } from '@/lib/interestMatch'

type Action = 'accept' | 'decline' | 'withdraw'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const action = (body as any)?.action as string | undefined

  if (action !== 'accept' && action !== 'decline' && action !== 'withdraw') {
    return NextResponse.json(
      { ok: false, message: 'action must be accept, decline, or withdraw' },
      { status: 400 },
    )
  }

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

  const { data: interest } = await admin
    .from('interests')
    .select('id, from_profile, to_profile, status')
    .eq('id', id)
    .maybeSingle()

  if (!interest) return NextResponse.json({ ok: false, message: 'Interest not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iv = interest as any

  if (iv.status !== 'sent') {
    return NextResponse.json(
      { ok: false, message: 'Only a pending interest can be responded to or withdrawn' },
      { status: 422 },
    )
  }

  const typedAction = action as Action

  if ((typedAction === 'accept' || typedAction === 'decline') && iv.to_profile !== myId) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
  }

  if (typedAction === 'withdraw' && iv.from_profile !== myId) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
  }

  // Accepting opens a conversation, so the sender must still be a live member
  // and neither side may have blocked the other.
  if (typedAction === 'accept') {
    const [{ data: sender }, { data: blk, error: blkError }] = await Promise.all([
      admin.from('profiles').select('deleted_at, profile_status, accounts!inner(account_status, deleted_at)').eq('id', iv.from_profile).maybeSingle(),
      admin.from('blocks').select('blocker_id')
        .or(`and(blocker_id.eq.${myId},blocked_id.eq.${iv.from_profile}),and(blocker_id.eq.${iv.from_profile},blocked_id.eq.${myId})`)
        .limit(1),
    ])
    // Fail closed: if the block check cannot run, the interest is not accepted.
    if (blkError) {
      console.error('[interests PATCH] blocks query error:', blkError.message)
      return NextResponse.json({ ok: false, message: 'Something went wrong — please try again.' }, { status: 503 })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sp = sender as any
    const acct = Array.isArray(sp?.accounts) ? sp.accounts[0] : sp?.accounts
    if (!sp || sp.deleted_at || sp.profile_status !== 'active' || !acct || acct.deleted_at || acct.account_status !== 'active' || (blk ?? []).length > 0) {
      return NextResponse.json({ ok: false, message: 'This member is no longer available.' }, { status: 410 })
    }
  }

  const newStatus = typedAction === 'accept' ? 'accepted' : typedAction === 'decline' ? 'declined' : 'withdrawn'

  // Guarded on the status still being 'sent': two taps, two tabs, or the
  // sender withdrawing at the same moment must not both win (which would
  // notify twice, or open a conversation for a withdrawn interest).
  const { data: updated, error: updateError } = await admin
    .from('interests')
    .update({ status: newStatus, responded_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'sent')
    .select('id')

  if (updateError) {
    console.error('[interests PATCH] update error:', updateError.message)
    return NextResponse.json({ ok: false, message: 'Failed to update interest' }, { status: 500 })
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json({ ok: false, message: 'This interest was already updated.', code: 'ALREADY_UPDATED' }, { status: 409 })
  }

  // On acceptance, open a conversation between the two profiles so messaging
  // becomes available immediately, and tell both members.
  let conversationId: string | null = null
  if (typedAction === 'accept') {
    conversationId = await openMatch(admin, { id, from_profile: iv.from_profile, to_profile: iv.to_profile })
  }

  if (typedAction === 'decline') {
    const { data: sender } = await admin
      .from('profiles')
      .select('account_id')
      .eq('id', iv.from_profile)
      .maybeSingle()
    if (sender) {
      await notify(admin, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        accountId: (sender as any).account_id,
        type: 'interest_declined',
        icon: 'bell',
        title: 'An update on your interest',
        message: 'One of the interests you sent was not taken forward. New members join every week.',
        ctaLabel: 'Explore Profiles',
        ctaUrl: '/search',
        payload: { interest_id: id },
        dedupeKey: `interest_declined:${id}`,
      })
    }
  }

  return NextResponse.json({ ok: true, conversation_id: conversationId })
}
