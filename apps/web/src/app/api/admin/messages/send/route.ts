import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { getSystemProfileId } from '@/lib/systemProfile'

/**
 * Send a message to a member as the official "Mithila Jodi" identity.
 *
 * For things like asking someone to add a profile photograph, where an email or
 * an SMS is heavier than the request warrants and the member is already used to
 * checking their Mithila Jodi inbox.
 *
 * It writes through the same `conversations` and `messages` tables a member
 * message uses, so the member's inbox, the thread view, unread counts and the
 * existing admin moderation view at /admin/messages all handle it with no
 * changes. The member can reply, and that reply lands in the same conversation.
 *
 * What it deliberately does not do:
 *  - It does not bypass a block. If the member has blocked the platform profile
 *    they have said they do not want these, and that is respected.
 *  - It is one recipient per call. A bulk broadcast is a different feature with
 *    different consent questions, and building the loop here would make it one
 *    accidental for-loop away from mass-messaging every member.
 */

const MAX_BODY = 2000

export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  const { profileId, body } = (raw ?? {}) as { profileId?: unknown; body?: unknown }

  if (typeof profileId !== 'string' || profileId.length < 10) {
    return NextResponse.json({ ok: false, message: 'profileId is required' }, { status: 400 })
  }
  if (typeof body !== 'string') {
    return NextResponse.json({ ok: false, message: 'body must be a string' }, { status: 400 })
  }
  const message = body.trim()
  if (message.length === 0) {
    return NextResponse.json({ ok: false, message: 'Message cannot be empty' }, { status: 400 })
  }
  if (message.length > MAX_BODY) {
    return NextResponse.json(
      { ok: false, message: `Message must be ${MAX_BODY} characters or fewer` },
      { status: 400 },
    )
  }

  const admin = await createAdminClient()

  const systemProfileId = await getSystemProfileId(admin)
  if (!systemProfileId) {
    // A missing seed is an operator problem, not a bad request — say so plainly.
    console.error('[admin/messages/send] system profile missing — run migration 20260912000001')
    return NextResponse.json(
      { ok: false, message: 'The Mithila Jodi profile is missing. Run migration 20260912000001.' },
      { status: 500 },
    )
  }

  if (profileId === systemProfileId) {
    return NextResponse.json(
      { ok: false, message: 'Cannot message the platform profile.' },
      { status: 400 },
    )
  }

  // The recipient must be a real, live profile.
  const { data: recipient } = await admin
    .from('profiles')
    .select('id, first_name, profile_status')
    .eq('id', profileId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!recipient) {
    return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })
  }
  if ((recipient.profile_status as string) === 'deleted') {
    return NextResponse.json({ ok: false, message: 'Profile is deleted' }, { status: 404 })
  }

  // A member who blocked the platform profile has opted out of these.
  const { data: blocked } = await admin
    .from('blocks')
    .select('blocker_id')
    .or(
      `and(blocker_id.eq.${profileId},blocked_id.eq.${systemProfileId}),` +
      `and(blocker_id.eq.${systemProfileId},blocked_id.eq.${profileId})`,
    )
    .limit(1)
    .maybeSingle()

  if (blocked) {
    return NextResponse.json(
      { ok: false, message: 'This member has blocked messages from Mithila Jodi.' },
      { status: 403 },
    )
  }

  // Canonical ordering (profile_a < profile_b) matches the table CHECK and the
  // unique constraint the interest-accept path upserts against, so an admin
  // message and a member message resolve to the same conversation row.
  const a = systemProfileId < profileId ? systemProfileId : profileId
  const b = systemProfileId < profileId ? profileId : systemProfileId

  const { error: convError } = await admin
    .from('conversations')
    .upsert({ profile_a: a, profile_b: b }, { onConflict: 'profile_a,profile_b', ignoreDuplicates: true })

  if (convError) {
    console.error('[admin/messages/send] conversation upsert error:', convError.message)
    return NextResponse.json({ ok: false, message: 'Could not open the conversation.' }, { status: 500 })
  }

  const { data: conv } = await admin
    .from('conversations')
    .select('id, status')
    .eq('profile_a', a)
    .eq('profile_b', b)
    .maybeSingle()

  if (!conv) {
    console.error('[admin/messages/send] conversation missing after upsert')
    return NextResponse.json({ ok: false, message: 'Could not open the conversation.' }, { status: 500 })
  }

  // A conversation previously closed by a block that has since been lifted would
  // otherwise reject the member's reply.
  if ((conv.status as string) !== 'open') {
    await admin.from('conversations').update({ status: 'open' }).eq('id', conv.id)
  }

  const { error: insertError } = await admin
    .from('messages')
    .insert({ conversation_id: conv.id, sender_id: systemProfileId, body: message })

  if (insertError) {
    console.error('[admin/messages/send] insert error:', insertError.message)
    return NextResponse.json({ ok: false, message: 'Could not send the message.' }, { status: 500 })
  }

  await admin.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conv.id)

  // Audited like every other admin action. The body is recorded so there is a
  // record of what members were actually told.
  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'send_official_message',
    target_type: 'profile',
    target_id: profileId,
    payload: { conversation_id: conv.id, body: message },
    ip_address: request.headers.get('x-forwarded-for') ?? null,
    user_agent: request.headers.get('user-agent') ?? null,
  })

  return NextResponse.json({ ok: true, conversationId: conv.id })
}
