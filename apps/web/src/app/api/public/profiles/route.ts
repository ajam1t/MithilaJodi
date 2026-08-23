import 'server-only'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { SearchCard } from '@/components/ProfileCard'

// ─── Constants ────────────────────────────────────────────────────────────────

// Maximum number of curated profiles shown to logged-out visitors.
const MAX = 20

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute age in whole years from a YYYY-MM-DD date string.
 * dob is used only to derive age here; it is never returned to the client.
 */
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

// ─── Route handler ────────────────────────────────────────────────────────────
//
// PUBLIC endpoint — NO authentication. Never returns 401. Exposes ONLY the
// curated showcase (public_showcase) intersected with profiles that are still
// discoverable + active + not deleted, so a profile that turns itself
// non-discoverable disappears even while listed in the showcase.
//
// The response is a strict allowlist of display-safe fields (SearchCard). Private
// fields (dob, account_id, mobile, family_about, storage_path, …) are never
// returned.

export async function GET() {
  const admin = await createAdminClient()

  // ─── Step 1: Curated showcase entries (active only), ordered ───────────────
  const { data: showcaseRows, error: showcaseError } = await admin
    .from('public_showcase')
    .select('profile_id, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(MAX)

  if (showcaseError) {
    console.error('[public/profiles GET] showcase query error:', showcaseError.code, showcaseError.message)
    return NextResponse.json({ ok: false, message: 'Failed to load profiles' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showcase: any[] = showcaseRows ?? []
  if (showcase.length === 0) {
    return NextResponse.json({ ok: true, results: [] })
  }

  const orderByProfileId = new Map<string, number>()
  for (const s of showcase) {
    orderByProfileId.set(s.profile_id as string, s.sort_order as number)
  }
  const showcaseProfileIds = [...orderByProfileId.keys()]

  // ─── Step 2: Fetch the profiles — privacy gates enforced server-side ───────
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
        'about_me',
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

  if (profilesError) {
    console.error('[public/profiles GET] profiles query error:', profilesError.code, profilesError.message)
    return NextResponse.json({ ok: false, message: 'Failed to load profiles' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profiles: any[] = rawProfiles ?? []
  if (profiles.length === 0) {
    return NextResponse.json({ ok: true, results: [] })
  }

  // Preserve the curator's ordering (sort_order asc).
  profiles.sort(
    (a, b) =>
      (orderByProfileId.get(a.id as string) ?? 0) - (orderByProfileId.get(b.id as string) ?? 0)
  )

  // ─── Step 3: Batch-fetch location names ────────────────────────────────────
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
      console.error('[public/profiles GET] locations query error:', locationError.code, locationError.message)
    } else {
      for (const loc of locationRows ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const l = loc as any
        locationMap.set(l.id as number, l.name_en as string)
      }
    }
  }

  // ─── Step 4: Batch-fetch primary approved photos ───────────────────────────
  const profileIds = profiles.map((p) => p.id as string)

  const { data: photoRows, error: photosError } = await admin
    .from('profile_photos')
    .select('id, profile_id, storage_path, is_primary, status')
    .in('profile_id', profileIds)
    .eq('is_primary', true)
    .eq('status', 'approved')

  if (photosError) {
    console.error('[public/profiles GET] photos query error:', photosError.code, photosError.message)
  }

  // storage_path is kept internal to this scope — used to sign a URL, then discarded.
  const photoByProfile = new Map<string, { storage_path: string }>()
  for (const photo of photoRows ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = photo as any
    if (!photoByProfile.has(ph.profile_id as string)) {
      photoByProfile.set(ph.profile_id as string, { storage_path: ph.storage_path as string })
    }
  }

  // ─── Step 5: Generate signed URLs (best-effort, 1-hour expiry) ─────────────
  const signedUrlByProfile = new Map<string, string | null>()
  for (const [profileId, photo] of photoByProfile.entries()) {
    try {
      const { data: signed, error: signedError } = await admin.storage
        .from('profile-photos')
        .createSignedUrl(photo.storage_path, 3600)

      if (signedError) {
        console.error('[public/profiles GET] signed URL error for profile', profileId, signedError.message)
        signedUrlByProfile.set(profileId, null)
      } else {
        signedUrlByProfile.set(profileId, signed?.signedUrl ?? null)
      }
    } catch (err) {
      console.error('[public/profiles GET] signed URL exception for profile', profileId, err)
      signedUrlByProfile.set(profileId, null)
    }
  }

  // ─── Build response cards (strict allowlist) ───────────────────────────────
  const results: SearchCard[] = profiles.map((p) => {
    const firstName = (p.first_name ?? '') as string
    const lastName = p.last_name as string | null

    // Full display name: "FirstName LastName".
    const displayName = lastName && lastName.length > 0 ? `${firstName} ${lastName}` : firstName

    const age = p.dob ? computeAge(p.dob as string) : 0

    const aboutMe = p.about_me as string | null
    const aboutSnippet = aboutMe && aboutMe.length > 0 ? aboutMe.slice(0, 200) : null

    const hasPhoto = photoByProfile.has(p.id as string)
    const primaryPhotoUrl = signedUrlByProfile.get(p.id as string) ?? null

    return {
      id: p.id as string,
      display_name: displayName,
      gender: p.gender as string,
      age,
      religion: (p.religion as string | null) ?? null,
      caste: (p.caste as string | null) ?? null,
      self_gotra: (p.self_gotra as string | null) ?? null,
      mool: (p.mool as string | null) ?? null,
      gram: (p.gram as string | null) ?? null,
      height_cm: (p.height_cm as number | null) ?? null,
      diet: (p.diet as string | null) ?? null,
      about_snippet: aboutSnippet,
      profile_complete: (p.profile_complete as number) ?? 0,
      profile_status: p.profile_status as string,
      native_place_name: locationMap.get(p.native_place_id as number) ?? null,
      current_loc_name: locationMap.get(p.current_loc_id as number) ?? null,
      has_photo: hasPhoto,
      primary_photo_url: primaryPhotoUrl,
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

  return NextResponse.json({ ok: true, results })
}
