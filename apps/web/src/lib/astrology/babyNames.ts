/**
 * Baby Names — the traditional first syllable from the child's Janma
 * nakshatra pada, plus the rashi letters, on the shared birth chart.
 * No names are generated; families choose the name.
 * Server-only by convention.
 */
import { METHODOLOGY } from './methodology'
import { prepareChart, type PreparedChart } from './birthChart'
import { rashiSyllables, syllableOf, syllablesBetween } from './vedic/nameSyllable'
import type { BabyNamesReading, BabyNamesResponse, SinglePersonRequest } from './types'

function assemble(p: PreparedChart, now: Date): BabyNamesReading {
  const { chart } = p
  const moon = chart.moon
  const candidates = moon.pada != null
    ? [syllableOf(moon.nakshatraIndex, moon.pada)]
    : syllablesBetween(moon.range!.fromLongitude, moon.range!.toLongitude)
  return {
    methodologyVersion: METHODOLOGY.version,
    computedAt: now.toISOString(),
    chart,
    candidates,
    rashiSyllables: rashiSyllables(moon.rashiIndex),
    warnings: p.warnings,
  }
}

export function computeBabyNames(request: SinglePersonRequest, now: Date): BabyNamesResponse {
  const r = prepareChart(request.person, 'native', now)
  if (r.kind === 'choose') return { kind: 'needs_moon_choice', choices: r.choices }
  if (r.charts.length === 1) return { kind: 'result', result: assemble(r.charts[0], now) }
  return { kind: 'scenarios', scenarios: r.charts.map(c => ({ segment: c.segment ?? 0, result: assemble(c, now) })) }
}
