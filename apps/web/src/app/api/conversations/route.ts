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
  if (photos.length > 0) {
    // One batched sign call instead of one round trip per partner photo.
    const paths = photos.map((photo) => (photo as { storage_path: string }).storage_path)
    const { data: signedList } = await admin.storage
      .from('profile-photos')
      .createSignedUrls(paths, 3600)
    signedList?.forEach((signed, i) => {
      if (!signed.signedUrl) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      photoUrlMap.set((photos[i] as any).profile_id as string, signed.signedUrl)
    })
  }

  // Step 8: last message per conversation.
  //
  // This used to fetch EVERY message body across all 50 conversations just to
  // read the newest one from each — an unbounded transfer that grows with chat
  // history. Instead take a bounded newest-first window (enough to cover the
  // common case in one round trip), then backfill only the conversations the
  // window happened to miss because a single busy thread dominated it.
  const MESSAGE_WINDOW = 300
  const { data: allMessagesData } = await admin
    .from('messages')
    .select('id, conversation_id, sender_id, body, sent_at')
    .is('deleted_at', null)
    .in('conversation_id', convIds)
    .order('sent_at', { ascending: false })
    .limit(MESSAGE_WINDOW)

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

  // Backfill any conversation the bounded window missed. Normally empty.
  const missing = convIds.filter((id) => !lastMessageMap.has(id))
  if (missing.length > 0) {
    await Promise.all(
      missing.map(async (cid) => {
        const { data } = await admin
          .from('messages')
          .select('id, conversation_id, sender_id, body, sent_at')
          .is('deleted_at', null)
          .eq('conversation_id', cid)
          .order('sent_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!data) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = data as any
        lastMessageMap.set(cid, {
          id: m.id as string,
          body: m.body as string,
          sent_at: m.sent_at as string,
          sender_id: m.sender_id as string,
        })
      }),
    )
  }

  // Step 9: unread counts.
  //
  // Also bounded: a badge only needs to distinguish 0 / n / "lots", so cap the
  // scan rather than streaming every unread row for an abandoned inbox.
  const UNREAD_SCAN_CAP = 500
  const { data: unreadData } = await admin
    .from('messages')
    .select('conversation_id')
    .is('deleted_at', null)
    .is('read_at', null)
    .neq('sender_id', myProfileId)
    .in('conversation_id', convIds)
    .limit(UNREAD_SCAN_CAP)

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
