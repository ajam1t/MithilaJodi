import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { sendOfficialMessage } from '@/lib/officialMessage'

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
  const sent = await sendOfficialMessage(admin, profileId, message)
  if (!sent.ok) return NextResponse.json({ ok: false, message: sent.message }, { status: sent.status })
  const conv = { id: sent.conversationId }

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
