import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { audit, isAdminRole, requireAdminApi } from '@/lib/adminAuth'

/** Revoke one admin/moderator session (e.g. a device you no longer trust). */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi('security')
  if (guard.error) return guard.error
  const { id } = await params
  const admin = await createAdminClient()
  const { data: s } = await admin.from('account_sessions').select('id, account_id, accounts!inner(role)').eq('id', id).maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!s || !isAdminRole((s as any).accounts?.role)) return NextResponse.json({ ok: false, message: 'Session not found.' }, { status: 404 })
  await admin.from('account_sessions').update({ revoked_at: new Date().toISOString() }).eq('id', id)
  await audit(guard.session.id, 'admin_session_revoked', { type: 'account', id: s.account_id }, { session: id, self: id === guard.session.session_id }, request)
  return NextResponse.json({ ok: true })
}
