import type { BiodataData } from './biodata'

/**
 * Digital Profile → biodata form, for a signed-in member opening the public
 * maker at /marriage-biodata.
 *
 * Pure and synchronous so it can be tested without a database: the server
 * loader (biodataProfile.server.ts) reads the rows and resolves ids and master
 * keys to labels, then hands everything here. The result is form-ready — the
 * date of birth stays `YYYY-MM-DD` for the date input, and age is derived from
 * it by the builder as it is for a guest.
 *
 * Where each biodata field comes from:
 *
 *   full_name         profiles.first_name + last_name
 *   dob               profiles.dob
 *   gender            profiles.gender (enum, humanised)
 *   height            profiles.height_cm, shown as feet/inches and cm
 *   marital_status    profiles.marital_status (community master)
 *   mother_tongue     profiles.mother_tongue (community master)
 *   religion, caste, sub_caste, self_gotra, maternal_gotra, mool
 *                     profiles.* (community masters)
 *   gram              profiles.gram (free text)
 *   diet, smoking, drinking
 *                     profiles.* (master or legacy free text)
 *   education         profiles.degree + specialization, else education_detail,
 *                     else the education level's label; then institution
 *   profession        profiles.job_title, else profession_detail, else the
 *                     profession's label
 *   employer          profiles.employer
 *   income            profile_private.income_range, else income_min/max_lpa
 *   current_location  profiles.current_loc_id → india_locations, with state
 *   native_place      profiles.native_place_id → india_locations, with state
 *   about_me          profiles.about_me (paragraphs kept)
 *   family_type, family_values
 *                     profiles.* (community masters)
 *   parents           profiles.parents_info
 *   siblings          profiles.siblings_info
 *   expectations      profiles.family_expectations
 *   family_about      profiles.family_about, plus family_introduction when it
 *                     says something different (older and newer forms each
 *                     wrote one of the two)
 *   rashi, nakshatra, mangalik, birth_time, birth_place
 *                     profile_private.*
 *   mobile, email, address
 *                     profile_private.contact_mobile / contact_email / address
 *
 * Deliberately left out: account and system fields (ids, status, moderation,
 * completeness, timestamps), managed_by, visibility settings, partner
 * preferences, the kundli link, and anything medical. The profile has no
 * father's or mother's name columns, so those stay for the member to type;
 * nothing is invented to fill a gap.
 */

export type ProfileRow = {
  first_name?: string | null
  last_name?: string | null
  gender?: string | null
  dob?: string | null
  height_cm?: number | null
  marital_status?: string | null
  mother_tongue?: string | null
  religion?: string | null
  caste?: string | null
  sub_caste?: string | null
  self_gotra?: string | null
  maternal_gotra?: string | null
  mool?: string | null
  gram?: string | null
  diet?: string | null
  smoking?: string | null
  drinking?: string | null
  degree?: string | null
  specialization?: string | null
  institution?: string | null
  education_detail?: string | null
  job_title?: string | null
  profession_detail?: string | null
  employer?: string | null
  about_me?: string | null
  family_about?: string | null
  family_introduction?: string | null
  family_type?: string | null
  family_values?: string | null
  parents_info?: string | null
  siblings_info?: string | null
  family_expectations?: string | null
}

export type PrivateRow = {
  income_range?: string | null
  income_min_lpa?: number | null
  income_max_lpa?: number | null
  rashi?: string | null
  nakshatra?: string | null
  mangalik?: string | null
  birth_time?: string | null
  birth_place?: string | null
  contact_mobile?: string | null
  contact_email?: string | null
  address?: string | null
}

/** Ids and master keys already resolved to display labels by the loader. */
export type ResolvedLabels = {
  /** (master type, stored key) → label; falls back to a readable key. */
  label: (type: string, value: string | null | undefined) => string | null
  educationLevel?: string | null
  profession?: string | null
  currentLocation?: string | null
  nativePlace?: string | null
}

/** Trims, and turns blank or whitespace-only strings into null. */
export function clean(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).replace(/\r\n?/g, '\n').trim()
  return s ? s : null
}

