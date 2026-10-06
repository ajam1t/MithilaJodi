import 'server-only'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { describeNotification, liveFilter, syncAutomaticNotifications } from '@/lib/notifications'

/**
 * The member's notification centre. Always scoped to the session's account —
 * there is no parameter that could name anyone else's.
 *
 * Runs the (throttled) automatic sync first, so opening the page shows
 * anything that has become due since the member last looked.
 */
export async function GET() {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  await syncAutomaticNotifications(admin, session.id)

  const [{ data: rows, error }, { count }] = await Promise.all([
    liveFilter(
      admin
        .from('notifications')
        .select('id, type, payload, read, created_at, title, message, icon, cta_label, cta_url, source, expires_at')
        .eq('account_id', session.id),
    )
      .order('created_at', { ascending: false })
      .limit(60),
    liveFilter(
      admin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', session.id)
        .eq('read', false),
    ),
  ])

  if (error) {
    console.error('[notifications GET] error:', error.message)
    return NextResponse.json({ ok: false, message: 'Failed to fetch notifications' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    notifications: (rows ?? []).map(describeNotification),
    unread_count: count ?? 0,
  })
}
