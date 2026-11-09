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

export type LimitRule = {
  test: (method: string, path: string) => boolean; scope: string; limit: number; windowMs: number
  /** Also counted in the database, across every server instance (see sharedLimit). */
  shared?: boolean
}

const MIN = 60_000
const HOUR = 60 * MIN
const isWrite = (m: string) => m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS'

/** First match wins. Order: specific rules, then the general ceiling. */
export const LIMIT_RULES: LimitRule[] = [
  // Chat: a fast typist sends a message every couple of seconds; a script sends hundreds.
  { test: (m, p) => m === 'POST' && /^\/api\/conversations\/[^/]+\/messages$/.test(p), scope: 'msg', shared: true, limit: 30, windowMs: MIN },
  { test: (m, p) => m === 'POST' && p === '/api/reports', scope: 'report', shared: true, limit: 10, windowMs: HOUR },
  { test: (m, p) => m === 'POST' && (p === '/api/contact-requests' || p === '/api/photo-requests'), scope: 'request', shared: true, limit: 30, windowMs: HOUR },
  { test: (m, p) => m === 'POST' && p === '/api/profile/shares', scope: 'share', shared: true, limit: 30, windowMs: HOUR },
  { test: (m, p) => m === 'POST' && p === '/api/profile/photos', scope: 'photo', limit: 40, windowMs: HOUR },
  { test: (m, p) => m === 'POST' && p === '/api/account/export', scope: 'export', shared: true, limit: 5, windowMs: HOUR },
  { test: (m, p) => m === 'POST' && p === '/api/biodata/generate', scope: 'biodata', limit: 60, windowMs: HOUR },
  // Each challenge costs a bcrypt hash and a row; a sign-up needs one or two.
  { test: (m, p) => m === 'POST' && p.startsWith('/api/auth/human/'), scope: 'human', shared: true, limit: 30, windowMs: 10 * MIN },
  { test: (m, p) => m === 'POST' && p.startsWith('/api/auth/password/'), scope: 'password', shared: true, limit: 20, windowMs: 15 * MIN },
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

/** The rule a request falls under, if any. */
export function ruleFor(method: string, path: string): LimitRule | undefined {
  return LIMIT_RULES.find(r => r.test(method, path))
}

/**
 * The same limit, counted in Postgres so it holds across serverless instances
 * (migration 20261110000002: rate_limit_hit). One short request to Supabase,
 * made only for rules marked `shared` — writes that are rare for a person and
 * attractive to a script. Fails open: a missing function, a slow or failed
 * call, or missing configuration all mean "allowed", and the in-memory limit
 * above still applies. The key is a SHA-256 of the scope and the client, so no
 * cookie or IP address is stored.
 */
export async function sharedLimit(
  rule: LimitRule, client: string,
  env: { url?: string; key?: string }, fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!rule.shared || !env.url || !env.key) return true
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${rule.scope}:${client}`))
    const key = rule.scope + ':' + Array.from(new Uint8Array(digest).slice(0, 16), b => b.toString(16).padStart(2, '0')).join('')
    const res = await fetchImpl(`${env.url}/rest/v1/rpc/rate_limit_hit`, {
      method: 'POST',
      headers: { apikey: env.key, Authorization: `Bearer ${env.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_key: key, p_limit: rule.limit, p_window_seconds: Math.round(rule.windowMs / 1000) }),
      signal: AbortSignal.timeout(1500),
      cache: 'no-store',
    })
    if (!res.ok) return true
    return (await res.json()) !== false
  } catch {
    return true
  }
}

/** True when a write names an Origin that is not this site. */
export function isCrossSiteWrite(method: string, origin: string | null, host: string | null): boolean {
  if (!isWrite(method) || !origin || !host) return false
  if (origin === 'null') return true   // sandboxed frame, data: URL and the like
  try { return new URL(origin).host.toLowerCase() !== host.toLowerCase() } catch { return true }
}

/** For tests. */
export function _resetLimits() { buckets.clear(); lastSweep = 0 }
