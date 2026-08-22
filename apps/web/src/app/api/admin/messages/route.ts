import 'server-only'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

export async function GET() {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const admin = await createAdminClient()

  const { data: convsData, error } = await admin
    .from('conversations')
    .select('id, profile_a, profile_b, status, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[admin/messages GET] error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convs: any[] = convsData ?? []

  if (convs.length === 0) {
    return NextResponse.json({ ok: true, conversations: [] })
  }

  const profileIds = [...new Set([
    ...convs.map((c) => c.profile_a as string),
    ...convs.map((c) => c.profile_b as string),
  ])]

  const { data: profilesData } = await admin
    .from('profiles')
    .select('id, first_name, last_name, accounts(mobile)')
    .in('id', profileIds)

  const profileMap = new Map<string, { display_name: string; mobile: string | null }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(profilesData as any[] ?? []).forEach((p) => {
    const name = p.last_name ? `${p.first_name} ${p.last_name}` : p.first_name
    profileMap.set(p.id as string, {
      display_name: name as string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mobile: (p.accounts as any)?.mobile ?? null,
    })
  })

  const convIds = convs.map((c) => c.id as string)

  const { data: allMsgData } = await admin
    .from('messages')
    .select('conversation_id, body, sent_at')
    .in('conversation_id', convIds)
    .is('deleted_at', null)
    .order('sent_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msgs: any[] = allMsgData ?? []

  const msgCountMap = new Map<string, number>()
  const lastMsgMap = new Map<string, { body: string; sent_at: string }>()
  for (const m of msgs) {
    const cid = m.conversation_id as string
    msgCountMap.set(cid, (msgCountMap.get(cid) ?? 0) + 1)
    if (!lastMsgMap.has(cid)) {
      lastMsgMap.set(cid, { body: m.body as string, sent_at: m.sent_at as string })
    }
  }

  const conversations = convs.map((c) => {
    const pa = profileMap.get(c.profile_a as string)
    const pb = profileMap.get(c.profile_b as string)
    return {
      id: c.id as string,
      created_at: c.created_at as string,
      updated_at: c.updated_at as string,
      status: c.status as string,
      profile_a: { id: c.profile_a as string, display_name: pa?.display_name ?? null, mobile: pa?.mobile ?? null },
      profile_b: { id: c.profile_b as string, display_name: pb?.display_name ?? null, mobile: pb?.mobile ?? null },
      message_count: msgCountMap.get(c.id as string) ?? 0,
      last_message: lastMsgMap.get(c.id as string) ?? null,
    }
  })

  return NextResponse.json({ ok: true, conversations })
}
