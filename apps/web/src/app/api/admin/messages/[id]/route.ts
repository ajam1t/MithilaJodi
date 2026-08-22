import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

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

  if (messageId) {
    const { error } = await admin
      .from('messages')
      .delete()
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
      payload: { conversation_id: id },
    })

    return NextResponse.json({ ok: true })
  }

  const { error: msgError } = await admin
    .from('messages')
    .delete()
    .eq('conversation_id', id)

  if (msgError) {
    console.error('[admin/messages/[id] DELETE conv messages] error:', msgError.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const { error: convError } = await admin
    .from('conversations')
    .delete()
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
    payload: {},
  })

  return NextResponse.json({ ok: true })
}
