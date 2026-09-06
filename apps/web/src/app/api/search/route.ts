import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { filterPhotoViewable } from '@/lib/photoAccess'
import { getSessionAccount } from '@/lib/auth'
import { getLocationIndex, idsWithin, idsInSameState } from '@/lib/locationIndex'
import { oppositeGender } from '@/lib/matchEligibility'
import {
  scoreMatch, topReasons,
  type ScoreProfile, type ScorePreferences, type MatchResult,
} from '@/lib/matchScore'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const VALID_GENDERS = ['male', 'female', 'any'] as const
const VALID_DIETS = ['vegetarian', 'non_vegetarian', 'eggetarian', 'vegan'] as const
const VALID_SORTS = ['match', 'newest', 'completeness', 'age_asc', 'age_desc'] as const

/**
 * How far "near" reaches by default. 120 km is roughly Darbhanga to Muzaffarpur,
 * or Mumbai to Nashik — far enough that families still consider it local, close
 * enough that it does not quietly turn a city filter into a state filter.
 */
const DEFAULT_RADIUS_KM = 120
const MAX_RADIUS_KM = 600

/**
 * Match scoring reads the whole candidate row, so it cannot run on a page that
 * has already been sliced by the database. Instead we pull a bounded candidate
 * pool, score it, then paginate. The cap is what keeps that honest: past this
 * many candidates the pool is truncated by the SQL sort, and the response says
 * so via `scored_pool_truncated`.
 */
const SCORING_POOL = 300

// ─── Types ────────────────────────────────────────────────────────────────────

type MatchSummary = {
  score: number
  band: MatchResult['band']
  confidence: number
  reasons: Array<{ key: string; label: string; detail: string }>
  blockers: string[]
  cautions: string[]
}

type SearchCard = {
  id: string
  display_name: string
  gender: string
  age: number              // computed from dob; dob is never returned
  religion: string | null
  caste: string | null
  self_gotra: string | null
  mool: string | null
  gram: string | null
  height_cm: number | null
  diet: string | null
  about_snippet: string | null  // first 200 chars of about_me; full text not returned
  profile_complete: number
  profile_status: string
  native_place_name: string | null
  current_loc_name: string | null
  has_photo: boolean
  primary_photo_url: string | null  // signed URL only; storage_path never returned
  employer: string | null
  profession_detail: string | null
  education_detail: string | null
  smoking: string | null
  drinking: string | null
  maternal_gotra: string | null
  job_loc_name: string | null
  marriage_timeline: string | null
  job_title: string | null
  marital_status: string | null
  family_type: string | null
  /** Null when the viewer has no profile of their own to score against. */
  match: MatchSummary | null
}

/** What the UI needs to explain a fallback honestly. */
type Relaxation = { filter: string; label: string; from: string; to: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Age filters must run in SQL, not in JS after pagination.
 *
 * Someone is at least `age` years old iff they were born on or before
 * (today - age years). Someone is at most `age` iff they were born strictly
 * after (today - (age + 1) years).
 */
function dobOnOrBefore(age: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - age)
  return d.toISOString().slice(0, 10)
}

/**
 * Earliest date of birth that still yields exactly `age` today — i.e. the
 * birthday of someone who turns `age + 1` tomorrow. Must be compared with
 * `>=`, not `>`: this date is itself a valid `age` and `>` would silently drop
 * that whole day's cohort from every search.
 */
function earliestDobForAge(age: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - (age + 1))
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function computeAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function parseIntParam(value: string | null): number | undefined {
  if (value === null) return undefined
  const n = parseInt(value, 10)
  return isNaN(n) ? undefined : n
}

/**
 * Strip characters that have special meaning in PostgREST filter strings
 * (comma is a filter separator; parens are grouping markers in `or()` calls).
 * Replacing with a space keeps multi-word intent without breaking the syntax.
 */
function sanitizeSearchQuery(raw: string): string {
  return raw.replace(/[,()\r\n]+/g, ' ').trim()
}

