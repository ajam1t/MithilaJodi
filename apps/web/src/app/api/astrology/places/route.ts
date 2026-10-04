import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit } from '@/lib/astrology/server/rateLimit'
import { searchKnownPlaces, searchOpenStreetMap } from '@/lib/astrology/server/places'

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
