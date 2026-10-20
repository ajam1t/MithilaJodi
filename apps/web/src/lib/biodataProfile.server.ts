import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import { getCommunityLabels, labelFor } from '@/lib/communityLabels'
import { ensurePrimaryShare } from '@/lib/digitalProfileOwner'
import { SITE_URL } from '@/lib/constants'
import { loadPartnerPreferences } from '@/lib/partnerPreferences'
import type { BiodataData } from '@/lib/biodata'
import { profileToBiodata, type PrivateRow, type ProfileRow } from '@/lib/biodataProfile'

/**
 * Reads the signed-in member's own Digital Profile for the biodata maker.
 *
 * The only input is the session's account id — never an id from the browser —
 * and the profile is found the same way /api/biodata/generate finds it: the
 * member's most recently updated profile that is not deleted. Like the rest of
 * the member tools this goes through the admin client, so the account check
 * here is the access control.
 */

const PROFILE_COLUMNS = [
  'id', 'first_name', 'last_name', 'gender', 'dob', 'height_cm', 'marital_status', 'mother_tongue',
  'religion', 'caste', 'sub_caste', 'self_gotra', 'maternal_gotra', 'mool', 'gram',
  'diet', 'smoking', 'drinking',
  'education_level_id', 'degree', 'specialization', 'institution', 'passing_year', 'education_detail',
  'profession_id', 'job_title', 'profession_detail', 'employer', 'industry', 'employment_type', 'work_type',
  'experience_years', 'marriage_timeline',
  'current_loc_id', 'native_place_id', 'job_loc_id',
  'about_me', 'family_about', 'family_introduction', 'family_type', 'family_values',
  'parents_info', 'siblings_info', 'family_expectations',
].join(', ')

const PRIVATE_COLUMNS =
  'income_range, income_min_lpa, income_max_lpa, rashi, nakshatra, mangalik, birth_time, birth_place, contact_mobile, contact_relation, contact_email, address'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

export async function findOwnProfileId(admin: Admin, accountId: string): Promise<string | null> {
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', accountId)
    .neq('profile_status', 'deleted')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

type Loc = { id: number; parent_id: number | null; level: string; name_en: string }

/** "Madhubani, Bihar" — the place and the state it sits in, if that is known. */
async function placeNames(admin: Admin, ids: number[]): Promise<Record<number, string>> {
  const out: Record<number, string> = {}
  if (!ids.length) return out
  const byId = new Map<number, Loc>()
  let want = ids
  // A village sits at most four levels below its state.
  for (let depth = 0; depth < 5 && want.length; depth++) {
    const { data } = await admin.from('india_locations').select('id, parent_id, level, name_en').in('id', want)
    for (const l of (data ?? []) as Loc[]) byId.set(l.id, l)
    want = [...new Set(((data ?? []) as Loc[])
      .filter(l => l.level !== 'state' && l.level !== 'country' && l.parent_id != null && !byId.has(l.parent_id))
      .map(l => l.parent_id as number))]
  }
  for (const id of ids) {
    const place = byId.get(id)
    if (!place) continue
    let up = place.parent_id != null ? byId.get(place.parent_id) : undefined
    while (up && up.level !== 'state' && up.parent_id != null) up = byId.get(up.parent_id)
    out[id] = up?.level === 'state' && up.id !== place.id ? `${place.name_en}, ${up.name_en}` : place.name_en
  }
  return out
}

export async function loadOwnBiodata(accountId: string): Promise<{ data: BiodataData; hasPhoto: boolean } | null> {
  const admin = await createAdminClient()
  const profileId = await findOwnProfileId(admin, accountId)
  if (!profileId) return null

  const [{ data: rawProfile }, { data: rawPrivate }, { data: photo }, labels] = await Promise.all([
    admin.from('profiles').select(PROFILE_COLUMNS).eq('id', profileId).maybeSingle(),
    admin.from('profile_private').select(PRIVATE_COLUMNS).eq('profile_id', profileId).maybeSingle(),
    admin.from('profile_photos').select('id').eq('profile_id', profileId).eq('is_primary', true).eq('status', 'approved').limit(1).maybeSingle(),
    getCommunityLabels(admin),
  ])
  if (!rawProfile) return null
  const p = rawProfile as ProfileRow & { education_level_id?: number | null; profession_id?: number | null; current_loc_id?: number | null; native_place_id?: number | null; job_loc_id?: number | null }

  const [places, edu, prof, preferences] = await Promise.all([
    placeNames(admin, [p.current_loc_id, p.native_place_id, p.job_loc_id].filter((v): v is number => typeof v === 'number')),
    p.education_level_id ? admin.from('education_levels').select('label_en').eq('id', p.education_level_id).maybeSingle() : null,
    p.profession_id ? admin.from('professions').select('label_en').eq('id', p.profession_id).maybeSingle() : null,
    loadPartnerPreferences(admin, profileId).catch(() => null),
  ])

  const data = profileToBiodata(p, (rawPrivate as PrivateRow | null) ?? null, {
    label: (type, value) => labelFor(labels, type, value),
    educationLevel: (edu?.data as { label_en?: string } | null)?.label_en ?? null,
    profession: (prof?.data as { label_en?: string } | null)?.label_en ?? null,
    currentLocation: p.current_loc_id ? places[p.current_loc_id] ?? null : null,
    nativePlace: p.native_place_id ? places[p.native_place_id] ?? null : null,
    workLocation: p.job_loc_id ? places[p.job_loc_id] ?? null : null,
    preferences,
  })
  // The member's own live Digital Profile link, as the member Home shows it.
  // A member who switched their link off gets none; the biodata works without it.
  const share = await ensurePrimaryShare(admin, profileId).catch(() => null)
  if (share) data.profile_link = `${SITE_URL}/p/${share.token}`
  return { data, hasPhoto: !!photo }
}

/** The member's own primary approved photo, as bytes, or null. */
export async function loadOwnPhoto(accountId: string): Promise<{ bytes: ArrayBuffer; type: string } | null> {
  const admin = await createAdminClient()
  const profileId = await findOwnProfileId(admin, accountId)
  if (!profileId) return null
  const { data: photo } = await admin
    .from('profile_photos')
    .select('storage_path')
    .eq('profile_id', profileId)
    .eq('is_primary', true)
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle()
  const path = (photo as { storage_path?: string } | null)?.storage_path
  if (!path) return null
  const { data: blob, error } = await admin.storage.from('profile-photos').download(path)
  if (error || !blob) return null
  const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg'
  return { bytes: await blob.arrayBuffer(), type }
}
