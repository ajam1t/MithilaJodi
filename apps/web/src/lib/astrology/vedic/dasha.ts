/**
 * Vimshottari dasha — the 120-year planetary period cycle read from the Moon's
 * nakshatra at birth. Pure; client-safe.
 */
import { NAKSHATRAS, NAKSHATRA_SPAN, nakshatraIndexOf, normalizeDeg, type GrahaId } from './zodiac'
import type { DashaPeriod, VimshottariDasha } from '../types'

export const DASHA_ORDER: GrahaId[] = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury']
export const DASHA_YEARS: Record<GrahaId, number> = {
  ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17,
}
/** Dasha years are Julian years of 365.25 days (methodology.ts). */
export const DASHA_YEAR_MS = 365.25 * 86_400_000

const iso = (ms: number) => new Date(Math.round(ms)).toISOString()

export function vimshottari(moonLongitude: number, birthUtcMs: number): VimshottariDasha {
  const nak = nakshatraIndexOf(moonLongitude)
  const first = NAKSHATRAS[nak].lord
  const elapsed = (normalizeDeg(moonLongitude) % NAKSHATRA_SPAN) / NAKSHATRA_SPAN
  const startIndex = DASHA_ORDER.indexOf(first)

  let cursor = birthUtcMs - elapsed * DASHA_YEARS[first] * DASHA_YEAR_MS
  const mahadashas: DashaPeriod[] = []
  for (let i = 0; i < 9; i += 1) {
    const lord = DASHA_ORDER[(startIndex + i) % 9]
    const years = DASHA_YEARS[lord]
    const start = cursor
    const end = start + years * DASHA_YEAR_MS
    const antardashas: NonNullable<DashaPeriod['antardashas']> = []
    let sub = start
    for (let j = 0; j < 9; j += 1) {
      const subLord = DASHA_ORDER[(startIndex + i + j) % 9]
      const subEnd = sub + ((years * DASHA_YEARS[subLord]) / 120) * DASHA_YEAR_MS
      antardashas.push({ lord: subLord, start: iso(sub), end: iso(subEnd) })
      sub = subEnd
    }
    mahadashas.push({ lord, start: iso(start), end: iso(end), years, antardashas })
    cursor = end
  }

  const balanceYears = (1 - elapsed) * DASHA_YEARS[first]
  const whole = Math.floor(balanceYears)
  const monthsFloat = (balanceYears - whole) * 12
  const months = Math.floor(monthsFloat)
  const days = Math.floor((monthsFloat - months) * (365.25 / 12))
  return { balanceAtBirth: { lord: first, years: whole, months, days }, mahadashas }
}
