import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { hasFeatureAccess } from '@/lib/membership'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Step 1: auth
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  // Step 2: feature access gate (open to all members while the platform is free)
  if (!(await hasFeatureAccess(session.id))) {
    return NextResponse.json(
      { ok: false, message: 'An active membership is required to send messages' },
      { status: 403 },
    )
  }

  const { id } = await params

  const admin = await createAdminClient()

  // Step 3: get my profile ID
  const { data: myProfileRow } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', session.id)
    .neq('profile_status', 'deleted')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!myProfileRow) return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myProfileId = (myProfileRow as any).id as string

  // Step 4: fetch the conversation
  const { data: convRow } = await admin
    .from('conversations')
    .select('id, profile_a, profile_b, status')
    .eq('id', id)
    .maybeSingle()

  if (!convRow) return NextResponse.json({ ok: false, message: 'Conversation not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conv = convRow as any

  if ((conv.profile_a as string) !== myProfileId && (conv.profile_b as string) !== myProfileId) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
  }

  // Step 5: check conversation is open
  if ((conv.status as string) !== 'open') {
    return NextResponse.json({ ok: false, message: 'Conversation is closed' }, { status: 403 })
  }

  // Step 5b: defence-in-depth — refuse if either party has blocked the other,
  // even if the conversation status was somehow left 'open'.
  const partnerId =
    (conv.profile_a as string) === myProfileId
      ? (conv.profile_b as string)
      : (conv.profile_a as string)

  const { data: blockRow } = await admin
    .from('blocks')
    .select('blocker_id')
    .or(
      `and(blocker_id.eq.${myProfileId},blocked_id.eq.${partnerId}),and(blocker_id.eq.${partnerId},blocked_id.eq.${myProfileId})`,
    )
    .limit(1)
    .maybeSingle()

  if (blockRow) {
    return NextResponse.json({ ok: false, message: 'Conversation is closed' }, { status: 403 })
  }

  // Step 6: parse and validate body
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bodyText = (rawBody as any)?.body

  if (typeof bodyText !== 'string') {
    return NextResponse.json({ ok: false, message: 'body must be a string' }, { status: 400 })
  }

  const trimmed = bodyText.trim()

  if (trimmed.length < 1) {
    return NextResponse.json({ ok: false, message: 'Message cannot be empty' }, { status: 400 })
  }

  if (trimmed.length > 2000) {
    return NextResponse.json(
      { ok: false, message: 'Message cannot exceed 2000 characters' },
      { status: 400 },
    )
  }

  // Step 7: insert message
  const { data: newMsgRow, error: insertError } = await admin
    .from('messages')
    .insert({ conversation_id: id, sender_id: myProfileId, body: trimmed })
    .select('id, sent_at')
    .maybeSingle()

  if (insertError || !newMsgRow) {
    console.error('[conversations/[id]/messages POST] insert error:', insertError?.message)
    return NextResponse.json({ ok: false, message: 'Failed to send message' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newMsg = newMsgRow as any

  // Step 8: update conversation updated_at
  await admin
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id)

  // Step 9: notify the partner
  const { data: partnerRow } = await admin
    .from('profiles')
    .select('account_id')
    .eq('id', partnerId)
    .maybeSingle()

  if (partnerRow) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partnerAccountId = (partnerRow as any).account_id as string
    await admin.from('notifications').insert({
      account_id: partnerAccountId,
      type: 'new_message',
      payload: { conversation_id: id, preview: trimmed.slice(0, 80) },
    })
  }

  // Step 10: return
  return NextResponse.json({
    ok: true,
    message: {
      id: newMsg.id as string,
      body: trimmed,
      sent_at: newMsg.sent_at as string,
      is_mine: true,
    },
  }, { status: 201 })
}
