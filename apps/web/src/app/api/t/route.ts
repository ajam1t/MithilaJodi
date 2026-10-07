import 'server-only'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { EVENT_NAMES, isUntracked, normalizePath } from '@/lib/analytics'

/*
 * Collector for first-party usage analytics (lib/analytics.ts, lib/track.ts).
 *
 * Accepts only the known event names and shapes, re-normalises the path so a
 * crafted request still cannot store an id, drops obvious bots, and stores no
 * request metadata (no IP, no user agent). Always answers 204 so a failure here
 * can never surface on the page.
 */

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor/i
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NAMES = new Set<string>(EVENT_NAMES)
const DEVICES = new Set(['mobile', 'tablet', 'desktop'])

const none = () => new Response(null, { status: 204 })

/** Only the live production deployment records; local and preview runs share the database. */
const COLLECT = process.env.VERCEL_ENV === 'production'

export async function POST(request: NextRequest) {
  if (!COLLECT) return none()
  try {
    if (BOT.test(request.headers.get('user-agent') ?? '')) return none()
    const raw = await request.text()
    if (raw.length > 1500) return none()
    const b = JSON.parse(raw) as Record<string, unknown>

    const name = typeof b.n === 'string' && NAMES.has(b.n) ? b.n : null
    const visitor = typeof b.vid === 'string' && UUID.test(b.vid) ? b.vid : null
    if (!name || !visitor) return none()
    const path = normalizePath(typeof b.p === 'string' ? b.p : '/')
    if (isUntracked(path)) return none()

    const k = typeof b.k === 'string' ? b.k.replace(/[^\w:.\-/]/g, '').slice(0, 120) || null : null
    const v = typeof b.v === 'number' && Number.isFinite(b.v) ? Math.max(-1e9, Math.min(1e9, b.v)) : null
    const ref = typeof b.r === 'string' && /^[a-z0-9.-]{1,100}$/i.test(b.r) ? b.r.toLowerCase() : null

    const admin = await createAdminClient()
    await admin.from('site_events').insert({
      name,
      path,
      visitor,
      new_visitor: b.nv === true,
      landing: name === 'page_view' && b.l === true,
      device: typeof b.d === 'string' && DEVICES.has(b.d) ? b.d : null,
      ref_host: name === 'page_view' ? ref : null,
      k,
      v,
    })
  } catch {
    // Malformed body or a transient DB error: analytics must never break a page.
  }
  return none()
}
