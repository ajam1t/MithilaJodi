import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { markConversationNotificationsRead } from '@/lib/notifications'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Step 1: auth
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const admin = await createAdminClient()

  // Step 2: get my profile ID
  const { data: myProfileRow } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', session.id)
    .neq('profile_status', 'deleted')
    .is('deleted_at', null)
    .maybeSingle()

  if (!myProfileRow) return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myProfileId = (myProfileRow as any).id as string

  // Step 3: fetch the conversation
  const { data: convRow } = await admin
    .from('conversations')
    .select('id, profile_a, profile_b, status')
    .eq('id', id)
    .maybeSingle()

  if (!convRow) return NextResponse.json({ ok: false, message: 'Conversation not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conv = convRow as any

  // Verify membership in conversation
  if ((conv.profile_a as string) !== myProfileId && (conv.profile_b as string) !== myProfileId) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
  }

  // Step 4: mark all unread messages from partner as read
  await admin
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
    .neq('sender_id', myProfileId)
    .eq('conversation_id', id)
  await markConversationNotificationsRead(admin, session.id, id)

  // Step 5: return
  return NextResponse.json({ ok: true })
}
