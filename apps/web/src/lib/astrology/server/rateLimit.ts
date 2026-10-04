import 'server-only'
import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * Sliding-window limiter, in memory per server instance.
 *
 * Serverless instances do not share memory, so this is a brake on a single
 * client hammering one instance — not a global quota. It keeps the public
 * calculation and geocoding endpoints from being trivially scripted without
 * adding a datastore round trip to every request. IPs are hashed before they
 * are used as keys and never logged.
 */
const buckets = new Map<string, number[]>()
let lastSweep = 0

function clientKey(request: NextRequest, scope: string): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  return `${scope}:${createHash('sha256').update(ip).digest('base64url').slice(0, 22)}`
}

export function rateLimit(
  request: NextRequest,
  scope: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now()
  if (now - lastSweep > 60_000) {
    lastSweep = now
    for (const [k, times] of buckets) if (!times.length || now - times[times.length - 1] > 3_600_000) buckets.delete(k)
  }
  const key = clientKey(request, scope)
  const recent = (buckets.get(key) ?? []).filter(t => now - t < windowMs)
  if (recent.length >= limit) {
    buckets.set(key, recent)
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000)) }
  }
  recent.push(now)
  buckets.set(key, recent)
  return { ok: true }
}
