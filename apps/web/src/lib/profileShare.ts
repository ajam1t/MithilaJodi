import 'server-only'
import { randomBytes } from 'crypto'
import { getCommunityLabels, labelFor } from '@/lib/communityLabels'
import { formatPartnerPreferences } from '@/lib/partnerPreferences'
import type { PartnerPreferencesDisplay } from '@/types/profile'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Shareable profile links.
 *
 * A member mints a link to their own profile and sends it on WhatsApp; the
 * recipient opens it with no account. Every gate lives in `loadSharedProfile`
 * so there is exactly one place where "may this token see this field" is
 * decided — the page is then purely presentational and cannot accidentally
 * render something the link did not grant.
 *
 * These links are UNLISTED, not private. A WhatsApp link gets forwarded and
 * screenshotted, so the model is: the owner chooses what a link exposes, the
 * link expires, and the owner can kill it.
 */

// ─── Sections ────────────────────────────────────────────────────────────────

export const SHARE_SECTIONS = [
  { key: 'basic',     label: 'Name, age, height',   hint: 'Always included.', locked: true },
  { key: 'photos',    label: 'Photos',              hint: 'Your approved photos.' },
  { key: 'community', label: 'Community',           hint: 'Caste, gotra, maternal gotra, mool, gram.' },
  { key: 'location',  label: 'Location',            hint: 'Where you live, your native place.' },
  { key: 'education', label: 'Education',           hint: 'Degree, specialisation, institution.' },
  { key: 'career',    label: 'Career',              hint: 'Role, employer, industry, experience.' },
  { key: 'lifestyle', label: 'Lifestyle',           hint: 'Diet, habits, marriage timeline.' },
  { key: 'family',    label: 'Family',              hint: 'Family type, values, parents, siblings.' },
  { key: 'about',     label: 'About you',           hint: 'Your own words.' },
  { key: 'horoscope', label: 'Horoscope',           hint: 'Rashi, nakshatra, manglik, birth details.' },
  {
    key: 'preferences',
    label: 'What you are looking for',
    hint: 'Your partner preferences — age, community, education, location, timeline.',
  },
  {
    key: 'contact',
    label: 'Contact details',
    hint: 'Mobile, email and address. Off by default — anyone the link reaches would get these.',
    sensitive: true,
  },
] as const

export type ShareSection = typeof SHARE_SECTIONS[number]['key']

export const DEFAULT_SHARE_FIELDS: ShareSection[] = [
  'basic', 'photos', 'community', 'location', 'education', 'career', 'lifestyle', 'family', 'about',
]

const VALID_SECTIONS = new Set<string>(SHARE_SECTIONS.map(s => s.key))

/** Keep only known sections, and always keep `basic` — a blank link is useless. */
export function sanitiseFields(input: unknown): ShareSection[] {
  const list = Array.isArray(input) ? input : []
  const kept = list.filter((v): v is ShareSection => typeof v === 'string' && VALID_SECTIONS.has(v))
  return [...new Set<ShareSection>(['basic', ...kept])]
}

/**
 * 16 random bytes as base64url — 22 characters, ~128 bits.
 *
 * Deliberately not the profile's UUID: that would make the link permanent and
 * unrevocable, and would leak an internal id that appears elsewhere in the API.
 */
export function generateShareToken(): string {
  return randomBytes(16).toString('base64url')
}

// ─── Loading a shared profile ────────────────────────────────────────────────

export type SharedProfile = {
  displayName: string
  age: number | null
  gender: string | null
  heightCm: number | null
  maritalStatus: string | null
  motherTongue: string | null
  profileFor: string | null

  photos: string[]

  community: {
    religion: string | null; caste: string | null; subCaste: string | null
    selfGotra: string | null; maternalGotra: string | null
    mool: string | null; gram: string | null
  } | null
  location: { current: string | null; native: string | null; work: string | null } | null
  education: { degree: string | null; specialization: string | null; institution: string | null; passingYear: number | null; detail: string | null } | null
  career: { jobTitle: string | null; employer: string | null; industry: string | null; employmentType: string | null; workType: string | null; experienceYears: number | null; detail: string | null } | null
  lifestyle: { diet: string | null; smoking: string | null; drinking: string | null; marriageTimeline: string | null } | null
  family: { type: string | null; values: string | null; parents: string | null; siblings: string | null; about: string | null; introduction: string | null } | null
  about: string | null
  horoscope: { rashi: string | null; nakshatra: string | null; manglik: string | null; birthTime: string | null; birthPlace: string | null } | null
  contact: { mobile: string | null; email: string | null; address: string | null } | null
  preferences: PartnerPreferencesDisplay | null
}

