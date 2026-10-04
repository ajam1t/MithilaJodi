/**
 * When did the Moon enter and leave a stretch of the sidereal zodiac?
 * Used for nakshatra and rashi windows. Server-only by convention (ephemeris).
 */
import { angularDelta, siderealMoonAt } from './chart'

const DAY = 86_400_000

/**
 * The instant in [from, to] at which the sidereal Moon crosses `boundary`,
 * given that it is before the boundary at `from` and past it at `to`. The Moon
 * never moves backwards, so a plain bisection to one second is exact enough.
 */
export function moonCrossing(boundary: number, from: number, to: number): number {
  let lo = from
  let hi = to
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2)
    if (angularDelta(boundary, siderealMoonAt(mid)) < 0) lo = mid
    else hi = mid
  }
  return hi
}

/**
 * Entry and exit of the Moon for the arc [startDeg, endDeg) that contains it at
 * `utcMs`. `searchDays` must exceed the longest time the Moon can take to cross
 * the arc (about 1.2 days for a nakshatra, 2.6 for a rashi).
 */
export function moonArcWindow(utcMs: number, startDeg: number, endDeg: number, searchDays: number) {
  return {
    start: new Date(moonCrossing(startDeg % 360, utcMs - searchDays * DAY, utcMs)).toISOString(),
    end: new Date(moonCrossing(endDeg % 360, utcMs, utcMs + searchDays * DAY)).toISOString(),
  }
}
