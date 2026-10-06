import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { displayName, notify } from '@/lib/notifications'

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

  const newStatus = typedAction === 'accept' ? 'accepted' : typedAction === 'decline' ? 'declined' : 'withdrawn'

  const { error: updateError } = await admin
    .from('interests')
    .update({ status: newStatus, responded_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    console.error('[interests PATCH] update error:', updateError.message)
    return NextResponse.json({ ok: false, message: 'Failed to update interest' }, { status: 500 })
  }

  // On acceptance, open a conversation between the two profiles so messaging
  // becomes available immediately. Canonical ordering (profile_a < profile_b)
  // matches the table CHECK; upsert with ignoreDuplicates = ON CONFLICT DO NOTHING.
  let conversationId: string | null = null
  if (typedAction === 'accept') {
    const a = (iv.from_profile as string) < (iv.to_profile as string) ? iv.from_profile : iv.to_profile
    const b = (iv.from_profile as string) < (iv.to_profile as string) ? iv.to_profile : iv.from_profile

    const { error: convError } = await admin
      .from('conversations')
      .upsert({ profile_a: a, profile_b: b }, { onConflict: 'profile_a,profile_b', ignoreDuplicates: true })

    if (convError) {
      console.error('[interests PATCH] conversation upsert error:', convError.message)
    }

    // Fetch the conversation id (whether just created or pre-existing)
    const { data: conv } = await admin
      .from('conversations')
      .select('id')
      .eq('profile_a', a)
      .eq('profile_b', b)
      .maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conversationId = (conv as any)?.id ?? null
  }

  if (typedAction === 'accept' || typedAction === 'decline') {
    const { data: pair } = await admin
      .from('profiles')
      .select('id, account_id, first_name, last_name')
      .in('id', [iv.from_profile, iv.to_profile])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sender = (pair ?? []).find((r: any) => r.id === iv.from_profile) as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accepter = (pair ?? []).find((r: any) => r.id === iv.to_profile) as any
    const chatUrl = conversationId ? `/messages/${conversationId}` : '/interests?tab=mutual'

    if (sender && typedAction === 'accept') {
      await notify(admin, {
        accountId: sender.account_id,
        type: 'interest_accepted',
        icon: 'heart',
        title: 'Your interest was accepted ❤️',
        message: `${displayName(accepter?.first_name, accepter?.last_name)} accepted your interest. You can now message each other.`,
        ctaLabel: 'View Match',
        ctaUrl: chatUrl,
        payload: { interest_id: id, conversation_id: conversationId },
        dedupeKey: `interest_accepted:${id}`,
      })
    }
    // The member who accepted gets the match too, with the way into the chat.
    if (accepter && sender && typedAction === 'accept') {
      await notify(admin, {
        accountId: accepter.account_id,
        type: 'mutual_match',
        icon: 'heart',
        title: "It's a Match! ❤️",
        message: `You and ${displayName(sender.first_name, sender.last_name)} have expressed mutual interest.`,
        ctaLabel: 'View Match',
        ctaUrl: chatUrl,
        payload: { interest_id: id, conversation_id: conversationId },
        dedupeKey: `mutual_match:${id}`,
      })
    }
    if (sender && typedAction === 'decline') {
      await notify(admin, {
        accountId: sender.account_id,
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
