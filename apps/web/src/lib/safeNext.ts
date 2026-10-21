// Edge- and client-safe — no Node.js APIs, no server-only imports.

/**
 * The return path ("next") that carries a visitor back to where they were
 * through login, registration and onboarding.
 *
 * `next` arrives in the query string, so anyone can craft it. Only a
 * same-site relative path is honoured: it must start with a single '/', not
 * '//' or '/\' (both are protocol-relative to a browser, i.e. another site),
 * hold no control characters or backslashes (a browser strips tabs and
 * newlines, so '/\t/evil.com' would become '//evil.com'), and no scheme.
 * As a final check it is resolved against a placeholder origin and must
 * stay on it. Anything else is dropped, never "repaired".
 *
 * /login and /register are refused as destinations too, so a signed-in
 * member sent back to them cannot bounce between the two.
 */

const MAX_NEXT_LENGTH = 1024
const PLACEHOLDER_ORIGIN = 'https://next.invalid'
const AUTH_PAGES = ['/login', '/register']

export function getSafeNextPath(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string' || !raw || raw.length > MAX_NEXT_LENGTH) return null
  if (raw[0] !== '/' || raw[1] === '/' || raw[1] === '\\') return null
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return null

  let url: URL
  try { url = new URL(raw, PLACEHOLDER_ORIGIN) } catch { return null }
  if (url.origin !== PLACEHOLDER_ORIGIN) return null

  // Dot segments are resolved by the parse: '/..//evil.com' becomes
  // '//evil.com', so the result is checked again, not just the input.
  const path = url.pathname
  if (path[1] === '/' || path[1] === '\\') return null
  if (AUTH_PAGES.some(p => path === p || path.startsWith(p + '/'))) return null
  return path + url.search + url.hash
}

/**
 * Where a member goes once signed in. The console has its own sign-in, and a
 * member-login session never carries admin rights (lib/auth.ts), so staff
 * heading for /admin are sent to /admin/login and everyone else to /home
 * rather than to a 404.
 */
export function getPostLoginPath(next: string | null, staff: boolean): string {
  if (next && /^\/admin(?:[/?#]|$)/.test(next)) return staff ? '/admin/login' : '/home'
  return next ?? '/home'
}

/** `href` with `next` added to its query string; `href` unchanged when there is no next. */
export function withNext(href: string, next: string | null | undefined): string {
  if (!next) return href
  return `${href}${href.includes('?') ? '&' : '?'}next=${encodeURIComponent(next)}`
}

/**
 * Registration spans /register and the /welcome pages, so the return path is
 * also kept for the tab in sessionStorage — a backup for when a step's URL
 * loses it. The query string stays the primary carrier; whatever is read back
 * is checked again by getSafeNextPath.
 */
export const JOIN_NEXT_KEY = 'mj-join-next'

export function rememberJoinNext(next: string | null) {
  try {
    if (next) sessionStorage.setItem(JOIN_NEXT_KEY, next)
    else sessionStorage.removeItem(JOIN_NEXT_KEY)
  } catch { /* storage unavailable */ }
}

export function recallJoinNext(): string | null {
  try { return getSafeNextPath(sessionStorage.getItem(JOIN_NEXT_KEY)) } catch { return null }
}
