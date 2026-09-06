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
/**
 * Why a profile would or would not actually appear on the public homepage and
 * /explore, evaluated with the SAME rules as getPublicShowcaseProfiles.
 *
 * Curating the showcase is the one admin action that puts a member's name,
 * photo and community details on a page that needs no account and is indexable
 * by Google. Until now the admin saw only a name and a mobile number, so there
 * was no way to tell that featuring a "Members only" profile does nothing - it
 * simply never showed up, with no explanation anywhere.
 *
 * Read-only and derived. It deliberately does not let an admin override any of
 * these gates: a member's own visibility choice is not an admin's to change,
 * and an editable override here is exactly how a private profile would end up
 * indexed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function publicEligibility(profile: any, approvedPhotos: number): { eligible: boolean; reason: string | null } {
  if (!profile) return { eligible: false, reason: 'Profile not found' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const account = (profile.accounts ?? null) as any
  if (profile.deleted_at) return { eligible: false, reason: 'Profile deleted' }
  if (profile.profile_status !== 'active') {
    return { eligible: false, reason: 'Profile status is ' + (profile.profile_status ?? 'unknown') }
  }
  if (profile.is_demo) return { eligible: false, reason: 'Demo profile - never shown publicly' }
  if (profile.visibility !== 'public') {
    const chose = profile.visibility === 'members' ? 'Members only' : 'Private'
    return { eligible: false, reason: 'Member chose "' + chose + '" - only they can change this' }
  }
  if (profile.discoverable !== true) return { eligible: false, reason: 'Member turned off discoverability' }
  if (!account) return { eligible: false, reason: 'Owning account not found' }
  if (account.deleted_at) return { eligible: false, reason: 'Account deleted' }
  if (account.account_status === 'banned') return { eligible: false, reason: 'Account banned' }
  if (account.account_status === 'deleted') return { eligible: false, reason: 'Account deleted' }
  if (approvedPhotos === 0) {
    return { eligible: false, reason: 'No approved photo yet - the card shows a placeholder' }
  }
  return { eligible: true, reason: null }
}

/** Approved-photo counts for a set of profiles, in one query. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function approvedPhotoCounts(admin: any, profileIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (profileIds.length === 0) return counts
  const { data } = await admin
    .from('profile_photos')
    .select('profile_id')
    .in('profile_id', profileIds)
    .eq('status', 'approved')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of ((data ?? []) as any[])) {
    const id = row.profile_id as string
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

const ELIGIBILITY_COLUMNS =
  'id, first_name, last_name, visibility, profile_status, discoverable, is_demo, deleted_at, ' +
  'accounts(mobile, account_status, deleted_at)'

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
  const nameMobileMap = new Map<string, {
    display_name: string; mobile: string | null; eligible: boolean; reason: string | null
  }>()
  if (showcaseIds.length > 0) {
    const { data: profRows } = await admin
      .from('profiles')
      .select(ELIGIBILITY_COLUMNS)
      .in('id', showcaseIds)
    const photoCounts = await approvedPhotoCounts(admin, showcaseIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(profRows as any[] ?? []).forEach((p) => {
      const name = p.last_name ? `${p.first_name} ${p.last_name}` : p.first_name
      const verdict = publicEligibility(p, photoCounts.get(p.id as string) ?? 0)
      nameMobileMap.set(p.id as string, {
        display_name: (name as string) ?? '—',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mobile: (p.accounts as any)?.mobile ?? null,
        eligible: verdict.eligible,
        reason: verdict.reason,
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
      // Whether this entry actually reaches the public page, and if not, why.
      public_eligible: info?.eligible ?? false,
      blocked_reason: info?.reason ?? 'Profile not found',
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
    .select(ELIGIBILITY_COLUMNS)
    .or(ors.join(','))
    .limit(20)

  if (candError) {
    console.error('[admin/showcase GET] candidates error:', candError.message)
    return NextResponse.json({ ok: true, showcase, candidates: [] })
  }

  const inShowcase = new Set(showcaseIds)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candList = ((candRows ?? []) as any[]).filter((p) => !inShowcase.has(p.id as string))
  const candPhotoCounts = await approvedPhotoCounts(admin, candList.map((p) => p.id as string))
  const candidates = candList.map((p) => {
    const name = p.last_name ? `${p.first_name as string} ${p.last_name as string}` : (p.first_name as string)
    const verdict = publicEligibility(p, candPhotoCounts.get(p.id as string) ?? 0)
    return {
      id: p.id as string,
      name: name ?? '—',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mobile: (p.accounts as any)?.mobile ?? null,
      public_eligible: verdict.eligible,
      blocked_reason: verdict.reason,
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
