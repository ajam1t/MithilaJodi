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

// ── GET: all items (active + inactive) for a type, with usage counts ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { type } = await params
  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('community_masters')
    .select('id, type, value, label_en, label_hi, label_mai, is_mithila, sort_order, is_active')
    .eq('type', type)
    .order('sort_order', { ascending: true })
    .order('label_en', { ascending: true })

  if (error) {
    console.error('[admin/master-data/[type] GET] error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data as any[] ?? [])

  // Best-effort usage counts: one query on the mapped profiles column.
  const usageMap = new Map<string, number>()
  const column = USAGE_COLUMN[type]
  if (column && rows.length > 0) {
    const values = rows.map((r) => r.value as string)
    const { data: profRows } = await admin
      .from('profiles')
      .select(column)
      .in(column, values)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(profRows as any[] ?? []).forEach((p) => {
      const v = p[column] as string
      usageMap.set(v, (usageMap.get(v) ?? 0) + 1)
    })
  }

  const items = rows.map((r) => ({
    id: r.id as number,
    type: r.type as string,
    value: r.value as string,
    label_en: r.label_en as string,
    label_hi: (r.label_hi as string | null) ?? null,
    label_mai: (r.label_mai as string | null) ?? null,
    is_mithila: r.is_mithila as boolean,
    sort_order: r.sort_order as number,
    is_active: r.is_active as boolean,
    usage_count: usageMap.get(r.value as string) ?? 0,
  }))

  return NextResponse.json({ ok: true, items })
}

// ── POST: add a new item for a type ──
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { type } = await params

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid body' }, { status: 400 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = body as any
  const value = typeof b?.value === 'string' ? b.value.trim() : ''
  const label_en = typeof b?.label_en === 'string' ? b.label_en.trim() : ''
  const label_hi = typeof b?.label_hi === 'string' && b.label_hi.trim() ? b.label_hi.trim() : null
  const label_mai = typeof b?.label_mai === 'string' && b.label_mai.trim() ? b.label_mai.trim() : null
  const is_mithila = b?.is_mithila === true

  if (!value || !label_en) {
    return NextResponse.json({ ok: false, message: 'value and label_en are required' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Auto-assign sort_order = max + 1 for this type.
  const { data: maxRow } = await admin
    .from('community_masters')
    .select('sort_order')
    .eq('type', type)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextSort = ((maxRow as any)?.sort_order as number | undefined ?? 0) + 1

  const { data: created, error } = await admin
    .from('community_masters')
    .insert({
      type,
      value,
      label_en,
      label_hi,
      label_mai,
      is_mithila,
      sort_order: nextSort,
      is_active: true,
    })
    .select('id, type, value, label_en, label_hi, label_mai, is_mithila, sort_order, is_active')
    .single()

  if (error) {
    console.error('[admin/master-data/[type] POST] error:', error.message)
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = created as any
  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'master_data_add',
    target_type: 'master_data',
    target_id: String(row.id),
    payload: { type, value, label_en },
  })

  return NextResponse.json({ ok: true, item: { ...row, usage_count: 0 } })
}
