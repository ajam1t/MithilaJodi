/**
 * The ONLY module that computes astronomical positions.
 *
 * Everything returned is tropical and referred to the MEAN equinox of date:
 * apparent (light-time + aberration corrected) geocentric longitudes from
 * astronomy-engine are given relative to the TRUE equinox, so the nutation in
 * longitude is removed here. Subtracting the mean ayanamsha afterwards is then
 * equivalent to the usual Indian practice of subtracting the true ayanamsha
 * from true longitudes.
 *
 * Server-side only by convention: the library is ~150 kB and must never ship
 * to mobile clients. Only API routes import the engine.
 */
import * as Astronomy from 'astronomy-engine'
import { normalizeDeg, type GrahaId } from '../vedic/zodiac'

export type AstroMoment = {
  /** Days of Terrestrial Time since J2000 — used for precession/ayanamsha. */
  ttDays: number
  /** Nutation in longitude, degrees. */
  nutationLonDeg: number
  /** True obliquity of the ecliptic, degrees. */
  trueObliquityDeg: number
  /** Greenwich apparent sidereal time, degrees. */
  gastDeg: number
  time: Astronomy.AstroTime
}

export function astroMoment(utcMs: number): AstroMoment {
  const time = Astronomy.MakeTime(new Date(utcMs))
  const tilt = Astronomy.e_tilt(time)
  return {
    ttDays: time.tt,
    nutationLonDeg: tilt.dpsi / 3600,
    trueObliquityDeg: tilt.tobl,
    gastDeg: Astronomy.SiderealTime(time) * 15,
    time,
  }
}

const BODY: Partial<Record<GrahaId, Astronomy.Body>> = {
  sun: Astronomy.Body.Sun,
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
}

/** Tropical longitude on the ecliptic, mean equinox of date, degrees. */
export function tropicalLongitude(graha: GrahaId, m: AstroMoment): number {
  if (graha === 'rahu') return meanNodeLongitude(m.ttDays)
  if (graha === 'ketu') return normalizeDeg(meanNodeLongitude(m.ttDays) + 180)
  let trueLon: number
  if (graha === 'moon') {
    // Geocentric Moon on the true ecliptic of date. The Moon's aberration (<1″)
    // is below the precision that matters here and is not applied.
    trueLon = Astronomy.EclipticGeoMoon(m.time).lon
  } else {
    const body = BODY[graha]
    if (!body) throw new Error(`unsupported graha ${graha}`)
    trueLon = Astronomy.Ecliptic(Astronomy.GeoVector(body, m.time, true)).elon
  }
  return normalizeDeg(trueLon - m.nutationLonDeg)
}

/**
 * Mean longitude of the Moon's ascending node (Rahu), mean equinox of date.
 * Meeus, Astronomical Algorithms (2nd ed.), eq. 47.7.
 */
export function meanNodeLongitude(ttDays: number): number {
  const T = ttDays / 36525
  return normalizeDeg(
    125.0445479 - 1934.1362891 * T + 0.0020754 * T ** 2 + T ** 3 / 467441 - T ** 4 / 60616000,
  )
}

/**
 * First sunrise at or after `fromUtcMs` within a day — the instant the Sun's
 * upper limb crosses the horizon, with standard atmospheric refraction (the
 * convention of most Indian panchangs). null in polar day or night.
 */
export function sunriseAfter(fromUtcMs: number, latitudeDeg: number, longitudeDeg: number): number | null {
  const observer = new Astronomy.Observer(latitudeDeg, longitudeDeg, 0)
  const t = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, Astronomy.MakeTime(new Date(fromUtcMs)), 1)
  return t ? t.date.getTime() : null
}

/**
 * Tropical ascendant (mean equinox of date) for a geographic position.
 * The rising point of the ecliptic on the eastern horizon.
 */
export function tropicalAscendant(m: AstroMoment, latitudeDeg: number, longitudeDeg: number): number {
  const rad = Math.PI / 180
  const ramc = normalizeDeg(m.gastDeg + longitudeDeg) * rad
  const eps = m.trueObliquityDeg * rad
  const phi = latitudeDeg * rad
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)))
  return normalizeDeg(asc / rad - m.nutationLonDeg)
}
