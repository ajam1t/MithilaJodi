import 'server-only'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

// ── GET: list categories (distinct type) with total + active counts ──
export async function GET() {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('community_masters')
    .select('type, is_active')

  if (error) {
    console.error('[admin/master-data GET] error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const map = new Map<string, { type: string; total: number; active: number }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(data as any[] ?? []).forEach((row) => {
    const type = row.type as string
    const entry = map.get(type) ?? { type, total: 0, active: 0 }
    entry.total += 1
    if (row.is_active) entry.active += 1
    map.set(type, entry)
  })

  const categories = [...map.values()].sort((a, b) => a.type.localeCompare(b.type))

  return NextResponse.json({ ok: true, categories })
}
