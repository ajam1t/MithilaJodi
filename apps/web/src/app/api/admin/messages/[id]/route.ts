import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

// ── GET: list all messages in a conversation (admin view, includes soft-deleted) ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  const admin = await createAdminClient()

  const { data: convRow } = await admin
    .from('conversations')
    .select('id, profile_a, profile_b, status')
    .eq('id', id)
    .maybeSingle()

  if (!convRow) return NextResponse.json({ ok: false, message: 'Conversation not found' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conv = convRow as any

  // Resolve sender display names
  const profileIds = [...new Set([conv.profile_a as string, conv.profile_b as string])]
  const { data: profRows } = await admin
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', profileIds)
  const nameMap = new Map<string, string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(profRows as any[] ?? []).forEach((p) => {
    nameMap.set(p.id as string, (p.last_name ? `${p.first_name} ${p.last_name}` : p.first_name) as string)
  })

  const { data: msgData, error } = await admin
    .from('messages')
    .select('id, sender_id, body, sent_at, deleted_at')
    .eq('conversation_id', id)
    .order('sent_at', { ascending: true })

  if (error) {
    console.error('[admin/messages/[id] GET] error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages = (msgData as any[] ?? []).map((m) => ({
    id: m.id as string,
    sender_id: m.sender_id as string,
    sender_name: nameMap.get(m.sender_id as string) ?? '—',
    body: m.body as string,
    sent_at: m.sent_at as string,
    is_deleted: m.deleted_at !== null,
  }))

  return NextResponse.json({ ok: true, status: conv.status as string, messages })
}

// ── DELETE: soft-delete a single message (?message_id=) or the whole chat ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  const messageId = request.nextUrl.searchParams.get('message_id')
  const admin = await createAdminClient()
  const now = new Date().toISOString()

  // Soft-delete a single message
  if (messageId) {
    const { error } = await admin
      .from('messages')
      .update({ deleted_at: now })
      .eq('id', messageId)
      .eq('conversation_id', id)

    if (error) {
      console.error('[admin/messages/[id] DELETE message] error:', error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    await admin.from('admin_audit_logs').insert({
      actor_id: session.id,
      action: 'delete_message',
      target_type: 'message',
      target_id: messageId,
      payload: { conversation_id: id, soft: true },
    })

    return NextResponse.json({ ok: true })
  }

  // Soft-delete the whole chat: hide every message and close the conversation.
  // Rows are preserved (recoverable / auditable) — never hard-deleted.
  const { error: msgError } = await admin
    .from('messages')
    .update({ deleted_at: now })
    .eq('conversation_id', id)
    .is('deleted_at', null)

  if (msgError) {
    console.error('[admin/messages/[id] DELETE conv messages] error:', msgError.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const { error: convError } = await admin
    .from('conversations')
    .update({ status: 'closed' })
    .eq('id', id)

  if (convError) {
    console.error('[admin/messages/[id] DELETE conv] error:', convError.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'delete_conversation',
    target_type: 'conversation',
    target_id: id,
    payload: { soft: true },
  })

  return NextResponse.json({ ok: true })
}

// ── PATCH: restore a soft-deleted message ──
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid body' }, { status: 400 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messageId = (body as any)?.message_id as string | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const action = (body as any)?.action as string | undefined

  if (action !== 'restore' || !messageId) {
    return NextResponse.json({ ok: false, message: 'message_id and action=restore required' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('messages')
    .update({ deleted_at: null })
    .eq('id', messageId)
    .eq('conversation_id', id)

  if (error) {
    console.error('[admin/messages/[id] PATCH restore] error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'restore_message',
    target_type: 'message',
    target_id: messageId,
    payload: { conversation_id: id },
  })

  return NextResponse.json({ ok: true })
}
