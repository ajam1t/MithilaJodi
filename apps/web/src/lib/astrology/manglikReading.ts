/**
 * Manglik tool — the same Manglik rule Kundli Match and Janam Kundli use, on
 * the shared birth chart, with Mars's dignity and the Venus-based count as
 * context. Server-only by convention.
 */
import { METHODOLOGY } from './methodology'
import { prepareChartByRashi, type RashiResolved } from './birthChart'
import { manglikFor } from './rules/manglik'
import { wholeSignHouse } from './vedic/chart'
import { dignityOf } from './vedic/divisions'
import type { ManglikReading, ManglikResponse, SinglePersonRequest } from './types'

function assemble({ prepared: p, nakshatraCertain }: RashiResolved, now: Date): ManglikReading {
  const { chart } = p
  const mars = chart.planets.find(x => x.id === 'mars')!
  const venus = chart.planets.find(x => x.id === 'venus')!
  return {
    methodologyVersion: METHODOLOGY.version,
    computedAt: now.toISOString(),
    chart,
    manglik: manglikFor(chart.planets, chart.lagna, chart.moon),
    marsDignity: dignityOf('mars', mars.rashiIndex),
    marsHouseFromVenus: wholeSignHouse(mars.rashiIndex, venus.rashiIndex),
    nakshatraCertain,
    warnings: p.warnings,
  }
}

export function computeManglik(request: SinglePersonRequest, now: Date): ManglikResponse {
  const r = prepareChartByRashi(request.person, now)
  if (r.kind === 'choose') return { kind: 'needs_moon_choice', choices: r.choices }
  if (r.kind === 'one') return { kind: 'result', result: assemble(r.resolved, now) }
  return { kind: 'scenarios', scenarios: r.resolved.map(x => ({ segment: x.segment, result: assemble(x, now) })) }
}
