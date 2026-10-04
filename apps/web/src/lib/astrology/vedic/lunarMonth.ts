/**
 * Amanta lunar months (new moon to new moon), as used across Mithila and most
 * of North India for festivals and muhurta.
 *
 * A lunar month is named by the solar sign the Sun enters during it (the
 * sankranti it contains): the month containing Mesha Sankranti is Chaitra,
 * Vrishabha → Vaishakha, and so on. A month with no sankranti is Adhika
 * (intercalary) and takes the name of the month that follows it; a month with
 * two is Kshaya. Server-only by convention (ephemeris).
 */
import { newMoonsBetween } from '../ephemeris/positions'
import { siderealSunMoonAt } from './chart'
import { rashiIndexOf } from './zodiac'

export const LUNAR_MONTHS = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashvin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
] as const

export type Lunation = {
  /** UTC ms of the new moon that starts the month. */
  start: number
  end: number
  /** 0 = Chaitra … 11 = Phalguna. */
  month: number
  kind: 'normal' | 'adhika' | 'kshaya'
  name: string
}

const DAY = 86_400_000

/** Every lunation overlapping [fromUtcMs, toUtcMs]. */
export function lunationsBetween(fromUtcMs: number, toUtcMs: number): Lunation[] {
  const moons = newMoonsBetween(fromUtcMs - 31 * DAY, toUtcMs + 31 * DAY)
  const out: Lunation[] = []
  for (let i = 0; i + 1 < moons.length; i++) {
    const start = moons[i]
    const end = moons[i + 1]
    if (end < fromUtcMs || start > toUtcMs) continue
    const rs = rashiIndexOf(siderealSunMoonAt(start).sun)
    const re = rashiIndexOf(siderealSunMoonAt(end).sun)
    const steps = (re - rs + 12) % 12
    if (steps === 0) {
      const month = (rs + 1) % 12
      out.push({ start, end, month, kind: 'adhika', name: `Adhika ${LUNAR_MONTHS[month]}` })
    } else if (steps === 2) {
      out.push({ start, end, month: re, kind: 'kshaya', name: `Kshaya ${LUNAR_MONTHS[(rs + 1) % 12]}` })
    } else {
      out.push({ start, end, month: re, kind: 'normal', name: LUNAR_MONTHS[re] })
    }
  }
  return out
}

/** The lunation containing `utcMs`, from a sorted list. */
export function lunationAt(lunations: Lunation[], utcMs: number): Lunation | undefined {
  let lo = 0
  let hi = lunations.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const l = lunations[mid]
    if (utcMs < l.start) hi = mid - 1
    else if (utcMs >= l.end) lo = mid + 1
    else return l
  }
  return undefined
}