export type ShareLoadResult =
  /**
   * `profileId` is returned alongside the projection so the page can offer a
   * signed-in visitor the full member view. It is an opaque uuid and the page
   * only ever puts it in a link to /profile/<id>, which enforces its own access
   * rules — the shared projection itself stays the same for everyone.
   */
  | { status: 'ok'; profile: SharedProfile; profileId: string }
  | { status: 'expired' }
  | { status: 'revoked' }
  | { status: 'missing' }

function computeAge(dob: string): number | null {
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function humanize(v: string | null | undefined): string | null {
  if (!v) return null
  const s = String(v).replace(/_/g, ' ').trim()
  if (!s) return null
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Null out a whole section unless the link granted it. */
function gate<T>(granted: boolean, value: T): T | null {
  return granted ? value : null
}

/**
 * Resolve a share token to a display-safe profile.
 *
 * Every reason to refuse is checked here: the token must exist, the link must
 * be live, and the underlying profile and account must still be in good
 * standing. A profile that has been deleted, deactivated or banned stops being
 * reachable through an old link immediately — the link is a view onto live
 * data, never a snapshot.
 */
export async function loadSharedProfile(admin: any, token: string): Promise<ShareLoadResult> {
  if (!token || token.length < 16 || token.length > 64) return { status: 'missing' }

  const { data: share } = await admin
    .from('profile_shares')
    .select('id, profile_id, fields, expires_at, revoked_at, view_count')
    .eq('token', token)
    .maybeSingle()

  if (!share) return { status: 'missing' }
  if (share.revoked_at) return { status: 'revoked' }
  if (new Date(share.expires_at).getTime() <= Date.now()) return { status: 'expired' }

  const granted = new Set<string>(sanitiseFields(share.fields))

  const { data: p } = await admin
    .from('profiles')
    .select(
      'id, account_id, profile_for, first_name, last_name, gender, dob, religion, caste, sub_caste, ' +
      'self_gotra, maternal_gotra, mool, gram, height_cm, diet, smoking, drinking, marital_status, ' +
      'mother_tongue, about_me, family_about, family_type, family_values, parents_info, siblings_info, ' +
      'family_introduction, native_place_id, current_loc_id, job_loc_id, education_detail, degree, ' +
      'specialization, institution, passing_year, job_title, employer, industry, employment_type, ' +
      'work_type, experience_years, profession_detail, marriage_timeline, profile_status'
    )
    .eq('id', share.profile_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!p) return { status: 'missing' }
  if (p.profile_status === 'deleted' || p.profile_status === 'deactivated') return { status: 'missing' }

  const { data: account } = await admin
    .from('accounts')
    .select('account_status, deleted_at, mobile')
    .eq('id', p.account_id)
    .maybeSingle()
  if (!account) return { status: 'missing' }
  if (account.deleted_at || account.account_status === 'banned' || account.account_status === 'deleted') {
    return { status: 'missing' }
  }

  // ── Locations ──
  const locIds = [p.native_place_id, p.current_loc_id, p.job_loc_id].filter(Boolean)
  const locMap = new Map<number, string>()
  if (granted.has('location') && locIds.length > 0) {
    const { data: locs } = await admin.from('india_locations').select('id, name_en').in('id', locIds)
    for (const l of locs ?? []) locMap.set(l.id, l.name_en)
  }

  // ── Photos ──
  // The owner minted this link deliberately, so the share's own setting governs
  // rather than their connections-only photo preference — that preference is
  // about strangers browsing search, not about a link they chose to send.
  const photos: string[] = []
  if (granted.has('photos')) {
    const { data: rows } = await admin
      .from('profile_photos')
      .select('storage_path, is_primary, display_order')
      .eq('profile_id', p.id)
      .eq('status', 'approved')
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })
      .limit(5)
    const paths = (rows ?? []).map((r: any) => r.storage_path).filter(Boolean)
    if (paths.length > 0) {
      const { data: signed } = await admin.storage.from('profile-photos').createSignedUrls(paths, 3600)
      for (const s of signed ?? []) if (s?.signedUrl) photos.push(s.signedUrl)
    }
  }

  // ── Partner preferences ──
  let preferences: PartnerPreferencesDisplay | null = null
  if (granted.has('preferences')) {
    const { data: prefRow } = await admin
      .from('profile_preferences')
      .select('*')
      .eq('profile_id', p.id)
      .maybeSingle()
    preferences = await formatPartnerPreferences(admin, prefRow)
  }

  // ── Private details, only for the sections that need them ──
  let priv: any = null
  if (granted.has('horoscope') || granted.has('contact')) {
    const { data } = await admin
      .from('profile_private')
      .select('rashi, nakshatra, mangalik, birth_time, birth_place, contact_mobile, contact_email, address')
      .eq('profile_id', p.id)
      .maybeSingle()
    priv = data ?? null
  }

  // Community values are stored as option keys; the shared page is display-only,
  // so they are resolved to labels here.
  const labels = await getCommunityLabels(admin)

  const profile: SharedProfile = {
    displayName: [p.first_name, p.last_name].filter(Boolean).join(' '),
    age: p.dob ? computeAge(p.dob) : null,
    gender: humanize(p.gender),
    heightCm: p.height_cm ?? null,
    maritalStatus: humanize(p.marital_status),
    motherTongue: humanize(p.mother_tongue),
    profileFor: humanize(p.profile_for),

    photos,

    community: gate(granted.has('community'), {
      religion: labelFor(labels, 'religion', p.religion),
      caste: labelFor(labels, 'caste', p.caste),
      subCaste: p.sub_caste ?? null,
      selfGotra: labelFor(labels, 'gotra', p.self_gotra),
      maternalGotra: p.maternal_gotra ?? null,
      mool: labelFor(labels, 'mool', p.mool),
      gram: p.gram ?? null,
    }),

    location: gate(granted.has('location'), {
      current: p.current_loc_id ? locMap.get(p.current_loc_id) ?? null : null,
      native: p.native_place_id ? locMap.get(p.native_place_id) ?? null : null,
      work: p.job_loc_id ? locMap.get(p.job_loc_id) ?? null : null,
    }),

    education: gate(granted.has('education'), {
      degree: p.degree ?? null,
      specialization: p.specialization ?? null,
      institution: p.institution ?? null,
      passingYear: p.passing_year ?? null,
      detail: p.education_detail ?? null,
    }),

    career: gate(granted.has('career'), {
      jobTitle: p.job_title ?? null,
      employer: p.employer ?? null,
      industry: humanize(p.industry),
      employmentType: humanize(p.employment_type),
      workType: humanize(p.work_type),
      experienceYears: p.experience_years ?? null,
      detail: p.profession_detail ?? null,
    }),

    lifestyle: gate(granted.has('lifestyle'), {
      diet: humanize(p.diet),
      smoking: humanize(p.smoking),
      drinking: humanize(p.drinking),
      marriageTimeline: humanize(p.marriage_timeline),
    }),

    family: gate(granted.has('family'), {
      type: humanize(p.family_type),
      values: humanize(p.family_values),
      parents: p.parents_info ?? null,
      siblings: p.siblings_info ?? null,
      about: p.family_about ?? null,
      introduction: p.family_introduction ?? null,
    }),

    about: gate(granted.has('about'), p.about_me ?? null),

    horoscope: gate(granted.has('horoscope') && !!priv, {
      rashi: humanize(priv?.rashi),
      nakshatra: humanize(priv?.nakshatra),
      manglik: humanize(priv?.mangalik),
      birthTime: priv?.birth_time ?? null,
      birthPlace: priv?.birth_place ?? null,
    }),

    // The registered mobile is the fallback only when the member has not given a
    // separate contact number — and only ever on a link that granted contact.
    contact: gate(granted.has('contact'), {
      mobile: priv?.contact_mobile ?? account.mobile ?? null,
      email: priv?.contact_email ?? null,
      address: priv?.address ?? null,
    }),

    // Already null when the family stated nothing, so an enabled-but-empty
    // section drops out of the page rather than printing an empty panel.
    preferences,
  }

  // Best-effort view counting. Never blocks the render, and a failure here must
  // not cost the visitor the page.
  void admin
    .from('profile_shares')
    .update({ view_count: (share.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
    .eq('id', share.id)
    .then(null, (err: unknown) => console.error('[profileShare] view count:', err))

  return { status: 'ok', profile, profileId: p.id as string }
}
