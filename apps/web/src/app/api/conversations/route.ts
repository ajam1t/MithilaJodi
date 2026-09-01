import 'server-only'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

function toDisplayName(firstName: string, lastName: string | null): string {
  if (lastName) return `${firstName} ${lastName}`
  return firstName
}

export async function GET() {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

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

  // Step 4: fetch open conversations for my profile
  const { data: convsData } = await admin
    .from('conversations')
    .select('id, profile_a, profile_b, status, created_at, updated_at')
    .or(`profile_a.eq.${myProfileId},profile_b.eq.${myProfileId}`)
    .eq('status', 'open')
    .order('updated_at', { ascending: false })
    .limit(50)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convs: any[] = convsData ?? []

  if (convs.length === 0) {
    return NextResponse.json({ ok: true, conversations: [] })
  }

  // Step 5: determine partner profile IDs
  const convIds = convs.map((c) => c.id as string)
  const partnerIds = convs.map((c) =>
    (c.profile_a as string) === myProfileId ? (c.profile_b as string) : (c.profile_a as string),
  )
  const uniquePartnerIds = [...new Set(partnerIds)]

  // Step 6: batch-fetch partner names
  const { data: partnerProfilesData } = await admin
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', uniquePartnerIds)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const partnerProfiles: any[] = partnerProfilesData ?? []
  const profileMap = new Map<string, { first_name: string; last_name: string | null }>()
  for (const p of partnerProfiles) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = p as any
    profileMap.set(row.id as string, {
      first_name: row.first_name as string,
      last_name: (row.last_name as string | null) ?? null,
    })
  }

  // Step 7: batch-fetch primary approved photos for partner profiles
  const { data: photosData } = await admin
    .from('profile_photos')
    .select('profile_id, storage_path')
    .eq('is_primary', true)
    .eq('status', 'approved')
    .in('profile_id', uniquePartnerIds)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const photos: any[] = photosData ?? []
  const photoUrlMap = new Map<string, string>()
  await Promise.all(
    photos.map(async (photo) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = photo as any
      const profileId = row.profile_id as string
      const storagePath = row.storage_path as string
      const { data: signedData } = await admin.storage
        .from('profile-photos')
        .createSignedUrl(storagePath, 3600)
      if (signedData?.signedUrl) {
        photoUrlMap.set(profileId, signedData.signedUrl)
      }
    }),
  )

  // Step 8: batch-fetch last message per conversation
  const { data: allMessagesData } = await admin
    .from('messages')
    .select('id, conversation_id, sender_id, body, sent_at')
    .is('deleted_at', null)
    .in('conversation_id', convIds)
    .order('sent_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allMessages: any[] = allMessagesData ?? []
  const lastMessageMap = new Map<string, { id: string; body: string; sent_at: string; sender_id: string }>()
  for (const msg of allMessages) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = msg as any
    const convId = m.conversation_id as string
    if (!lastMessageMap.has(convId)) {
      lastMessageMap.set(convId, {
        id: m.id as string,
        body: m.body as string,
        sent_at: m.sent_at as string,
        sender_id: m.sender_id as string,
      })
    }
  }

  // Step 9: batch-fetch unread counts
  const { data: unreadData } = await admin
    .from('messages')
    .select('conversation_id')
    .is('deleted_at', null)
    .is('read_at', null)
    .neq('sender_id', myProfileId)
    .in('conversation_id', convIds)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unreadRows: any[] = unreadData ?? []
  const unreadCountMap = new Map<string, number>()
  for (const row of unreadRows) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any
    const cid = r.conversation_id as string
    unreadCountMap.set(cid, (unreadCountMap.get(cid) ?? 0) + 1)
  }

  // Step 10: assemble response
  const conversations = convs.map((conv, idx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = conv as any
    const partnerId = partnerIds[idx]
    const profileInfo = profileMap.get(partnerId)
    const lastMsg = lastMessageMap.get(c.id as string) ?? null

    return {
      id: c.id as string,
      partner: {
        id: partnerId,
        display_name: profileInfo
          ? toDisplayName(profileInfo.first_name, profileInfo.last_name)
          : null,
        photo_url: photoUrlMap.get(partnerId) ?? null,
      },
      last_message: lastMsg
        ? {
            body: lastMsg.body,
            sent_at: lastMsg.sent_at,
            is_mine: lastMsg.sender_id === myProfileId,
          }
        : null,
      unread_count: unreadCountMap.get(c.id as string) ?? 0,
      updated_at: c.updated_at as string,
    }
  })

  return NextResponse.json({ ok: true, conversations })
}
