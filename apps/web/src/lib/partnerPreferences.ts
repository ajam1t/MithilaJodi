import 'server-only'
import type { PartnerPreferencesDisplay } from '@/types/profile'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * "What we are looking for", resolved to display-ready strings.
 *
 * Two of the stored columns are id arrays (`pref_education` into
 * education_levels, `pref_location` into india_locations), so this cannot be a
 * pure formatter — it needs the database. One loader shared by the profile
 * gallery, another member's profile view and the shared-link page keeps the
 * three from describing the same preferences differently.
 */

const TIMELINE_LABELS: Record<string, string> = {
  within_3_months: 'Within 3 months',
  within_6_months: 'Within 6 months',
  within_1_year: 'Within a year',
  within_2_years: 'Within 2 years',
  no_rush: 'No fixed timeline',
}

function humanize(v: string | null | undefined): string | null {
  if (!v) return null
  const s = String(v).replace(/_/g, ' ').trim()
  if (!s) return null
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Join a text array into a readable list, dropping blanks. */
function list(arr: unknown): string | null {
  if (!Array.isArray(arr)) return null
  const items = arr.map(v => humanize(String(v))).filter(Boolean) as string[]
  return items.length > 0 ? items.join(', ') : null
}

function ageRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null) return `${min}–${max} years`
  if (min != null) return `${min} years and above`
  return `Up to ${max} years`
}

/**
 * Load and format one profile's partner preferences.
 *
 * Returns null when the member has stated nothing. `pref_gotra_safe` is
 * deliberately excluded from that emptiness test: the column is NOT NULL
 * DEFAULT true, so every profile has it whether or not anyone chose it.
 * Counting it would mean an untouched preferences form renders a panel reading
 * "Gotra-safe matches only" and nothing else — presenting a schema default as
 * something the family said.
 */
export async function loadPartnerPreferences(
  admin: any,
  profileId: string,
): Promise<PartnerPreferencesDisplay | null> {
  const { data: raw } = await admin
    .from('profile_preferences')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (!raw) return null
  return formatPartnerPreferences(admin, raw)
}

/** Same, when the caller already holds the row (search and match scoring do). */
export async function formatPartnerPreferences(
  admin: any,
  raw: any,
): Promise<PartnerPreferencesDisplay | null> {
  if (!raw) return null

  // Resolve the two id-array columns.
  let education: string | null = null
  const eduIds = Array.isArray(raw.pref_education) ? raw.pref_education.filter(Number.isFinite) : []
  if (eduIds.length > 0) {
    const { data } = await admin.from('education_levels').select('label_en').in('id', eduIds)
    const labels = (data ?? []).map((r: any) => r.label_en).filter(Boolean)
    education = labels.length > 0 ? labels.join(', ') : null
  }

  let location: string | null = null
  const locIds = Array.isArray(raw.pref_location) ? raw.pref_location.filter(Number.isFinite) : []
  if (locIds.length > 0) {
    const { data } = await admin.from('india_locations').select('name_en').in('id', locIds)
    const names = (data ?? []).map((r: any) => r.name_en).filter(Boolean)
    location = names.length > 0 ? names.join(', ') : null
  }

  const timelineRaw = raw.pref_marriage_timeline as string | null
  const marriageTimeline = timelineRaw
    ? TIMELINE_LABELS[timelineRaw] ?? humanize(timelineRaw)
    : null

  const prefs: PartnerPreferencesDisplay = {
    ageRange: ageRange(raw.pref_age_min ?? null, raw.pref_age_max ?? null),
    lookingFor: raw.pref_gender === 'male' ? 'Groom' : raw.pref_gender === 'female' ? 'Bride' : null,
    community: list(raw.pref_caste),
    maritalStatus: list(raw.pref_marital_status),
    education,
    profession: list(raw.pref_profession),
    location,
    diet: list(raw.pref_diet),
    marriageTimeline,
    manglik: humanize(raw.pref_manglik),
    children: humanize(raw.pref_children),
    livingArrangement: humanize(raw.pref_living_arrangement),
    career: raw.pref_career ?? null,
    notes: raw.pref_notes ?? null,
    gotraSafe: raw.pref_gotra_safe === true,
  }

  // Everything except gotraSafe, for the reason in the doc comment above.
  const stated = (Object.keys(prefs) as Array<keyof PartnerPreferencesDisplay>)
    .filter(k => k !== 'gotraSafe')
    .some(k => {
      const v = prefs[k]
      return v != null && v !== ''
    })

  return stated ? prefs : null
}
