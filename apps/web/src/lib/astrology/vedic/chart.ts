/**
 * Sidereal chart construction: ephemeris output → planets in rashi, nakshatra,
 * pada and whole-sign house, plus the Moon attributes the Ashtakoota needs.
 */
import { astroMoment, tropicalAscendant, tropicalLongitude, type AstroMoment } from '../ephemeris/positions'
import { lahiriAyanamsha } from './ayanamsha'
import {
  GRAHAS, NAKSHATRAS, RASHIS, degreeInRashi, nakshatraIndexOf, normalizeDeg, padaOf, rashiIndexOf,
  type GrahaId,
} from './zodiac'
import {
  GANA_BY_NAKSHATRA, NADI_BY_NAKSHATRA, VARNA_BY_RASHI, YONI_BY_NAKSHATRA, vashyaOf,
} from '../rules/tables'
import type { LagnaPosition, MoonProfile, PlanetPosition } from '../types'

export type SiderealSnapshot = {
  utcMs: number
  ayanamsha: number
  longitudes: Record<GrahaId, number>
  moment: AstroMoment
}

export function siderealLongitudesAt(utcMs: number): SiderealSnapshot {
  const moment = astroMoment(utcMs)
  const ayanamsha = lahiriAyanamsha(moment.ttDays)
  const longitudes = {} as Record<GrahaId, number>
  for (const g of GRAHAS) longitudes[g.id] = normalizeDeg(tropicalLongitude(g.id, moment) - ayanamsha)
  return { utcMs, ayanamsha, longitudes, moment }
}

/** Sidereal Moon longitude only — cheap enough to bisect boundaries with. */
export function siderealMoonAt(utcMs: number): number {
  const moment = astroMoment(utcMs)
  return normalizeDeg(tropicalLongitude('moon', moment) - lahiriAyanamsha(moment.ttDays))
}

/** Sidereal Sun and Moon only — the panchang's inputs, cheap enough to scan a year with. */
export function siderealSunMoonAt(utcMs: number): { sun: number; moon: number } {
  const moment = astroMoment(utcMs)
  const ayanamsha = lahiriAyanamsha(moment.ttDays)
  return {
    sun: normalizeDeg(tropicalLongitude('sun', moment) - ayanamsha),
    moon: normalizeDeg(tropicalLongitude('moon', moment) - ayanamsha),
  }
}

/** Signed shortest angular difference b − a, in (−180, 180]. */
export function angularDelta(a: number, b: number): number {
  let d = normalizeDeg(b - a)
  if (d > 180) d -= 360
  return d
}

const HALF_DAY = 43_200_000

/** Daily motion of every graha by central difference over one day. */
export function dailyMotion(utcMs: number): Record<GrahaId, number> {
  const before = siderealLongitudesAt(utcMs - HALF_DAY).longitudes
  const after = siderealLongitudesAt(utcMs + HALF_DAY).longitudes
  const out = {} as Record<GrahaId, number>
  for (const g of GRAHAS) out[g.id] = angularDelta(before[g.id], after[g.id])
  return out
}

export function siderealLagna(snapshot: SiderealSnapshot, latitude: number, longitude: number): number {
  return normalizeDeg(tropicalAscendant(snapshot.moment, latitude, longitude) - snapshot.ayanamsha)
}

export function lagnaPosition(lon: number): LagnaPosition {
  const rashiIndex = rashiIndexOf(lon)
  const nak = nakshatraIndexOf(lon)
  return {
    longitude: lon,
    rashi: RASHIS[rashiIndex].slug,
    rashiIndex,
    degreeInRashi: degreeInRashi(lon),
    nakshatra: NAKSHATRAS[nak].slug,
    pada: padaOf(lon),
  }
}

export function wholeSignHouse(planetRashi: number, firstHouseRashi: number): number {
  return ((planetRashi - firstHouseRashi + 12) % 12) + 1
}

export function planetPositions(
  longitudes: Record<GrahaId, number>,
  speeds: Record<GrahaId, number>,
  lagnaRashiIndex: number | null,
): PlanetPosition[] {
  const moonRashi = rashiIndexOf(longitudes.moon)
  return GRAHAS.map(({ id }) => {
    const lon = longitudes[id]
    const rashiIndex = rashiIndexOf(lon)
    const nakshatraIndex = nakshatraIndexOf(lon)
    return {
      id,
      longitude: lon,
      rashi: RASHIS[rashiIndex].slug,
      rashiIndex,
      degreeInRashi: degreeInRashi(lon),
      nakshatra: NAKSHATRAS[nakshatraIndex].slug,
      nakshatraIndex,
      pada: padaOf(lon),
      house: lagnaRashiIndex == null ? null : wholeSignHouse(rashiIndex, lagnaRashiIndex),
      houseFromMoon: wholeSignHouse(rashiIndex, moonRashi),
      // Mean nodes always move backwards; Sun and Moon never do.
      retrograde: id === 'rahu' || id === 'ketu' ? true : id === 'sun' || id === 'moon' ? false : speeds[id] < 0,
      speed: speeds[id],
    }
  })
}

/** Ashtakoota attributes of a Moon longitude. */
export function moonProfile(lon: number, pada: MoonProfile['pada'] = padaOf(lon)): MoonProfile {
  const rashiIndex = rashiIndexOf(lon)
  const nakshatraIndex = nakshatraIndexOf(lon)
  const deg = degreeInRashi(lon)
  return {
    longitude: lon,
    rashi: RASHIS[rashiIndex].slug,
    rashiIndex,
    rashiLord: RASHIS[rashiIndex].lord,
    degreeInRashi: deg,
    nakshatra: NAKSHATRAS[nakshatraIndex].slug,
    nakshatraIndex,
    nakshatraLord: NAKSHATRAS[nakshatraIndex].lord,
    pada,
    varna: VARNA_BY_RASHI[rashiIndex],
    vashya: vashyaOf(rashiIndex, deg),
    yoni: YONI_BY_NAKSHATRA[nakshatraIndex],
    gana: GANA_BY_NAKSHATRA[nakshatraIndex],
    nadi: NADI_BY_NAKSHATRA[nakshatraIndex],
  }
}
