import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

// ── GET: public (logged-in) option lists for profile forms ──
// ?types=gotra,mool,religion → { ok, options: { gotra: [{value,label}], ... } }
export async function GET(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const raw = request.nextUrl.searchParams.get('types') ?? ''
  const types = raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  const options: Record<string, { value: string; label: string }[]> = {}
  for (const t of types) options[t] = []

  if (types.length === 0) {
    return NextResponse.json({ ok: true, options })
  }

  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('community_masters')
    .select('type, value, label_en, sort_order')
    .in('type', types)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[options GET] error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(data as any[] ?? []).forEach((row) => {
    const type = row.type as string
    if (!options[type]) options[type] = []
    options[type].push({ value: row.value as string, label: row.label_en as string })
  })

  return NextResponse.json({ ok: true, options })
}
