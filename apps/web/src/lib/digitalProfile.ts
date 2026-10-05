/**
 * Digital Profile — the sections a shared link can show, and the rules for
 * link expiry. Client-safe: the owner dashboard and the server gate in
 * lib/profileShare read the same list, so they cannot drift apart. The server
 * still re-validates every key it is sent.
 */

export type SectionDef = {
  key: string
  label: string
  hint: string
  group: 'identity' | 'roots' | 'life' | 'private' | 'preview'
  locked?: boolean
  sensitive?: boolean
}

export const SHARE_SECTIONS = [
  { key: 'basic',          group: 'identity', label: 'Name, age, height',   hint: 'Always shown — a profile needs a name.', locked: true },
  { key: 'photos',         group: 'identity', label: 'Profile photos',      hint: 'Your approved photos.' },
  { key: 'about',          group: 'identity', label: 'About me',            hint: 'Your own words.' },
  { key: 'location',       group: 'identity', label: 'Location',            hint: 'Where you live and work, and your native place.' },
  { key: 'caste',          group: 'roots',    label: 'Community',           hint: 'Religion, caste, sub-caste, mother tongue.' },
  { key: 'gotra',          group: 'roots',    label: 'Gotra',               hint: 'Your own gotra.' },
  { key: 'maternal_gotra', group: 'roots',    label: 'Maternal gotra',      hint: 'Your mother’s gotra.' },
  { key: 'mool',           group: 'roots',    label: 'Mool',                hint: 'Your mool, for families who check it.' },
  { key: 'gram',           group: 'roots',    label: 'Native village',      hint: 'Your gram — the village your family is from.' },
  { key: 'education',      group: 'life',     label: 'Education',           hint: 'Degree, specialisation, institution.' },
  { key: 'career',         group: 'life',     label: 'Career',              hint: 'Role, employer, industry, experience.' },
  { key: 'family',         group: 'life',     label: 'Family',              hint: 'Family type, values, parents, siblings.' },
  { key: 'lifestyle',      group: 'life',     label: 'Lifestyle',           hint: 'Diet, habits, marriage timeline.' },
  { key: 'preferences',    group: 'life',     label: 'Looking for',         hint: 'The partner you are hoping for.' },
  { key: 'horoscope',      group: 'life',     label: 'Horoscope',           hint: 'Rashi, nakshatra, manglik, birth time and place.' },
  {
    key: 'contact', group: 'private', label: 'Contact details', sensitive: true,
    hint: 'Mobile, email and address. Anyone the link reaches would get them — including whoever it is forwarded to.',
  },
  {
    key: 'link_preview', group: 'preview', label: 'Show my name in link previews',
    hint: 'WhatsApp shows your name on the link card. Never your photo or any other detail.',
  },
] as const satisfies readonly SectionDef[]

export type ShareSection = typeof SHARE_SECTIONS[number]['key']

export const SECTION_GROUPS: Array<{ id: SectionDef['group']; title: string }> = [
  { id: 'identity', title: 'About you' },
  { id: 'roots', title: 'Mithila roots' },
  { id: 'life', title: 'Life & family' },
  { id: 'private', title: 'Private' },
  { id: 'preview', title: 'Link preview' },
]

/** What a new link shows: everything a family reads first, nothing private. */
export const DEFAULT_SHARE_FIELDS: ShareSection[] = [
  'basic', 'photos', 'about', 'location', 'caste', 'gotra', 'maternal_gotra', 'mool', 'gram',
  'education', 'career', 'family', 'lifestyle', 'link_preview',
]

const VALID = new Set<string>(SHARE_SECTIONS.map(s => s.key))

/**
 * Links made before the roots were split carry one 'community' key, which
 * showed caste, gotra, maternal gotra, mool and gram together. It expands to
 * exactly those, so an existing link shows what it always showed.
 */
const LEGACY: Record<string, ShareSection[]> = {
  community: ['caste', 'gotra', 'maternal_gotra', 'mool', 'gram'],
}

/** Keep only known sections, and always keep `basic` — a blank link is useless. */
export function sanitiseFields(input: unknown): ShareSection[] {
  const list = Array.isArray(input) ? input : []
  const out = new Set<ShareSection>(['basic'])
  for (const v of list) {
    if (typeof v !== 'string') continue
    if (LEGACY[v]) LEGACY[v].forEach(k => out.add(k))
    else if (VALID.has(v)) out.add(v as ShareSection)
  }
  return SHARE_SECTIONS.map(s => s.key).filter(k => out.has(k))
}

// ─── Expiry ─────────────────────────────────────────────────────────────────

/**
 * "No expiry" is stored as a far-future date rather than NULL: every check in
 * the codebase compares expires_at with now, and a sentinel keeps all of them
 * correct with no special case. Anything from 9000 on reads as "never".
 */
export const NO_EXPIRY_ISO = '9999-12-31T23:59:59.000Z'
export const isNoExpiry = (iso: string | null | undefined) => !!iso && new Date(iso).getUTCFullYear() >= 9000

/** Longest dated expiry a member can pick. */
export const MAX_EXPIRY_DAYS = 5 * 366

/**
 * Resolve an expiry request to the timestamp to store, or an error message.
 * `null` means no expiry; a date string is the last day the link works.
 */
export function resolveExpiry(input: { expires_at?: string | null; expires_in_days?: number }): { iso: string } | { error: string } | null {
  if (input.expires_at === null) return { iso: NO_EXPIRY_ISO }
  if (typeof input.expires_at === 'string') {
    const d = new Date(input.expires_at)
    if (Number.isNaN(d.getTime())) return { error: 'That date is not valid.' }
    // A bare date means "works through that day" (end of day, India time).
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.expires_at)) d.setTime(Date.parse(`${input.expires_at}T23:59:59+05:30`))
    if (d.getTime() <= Date.now()) return { error: 'Pick a date in the future.' }
    if (d.getTime() > Date.now() + MAX_EXPIRY_DAYS * 864e5) return { error: 'Pick a date within five years, or choose no expiry.' }
    return { iso: d.toISOString() }
  }
  if (input.expires_in_days) return { iso: new Date(Date.now() + input.expires_in_days * 864e5).toISOString() }
  return null
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const DIGITAL_PROFILE_PATH = '/digital-profile'

/** The WhatsApp message a member starts from; they can edit it before sending. */
export const DEFAULT_SHARE_MESSAGE = 'Sharing my Mithila Jodi Digital Profile with you. ❤️\n\nView my profile:\n{link}'
