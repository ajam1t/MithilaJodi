/*
 * First-party usage analytics — the shared, client-safe part.
 *
 * What is recorded (site_events): an event name, a normalised path, a random
 * id this browser keeps in localStorage (so "unique visitors" are real people-
 * ish, not page views), whether it was new, whether this was the first page of
 * a visit, a coarse device class, the referring site's hostname on entry, and
 * at most one short dimension (a tool or festival slug) or a number (web
 * vitals). Never: IP address, user agent, account id, names, form contents.
 *
 * Paths are normalised here AND again on the server, so member ids, share
 * tokens and invitation slugs never reach the database.
 */

export const EVENT_NAMES = [
  'page_view',
  'web_vital',
  'astrology_tool_used', // k = tool slug (see ASTROLOGY_TOOL_SLUGS)
  'biodata_downloaded', // the public no-login biodata maker
  'invitation_card_made', // basic invitation card downloaded or shared
  'song_played', // k = festival slug
  'dp_shared', // a member shares their Digital Profile link; k = channel
] as const

export type EventName = (typeof EVENT_NAMES)[number]

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Routes whose dynamic segment identifies a person, link or invitation. */
const REDACT: Array<[RegExp, string]> = [
  [/^\/p\/[^/]+/, '/p/:token'],
  [/^\/profile\/(?!edit\b|preferences\b)[^/]+/, '/profile/:id'],
  [/^\/messages\/[^/]+/, '/messages/:id'],
  [/^\/Invitation\/[^/]+/i, '/Invitation/:slug'],
  [/^\/wedding\/[^/]+/, '/wedding/:name'],
  [/^\/biodata\/preview\/[^/]+/, '/biodata/preview/:id'],
  [/^\/astrology\/kundli-match\/result\/[^/]+/, '/astrology/kundli-match/result/:token'],
]

/** Drop query/hash and replace anything identifying with a placeholder. */
export function normalizePath(raw: string): string {
  let path = (raw || '/').split(/[?#]/)[0] || '/'
  if (!path.startsWith('/')) path = '/' + path
  for (const [re, to] of REDACT) {
    if (re.test(path)) { path = path.replace(re, to); break }
  }
  // Belt and braces: any remaining id-like segment is masked too.
  path = path
    .split('/')
    .map(seg => (UUID.test(seg) ? ':id' : seg.length >= 20 && /\d/.test(seg) && /[a-z]/i.test(seg) ? ':token' : seg))
    .join('/')
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path.slice(0, 200)
}

/** Paths that are never recorded at all. */
export function isUntracked(path: string): boolean {
  return path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/_next')
}

export type Device = 'mobile' | 'tablet' | 'desktop'
