import 'server-only'
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
function toPublicName(firstName: string, lastName: string | null): string {
  const first = (firstName ?? '').trim()
  const last = (lastName ?? '').trim()
  if (last.length > 0) return `${first} ${last}`
  return first
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
  // Applied here rather than as a WHERE clause so the deploy does not depend on
  // migration 20260826000006 having already run. Before it runs the column is
  // simply absent and this is a no-op, leaving the pre-existing `discoverable`
  // gate in charge — the page keeps working instead of silently emptying.
  // Once the migration has landed everywhere, fold this back into the query.
  if (profiles.length > 0 && 'visibility' in profiles[0]) {
    profiles = profiles.filter((row) => row.visibility === 'public')
  }
  if (profiles.length === 0) return []

  // Preserve the curator's ordering (sort_order asc).
  profiles.sort(
    (a, b) => (orderByProfileId.get(a.id as string) ?? 0) - (orderByProfileId.get(b.id as string) ?? 0)
  )

  // Step 3: batch-fetch location names.
  const locationIdSet = new Set<number>()
  for (const p of profiles) {
    if (p.native_place_id != null) locationIdSet.add(p.native_place_id as number)
    if (p.current_loc_id != null) locationIdSet.add(p.current_loc_id as number)
    if (p.job_loc_id != null) locationIdSet.add(p.job_loc_id as number)
  }

  const locationMap = new Map<number, string>()
  if (locationIdSet.size > 0) {
    const { data: locationRows, error: locationError } = await admin
      .from('india_locations')
      .select('id, name_en')
      .in('id', [...locationIdSet])
    if (locationError) {
      console.error('[publicProfiles] locations query error:', locationError.code, locationError.message)
    } else {
      for (const loc of locationRows ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const l = loc as any
        locationMap.set(l.id as number, l.name_en as string)
      }
    }
  }

  // Step 4: batch-fetch primary approved photos.
  const profileIds = profiles.map((p) => p.id as string)
  const { data: photoRows, error: photosError } = await admin
    .from('profile_photos')
    .select('id, profile_id, storage_path, is_primary, status')
    .in('profile_id', profileIds)
    .eq('is_primary', true)
    .eq('status', 'approved')

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

  // Step 6: verification status (trust badge) — a profile is "verified" when it
  // has at least one approved verification. Read-only; verified status is not
  // sensitive. Used only to render the Verified badge truthfully.
  const verifiedSet = new Set<string>()
  const { data: verifRows, error: verifError } = await admin
    .from('verifications')
    .select('profile_id')
    .in('profile_id', profileIds)
    .eq('status', 'verified')
  if (verifError) {
    console.error('[publicProfiles] verifications query error:', verifError.code, verifError.message)
  } else {
    for (const v of verifRows ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      verifiedSet.add((v as any).profile_id as string)
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
