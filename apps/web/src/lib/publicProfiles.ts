import 'server-only'
import { filterPhotoViewable } from '@/lib/photoAccess'
import { createAdminClient } from '@/lib/supabase/server'
import type { SearchCard } from '@/types/profile'

// Maximum number of curated profiles shown to logged-out visitors.
export const PUBLIC_SHOWCASE_MAX = 20

/**
 * Compute age in whole years from a YYYY-MM-DD date string.
 * dob is used only to derive age; it is never returned to the client.
 */
function computeAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--
  return age
}

/** Public display name used consistently across the home/explore showcase. */
/**
 * Public display name — the member's full name.
 *
 * Showing the full name on public pages is a deliberate product decision: a
 * family evaluating a match expects to see who it is, and an initial reads as
 * evasive. It does mean a name, photo, city, caste and gotra appear together on
 * a page that needs no account and is indexable, so the visibility copy in the
 * profile editor and on /help states plainly what Public means rather than
 * implying the surname is hidden.
 *
 * Everything genuinely private is still withheld from this projection: date of
 * birth, mobile, email, address, family detail, horoscope and free text.
 */
function toPublicName(firstName: string, lastName: string | null): string {
  const first = (firstName ?? '').trim()
  const last = (lastName ?? '').trim()
  return last.length > 0 ? `${first} ${last}` : first
}

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>

/**
 * Location id -> English name. Split out so it can be issued concurrently with
 * the other per-profile reads; a query error degrades to unnamed places rather
 * than failing the page, which is how the inline version behaved.
 */
async function fetchLocationNames(
  admin: AdminClient,
  ids: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>()
  if (ids.length === 0) return map
  const { data, error } = await admin.from('india_locations').select('id, name_en').in('id', ids)
  if (error) {
    console.error('[publicProfiles] locations query error:', error.code, error.message)
    return map
  }
  for (const loc of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const l = loc as any
    map.set(l.id as number, l.name_en as string)
  }
  return map
}

/**
 * Profile ids with at least one approved verification, for the Verified badge.
 * Read-only and not sensitive; on error the set is empty, so the badge is simply
 * not shown rather than shown untruthfully.
 */
async function fetchVerifiedProfileIds(
  admin: AdminClient,
  profileIds: string[],
): Promise<Set<string>> {
  const verified = new Set<string>()
  if (profileIds.length === 0) return verified
  const { data, error } = await admin
    .from('verifications')
    .select('profile_id')
    .in('profile_id', profileIds)
    .eq('status', 'verified')
  if (error) {
    console.error('[publicProfiles] verifications query error:', error.code, error.message)
    return verified
  }
  for (const v of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verified.add((v as any).profile_id as string)
  }
  return verified
}

/**
 * Fetch the curated public showcase as a strict display-safe allowlist.
 *
 * PUBLIC — no authentication. Returns ONLY the admin-curated `public_showcase`
 * intersected with profiles that are still discoverable + active + not deleted,
 * so a profile that turns itself non-discoverable disappears even while listed.
 *
 * Private fields (dob, account_id, mobile/phone, email, family_about, exact
 * address, horoscope, storage_path, …) are NEVER selected or returned. The
 * Full names are returned for display; private contact and free-text fields
 * remain excluded from the public projection.
 *
 * Used by both /api/public/profiles (client fallback/refresh) and the /explore
 * server component (SSR — first meaningful content in the initial HTML).
 */
