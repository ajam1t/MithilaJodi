/**
 * Request guards that run in middleware, in front of every API route.
 *
 * Two things, both cheap and both a second line of defence — every route still
 * does its own session and permission checks:
 *
 * 1. Cross-site writes are refused. A browser attaches an Origin header to any
 *    cross-origin POST/PUT/PATCH/DELETE; when it names another site, the request
 *    did not come from our own pages. (The session cookie is SameSite=Lax, which
 *    already keeps it off cross-site POSTs; this also covers a browser that
 *    ignores that.) Requests with no Origin — server-to-server calls, some old
 *    browsers on same-origin — pass.
 *
 * 2. Burst limits, per signed-in session or, without one, per IP. Held in
 *    memory per server instance, so they are a brake on one client hammering one
 *    instance, not a global quota — the daily caps that matter (interests, OTPs,
 *    password attempts) are enforced in the database by their own routes.
 *
 * No imports from Node: this file runs on the Edge runtime.
 */

export type LimitRule = { test: (method: string, path: string) => boolean; scope: string; limit: number; windowMs: number }

const MIN = 60_000
const HOUR = 60 * MIN
const isWrite = (m: string) => m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS'

/** First match wins. Order: specific rules, then the general ceiling. */
export const LIMIT_RULES: LimitRule[] = [
  // Chat: a fast typist sends a message every couple of seconds; a script sends hundreds.
  { test: (m, p) => m === 'POST' && /^\/api\/conversations\/[^/]+\/messages$/.test(p), scope: 'msg', limit: 30, windowMs: MIN },
  { test: (m, p) => m === 'POST' && p === '/api/reports', scope: 'report', limit: 10, windowMs: HOUR },
  { test: (m, p) => m === 'POST' && (p === '/api/contact-requests' || p === '/api/photo-requests'), scope: 'request', limit: 30, windowMs: HOUR },
  { test: (m, p) => m === 'POST' && p === '/api/profile/shares', scope: 'share', limit: 30, windowMs: HOUR },
  { test: (m, p) => m === 'POST' && p === '/api/profile/photos', scope: 'photo', limit: 40, windowMs: HOUR },
  { test: (m, p) => m === 'POST' && p === '/api/account/export', scope: 'export', limit: 5, windowMs: HOUR },
  { test: (m, p) => m === 'POST' && p === '/api/biodata/generate', scope: 'biodata', limit: 60, windowMs: HOUR },
  // Each challenge costs a bcrypt hash and a row; a sign-up needs one or two.
  { test: (m, p) => m === 'POST' && p.startsWith('/api/auth/human/'), scope: 'human', limit: 30, windowMs: 10 * MIN },
  { test: (m, p) => m === 'POST' && p.startsWith('/api/auth/password/'), scope: 'password', limit: 20, windowMs: 15 * MIN },
  // Profile discovery: paging and filtering quickly is normal; scraping is not.
  { test: (m, p) => m === 'GET' && (p === '/api/search' || p === '/api/public/profiles'), scope: 'search', limit: 90, windowMs: MIN },
  // Page-view beacons.
  { test: (_m, p) => p === '/api/t', scope: 'beacon', limit: 120, windowMs: MIN },
  // The Command Centre does bulk work and is behind its own sign-in and PIN.
  { test: (_m, p) => p.startsWith('/api/admin/'), scope: 'admin', limit: 600, windowMs: MIN },
  // Everything else that changes something.
  { test: (m, p) => isWrite(m) && p.startsWith('/api/'), scope: 'write', limit: 120, windowMs: MIN },
]

const buckets = new Map<string, number[]>()
let lastSweep = 0

/** Small non-cryptographic hash: keys never leave memory and are never logged. */
function fnv(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return (h >>> 0).toString(36) + s.length.toString(36)
}

export function checkLimit(method: string, path: string, client: string, now = Date.now()): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const rule = LIMIT_RULES.find(r => r.test(method, path))
  if (!rule) return { ok: true }
  if (now - lastSweep > MIN) {
    lastSweep = now
    for (const [k, times] of buckets) if (!times.length || now - times[times.length - 1] > HOUR) buckets.delete(k)
  }
  const key = `${rule.scope}:${fnv(client)}`
  const recent = (buckets.get(key) ?? []).filter(t => now - t < rule.windowMs)
  if (recent.length >= rule.limit) {
    buckets.set(key, recent)
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((rule.windowMs - (now - recent[0])) / 1000)) }
  }
  recent.push(now)
  buckets.set(key, recent)
  return { ok: true }
}

/** True when a write names an Origin that is not this site. */
export function isCrossSiteWrite(method: string, origin: string | null, host: string | null): boolean {
  if (!isWrite(method) || !origin || !host) return false
  if (origin === 'null') return true   // sandboxed frame, data: URL and the like
  try { return new URL(origin).host.toLowerCase() !== host.toLowerCase() } catch { return true }
}

/** For tests. */
export function _resetLimits() { buckets.clear(); lastSweep = 0 }
