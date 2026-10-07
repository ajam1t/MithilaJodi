import 'server-only'
import { NextResponse, after } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { findOwnProfileId } from '@/lib/ownProfile'
import { liveFilter, syncAutomaticNotifications } from '@/lib/notifications'
import { countUnreadMessages } from '@/lib/memberActivity'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Counts of things waiting on the member, for the nav badges.
 *
 * Interests waiting for a reply, unread messages and unread notifications —
 * without these an interest could sit unanswered with nothing in the UI to
 * say so.
 *
 * Counts only. No names, no ids, nothing that would leak who is interested in
 * whom to a stale or shared cache.
 *
 * Every member page asks for these, which makes it the natural moment to run
 * the automatic-notification sync. It runs after the response (and is
 * throttled per member), so the badge is never slowed down by it.
 */
export async function GET() {
  const session = await getSessionAccount()
  if (!session) {
    return NextResponse.json({ ok: true, interests: 0, notifications: 0, messages: 0 })
  }

  const admin = await createAdminClient()
  const myProfileId = await findOwnProfileId(admin, session.id)
  after(() => syncAutomaticNotifications(admin, session.id))

  const notificationsRes = await liveFilter(
    admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', session.id)
      .eq('read', false),
  )

  if (!myProfileId) {
    return NextResponse.json({ ok: true, interests: 0, notifications: (notificationsRes as any).count ?? 0, messages: 0 })
  }

  const [interestsRes, messages] = await Promise.all([
    admin
      .from('interests')
      .select('id', { count: 'exact', head: true })
      .eq('to_profile', myProfileId)
      .eq('status', 'sent'),
    countUnreadMessages(admin, myProfileId),
  ])

  return NextResponse.json({
    ok: true,
    interests: (interestsRes as any).count ?? 0,
    notifications: (notificationsRes as any).count ?? 0,
    messages,
  })
}
