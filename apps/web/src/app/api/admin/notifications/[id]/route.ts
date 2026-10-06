import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Turn an announcement off or back on. Off expires every delivered copy, so it
 * vanishes from members' Notifications (and their unread counts) at once; on
 * restores the campaign's own expiry.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') return NextResponse.json({ ok: false }, { status: 403 })

  const { id } = await params
  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }
  if (typeof body?.is_active !== 'boolean') {
    return NextResponse.json({ ok: false, message: 'is_active is required' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: campaign } = await admin
    .from('notification_campaigns')
    .select('id, expires_at')
    .eq('id', id)
    .maybeSingle()
  if (!campaign) return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 })

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    admin.from('notification_campaigns').update({ is_active: body.is_active }).eq('id', id),
    admin.from('notifications')
      .update({ expires_at: body.is_active ? (campaign as any).expires_at : new Date().toISOString() })
      .eq('campaign_id', id),
  ])
  if (e1 || e2) {
    console.error('[admin/notifications PATCH] error:', e1?.message ?? e2?.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: body.is_active ? 'activate_announcement' : 'deactivate_announcement',
    target_type: 'notification_campaign',
    target_id: id,
    payload: {},
  })
  return NextResponse.json({ ok: true })
}
