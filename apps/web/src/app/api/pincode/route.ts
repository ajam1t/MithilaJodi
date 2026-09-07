import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

/**
 * Resolve an Indian PIN code to its district, state and the villages / post
 * offices it serves.
 *
 * Why this exists: members were asked to find their district and their
 * ancestral village by typing a name. People know their PIN code, and for a
 * village in Mithila the PIN is often the only thing they can state exactly.
 *
 * Why it is a server route and not a fetch from the browser:
 *  - the third-party call is made once per PIN for the whole platform and then
 *    cached, instead of once per keystroke per visitor;
 *  - the member's browser never talks to an unrelated service, so no PIN code
 *    is sent anywhere with their IP attached;
 *  - the outbound call has a timeout and a failure here degrades to "type the
 *    name instead" rather than a hanging input.
 *
 * Signed-in only. This is a convenience inside the profile editor, and leaving
 * it open would make the app a free proxy for the India Post API.
 */

const PIN_RE = /^[1-9][0-9]{5}$/
const UPSTREAM = 'https://api.postalpincode.in/pincode/'
const UPSTREAM_TIMEOUT_MS = 4000

type PostOffice = {
  Name?: string
  District?: string
  State?: string
  Block?: string
}

export type PincodeResult = {
  ok: boolean
  pincode: string
  state: string | null
  district: string | null
  /** Post office / village names served by this PIN. */
  places: string[]
  /** Matching india_locations row, when the district or city is one we hold. */
  location: { id: number; name: string; level: string } | null
  /** True when the answer came from our cache rather than India Post. */
  cached?: boolean
  message?: string
}

/**
 * Match a PIN's district (or one of its places) to an india_locations row.
 *
 * Preference order is deliberate: a district row is the right granularity for
 * "where are you from", and only if there is no district row do we accept a
 * city of the same name. Nothing is inserted — inventing a location row with no
 * coordinates would quietly break distance-based matching.
 */
async function resolveLocation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  district: string | null,
  state: string | null,
): Promise<{ id: number; name: string; level: string } | null> {
  if (!district) return null

  for (const level of ['district', 'city'] as const) {
    const { data } = await admin
      .from('india_locations')
      .select('id, name_en, level, state_code')
      .eq('level', level)
      .ilike('name_en', district)
      .limit(5)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []) as any[]
    if (rows.length === 0) continue
    // With more than one same-named place, prefer the one whose state matches.
    const byState = state
      ? rows.find(r => typeof r.state_code === 'string' && r.state_code.toLowerCase() === state.toLowerCase())
      : undefined
    const row = byState ?? rows[0]
    return { id: row.id as number, name: row.name_en as string, level: row.level as string }
  }
  return null
}

export async function GET(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  const pin = (request.nextUrl.searchParams.get('pin') ?? '').trim()
  if (!PIN_RE.test(pin)) {
    return NextResponse.json(
      { ok: false, pincode: pin, places: [], state: null, district: null, location: null,
        message: 'Enter a six-digit PIN code.' } satisfies PincodeResult,
      { status: 400 },
    )
  }

  const admin = await createAdminClient()

  // ── Cache first. A PIN code's district does not change, and a previously
  //    failed lookup is cached too so a mistyped PIN is not retried upstream on
  //    every keystroke.
  const { data: cached } = await admin
    .from('pincode_lookups')
    .select('pincode, state, district, places, location_id, status')
    .eq('pincode', pin)
    .maybeSingle()

  if (cached) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = cached as any
    if (c.status === 'not_found') {
      return NextResponse.json({
        ok: false, pincode: pin, state: null, district: null, places: [], location: null,
        cached: true, message: 'No such PIN code.',
      } satisfies PincodeResult)
    }
    let location: PincodeResult['location'] = null
    if (c.location_id) {
      const { data: loc } = await admin
        .from('india_locations').select('id, name_en, level').eq('id', c.location_id).maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (loc) location = { id: (loc as any).id, name: (loc as any).name_en, level: (loc as any).level }
    }
    return NextResponse.json({
      ok: true, pincode: pin, state: c.state ?? null, district: c.district ?? null,
      places: (c.places ?? []) as string[], location, cached: true,
    } satisfies PincodeResult)
  }

  // ── Miss: ask India Post, with a timeout so a slow upstream cannot hold the
  //    member's input hostage.
  let offices: PostOffice[] = []
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
    const res = await fetch(`${UPSTREAM}${pin}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    clearTimeout(timer)

    if (!res.ok) throw new Error(`upstream ${res.status}`)
    const body = await res.json()
    const first = Array.isArray(body) ? body[0] : null
    if (first?.Status === 'Success' && Array.isArray(first.PostOffice)) {
      offices = first.PostOffice as PostOffice[]
    }
  } catch (err) {
    console.error('[pincode] upstream lookup failed for', pin, err)
    // Not cached: this is our failure, not a statement about the PIN.
    return NextResponse.json({
      ok: false, pincode: pin, state: null, district: null, places: [], location: null,
      message: 'Could not look up that PIN code just now — please type the name instead.',
    } satisfies PincodeResult, { status: 503 })
  }

  if (offices.length === 0) {
    await admin.from('pincode_lookups').upsert({ pincode: pin, status: 'not_found', places: [] })
    return NextResponse.json({
      ok: false, pincode: pin, state: null, district: null, places: [], location: null,
      message: 'No such PIN code.',
    } satisfies PincodeResult)
  }

  const district = offices[0].District?.trim() || null
  const state = offices[0].State?.trim() || null
  const places = [...new Set(
    offices.map(o => o.Name?.trim()).filter((n): n is string => !!n),
  )].sort()

  const location = await resolveLocation(admin, district, state)

  await admin.from('pincode_lookups').upsert({
    pincode: pin,
    state,
    district,
    places,
    location_id: location?.id ?? null,
    status: 'ok',
    fetched_at: new Date().toISOString(),
  })

  return NextResponse.json({
    ok: true, pincode: pin, state, district, places, location, cached: false,
  } satisfies PincodeResult)
}
