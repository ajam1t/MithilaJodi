import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import type { BirthPlace } from '../types'

/**
 * Birthplace resolution for the public astrology tools.
 *
 *  1. Mithila Jodi's own india_locations (districts and cities with
 *     coordinates) — instant, typeahead-safe.
 *  2. OpenStreetMap Nominatim, India only, on an explicit "search more places"
 *     action — never per keystroke, which Nominatim's usage policy forbids.
 *     Results are cached and requests are throttled to ≤1 per second.
 *  3. Manual coordinates + time zone, handled entirely in the form.
 *
 * Every Indian place resolves to Asia/Kolkata; historical offsets for that zone
 * (war time, pre-1906 Madras time) are applied by the engine from the date.
 */

export type PlaceSuggestion = BirthPlace & { detail: string }

type Row = { id: number; level: string; name: string; parentId: number | null; lat: number; lng: number; mithila: boolean }

type PlaceIndex = { rows: Row[]; byId: Map<number, Row>; loadedAt: number }

const TTL_MS = 30 * 60_000
let cache: PlaceIndex | null = null
let inflight: Promise<PlaceIndex> | null = null

async function load(): Promise<PlaceIndex> {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('india_locations')
    .select('id, level, name_en, parent_id, latitude, longitude, is_mithila_region')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(5000)
  if (error) throw new Error(`india_locations: ${error.message}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: Row[] = ((data ?? []) as any[]).map(r => ({
    id: r.id, level: r.level, name: r.name_en, parentId: r.parent_id,
    lat: Number(r.latitude), lng: Number(r.longitude), mithila: !!r.is_mithila_region,
  }))
  return { rows, byId: new Map(rows.map(r => [r.id, r])), loadedAt: Date.now() }
}

async function index(): Promise<PlaceIndex> {
  if (cache && Date.now() - cache.loadedAt < TTL_MS) return cache
  if (!inflight) inflight = load().then(c => { cache = c; inflight = null; return c }).catch(e => { inflight = null; throw e })
  return inflight
}

// Country and state centroids are hundreds of kilometres from most births.
const SEARCHABLE = new Set(['district', 'city', 'town', 'village'])
const LEVEL_WEIGHT: Record<string, number> = { city: 0, town: 0, village: 1, district: 2 }

function ancestry(row: Row, byId: Map<number, Row>): string[] {
  const out: string[] = []
  let p = row.parentId != null ? byId.get(row.parentId) : undefined
  while (p && p.level !== 'country') {
    out.push(p.name)
    p = p.parentId != null ? byId.get(p.parentId) : undefined
  }
  return out
}

export async function searchKnownPlaces(q: string): Promise<PlaceSuggestion[]> {
  const needle = q.trim().toLowerCase()
  if (needle.length < 2) return []
  const { rows, byId } = await index()
  return rows
    .filter(r => SEARCHABLE.has(r.level) && r.name.toLowerCase().includes(needle))
    .map(r => {
      const name = r.name.toLowerCase()
      const rank = (name === needle ? -1000 : name.startsWith(needle) ? -500 : 0) + (r.mithila ? -50 : 0) + (LEVEL_WEIGHT[r.level] ?? 3)
      return { r, rank }
    })
    .sort((a, b) => a.rank - b.rank || a.r.name.localeCompare(b.r.name))
    .slice(0, 8)
    .map(({ r }) => {
      const parents = ancestry(r, byId)
      return {
        label: [r.name, ...parents].join(', '),
        detail: r.level === 'district' ? 'District (centre)' : r.level[0].toUpperCase() + r.level.slice(1),
        latitude: r.lat,
        longitude: r.lng,
        timezone: 'Asia/Kolkata',
        source: 'mithila-jodi' as const,
      }
    })
}

// ─── Nominatim ───────────────────────────────────────────────────────────────

const osmCache = new Map<string, { at: number; results: PlaceSuggestion[] }>()
const OSM_TTL_MS = 7 * 24 * 3_600_000
let osmQueue: Promise<unknown> = Promise.resolve()
let lastOsmCall = 0

/** OpenStreetMap's generic address types, in the terms Indian users know. */
const OSM_KIND: Record<string, string> = {
  county: 'Block / tehsil (centre)',
  state_district: 'District (centre)',
  state: 'State (centre)',
  municipality: 'Municipality',
  hamlet: 'Hamlet',
}

const USER_AGENT ='MithilaJodi-KundliMatch/1.0 (+https://mithilajodi.com/contact)'

export async function searchOpenStreetMap(q: string): Promise<PlaceSuggestion[]> {
  const key = q.trim().toLowerCase().replace(/\s+/g, ' ')
  if (key.length < 2) return []
  const hit = osmCache.get(key)
  if (hit && Date.now() - hit.at < OSM_TTL_MS) return hit.results

  // Serialise and space calls at ≥1.1 s, per Nominatim's usage policy.
  const run = osmQueue.then(async () => {
    const wait = lastOsmCall + 1100 - Date.now()
    if (wait > 0) await new Promise(r => setTimeout(r, wait))
    lastOsmCall = Date.now()
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', key)
    url.searchParams.set('countrycodes', 'in')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', '8')
    url.searchParams.set('accept-language', 'en')
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`nominatim ${res.status}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (await res.json()) as any[]
  })
  osmQueue = run.catch(() => undefined)
  const raw = await run

  const seen = new Set<string>()
  const results: PlaceSuggestion[] = []
  for (const r of raw) {
    if (r?.address?.country_code !== 'in') continue
    const lat = Number(r.lat)
    const lng = Number(r.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const label = String(r.display_name ?? '').replace(/,\s*India$/, '').replace(/,\s*\d{6}(?=,|$)/, '')
    const kind = String(r.addresstype ?? r.type ?? 'place')
    // A town and its surrounding block often share a name; keep both.
    if (!label || seen.has(`${label}|${kind}`)) continue
    seen.add(`${label}|${kind}`)
    results.push({
      label,
      detail: OSM_KIND[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1).replace(/_/g, ' '),
      latitude: Math.round(lat * 1e5) / 1e5,
      longitude: Math.round(lng * 1e5) / 1e5,
      timezone: 'Asia/Kolkata',
      source: 'openstreetmap',
    })
  }
  if (osmCache.size > 500) osmCache.delete(osmCache.keys().next().value as string)
  osmCache.set(key, { at: Date.now(), results })
  return results
}