const humanize = (v: string | null | undefined) => {
  const s = clean(v)
  return s ? (s.charAt(0).toUpperCase() + s.slice(1)).replace(/_/g, ' ') : null
}

/** 162 → `5'4" (162 cm)`. Out-of-range values are dropped rather than printed. */
export function formatHeight(cm: number | null | undefined): string | null {
  if (cm == null || !Number.isFinite(cm) || cm < 100 || cm > 250) return null
  const inches = Math.round(cm / 2.54)
  return `${Math.floor(inches / 12)}'${inches % 12}" (${Math.round(cm)} cm)`
}

/** A real calendar date as `YYYY-MM-DD`, or null. Accepts timestamps too. */
export function formDate(v: string | null | undefined): string | null {
  const m = clean(v)?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? `${m[1]}-${m[2]}-${m[3]}` : null
}

/** Joins the parts that have content, skipping any already contained in an earlier one. */
function joinDistinct(parts: Array<string | null | undefined>, sep: string): string | null {
  const out: string[] = []
  for (const p of parts) {
    const s = clean(p)
    if (s && !out.some(o => o.toLowerCase().includes(s.toLowerCase()))) out.push(s)
  }
  return out.length ? out.join(sep) : null
}

function income(priv: PrivateRow, label: ResolvedLabels['label']): string | null {
  const range = label('income_range', clean(priv.income_range))
  if (range) return range
  const lo = priv.income_min_lpa, hi = priv.income_max_lpa
  if (lo != null && hi != null && hi > 0) return lo === hi ? `₹${lo} LPA` : `₹${lo} – ${hi} LPA`
  if (hi != null && hi > 0) return `Up to ₹${hi} LPA`
  if (lo != null && lo > 0) return `₹${lo} LPA+`
  return null
}

export function profileToBiodata(p: ProfileRow, priv: PrivateRow | null, r: ResolvedLabels): BiodataData {
  const q = priv ?? {}
  const L = (type: string, v: string | null | undefined) => r.label(type, clean(v))

  const education = joinDistinct([
    clean(p.degree) ? joinDistinct([p.degree, p.specialization], ', ') : (clean(p.education_detail) ?? r.educationLevel),
    p.institution,
  ], ' — ')

  const out: BiodataData = {
    full_name: joinDistinct([p.first_name, p.last_name], ' '),
    dob: formDate(p.dob),
    gender: humanize(p.gender),
    height: formatHeight(p.height_cm),
    marital_status: L('marital_status', p.marital_status),
    mother_tongue: L('mother_tongue', p.mother_tongue),

    religion: L('religion', p.religion),
    caste: L('caste', p.caste),
    sub_caste: L('sub_caste', p.sub_caste),
    self_gotra: L('gotra', p.self_gotra),
    maternal_gotra: L('gotra', p.maternal_gotra),
    mool: L('mool', p.mool),
    gram: clean(p.gram),

    diet: L('diet', p.diet),
    smoking: humanize(p.smoking),
    drinking: humanize(p.drinking),

    education,
    profession: clean(p.job_title) ?? clean(p.profession_detail) ?? clean(r.profession),
    employer: clean(p.employer),
    income: income(q, r.label),

    current_location: clean(r.currentLocation),
    native_place: clean(r.nativePlace),

    about_me: clean(p.about_me),

    family_type: L('family_type', p.family_type),
    family_values: L('family_values', p.family_values),
    parents: clean(p.parents_info),
    siblings: clean(p.siblings_info),
    expectations: clean(p.family_expectations),
    family_about: joinDistinct([p.family_about, p.family_introduction], '\n\n'),

    rashi: L('rashi', q.rashi),
    nakshatra: L('nakshatra', q.nakshatra),
    mangalik: L('manglik', q.mangalik),
    birth_time: clean(q.birth_time),
    birth_place: clean(q.birth_place),

    mobile: clean(q.contact_mobile),
    email: clean(q.contact_email),
    address: clean(q.address),
  }

  // Only populated fields travel; an absent key never blanks what the member typed.
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v != null)) as BiodataData
}
