/**
 * Rashi tool — the Moon sign from the shared birth chart, plus when the Moon
 * entered and left it, the Sun's Vedic and Western signs, and the Moon-sign
 * compatibility read. Server-only by convention (ephemeris for the window).
 */
import { METHODOLOGY } from './methodology'
import { prepareChart, type PreparedChart } from './birthChart'
import { moonArcWindow } from './vedic/moonTransit'
import { moonSignCompatibility } from './vedic/rashiInfo'
import { rashiIndexOf } from './vedic/zodiac'
import type { MoonSegmentChoice, PersonInput, RashiReading, RashiResponse, SinglePersonRequest } from './types'

function assemble(p: PreparedChart, now: Date, nakshatraCertain: boolean, mergedTo?: string): RashiReading {
  const chart = mergedTo && p.chart.moonWindow ? { ...p.chart, moonWindow: { ...p.chart.moonWindow, toLocal: mergedTo } } : p.chart
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

/** Consecutive parts of the day with the same Moon rashi. */
function groupByRashi(choices: MoonSegmentChoice[]): MoonSegmentChoice[][] {
  const groups: MoonSegmentChoice[][] = []
  for (const c of choices) {
    const last = groups[groups.length - 1]
    if (last && last[0].rashi === c.rashi) last.push(c)
    else groups.push([c])
  }
  return groups
}

export function computeRashi(request: SinglePersonRequest, now: Date): RashiResponse {
  const person = request.person
  const base = prepareChart({ ...person, moonSegment: undefined }, 'native', now)
  if (base.kind === 'charts') return { kind: 'result', result: assemble(base.charts[0], now, true) }

  // Unknown time, and the Moon changed rashi or nakshatra that day. Only rashi changes matter here.
  const groups = groupByRashi(base.choices)
  const chartFor = (group: MoonSegmentChoice[]) => {
    const r = prepareChart({ ...person, moonSegment: group[0].index } as PersonInput, 'native', now)
    if (r.kind !== 'charts') throw new Error('segment did not resolve')
    return assemble(r.charts[0], now, group.length === 1, group.length > 1 ? group[group.length - 1].toLocal : undefined)
  }

  if (groups.length === 1) return { kind: 'result', result: chartFor(groups[0]) }
  if (person.moonSegment === 'all') {
    return { kind: 'scenarios', scenarios: groups.map(g => ({ segment: g[0].index, result: chartFor(g) })) }
  }
  if (typeof person.moonSegment === 'number') {
    const group = groups.find(g => g.some(c => c.index === person.moonSegment))
    if (group) return { kind: 'result', result: chartFor(group) }
  }
  return {
    kind: 'needs_moon_choice',
    choices: groups.map(g => ({ ...g[0], toLocal: g[g.length - 1].toLocal, ...(g.length > 1 ? { nakshatraVaries: true } : {}) })),
  }
}
