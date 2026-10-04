import 'server-only'

/**
 * India Post PIN lookup with the platform-wide pincode_lookups cache. Shared by
 * the profile editor (/api/pincode) and the public astrology birthplace field.
 *
 * A PIN code's district does not change, so a successful answer is cached for
 * good; a "no such PIN" answer is cached too (when the caller allows it) so a
 * mistyped PIN is not retried upstream. An upstream failure is never cached —
 * it is our failure, not a statement about the PIN.
 */

export const PIN_RE = /^[1-9][0-9]{5}$/
const UPSTREAM = 'https://api.postalpincode.in/pincode/'
const UPSTREAM_TIMEOUT_MS = 4000

type PostOffice = { Name?: string; District?: string; State?: string; Block?: string }

export type PinLookup =
  | { status: 'ok'; state: string | null; district: string | null; places: string[]; locationId: number | null; cached: boolean }
  | { status: 'not_found'; cached: boolean }
  | { status: 'unavailable' }

export async function lookupPincode(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  pin: string,
  { cacheNotFound = true }: { cacheNotFound?: boolean } = {},
): Promise<PinLookup> {
  const { data: cached } = await admin
    .from('pincode_lookups')
    .select('pincode, state, district, places, location_id, status')
    .eq('pincode', pin)
    .maybeSingle()

  if (cached) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = cached as any
    if (c.status === 'not_found') return { status: 'not_found', cached: true }
    return {
      status: 'ok', state: c.state ?? null, district: c.district ?? null,
      places: (c.places ?? []) as string[], locationId: c.location_id ?? null, cached: true,
    }
  }

  // Miss: ask India Post, with a timeout so a slow upstream cannot hold the input hostage.
  let offices: PostOffice[] = []
  try {
    const res = await fetch(`${UPSTREAM}${pin}`, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`upstream ${res.status}`)
    const body = await res.json()
    const first = Array.isArray(body) ? body[0] : null
    if (first?.Status === 'Success' && Array.isArray(first.PostOffice)) offices = first.PostOffice as PostOffice[]
  } catch (err) {
    console.error('[pincode] upstream lookup failed for', pin, err)
    return { status: 'unavailable' }
  }

  if (offices.length === 0) {
    if (cacheNotFound) await admin.from('pincode_lookups').upsert({ pincode: pin, status: 'not_found', places: [] })
    return { status: 'not_found', cached: false }
  }

  const district = offices[0].District?.trim() || null
  const state = offices[0].State?.trim() || null
  const places = [...new Set(offices.map(o => o.Name?.trim()).filter((n): n is string => !!n))].sort()

  await admin.from('pincode_lookups').upsert({
    pincode: pin, state, district, places, location_id: null, status: 'ok', fetched_at: new Date().toISOString(),
  })
  return { status: 'ok', state, district, places, locationId: null, cached: false }
}
