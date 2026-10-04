/**
 * Unknown birth time: which Moon-dependent values are actually fixed by the date?
 *
 * The Moon moves 12–15° a day, so on most dates it crosses at least one
 * nakshatra boundary. The Ashtakoota depends only on the Moon's rashi,
 * nakshatra and (for Dhanu/Makar) which half of the sign it is in. This splits
 * the birth date into the windows over which those three stay constant, so
 * the engine can ask "before or after about 14:22?" instead of guessing.
 */
import { siderealMoonAt } from './chart'
import { degreeInRashi, nakshatraIndexOf, rashiIndexOf } from './zodiac'
import { vashyaOf, type Vashya } from '../rules/tables'

export type MoonSegment = {
  index: number
  startUtc: number
  endUtc: number
  startLon: number
  endLon: number
  rashiIndex: number
  nakshatraIndex: number
  vashya: Vashya
}

type Key = { rashiIndex: number; nakshatraIndex: number; vashya: Vashya }

function keyOf(lon: number): Key {
  const rashiIndex = rashiIndexOf(lon)
  return { rashiIndex, nakshatraIndex: nakshatraIndexOf(lon), vashya: vashyaOf(rashiIndex, degreeInRashi(lon)) }
}

const sameKey = (a: Key, b: Key) =>
  a.rashiIndex === b.rashiIndex && a.nakshatraIndex === b.nakshatraIndex && a.vashya === b.vashya

// Boundaries that matter are never closer than 1°40′ (≈ 2.6 h of the fastest
// Moon), so a 20-minute grid cannot step over two of them at once.
const STEP_MS = 20 * 60_000

export function moonSegments(startUtc: number, endUtc: number): MoonSegment[] {
  const boundaries: number[] = []
  let prevT = startUtc
  let prevKey = keyOf(siderealMoonAt(startUtc))
  for (let t = Math.min(startUtc + STEP_MS, endUtc); ; t = Math.min(t + STEP_MS, endUtc)) {
    const k = keyOf(siderealMoonAt(t))
    if (!sameKey(k, prevKey)) {
      let lo = prevT
      let hi = t
      while (hi - lo > 1000) {
        const mid = Math.floor((lo + hi) / 2)
        if (sameKey(keyOf(siderealMoonAt(mid)), prevKey)) lo = mid
        else hi = mid
      }
      boundaries.push(hi)
      prevKey = k
    }
    prevT = t
    if (t >= endUtc) break
  }

  const edges = [startUtc, ...boundaries, endUtc]
  const segments: MoonSegment[] = []
  for (let i = 0; i < edges.length - 1; i += 1) {
    const s = edges[i]
    const e = i === edges.length - 2 ? edges[i + 1] : edges[i + 1] - 1000
    const startLon = siderealMoonAt(s)
    const k = keyOf(startLon)
    segments.push({ index: i, startUtc: s, endUtc: e, startLon, endLon: siderealMoonAt(e), ...k })
  }
  return segments
}
