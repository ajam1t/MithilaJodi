/**
 * Nakshatra tool — the Janma nakshatra from the shared birth chart, plus when
 * the Moon entered and left it, the pada's navamsa and the Navatara chart.
 * Server-only by convention (reaches the ephemeris for the window).
 */
import { METHODOLOGY } from './methodology'
import { prepareChart, type PreparedChart } from './birthChart'
import { moonArcWindow } from './vedic/moonTransit'
import { navamsaRashiIndex } from './vedic/divisions'
import { nakshatraBounds, navatara } from './vedic/nakshatraInfo'
import { NAKSHATRA_SPAN } from './vedic/zodiac'
import type { NakshatraReading, NakshatraResponse, SinglePersonRequest } from './types'

/** The Moon covers a nakshatra in 21–28 hours, so 1.5 days either side always brackets both ends. */
export function nakshatraWindow(utcMs: number, nakshatraIndex: number) {
  const { start, end } = nakshatraBounds(nakshatraIndex)
  return moonArcWindow(utcMs, start, end, 1.5)
}

function assemble(p: PreparedChart, now: Date): NakshatraReading {
  const { chart } = p
  const moon = chart.moon
  return {
    methodologyVersion: METHODOLOGY.version,
    computedAt: now.toISOString(),
    chart,
    progress: chart.timeKnown ? (moon.longitude - moon.nakshatraIndex * NAKSHATRA_SPAN) / NAKSHATRA_SPAN : null,
    window: nakshatraWindow(p.utcMs, moon.nakshatraIndex),
    padaNavamsaIndex: moon.pada == null ? null : navamsaRashiIndex(moon.longitude),
    navatara: navatara(moon.nakshatraIndex),
    warnings: p.warnings,
  }
}

export function computeNakshatra(request: SinglePersonRequest, now: Date): NakshatraResponse {
  const r = prepareChart(request.person, 'native', now)
  if (r.kind === 'choose') return { kind: 'needs_moon_choice', choices: r.choices }
  if (r.charts.length === 1) return { kind: 'result', result: assemble(r.charts[0], now) }
  return { kind: 'scenarios', scenarios: r.charts.map(c => ({ segment: c.segment ?? 0, result: assemble(c, now) })) }
}
