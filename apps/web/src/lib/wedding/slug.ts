/**
 * The short public address of an invitation:
 *
 *   /Invitation/Muskan-Jha-Rahul-Kumar-15122026
 *
 * Built from the bride's name, the groom's name and the wedding date. Only
 * A–Z, a–z, 0–9 and single hyphens; Devanagari names are romanised. The slug
 * is an alias for finding an invitation — never an id and never a permission.
 * Stored lower-case for case-insensitive lookup, shown with its capitals.
 */
import { romanize } from './translit'

export const INVITATION_BASE = '/Invitation'

/** Words that may never be a whole slug (they read as app routes). */
const RESERVED = new Set([
  'admin', 'api', 'about', 'astrology', 'biodata', 'blogs', 'contact', 'digital-profile', 'edit', 'explore',
  'festival', 'festivals', 'festival-songs', 'help', 'interests', 'invitation', 'legal', 'login', 'logout',
  'marriage-biodata', 'marriage-invitation', 'matrimony', 'messages', 'new', 'p', 'premium', 'pricing', 'profile',
  'register', 'safety', 'search', 'settings', 'shortlists', 'signup', 'wedding', 'welcome',
])

const SLUG_SHAPE = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/
export const MAX_SLUG = 120

/** "muskan  jha" → "Muskan-Jha"; "मुस्कान" → "Muskan"; symbols dropped. */
export function slugName(name: string, fallback: string): string {
  const words = romanize(name ?? '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    // "RAHUL" and "rahul" both read as "Rahul"; a deliberate "McKenzie" is kept.
    .map(w => w[0].toUpperCase() + (w === w.toUpperCase() ? w.slice(1).toLowerCase() : w.slice(1)))
  const joined = words.join('-').slice(0, 40).replace(/-+$/, '')
  return joined || fallback
}

/** YYYY-MM-DD → DDMMYYYY. */
export function slugDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  return m ? `${m[3]}${m[2]}${m[1]}` : ''
}

/** The slug an invitation would get, before collisions are considered. */
export function baseSlug(bride: string, groom: string, date: string): string {
  const s = [slugName(bride, 'Bride'), slugName(groom, 'Groom'), slugDate(date)].filter(Boolean).join('-')
  return RESERVED.has(s.toLowerCase()) ? `${s}-Vivah` : s
}

/** A slug as it may appear in a URL. Anything else is not looked up at all. */
export function isSlug(s: string | undefined | null): s is string {
  return !!s && s.length <= MAX_SLUG && SLUG_SHAPE.test(s)
}

/** Strip a collision suffix (-2, -3…) so a renamed invitation can be compared with its base. */
export function slugStem(display: string): string {
  // The date is 8 digits, so a 1–3 digit tail can only be a collision suffix.
  return display.replace(/-\d{1,3}$/, '')
}

export function invitationPath(displaySlug: string): string {
  return `${INVITATION_BASE}/${displaySlug}`
}
