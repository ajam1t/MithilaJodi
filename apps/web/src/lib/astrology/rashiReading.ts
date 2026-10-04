/**
 * Rashi tool — the Moon sign from the shared birth chart, plus when the Moon
 * entered and left it, the Sun's Vedic and Western signs, and the Moon-sign
 * compatibility read. Server-only by convention (ephemeris for the window).
 */
import { METHODOLOGY } from './methodology'
import { prepareChartByRashi, type RashiResolved } from './birthChart'
import { moonArcWindow } from './vedic/moonTransit'
import { moonSignCompatibility } from './vedic/rashiInfo'
import { rashiIndexOf } from './vedic/zodiac'
import type { RashiReading, RashiResponse, SinglePersonRequest } from './types'

function assemble({ prepared: p, nakshatraCertain }: RashiResolved, now: Date): RashiReading {
  const { chart } = p
  const r = chart.moon.rashiIndex
  const sun = chart.planets.find(x => x.id === 'sun')!
  return {
    methodologyVersion: METHODOLOGY.version,
    computedAt: now.toISOString(),
    chart,
    // A rashi takes the Moon 2–2.6 days to cross.
    window: moonArcWindow(p.utcMs, r * 30, r * 30 + 30, 3),
    nakshatraCertain,
    sun: { siderealRashiIndex: sun.rashiIndex, tropicalRashiIndex: rashiIndexOf(sun.longitude + chart.ayanamsha) },
    compatibility: moonSignCompatibility(r),
    warnings: p.warnings,
  }
}

export function computeRashi(request: SinglePersonRequest, now: Date): RashiResponse {
  const r = prepareChartByRashi(request.person, now)
  if (r.kind === 'choose') return { kind: 'needs_moon_choice', choices: r.choices }
  if (r.kind === 'one') return { kind: 'result', result: assemble(r.resolved, now) }
  return { kind: 'scenarios', scenarios: r.resolved.map(x => ({ segment: x.segment, result: assemble(x, now) })) }
}