/** The columns match scoring needs, over and above what the card renders. */
const PROFILE_COLUMNS = [
  'id',
  'account_id',     // internal — excluded from response
  'first_name',
  'last_name',
  'gender',
  'dob',            // internal — used to compute age, then discarded
  'religion',
  'caste',
  'sub_caste',
  'self_gotra',
  'mool',
  'gram',
  'height_cm',
  'diet',
  'about_me',
  // family_about intentionally omitted — private field
  'profile_complete',
  'profile_status',
  'native_place_id',
  'current_loc_id',
  'updated_at',
  'employer',
  'profession_detail',
  'education_detail',
  'degree',
  'smoking',
  'drinking',
  'maternal_gotra',
  'job_loc_id',
  'job_title',
  'marital_status',
  'family_type',
  'family_values',
  'marriage_timeline',
].join(', ')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toScoreProfile(row: any): ScoreProfile {
  return {
    id: row.id, gender: row.gender, dob: row.dob,
    religion: row.religion, caste: row.caste, sub_caste: row.sub_caste,
    self_gotra: row.self_gotra, maternal_gotra: row.maternal_gotra,
    mool: row.mool, gram: row.gram,
    native_place_id: row.native_place_id, current_loc_id: row.current_loc_id, job_loc_id: row.job_loc_id,
    diet: row.diet, smoking: row.smoking, drinking: row.drinking,
    marriage_timeline: row.marriage_timeline,
    education_detail: row.education_detail, degree: row.degree,
    family_type: row.family_type, family_values: row.family_values,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toScorePrefs(row: any | null | undefined): ScorePreferences {
  if (!row) return {}
  return {
    pref_age_min: row.pref_age_min, pref_age_max: row.pref_age_max,
    pref_caste: row.pref_caste, pref_diet: row.pref_diet, pref_location: row.pref_location,
    pref_marriage_timeline: row.pref_marriage_timeline, pref_gotra_safe: row.pref_gotra_safe,
  }
}

// ─── Filter model ─────────────────────────────────────────────────────────────
//
// Held as data rather than applied inline so the relaxation passes can produce a
// modified copy instead of rebuilding the query by hand each time.

type Filters = {
  gender: string
  ageMin?: number
  ageMax?: number
  gotra?: string
  mool?: string
  gram?: string
  caste?: string
  religion?: string
  diet?: string
  heightMin?: number
  heightMax?: number
  maritalStatus?: string
  timeline?: string
  q?: string
  /** Resolved to a concrete id set before the query runs. */
  locId?: number
  radiusKm: number
  /** Set when a pass has widened the location filter to the whole state. */
  locWholeState?: boolean
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await getSessionAccount()
  if (!session) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams

  // ── Parse query params ────────────────────────────────────────────────────
  const genderParam = sp.get('gender') ?? 'any'
  const dietParam   = sp.get('diet')
  const sortParam   = sp.get('sort') ?? 'match'
  const pageRaw     = parseIntParam(sp.get('page'))
  const page        = Math.max(1, pageRaw ?? 1)
  const ageMinParam = parseIntParam(sp.get('age_min'))
  const ageMaxParam = parseIntParam(sp.get('age_max'))
  const radiusParam = parseIntParam(sp.get('radius_km'))

  // ── Validate params ───────────────────────────────────────────────────────
  if (!VALID_GENDERS.includes(genderParam as typeof VALID_GENDERS[number])) {
    return NextResponse.json(
      { ok: false, message: `Invalid gender. Accepted: ${VALID_GENDERS.join(', ')}` },
      { status: 400 }
    )
  }
  if (dietParam && !VALID_DIETS.includes(dietParam as typeof VALID_DIETS[number])) {
    return NextResponse.json(
      { ok: false, message: `Invalid diet. Accepted: ${VALID_DIETS.join(', ')}` },
      { status: 400 }
    )
  }
  if (!VALID_SORTS.includes(sortParam as typeof VALID_SORTS[number])) {
    return NextResponse.json(
      { ok: false, message: `Invalid sort. Accepted: ${VALID_SORTS.join(', ')}` },
      { status: 400 }
    )
  }
  if (ageMinParam !== undefined && (ageMinParam < 18 || ageMinParam > 100)) {
    return NextResponse.json({ ok: false, message: 'age_min must be between 18 and 100' }, { status: 400 })
  }
  if (ageMaxParam !== undefined && (ageMaxParam < 18 || ageMaxParam > 100)) {
    return NextResponse.json({ ok: false, message: 'age_max must be between 18 and 100' }, { status: 400 })
  }
  if (
    ageMinParam !== undefined &&
    ageMaxParam !== undefined &&
    ageMinParam > ageMaxParam
  ) {
    return NextResponse.json({ ok: false, message: 'age_min cannot exceed age_max' }, { status: 400 })
  }

  // Gender is not a filter the member chooses — it is derived from their own.
  // A groom's feed is brides and a bride's feed is grooms, so an explicit
  // `gender` parameter (including a stale bookmark or a hand-edited URL) cannot
  // widen the feed to the same gender. Falls back to the requested value only
  // when the viewer has no gender yet, which the onboarding gate prevents for
  // anyone who has completed signup.
  const filters: Filters = {
    gender: genderParam,
    ageMin: ageMinParam,
    ageMax: ageMaxParam,
    gotra: sp.get('gotra') ?? undefined,
    mool: sp.get('mool') ?? undefined,
    gram: sp.get('gram') ?? undefined,
    caste: sp.get('caste') ?? undefined,
    religion: sp.get('religion') ?? undefined,
    diet: dietParam ?? undefined,
    heightMin: parseIntParam(sp.get('height_min')),
    heightMax: parseIntParam(sp.get('height_max')),
    maritalStatus: sp.get('marital_status') ?? undefined,
    timeline: sp.get('marriage_timeline') ?? undefined,
    q: sp.get('q') ?? undefined,
    locId: parseIntParam(sp.get('loc_id')),
    radiusKm: Math.min(MAX_RADIUS_KM, Math.max(0, radiusParam ?? DEFAULT_RADIUS_KM)),
  }

  const admin = await createAdminClient()
  const locationIndex = await getLocationIndex(admin)

  // Declared before the viewer lookup so the gender override below can narrow
  // it, and before runQuery so every pass uses the same object.
  let activeFilters: Filters = filters

  // ─── Step 0: Resolve caller's own profile, preferences and block list ─────
  //
  // Security/UX: profiles the caller has blocked, or that have blocked the
  // caller, must not appear in search results (in either direction).
  const { data: myProfileRows } = await admin
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('account_id', session.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myProfiles: any[] = myProfileRows ?? []
  const myProfileIds: string[] = myProfiles.map((r) => r.id as string)
  const viewerRow = myProfiles[0] ?? null

  let viewerPrefs: ScorePreferences = {}
  if (viewerRow) {
    const { data: prefRow } = await admin
      .from('profile_preferences').select('*').eq('profile_id', viewerRow.id).maybeSingle()
    viewerPrefs = toScorePrefs(prefRow)
  }
  const viewer: ScoreProfile | null = viewerRow ? toScoreProfile(viewerRow) : null

  // Derive the feed's gender from the viewer. Done here rather than at parse
  // time because it needs the viewer's own profile.
  const wanted = oppositeGender(viewerRow?.gender as string | undefined)
  if (wanted) activeFilters = { ...activeFilters, gender: wanted }

  const blockedProfileIds = new Set<string>()
  if (myProfileIds.length > 0) {
    const { data: blockRows } = await admin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(
        `blocker_id.in.(${myProfileIds.join(',')}),blocked_id.in.(${myProfileIds.join(',')})`,
      )
    for (const b of (blockRows ?? [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = b as any
      // Add whichever side is NOT one of my own profiles.
      if (!myProfileIds.includes(row.blocker_id as string)) blockedProfileIds.add(row.blocker_id as string)
      if (!myProfileIds.includes(row.blocked_id as string)) blockedProfileIds.add(row.blocked_id as string)
    }
  }

  // ─── Step 1: Fetch a candidate pool ───────────────────────────────────────
  //
  // Security notes:
  //   - `discoverable = true` is enforced server-side and cannot be bypassed.
  //   - `profile_status NOT IN (deleted, deactivated)` is enforced here.
  //   - `deleted_at IS NULL` enforced here.
  //   - Searching user's own profiles are excluded via account_id filter.
  //   - `dob` is fetched only to compute age in JS; it is discarded before
  //     the response is serialised (never appears in SearchCard).
  //   - `account_id` is fetched only for the account-status cross-check and
  //     to exclude own profiles; it is discarded before response.
  //   - `family_about` is intentionally NOT selected.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function runQuery(f: Filters): Promise<{ data: any[] | null; error: any }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = admin
      .from('profiles')
      .select(PROFILE_COLUMNS)
      // Security: server-enforced visibility gates
      .eq('discoverable', true)
      .neq('profile_status', 'deleted')
      .neq('profile_status', 'deactivated')
      .is('deleted_at', null)
      // Security: exclude the authenticated user's own profiles
      .neq('account_id', session!.id)

    // Age → dob range, applied in SQL so it filters BEFORE the pool is capped.
    if (f.ageMin !== undefined) query = query.lte('dob', dobOnOrBefore(f.ageMin))
    if (f.ageMax !== undefined) query = query.gte('dob', earliestDobForAge(f.ageMax))

    if (f.gender !== 'any')      query = query.eq('gender', f.gender)
    if (f.gotra)                 query = query.ilike('self_gotra', `%${f.gotra}%`)
    if (f.mool)                  query = query.ilike('mool', `%${f.mool}%`)
    if (f.gram)                  query = query.ilike('gram', `%${f.gram}%`)
    if (f.caste)                 query = query.ilike('caste', `%${f.caste}%`)
    if (f.religion)              query = query.ilike('religion', `%${f.religion}%`)
    if (f.diet)                  query = query.eq('diet', f.diet)
    if (f.maritalStatus)         query = query.ilike('marital_status', `%${f.maritalStatus}%`)
    if (f.timeline)              query = query.eq('marriage_timeline', f.timeline)
    if (f.heightMin !== undefined) query = query.gte('height_cm', f.heightMin)
    if (f.heightMax !== undefined) query = query.lte('height_cm', f.heightMax)

    // Location: expand the chosen place into the set of ids that count as
    // "there", then match either the current or the work location against it.
    if (f.locId !== undefined) {
      const ids = f.locWholeState
        ? idsInSameState(locationIndex, f.locId)
        : idsWithin(locationIndex, f.locId, f.radiusKm)
      const list = [...ids].join(',')
      query = query.or(`current_loc_id.in.(${list}),job_loc_id.in.(${list})`)
    }

    if (f.q) {
      // Sanitise: strip PostgREST filter-syntax special characters before
      // embedding the value in an `or()` filter string.
      const q = sanitizeSearchQuery(f.q)
      if (q.length > 0) {
        query = query.or(
          `first_name.ilike.%${q}%,caste.ilike.%${q}%,mool.ilike.%${q}%,gram.ilike.%${q}%,job_title.ilike.%${q}%,employer.ilike.%${q}%`
        )
      }
    }

    // The pool's SQL ordering only decides what gets truncated when there are
    // more than SCORING_POOL candidates; the returned order is set below.
    if (sortParam === 'age_asc')            query = query.order('dob', { ascending: false })
    else if (sortParam === 'age_desc')      query = query.order('dob', { ascending: true })
    else if (sortParam === 'newest')        query = query.order('updated_at', { ascending: false })
    else                                    query = query.order('profile_complete', { ascending: false })

    return query.limit(SCORING_POOL)
  }

  // ─── Step 1b: Progressive relaxation ──────────────────────────────────────
  //
  // "No results" is a dead end for a member who cannot tell which of their six
  // filters is the one with nothing behind it. Each pass loosens exactly one
  // filter, widest-net-last, and the response reports every step it took so the
  // UI can say "no one in Thane — here are 12 within 300 km" rather than
  // pretending these were the results that were asked for.
  const relaxations: Relaxation[] = []

  function nextRelaxation(f: Filters): { filters: Filters; step: Relaxation } | null {
    // Ordered least-costly to most-costly to give up.
    if (f.heightMin !== undefined || f.heightMax !== undefined) {
      return {
        filters: { ...f, heightMin: undefined, heightMax: undefined },
        step: { filter: 'height', label: 'Height', from: 'your height range', to: 'any height' },
      }
    }
    if (f.timeline) {
      return {
        filters: { ...f, timeline: undefined },
        step: { filter: 'marriage_timeline', label: 'Marriage timeline', from: f.timeline.replace(/_/g, ' '), to: 'any timeline' },
      }
    }
    if (f.diet) {
      return {
        filters: { ...f, diet: undefined },
        step: { filter: 'diet', label: 'Diet', from: f.diet.replace(/_/g, ' '), to: 'any diet' },
      }
    }
    if (f.gram) {
      return { filters: { ...f, gram: undefined }, step: { filter: 'gram', label: 'Ancestral village', from: f.gram, to: 'any village' } }
    }
    if (f.mool) {
      return { filters: { ...f, mool: undefined }, step: { filter: 'mool', label: 'Mool', from: f.mool, to: 'any mool' } }
    }
    if (f.gotra) {
      return { filters: { ...f, gotra: undefined }, step: { filter: 'gotra', label: 'Gotra', from: f.gotra, to: 'any gotra' } }
    }
    if (f.maritalStatus) {
      return { filters: { ...f, maritalStatus: undefined }, step: { filter: 'marital_status', label: 'Marital status', from: f.maritalStatus, to: 'any' } }
    }
    // Location widens in two steps before it is dropped, because "somewhere
    // else in Maharashtra" is a genuinely useful answer and "anywhere in India"
    // usually is not.
    if (f.locId !== undefined && !f.locWholeState && f.radiusKm < MAX_RADIUS_KM) {
      const wider = Math.min(MAX_RADIUS_KM, Math.max(f.radiusKm * 2, 250))
      return {
        filters: { ...f, radiusKm: wider },
        step: { filter: 'radius_km', label: 'Distance', from: `within ${f.radiusKm} km`, to: `within ${wider} km` },
      }
    }
    if (f.locId !== undefined && !f.locWholeState) {
      return {
        filters: { ...f, locWholeState: true },
        step: { filter: 'loc_id', label: 'Location', from: `within ${f.radiusKm} km`, to: 'anywhere in the same state' },
      }
    }
    if (f.ageMin !== undefined || f.ageMax !== undefined) {
      const lo = f.ageMin !== undefined ? Math.max(18, f.ageMin - 3) : undefined
      const hi = f.ageMax !== undefined ? Math.min(100, f.ageMax + 3) : undefined
      if (lo !== f.ageMin || hi !== f.ageMax) {
        return {
          filters: { ...f, ageMin: lo, ageMax: hi },
          step: {
            filter: 'age', label: 'Age',
            from: `${f.ageMin ?? 18}–${f.ageMax ?? 100}`, to: `${lo ?? 18}–${hi ?? 100}`,
          },
        }
      }
    }
    if (f.locId !== undefined) {
      return { filters: { ...f, locId: undefined }, step: { filter: 'loc_id', label: 'Location', from: 'the location you chose', to: 'anywhere in India' } }
    }
    if (f.caste) {
      return { filters: { ...f, caste: undefined }, step: { filter: 'caste', label: 'Community', from: f.caste, to: 'any community' } }
    }
    return null
  }

  const firstPass = await runQuery(activeFilters)

  if (firstPass.error) {
    console.error('[search GET] profiles query error:', firstPass.error.code, firstPass.error.message)
    return NextResponse.json({ ok: false, message: 'Search failed' }, { status: 500 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawProfiles: any[] | null = firstPass.data

  // Only relax on the first page. Relaxing on page 3 would silently change what
  // the earlier pages meant.
  if (page === 1) {
    let guard = 0
    while ((rawProfiles ?? []).length === 0 && guard++ < 12) {
      const next = nextRelaxation(activeFilters)
      if (!next) break
      activeFilters = next.filters
      relaxations.push(next.step)
      const res = await runQuery(activeFilters)
      if (res.error) {
        console.error('[search GET] relaxed query error:', res.error.message)
        break
      }
      rawProfiles = res.data
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pool: any[] = rawProfiles ?? []
  const poolTruncated = pool.length >= SCORING_POOL

  if (pool.length === 0) {
    return NextResponse.json({
      ok: true, results: [], page, has_more: false,
      total: 0, relaxed: relaxations, scored_pool_truncated: false,
    })
  }

  // ─── Step 2: Account status check (JS-side, two-step query) ───────────────
  //
  // Security: profiles whose owning account is banned, deleted, or soft-deleted
  // are excluded. Account fields (account_status, deleted_at) are used only for
  // this gate and are never returned to the client.
  //
  // We do NOT use PostgREST inner-joins (!inner) because they silently return
  // 0 rows in some configurations — two explicit queries are safer.

  const accountIds = [...new Set<string>(pool.map((p) => p.account_id as string))]

  const { data: accountRows, error: accountsError } = await admin
    .from('accounts')
    .select('id, account_status, deleted_at')
    .in('id', accountIds)

  if (accountsError) {
    console.error('[search GET] accounts query error:', accountsError.code, accountsError.message)
    return NextResponse.json({ ok: false, message: 'Search failed' }, { status: 500 })
  }

  const validAccountIds = new Set<string>()
  for (const acct of (accountRows ?? [])) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = acct as any
    if (
      a.account_status !== 'banned' &&
      a.account_status !== 'deleted' &&
      a.deleted_at === null
    ) {
      validAccountIds.add(a.id as string)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let candidates: any[] = pool.filter((p) => validAccountIds.has(p.account_id as string))
  if (blockedProfileIds.size > 0) {
    candidates = candidates.filter((p) => !blockedProfileIds.has(p.id as string))
  }

  if (candidates.length === 0) {
    return NextResponse.json({
      ok: true, results: [], page, has_more: false,
      total: 0, relaxed: relaxations, scored_pool_truncated: poolTruncated,
    })
  }

  // ─── Step 3: Score the pool ───────────────────────────────────────────────
  //
  // Needs each candidate's own preferences, because several factors (age fit,
  // marriage timeline) are mutual: "you are inside their range too" is a much
  // stronger signal than "they are inside yours".

  const scoreById = new Map<string, MatchResult>()
  if (viewer) {
    const { data: prefRows } = await admin
      .from('profile_preferences')
      .select('profile_id, pref_age_min, pref_age_max, pref_caste, pref_diet, pref_location, pref_marriage_timeline, pref_gotra_safe')
      .in('profile_id', candidates.map((p) => p.id as string))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prefsByProfile = new Map<string, any>()
    for (const row of (prefRows ?? [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prefsByProfile.set((row as any).profile_id as string, row)
    }

    for (const c of candidates) {
      scoreById.set(
        c.id as string,
        scoreMatch(viewer, viewerPrefs, toScoreProfile(c), toScorePrefs(prefsByProfile.get(c.id as string)), locationIndex),
      )
    }
  }

  // ─── Step 4: Order and paginate ───────────────────────────────────────────
  //
  // Ordering happens here rather than in SQL because the match score does not
  // exist in the database. The non-match sorts are re-applied for the same
  // reason: the pool query's ORDER BY only decided what survived truncation.
  if (sortParam === 'match' && scoreById.size > 0) {
    candidates.sort((a, b) => {
      const sa = scoreById.get(a.id as string), sb = scoreById.get(b.id as string)
      const diff = (sb?.score ?? 0) - (sa?.score ?? 0)
      if (diff !== 0) return diff
      // Tie-break on how much of the score was actually evidenced, then on how
      // complete the profile is — both favour the candidate you can learn more
      // about, which is the more useful one to show first.
      const conf = (sb?.confidence ?? 0) - (sa?.confidence ?? 0)
      if (conf !== 0) return conf
      return (b.profile_complete ?? 0) - (a.profile_complete ?? 0)
    })
  } else if (sortParam === 'age_asc') {
    candidates.sort((a, b) => String(b.dob ?? '').localeCompare(String(a.dob ?? '')))
  } else if (sortParam === 'age_desc') {
    candidates.sort((a, b) => String(a.dob ?? '').localeCompare(String(b.dob ?? '')))
  } else if (sortParam === 'completeness') {
    candidates.sort((a, b) => (b.profile_complete ?? 0) - (a.profile_complete ?? 0))
  } else {
    candidates.sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? '')))
  }

  const total = candidates.length
  const offset = (page - 1) * PAGE_SIZE
  const validProfiles = candidates.slice(offset, offset + PAGE_SIZE)
  const hasMore = offset + PAGE_SIZE < total

  if (validProfiles.length === 0) {
    return NextResponse.json({
      ok: true, results: [], page, has_more: false,
      total, relaxed: relaxations, scored_pool_truncated: poolTruncated,
    })
  }

  // ─── Step 5: Batch-fetch location names ───────────────────────────────────

  const locationIdSet = new Set<number>()
  for (const p of validProfiles) {
    if (p.native_place_id != null) locationIdSet.add(p.native_place_id as number)
    if (p.current_loc_id   != null) locationIdSet.add(p.current_loc_id   as number)
    if (p.job_loc_id       != null) locationIdSet.add(p.job_loc_id       as number)
  }

  const locationMap = new Map<number, string>()
  if (locationIdSet.size > 0) {
    const { data: locationRows, error: locationError } = await admin
      .from('india_locations')
      .select('id, name_en')
      .in('id', [...locationIdSet])

    if (locationError) {
      // Non-fatal: locations are display-only; log and continue with nulls.
      console.error('[search GET] locations query error:', locationError.code, locationError.message)
    } else {
      for (const loc of (locationRows ?? [])) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const l = loc as any
        locationMap.set(l.id as number, l.name_en as string)
      }
    }
  }

  // ─── Step 6: Batch-fetch primary approved photos ──────────────────────────

  const profileIds = validProfiles.map((p) => p.id as string)

  const { data: photoRows, error: photosError } = await admin
    .from('profile_photos')
    .select('id, profile_id, storage_path, is_primary, status')
    .in('profile_id', profileIds)
    .eq('is_primary', true)
    .eq('status', 'approved')

  if (photosError) {
    // Non-fatal: photos are optional display data; log and continue with nulls.
    console.error('[search GET] photos query error:', photosError.code, photosError.message)
  }

  // Map profile_id → internal photo record (first row wins per profile)
  const photoByProfile = new Map<string, { storage_path: string }>()
  for (const photo of (photoRows ?? [])) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = photo as any
    if (!photoByProfile.has(ph.profile_id as string)) {
      // storage_path is kept internal to this scope only — used below to
      // generate a signed URL and then discarded.
      photoByProfile.set(ph.profile_id as string, { storage_path: ph.storage_path as string })
    }
  }

  // ─── Step 7: Generate signed URLs (best-effort, 1-hour expiry) ────────────
  //
  // Security: we expose only the time-limited signed URL to the client.
  // The raw storage_path (internal bucket path) is intentionally never
  // included in the response.

  const signedUrlByProfile = new Map<string, string | null>()

  // One batched call rather than one round trip per photo.
  // Photo privacy: a member set to connections-only shows a photo in search
  // results ONLY to someone they have an accepted interest with. The profile
  // itself still appears — this withholds the photograph, not the person.
  const photoOk = await filterPhotoViewable(admin, myProfileIds[0] ?? null, [...photoByProfile.keys()])
  for (const id of [...photoByProfile.keys()]) {
    if (!photoOk.has(id)) photoByProfile.delete(id)
  }

  const signEntries = [...photoByProfile.entries()]
  if (signEntries.length > 0) {
    try {
      const { data: signedList, error: signErr } = await admin.storage
        .from('profile-photos')
        .createSignedUrls(signEntries.map(([, photo]) => photo.storage_path), 3600)

      if (signErr) {
        console.error('[search GET] batch signed URL error:', signErr.message)
        for (const [profileId] of signEntries) signedUrlByProfile.set(profileId, null)
      } else {
        // createSignedUrls preserves input order.
        signEntries.forEach(([profileId], i) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const entry = (signedList ?? [])[i] as any
          signedUrlByProfile.set(profileId, entry?.signedUrl ?? null)
        })
      }
    } catch (err) {
      // Best-effort: if signing fails, cards render with the placeholder.
      console.error('[search GET] batch signed URL exception:', err)
      for (const [profileId] of signEntries) signedUrlByProfile.set(profileId, null)
    }
  }

  // ─── Build response cards (strict allowlist) ──────────────────────────────
  //
  // Fields intentionally excluded from every card:
  //   - dob          (private; age is computed and included instead)
  //   - account_id   (internal join key; never exposed to clients)
  //   - mobile       (private; not selected from DB in this route)
  //   - family_about (private; not selected from DB in this route)
  //   - storage_path (internal; signed URL is exposed instead)
  //   - family_values, sub_caste, degree (used for scoring only — the score's
  //     `reasons` already say whatever needs saying about them)

  const results: SearchCard[] = validProfiles.map((p) => {
    const firstName = (p.first_name ?? '') as string
    const lastName  = p.last_name as string | null

    // Display name: "FirstName LastName" if last name exists, otherwise just first name.
    const displayName = lastName && lastName.length > 0
      ? `${firstName} ${lastName}`
      : firstName

    // Age is derived from dob; dob is not forwarded.
    const age = p.dob ? computeAge(p.dob as string) : 0

    const aboutMe = p.about_me as string | null
    // about_snippet: truncated to 200 characters. Full text and family_about
    // are intentionally excluded.
    const aboutSnippet = aboutMe && aboutMe.length > 0
      ? aboutMe.slice(0, 200)
      : null

    const hasPhoto = photoByProfile.has(p.id as string)
    // primary_photo_url is the signed URL only — storage_path never returned.
    const primaryPhotoUrl = signedUrlByProfile.get(p.id as string) ?? null

    const scored = scoreById.get(p.id as string) ?? null
    const match: MatchSummary | null = scored
      ? {
          score: scored.score,
          band: scored.band,
          confidence: Math.round(scored.confidence * 100) / 100,
          reasons: topReasons(scored, 4).map(r => ({ key: r.key, label: r.label, detail: r.detail })),
          blockers: scored.blockers,
          cautions: scored.cautions,
        }
      : null

    return {
      id:               p.id as string,
      display_name:     displayName,
      gender:           p.gender as string,
      age,
      religion:         (p.religion as string | null) ?? null,
      caste:            (p.caste    as string | null) ?? null,
      self_gotra:       (p.self_gotra as string | null) ?? null,
      mool:             (p.mool     as string | null) ?? null,
      gram:             (p.gram     as string | null) ?? null,
      height_cm:        (p.height_cm as number | null) ?? null,
      diet:             (p.diet     as string | null) ?? null,
      about_snippet:    aboutSnippet,
      profile_complete: (p.profile_complete as number) ?? 0,
      profile_status:   p.profile_status as string,
      native_place_name: locationMap.get(p.native_place_id as number) ?? null,
      current_loc_name:  locationMap.get(p.current_loc_id  as number) ?? null,
      has_photo:        hasPhoto,
      primary_photo_url: primaryPhotoUrl,
      employer:          (p.employer          as string | null) ?? null,
      profession_detail: (p.profession_detail as string | null) ?? null,
      education_detail:  (p.education_detail  as string | null) ?? null,
      smoking:           (p.smoking           as string | null) ?? null,
      drinking:          (p.drinking          as string | null) ?? null,
      maternal_gotra:    (p.maternal_gotra    as string | null) ?? null,
      job_loc_name:      locationMap.get(p.job_loc_id as number) ?? null,
      marriage_timeline: (p.marriage_timeline as string | null) ?? null,
      job_title:         (p.job_title         as string | null) ?? null,
      marital_status:    (p.marital_status    as string | null) ?? null,
      family_type:       (p.family_type       as string | null) ?? null,
      match,
    } satisfies SearchCard
  })

  return NextResponse.json({
    ok: true,
    results,
    page,
    has_more: hasMore,
    total,
    /** Non-empty means these are NOT the results the filters asked for. */
    relaxed: relaxations,
    /** True when more candidates matched than could be scored in one pass. */
    scored_pool_truncated: poolTruncated,
    /** Null when the viewer has no profile yet, so the UI can prompt for one. */
    scoring: viewer ? 'on' : 'no_profile',
    /** Gender actually applied, derived from the viewer. The UI states this
     *  instead of offering a control that cannot change it. */
    showing: activeFilters.gender === 'any' ? null : activeFilters.gender,
  })
}