export async function getPublicShowcaseProfiles(): Promise<SearchCard[]> {
  const admin = await createAdminClient()

  // Step 1: curated showcase entries (active only), ordered.
  const { data: showcaseRows, error: showcaseError } = await admin
    .from('public_showcase')
    .select('profile_id, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(PUBLIC_SHOWCASE_MAX)

  if (showcaseError) {
    console.error('[publicProfiles] showcase query error:', showcaseError.code, showcaseError.message)
    throw new Error('showcase_query_failed')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showcase: any[] = showcaseRows ?? []
  if (showcase.length === 0) return []

  const orderByProfileId = new Map<string, number>()
  for (const s of showcase) orderByProfileId.set(s.profile_id as string, s.sort_order as number)
  const showcaseProfileIds = [...orderByProfileId.keys()]

  // Step 2: fetch the profiles — privacy gates enforced server-side.
  const { data: rawProfiles, error: profilesError } = await admin
    .from('profiles')
    .select(
      [
        'id',
        'account_id',     // internal — used for the account-status gate, then dropped
        'visibility',     // internal — drives the public/members gate, then dropped
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
        'profile_complete',
        'profile_status',
        'native_place_id',
        'current_loc_id',
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
    .in('id', showcaseProfileIds)
    // Privacy: respect the profile's own visibility choices.
    .eq('discoverable', true)
    .eq('profile_status', 'active')
    .is('deleted_at', null)
    // Synthetic demo profiles must never appear on a public, indexable page.
    .eq('is_demo', false)

  if (profilesError) {
    console.error('[publicProfiles] profiles query error:', profilesError.code, profilesError.message)
    throw new Error('profiles_query_failed')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profiles: any[] = rawProfiles ?? []

  // Three-level visibility: only members who explicitly chose 'public' may
  // appear on a no-login page. Admin curation (public_showcase) decides WHO is
  // featured; this decides who is even eligible. Both must agree.
  //
  // This filter was previously guarded by `'visibility' in profiles[0]` so the
  // deploy would survive migration 20260826000006 not having run yet — but
  // `visibility` was never added to the select, so the guard was always false
  // and the filter never ran at all. A member set to "Members only" would have
  // appeared on this no-login, indexable page the moment an admin featured
  // them. The migration has since run everywhere, so the column is selected
  // above and the gate is now unconditional.
  profiles = profiles.filter((row) => row.visibility === 'public')
  if (profiles.length === 0) return []

  // The owning account must be in good standing. Member search and the shared
  // /p/ links both check this; this page did not, which meant banning an
  // account — the strongest action an admin has — left that person's profile on
  // the most exposed surface there is: a public, Google-indexable page.
  const accountIds = [...new Set(profiles.map((row) => row.account_id as string).filter(Boolean))]
  if (accountIds.length > 0) {
    const { data: accountRows, error: accountsError } = await admin
      .from('accounts')
      .select('id, account_status, deleted_at')
      .in('id', accountIds)

    if (accountsError) {
      // Fail closed. An unreadable account table must not default to showing
      // profiles whose ban status is unknown.
      console.error('[publicProfiles] accounts query error:', accountsError.code, accountsError.message)
      throw new Error('accounts_query_failed')
    }

    const inGoodStanding = new Set<string>()
    for (const row of (accountRows ?? [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const acct = row as any
      if (
        acct.deleted_at === null &&
        acct.account_status !== 'banned' &&
        acct.account_status !== 'deleted'
      ) {
        inGoodStanding.add(acct.id as string)
      }
    }
    profiles = profiles.filter((row) => inGoodStanding.has(row.account_id as string))
    if (profiles.length === 0) return []
  }

  // Preserve the curator's ordering (sort_order asc).
  profiles.sort(
    (a, b) => (orderByProfileId.get(a.id as string) ?? 0) - (orderByProfileId.get(b.id as string) ?? 0)
  )

  // Steps 3, 4 and 6 all key off the profile ids that survived the gates above
  // and none of them depends on the others, but they ran one after another —
  // three sequential Supabase round trips on every render of a public,
  // Google-indexable page, straight onto TTFB. They now go out together.
  //
  // They are deliberately still issued *after* the visibility and account-status
  // gates rather than alongside them: nothing should be read, and no URL signed,
  // for a profile that is not allowed on this page in the first place.
  const locationIdSet = new Set<number>()
  for (const p of profiles) {
    if (p.native_place_id != null) locationIdSet.add(p.native_place_id as number)
    if (p.current_loc_id != null) locationIdSet.add(p.current_loc_id as number)
    if (p.job_loc_id != null) locationIdSet.add(p.job_loc_id as number)
  }
  const profileIds = profiles.map((p) => p.id as string)

  const [locationMap, { data: photoRows, error: photosError }, verifiedSet] = await Promise.all([
    fetchLocationNames(admin, [...locationIdSet]),
    admin
      .from('profile_photos')
      .select('id, profile_id, storage_path, is_primary, status')
      .in('profile_id', profileIds)
      .eq('is_primary', true)
      .eq('status', 'approved'),
    fetchVerifiedProfileIds(admin, profileIds),
  ])

  if (photosError) {
    console.error('[publicProfiles] photos query error:', photosError.code, photosError.message)
  }

  // storage_path is kept internal — used to sign a URL, then discarded.
  const photoByProfile = new Map<string, { storage_path: string }>()
  for (const photo of photoRows ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = photo as any
    if (!photoByProfile.has(ph.profile_id as string)) {
      photoByProfile.set(ph.profile_id as string, { storage_path: ph.storage_path as string })
    }
  }

  // Step 5: generate signed URLs (best-effort, 1-hour expiry).
  const signedUrlByProfile = new Map<string, string | null>()
  // One batched call instead of a serialised loop. This runs during SSR of the
  // public /explore page, where N sequential Storage round trips (~30ms each)
  // went straight onto TTFB.
  // A member who limits photographs to accepted connections must not have that
  // photograph published on a page anyone can load. The open web is not a
  // connection, so only 'all' owners are signed here.
  const publicPhotoOk = await filterPhotoViewable(admin, null, [...photoByProfile.keys()])
  for (const id of [...photoByProfile.keys()]) {
    if (!publicPhotoOk.has(id)) photoByProfile.delete(id)
  }

  const signEntries = [...photoByProfile.entries()]
  if (signEntries.length > 0) {
    try {
      const { data: signedList, error: signErr } = await admin.storage
        .from('profile-photos')
        .createSignedUrls(signEntries.map(([, photo]) => photo.storage_path), 3600)
      if (signErr) {
        console.error('[publicProfiles] batch signed URL error:', signErr.message)
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
      console.error('[publicProfiles] batch signed URL exception:', err)
      for (const [profileId] of signEntries) signedUrlByProfile.set(profileId, null)
    }
  }

  // Build response cards (strict allowlist).
  return profiles.map((p) => {
    const hasPhoto = photoByProfile.has(p.id as string)
    return {
      id: p.id as string,
      display_name: toPublicName(p.first_name as string, (p.last_name as string | null) ?? null),
      gender: p.gender as string,
      age: p.dob ? computeAge(p.dob as string) : 0,
      religion: (p.religion as string | null) ?? null,
      caste: (p.caste as string | null) ?? null,
      self_gotra: (p.self_gotra as string | null) ?? null,
      mool: (p.mool as string | null) ?? null,
      gram: (p.gram as string | null) ?? null,
      height_cm: (p.height_cm as number | null) ?? null,
      diet: (p.diet as string | null) ?? null,
      // Free-text "about me" is intentionally omitted from the public projection.
      about_snippet: null,
      profile_complete: (p.profile_complete as number) ?? 0,
      profile_status: p.profile_status as string,
      native_place_name: locationMap.get(p.native_place_id as number) ?? null,
      current_loc_name: locationMap.get(p.current_loc_id as number) ?? null,
      has_photo: hasPhoto,
      primary_photo_url: signedUrlByProfile.get(p.id as string) ?? null,
      verified: verifiedSet.has(p.id as string),
      employer: (p.employer as string | null) ?? null,
      profession_detail: (p.profession_detail as string | null) ?? null,
      education_detail: (p.education_detail as string | null) ?? null,
      smoking: (p.smoking as string | null) ?? null,
      drinking: (p.drinking as string | null) ?? null,
      maternal_gotra: (p.maternal_gotra as string | null) ?? null,
      job_loc_name: locationMap.get(p.job_loc_id as number) ?? null,
      marriage_timeline: (p.marriage_timeline as string | null) ?? null,
    } satisfies SearchCard
  })
}
