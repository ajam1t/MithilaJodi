import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Mark notifications read. `{ ids: [...] }` marks those; an empty body marks
 * all. Either way only the session's own rows can match.
 */
export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  let ids: string[] | null = null
  try {
    const body = await request.json()
    if (Array.isArray(body?.ids)) ids = body.ids.filter((x: unknown) => typeof x === 'string' && UUID.test(x)).slice(0, 100)
  } catch { /* no body = mark all */ }

  const admin = await createAdminClient()
  let query = admin
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('account_id', session.id)
    .eq('read', false)
  if (ids) {
    if (ids.length === 0) return NextResponse.json({ ok: true })
    query = query.in('id', ids)
  }

  const { error } = await query
  if (error) {
    console.error('[notifications/read POST] error:', error.message)
    return NextResponse.json({ ok: false, message: 'Failed to mark notifications as read' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
