import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

// Map a master-data type to the profiles column that stores it, for usage counts.
const USAGE_COLUMN: Record<string, string> = {
  gotra: 'self_gotra',
  mool: 'mool',
  caste: 'caste',
  sub_caste: 'sub_caste',
  religion: 'religion',
  diet: 'diet',
}

// ── PATCH: update an item (edit / activate-deactivate / reorder) ──
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid body' }, { status: 400 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = body as any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {}
  if (typeof b?.label_en === 'string') updates.label_en = b.label_en.trim()
  if (b?.label_hi === null || typeof b?.label_hi === 'string') {
    updates.label_hi = typeof b.label_hi === 'string' && b.label_hi.trim() ? b.label_hi.trim() : null
  }
  if (b?.label_mai === null || typeof b?.label_mai === 'string') {
    updates.label_mai = typeof b.label_mai === 'string' && b.label_mai.trim() ? b.label_mai.trim() : null
  }
  if (typeof b?.is_mithila === 'boolean') updates.is_mithila = b.is_mithila
  if (typeof b?.is_active === 'boolean') updates.is_active = b.is_active
  if (typeof b?.sort_order === 'number') updates.sort_order = b.sort_order
  if (typeof b?.value === 'string' && b.value.trim()) updates.value = b.value.trim()

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, message: 'No valid fields to update' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { data: updated, error } = await admin
    .from('community_masters')
    .update(updates)
    .eq('id', id)
    .select('id, type, value, label_en, label_hi, label_mai, is_mithila, sort_order, is_active')
    .single()

  if (error) {
    console.error('[admin/master-data/[type]/[id] PATCH] error:', error.message)
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'master_data_update',
    target_type: 'master_data',
    target_id: String(id),
    payload: updates,
  })

  return NextResponse.json({ ok: true, item: updated })
}

// ── DELETE: hard-delete only when the item has zero usage ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { type, id } = await params
  const admin = await createAdminClient()

  const { data: itemRow, error: fetchError } = await admin
    .from('community_masters')
    .select('id, type, value')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error('[admin/master-data/[type]/[id] DELETE fetch] error:', fetchError.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  if (!itemRow) {
    return NextResponse.json({ ok: false, message: 'Item not found' }, { status: 404 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = itemRow as any

  // Check usage on the mapped profiles column (if any).
  const column = USAGE_COLUMN[type]
  if (column) {
    const { count } = await admin
      .from('profiles')
      .select(column, { count: 'exact', head: true })
      .eq(column, item.value as string)
    if ((count ?? 0) > 0) {
      return NextResponse.json({ ok: false, message: 'In use — deactivate instead' }, { status: 409 })
    }
  }

  const { error } = await admin
    .from('community_masters')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[admin/master-data/[type]/[id] DELETE] error:', error.message)
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'master_data_delete',
    target_type: 'master_data',
    target_id: String(id),
    payload: { type, value: item.value },
  })

  return NextResponse.json({ ok: true })
}
