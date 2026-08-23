import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

// Strip PostgREST filter-syntax special chars from a free-text search term.
function sanitize(raw: string): string {
  return raw.replace(/[,()\r\n]+/g, ' ').trim()
}

// ── GET: current showcase (+ optional add-candidates via ?search=) ──
// Reads allowed for admin || moderator.
export async function GET(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const admin = await createAdminClient()

  // ─── Current showcase entries, ordered ─────────────────────────────────────
  const { data: showcaseRows, error: showcaseError } = await admin
    .from('public_showcase')
    .select('profile_id, sort_order, is_active, created_at')
    .order('sort_order', { ascending: true })

  if (showcaseError) {
    console.error('[admin/showcase GET] showcase error:', showcaseError.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = showcaseRows ?? []
  const showcaseIds = rows.map((r) => r.profile_id as string)

  // Resolve name + mobile for each showcased profile.
  const nameMobileMap = new Map<string, { display_name: string; mobile: string | null }>()
  if (showcaseIds.length > 0) {
    const { data: profRows } = await admin
      .from('profiles')
      .select('id, first_name, last_name, accounts(mobile)')
      .in('id', showcaseIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(profRows as any[] ?? []).forEach((p) => {
      const name = p.last_name ? `${p.first_name} ${p.last_name}` : p.first_name
      nameMobileMap.set(p.id as string, {
        display_name: (name as string) ?? '—',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mobile: (p.accounts as any)?.mobile ?? null,
      })
    })
  }

  const showcase = rows.map((r) => {
    const info = nameMobileMap.get(r.profile_id as string)
    return {
      profile_id: r.profile_id as string,
      display_name: info?.display_name ?? '—',
      mobile: info?.mobile ?? null,
      sort_order: r.sort_order as number,
      is_active: r.is_active as boolean,
    }
  })

  // ─── Optional: candidates NOT yet in the showcase (?search=) ───────────────
  const searchRaw = request.nextUrl.searchParams.get('search')
  if (searchRaw === null) {
    return NextResponse.json({ ok: true, showcase })
  }

  const q = sanitize(searchRaw)
  if (q.length === 0) {
    return NextResponse.json({ ok: true, showcase, candidates: [] })
  }

  // Match by mobile (via accounts) or by first/last name.
  const { data: acctRows } = await admin.from('accounts').select('id').ilike('mobile', `%${q}%`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acctIds = (acctRows as any[] ?? []).map((a) => a.id as string)

  const ors = [`first_name.ilike.%${q}%`, `last_name.ilike.%${q}%`]
  if (acctIds.length > 0) ors.push(`account_id.in.(${acctIds.join(',')})`)

  const { data: candRows, error: candError } = await admin
    .from('profiles')
    .select('id, first_name, last_name, accounts(mobile)')
    .or(ors.join(','))
    .limit(20)

  if (candError) {
    console.error('[admin/showcase GET] candidates error:', candError.message)
    return NextResponse.json({ ok: true, showcase, candidates: [] })
  }

  const inShowcase = new Set(showcaseIds)
  const candidates = ((candRows as unknown[] ?? []) as Array<Record<string, unknown>>)
    .filter((p) => !inShowcase.has(p.id as string))
    .map((p) => {
      const name = p.last_name ? `${p.first_name as string} ${p.last_name as string}` : (p.first_name as string)
      return {
        id: p.id as string,
        name: name ?? '—',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mobile: (p.accounts as any)?.mobile ?? null,
      }
    })

  return NextResponse.json({ ok: true, showcase, candidates })
}

// ── POST: add a profile to the showcase (admin only) ──
export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid body' }, { status: 400 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileId = (body as any)?.profile_id as string | undefined
  if (!profileId) {
    return NextResponse.json({ ok: false, message: 'profile_id required' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Already present? Ignore (idempotent).
  const { data: existing } = await admin
    .from('public_showcase')
    .select('profile_id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, message: 'Already in showcase' })
  }

  // Next sort_order = current max + 1.
  const { data: maxRow } = await admin
    .from('public_showcase')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextSort = ((maxRow as any)?.sort_order ?? -1) + 1

  const { error: insertError } = await admin.from('public_showcase').insert({
    profile_id: profileId,
    sort_order: nextSort,
    is_active: true,
    added_by: session.id,
  })

  if (insertError) {
    console.error('[admin/showcase POST] insert error:', insertError.message)
    return NextResponse.json({ ok: false, message: 'Failed to add' }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'showcase_add',
    target_type: 'public_showcase',
    target_id: profileId,
    payload: { sort_order: nextSort },
  })

  return NextResponse.json({ ok: true })
}
