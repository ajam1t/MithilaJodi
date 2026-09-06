import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

/**
 * Ranking: an exact name match first, then a prefix match, then anything else;
 * Mithila-region places float up within each band, and larger administrative
 * levels beat smaller ones on a tie.
 *
 * This is done in JS rather than SQL because `ilike '%q%'` cannot express
 * "starts with beats contains" without either two round trips or a
 * `similarity()` ordering that needs the query string interpolated into the
 * order clause. The candidate set is capped at 40 rows, so sorting it here
 * costs nothing.
 */
const LEVEL_WEIGHT: Record<string, number> = {
  country: 0, state: 1, district: 2, city: 3, town: 4, village: 5,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rank(row: any, q: string): number {
  const name = String(row.name_en ?? '').toLowerCase()
  const needle = q.toLowerCase()
  let score = 0
  if (name === needle) score -= 1000
  else if (name.startsWith(needle)) score -= 500
  if (row.is_mithila_region) score -= 50
  score += LEVEL_WEIGHT[row.level as string] ?? 9
  score += name.length * 0.01
  return score
}

export async function GET(request: NextRequest) {
  const account = await getSessionAccount()
  if (!account) return NextResponse.json({ ok: false }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  const level = searchParams.get('level') // state | district | city | town | village
  const parentId = searchParams.get('parent_id')
  const idsParam = searchParams.get('ids')

  const admin = await createAdminClient()

  const COLUMNS = 'id, level, name_en, name_hi, name_mai, state_code, is_mithila_region, parent_id, latitude, longitude'

  // Resolve a known set of ids to display names. Used by the search filters to
  // re-hydrate a location chip from the URL without a name round trip.
  if (idsParam) {
    const ids = idsParam.split(',').map(v => parseInt(v, 10)).filter(Number.isFinite).slice(0, 25)
    if (ids.length === 0) return NextResponse.json({ ok: true, results: [] })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any).from('india_locations').select(COLUMNS).in('id', ids)
    return NextResponse.json({ ok: true, results: await withParentNames(admin, data ?? []) })
  }

  if (q.length < 2 && !parentId) {
    return NextResponse.json({ ok: true, results: [] })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('india_locations')
    .select(COLUMNS)
    .limit(40)

  if (level) {
    const levels = level.split(',')
    if (levels.length === 1) {
      query = query.eq('level', level)
    } else {
      query = query.in('level', levels)
    }
  }

  if (parentId) {
    query = query.eq('parent_id', parseInt(parentId, 10))
  }

  if (q.length >= 2) {
    query = query.ilike('name_en', `%${q}%`)
  }

  const { data, error } = await query
  if (error) {
    console.error('[locations] query error:', error.message)
    return NextResponse.json({ ok: false, message: 'Search failed' }, { status: 500 })
  }

  const rows = [...(data ?? [])]
  if (q.length >= 2) rows.sort((a, b) => rank(a, q) - rank(b, q))
  else rows.sort((a, b) => String(a.name_en).localeCompare(String(b.name_en)))

  return NextResponse.json({ ok: true, results: await withParentNames(admin, rows.slice(0, 20)) })
}

/**
 * Attach the parent's name to each row.
 *
 * Without it the suggestion list showed bare names, and India has plenty of
 * repeats — there is an Aurangabad in both Maharashtra and Bihar, a Bilaspur in
 * both Chhattisgarh and Himachal. Picking the wrong one is invisible until it
 * shows up on your profile.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function withParentNames(admin: any, rows: any[]) {
  const parentIds = [...new Set(rows.map(r => r.parent_id).filter((v): v is number => typeof v === 'number'))]
  const nameById = new Map<number, string>()
  if (parentIds.length > 0) {
    const { data: parents } = await admin.from('india_locations').select('id, name_en').in('id', parentIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of (parents ?? [])) nameById.set((p as any).id, (p as any).name_en)
  }
  return rows.map(r => ({ ...r, parent_name: r.parent_id ? nameById.get(r.parent_id) ?? null : null }))
}
