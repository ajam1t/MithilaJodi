import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { audit, requireAdminApi } from '@/lib/adminAuth'

/**
 * Reveal a member's mobile number (and email, if set) to an admin — for
 * support. Masked everywhere else in the console; every reveal is audited.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi('manage_members')
  if (guard.error) return guard.error
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, message: 'Member not found.' }, { status: 404 })

  const admin = await createAdminClient()
  const { data } = await admin.from('accounts').select('id, role, mobile, email').eq('id', id).maybeSingle()
  if (!data || data.role !== 'user') return NextResponse.json({ ok: false, message: 'Member not found.' }, { status: 404 })

  await audit(guard.session.id, 'member_contact_revealed', { type: 'account', id }, {}, request)
  return NextResponse.json({ ok: true, mobile: data.mobile, email: data.email ?? null }, { headers: { 'Cache-Control': 'no-store' } })
}
