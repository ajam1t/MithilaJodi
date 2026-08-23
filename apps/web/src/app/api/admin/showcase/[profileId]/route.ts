import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

// ── PATCH: update sort_order and/or is_active for a showcase entry (admin only) ──
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { profileId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid body' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = (body ?? {}) as any
  const update: { sort_order?: number; is_active?: boolean } = {}
  if (typeof b.sort_order === 'number') update.sort_order = b.sort_order
  if (typeof b.is_active === 'boolean') update.is_active = b.is_active

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, message: 'Nothing to update' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { error } = await admin
    .from('public_showcase')
    .update(update)
    .eq('profile_id', profileId)

  if (error) {
    console.error('[admin/showcase/[profileId] PATCH] error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'showcase_update',
    target_type: 'public_showcase',
    target_id: profileId,
    payload: update,
  })

  return NextResponse.json({ ok: true })
}

// ── DELETE: remove a profile from the showcase (admin only) ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { profileId } = await params
  const admin = await createAdminClient()

  const { error } = await admin
    .from('public_showcase')
    .delete()
    .eq('profile_id', profileId)

  if (error) {
    console.error('[admin/showcase/[profileId] DELETE] error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'showcase_remove',
    target_type: 'public_showcase',
    target_id: profileId,
    payload: {},
  })

  return NextResponse.json({ ok: true })
}
