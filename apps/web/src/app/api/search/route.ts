import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { filterPhotoViewable } from '@/lib/photoAccess'
import { getSessionAccount } from '@/lib/auth'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const VALID_GENDERS = ['male', 'female', 'any'] as const
const VALID_DIETS = ['vegetarian', 'non_vegetarian', 'eggetarian', 'vegan'] as const
const VALID_SORTS = ['newest', 'completeness', 'age_asc', 'age_desc'] as const

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute age in whole years from a YYYY-MM-DD date string.
 * Mirrors DATE_PART('year', AGE(dob)) semantics: birthday hasn't passed yet
 * this calendar year → subtract one.
 */
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
  const ageMinParam = parseIntParam(sp.get('age_min'))
  const ageMaxParam = parseIntParam(sp.get('age_max'))
  const gotraParam  = sp.get('gotra')
  const moolParam   = sp.get('mool')
  const gramParam   = sp.get('gram')
  const casteParam  = sp.get('caste')
  const religionParam = sp.get('religion')
  const dietParam   = sp.get('diet')
  const heightMin   = parseIntParam(sp.get('height_min'))
  const heightMax   = parseIntParam(sp.get('height_max'))
  const qRaw        = sp.get('q')
  const sortParam   = sp.get('sort') ?? 'newest'
  const pageRaw     = parseIntParam(sp.get('page'))
  const page        = Math.max(1, pageRaw ?? 1)

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

  const admin = await createAdminClient()

  // ─── Step 0: Resolve caller's own profiles + block list ───────────────────
  //
  // Security/UX: profiles the caller has blocked, or that have blocked the
  // caller, must not appear in search results (in either direction).
  const { data: myProfileRows } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', session.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myProfileIds: string[] = (myProfileRows ?? []).map((r: any) => r.id as string)

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

  // ─── Step 1: Query profiles ───────────────────────────────────────────────
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
  //
  // Pagination: we request page_size+1 rows to determine `has_more` without
  // an expensive COUNT query. Only page_size rows are returned to the client.
  // Note: JS-side age / account-status filters applied in steps 2-3 may
  // reduce the returned count below page_size on some pages — this is an
  // acceptable trade-off vs. fetching the entire result set.

  const offset = (page - 1) * PAGE_SIZE

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from('profiles')
    .select(
      [
        'id',
        'account_id',     // internal — excluded from response
        'first_name',
        'last_name',
        'gender',
        'dob',            // internal — used to compute age, then discarded
        'religion',
        'caste',
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
        'smoking',
        'drinking',
        'maternal_gotra',
        'job_loc_id',
        'marriage_timeline',
      ].join(', ')
    )
    // Security: server-enforced visibility gates
    .eq('discoverable', true)
    .neq('profile_status', 'deleted')
    .neq('profile_status', 'deactivated')
    .is('deleted_at', null)
    // Security: exclude the authenticated user's own profiles
    .neq('account_id', session.id)

  // Age → dob range, applied in SQL so it filters BEFORE pagination.
  // Previously this ran in JS on the already-sliced page, which meant a narrow
  // age range could return an empty page while matches remained, and made the
  // filter behave as though it barely worked.
  if (ageMinParam !== undefined) {
    query = query.lte('dob', dobOnOrBefore(ageMinParam))
  }
  if (ageMaxParam !== undefined) {
    query = query.gte('dob', earliestDobForAge(ageMaxParam))
  }

  // Optional filters
  if (genderParam !== 'any') {
    query = query.eq('gender', genderParam)
  }
  if (gotraParam) {
    query = query.ilike('self_gotra', `%${gotraParam}%`)
  }
  if (moolParam) {
    query = query.ilike('mool', `%${moolParam}%`)
  }
  if (gramParam) {
    query = query.ilike('gram', `%${gramParam}%`)
  }
  if (casteParam) {
    query = query.ilike('caste', `%${casteParam}%`)
  }
  if (religionParam) {
    query = query.ilike('religion', `%${religionParam}%`)
  }
  if (dietParam) {
    query = query.eq('diet', dietParam)
  }
  if (heightMin !== undefined) {
    query = query.gte('height_cm', heightMin)
  }
  if (heightMax !== undefined) {
    query = query.lte('height_cm', heightMax)
  }
  if (qRaw) {
    // Sanitise: strip PostgREST filter-syntax special characters before
    // embedding the value in an `or()` filter string.
    const q = sanitizeSearchQuery(qRaw)
    if (q.length > 0) {
      query = query.or(
        `first_name.ilike.%${q}%,caste.ilike.%${q}%,mool.ilike.%${q}%,gram.ilike.%${q}%`
      )
    }
  }

  // Sort
  if (sortParam === 'completeness') {
    query = query.order('profile_complete', { ascending: false })
  } else if (sortParam === 'age_asc') {
    // Youngest first → most recent date of birth → dob descending
    query = query.order('dob', { ascending: false })
  } else if (sortParam === 'age_desc') {
    // Oldest first → earliest date of birth → dob ascending
    query = query.order('dob', { ascending: true })
  } else {
    // Default: newest (most recently updated first)
    query = query.order('updated_at', { ascending: false })
  }

  // Fetch page_size+1 to determine has_more.
  // range(from, to) is inclusive on both ends → page_size+1 rows.
  query = query.range(offset, offset + PAGE_SIZE)

  const { data: rawProfiles, error: profilesError } = await query

  if (profilesError) {
    console.error('[search GET] profiles query error:', profilesError.code, profilesError.message)
    return NextResponse.json({ ok: false, message: 'Search failed' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allFetched: any[] = rawProfiles ?? []
  const dbHasMore = allFetched.length > PAGE_SIZE
  // Trim to the actual page before JS-side filtering
  const pageSlice = dbHasMore ? allFetched.slice(0, PAGE_SIZE) : allFetched

  if (pageSlice.length === 0) {
    return NextResponse.json({ ok: true, results: [], page, has_more: dbHasMore })
  }

  // ─── Step 2: Account status check (JS-side, two-step query) ───────────────
  //
  // Security: profiles whose owning account is banned, deleted, or soft-deleted
  // are excluded. Account fields (account_status, deleted_at) are used only for
  // this gate and are never returned to the client.
  //
  // We do NOT use PostgREST inner-joins (!inner) because they silently return
  // 0 rows in some configurations — two explicit queries are safer.

  const accountIds = [...new Set<string>(pageSlice.map((p) => p.account_id as string))]

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
  let validProfiles: any[] = pageSlice.filter((p) => validAccountIds.has(p.account_id as string))

  // Exclude profiles involved in a block with the caller (either direction).
  if (blockedProfileIds.size > 0) {
    validProfiles = validProfiles.filter((p) => !blockedProfileIds.has(p.id as string))
  }

  // Age is now filtered in SQL via the dob range above, before pagination.
  // dob is still fetched to compute the displayed age, and is never forwarded
  // to the client in this response path.

  if (validProfiles.length === 0) {
    return NextResponse.json({ ok: true, results: [], page, has_more: dbHasMore })
  }

  // ─── Step 3: Batch-fetch location names ───────────────────────────────────
  //
  // One query for all native_place_id + current_loc_id values. We build a
  // Map<id, name_en> and resolve per-profile without N+1 queries.

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

  // ─── Step 4: Batch-fetch primary approved photos ──────────────────────────
  //
  // One query for all profiles; only is_primary=true, status='approved' rows.
  // storage_path is fetched here to generate a signed URL; it is never
  // forwarded to the client.

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

  // ─── Step 5: Generate signed URLs (best-effort, 1-hour expiry) ────────────
  //
  // Security: we expose only the time-limited signed URL to the client.
  // The raw storage_path (internal bucket path) is intentionally never
  // included in the response.

  const signedUrlByProfile = new Map<string, string | null>()

  // One batched call rather than one round trip per photo. A 20-result page
  // previously made up to 20 sequential Storage calls (~30ms each) before it
  // could respond.
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

  const results: SearchCard[] = validProfiles.map((p) => {
    const firstName = (p.first_name ?? '') as string
    const lastName  = p.last_name as string | null

    // Display name: "FirstName L." if last name exists, otherwise just first name.
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
    } satisfies SearchCard
  })

  return NextResponse.json({ ok: true, results, page, has_more: dbHasMore })
}
