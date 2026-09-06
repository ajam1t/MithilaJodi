import 'server-only'
import { haversineKm, type LocationInfo } from '@/lib/matchScore'

/**
 * In-memory index of india_locations.
 *
 * The table is a few hundred rows of reference data that changes only when a
 * migration adds places, so it is loaded once per server process and reused.
 * That is what makes "everywhere within 150 km of Thane" a Set lookup instead of
 * a PostGIS query — search calls it on every request, and on the relaxation
 * passes it can be called several times for one request.
 *
 * The TTL exists only so a seed migration takes effect without a redeploy.
 */

const TTL_MS = 10 * 60 * 1000

type Index = {
  byId: Map<number, LocationInfo>
  loadedAt: number
}

let cached: Index | null = null
let inflight: Promise<Index> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function load(admin: any): Promise<Index> {
  const byId = new Map<number, LocationInfo>()
  // Paged so this cannot silently truncate at PostgREST's default row cap once
  // the table grows past it.
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from('india_locations')
      .select('id, level, parent_id, state_code, latitude, longitude, is_mithila_region')
      .range(from, from + PAGE - 1)
    if (error) {
      console.error('[locationIndex] load failed:', error.message)
      break
    }
    const rows = data ?? []
    for (const r of rows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = r as any
      byId.set(l.id as number, {
        id: l.id, level: l.level, parent_id: l.parent_id,
        state_code: l.state_code, latitude: l.latitude, longitude: l.longitude,
        is_mithila_region: !!l.is_mithila_region,
      })
    }
    if (rows.length < PAGE) break
  }
  return { byId, loadedAt: Date.now() }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getLocationIndex(admin: any): Promise<Map<number, LocationInfo>> {
  if (cached && Date.now() - cached.loadedAt < TTL_MS) return cached.byId
  // Collapse concurrent misses onto one query rather than one per request.
  if (!inflight) {
    inflight = load(admin).then(idx => { cached = idx; inflight = null; return idx })
  }
  return (await inflight).byId
}

/**
 * Every location id within `km` of `originId`, including the origin itself and
 * anything in the same administrative branch (a district's cities, a city's
 * district) regardless of distance — a member who says "Darbhanga" should match
 * someone who says "Laheriasarai" even if the coordinates disagree.
 */
export function idsWithin(
  index: Map<number, LocationInfo>, originId: number, km: number,
): Set<number> {
  const out = new Set<number>([originId])
  const origin = index.get(originId)
  if (!origin) return out

  for (const [id, loc] of index) {
    if (id === originId) continue
    // Direct ancestry is automatic; siblings still have to earn it on distance.
    if (loc.parent_id === originId || origin.parent_id === id) { out.add(id); continue }
    if (
      origin.latitude != null && origin.longitude != null &&
      loc.latitude != null && loc.longitude != null &&
      haversineKm(origin.latitude, origin.longitude, loc.latitude, loc.longitude) <= km
    ) {
      out.add(id)
    }
  }
  return out
}

/** Every location id sharing `originId`'s state, including the state row. */
export function idsInSameState(
  index: Map<number, LocationInfo>, originId: number,
): Set<number> {
  const out = new Set<number>([originId])
  const origin = index.get(originId)
  if (!origin?.state_code) return out
  for (const [id, loc] of index) {
    if (loc.state_code === origin.state_code) out.add(id)
  }
  return out
}

/** Ordered nearest-first list of place ids, for "nothing here — try these". */
export function nearestIds(
  index: Map<number, LocationInfo>, originId: number, limit: number,
): number[] {
  const origin = index.get(originId)
  if (!origin || origin.latitude == null || origin.longitude == null) return []
  const scored: Array<[number, number]> = []
  for (const [id, loc] of index) {
    if (id === originId) continue
    if (loc.latitude == null || loc.longitude == null) continue
    scored.push([id, haversineKm(origin.latitude, origin.longitude, loc.latitude, loc.longitude)])
  }
  scored.sort((a, b) => a[1] - b[1])
  return scored.slice(0, limit).map(([id]) => id)
}
