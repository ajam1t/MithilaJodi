/**
 * The projection a share link stores and shows.
 *
 * Deliberately excludes the birth date, time, place, coordinates, the Lagna
 * and every planetary degree: the Sun, Moon and planet longitudes together
 * pin down the date and time of birth. What remains — Guna scores, Moon
 * rashi/nakshatra attributes and Manglik status — cannot be reversed into
 * birth details.
 */
import type { MatchResult, SharedMatchSummary } from './types'

export function toSharedSummary(result: MatchResult, includeNames: boolean): SharedMatchSummary {
  const moon = (m: MatchResult['bride']['moon']) => ({
    rashi: m.rashi, rashiLord: m.rashiLord, nakshatra: m.nakshatra, nakshatraLord: m.nakshatraLord,
    varna: m.varna, vashya: m.vashya, yoni: m.yoni, gana: m.gana, nadi: m.nadi,
  })
  const manglik = (p: MatchResult['manglik']['bride']) => ({
    status: p.status, label: p.label, marsRashi: p.marsRashi, marsHouseFromLagna: p.marsHouseFromLagna,
    marsHouseFromMoon: p.marsHouseFromMoon, exceptions: p.exceptions,
    // The explanation quotes Mars's exact degree; drop that sentence.
    explanation: p.explanation.replace(/^Mars is in [^.]+ at \d+°\d+′\.\s*/, ''),
  })
  return {
    methodologyVersion: result.methodologyVersion,
    computedAt: result.computedAt,
    names: includeNames ? { bride: result.bride.name, groom: result.groom.name } : { bride: null, groom: null },
    total: result.total,
    maxTotal: 36,
    band: result.band,
    kootas: result.kootas,
    moon: { bride: moon(result.bride.moon), groom: moon(result.groom.moon) },
    manglik: { bride: manglik(result.manglik.bride), groom: manglik(result.manglik.groom), pair: result.manglik.pair },
    insights: result.insights.filter(i => !/birth time is unknown/.test(i)),
    timeKnown: { bride: result.bride.timeKnown, groom: result.groom.timeKnown },
  }
}
