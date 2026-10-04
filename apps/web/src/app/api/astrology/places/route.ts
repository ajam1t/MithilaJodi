import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit } from '@/lib/astrology/server/rateLimit'
import { searchByPincode, searchKnownPlaces, searchOpenStreetMap } from '@/lib/astrology/server/places'
import { PIN_RE } from '@/lib/pincode'

/**
 * Public, read-only birthplace lookup for the astrology tools.
 *
 * Separate from /api/locations (session-gated) on purpose: these tools work
 * without an account, and the shared session check must not be loosened to
 * allow that. This route returns reference geography only — no member data.
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 80)
  const provider = request.nextUrl.searchParams.get('provider') === 'osm' ? 'osm' : 'known'

  // A six-digit entry is an Indian PIN code, not a place name.
  if (PIN_RE.test(q)) {
    const pinLimited = rateLimit(request, 'places-pin', { limit: 20, windowMs: 5 * 60_000 })
    if (!pinLimited.ok) {
      return NextResponse.json(
        { ok: false, message: 'Too many PIN lookups — please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(pinLimited.retryAfterSeconds) } },
      )
    }
    try {
      const found = await searchByPincode(q)
      return NextResponse.json(
        { ok: true, ...found, attribution: '© OpenStreetMap contributors; India Post' },
        { headers: { 'Cache-Control': 'public, max-age=3600' } },
      )
    } catch (e) {
      console.error('[astrology/places] PIN lookup failed:', e instanceof Error ? e.message : 'unknown')
      return NextResponse.json(
        { ok: false, message: 'Could not look up that PIN code right now. Type the town or district name instead.' },
        { status: 502 },
      )
    }
  }

  const limited = provider === 'osm'
    ? rateLimit(request, 'places-osm', { limit: 15, windowMs: 5 * 60_000 })
    : rateLimit(request, 'places', { limit: 120, windowMs: 5 * 60_000 })
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, message: 'Too many searches — please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
    )
  }

  if (q.length < 2) return NextResponse.json({ ok: true, results: [] })

  try {
    const results = provider === 'osm' ? await searchOpenStreetMap(q) : await searchKnownPlaces(q)
    return NextResponse.json(
      { ok: true, results, ...(provider === 'osm' ? { attribution: '© OpenStreetMap contributors' } : {}) },
      { headers: { 'Cache-Control': 'public, max-age=300' } },
    )
  } catch (e) {
    console.error('[astrology/places] lookup failed:', provider, e instanceof Error ? e.message : 'unknown')
    return NextResponse.json(
      { ok: false, message: 'Place search is not responding right now. You can enter the coordinates manually instead.' },
      { status: 502 },
    )
  }
}
