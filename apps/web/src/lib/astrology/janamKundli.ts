/**
 * Janam Kundli — one birth chart (birthChart.ts) plus the readings a
 * traditional kundli carries: Navamsa, dignities, Vimshottari dasha, the
 * panchang at birth and the Manglik check.
 *
 * Deterministic; `now` only stamps `computedAt` and rejects future births.
 * Server-only by convention.
 */
import { METHODOLOGY } from './methodology'
import { ENGINE_INFO } from './engine'
import { prepareChart, type PreparedChart } from './birthChart'
import { manglikFor } from './rules/manglik'
import { sunriseAfter } from './ephemeris/positions'
import { vimshottari } from './vedic/dasha'
import { dignityOf, navamsaRashiIndex } from './vedic/divisions'
import { karanaOf, tithiOf, varaOf, yogaOf } from './vedic/panchang'
import { localDayBounds } from './time/localTime'
import type { BirthPanchang, JanamKundliRequest, JanamKundliResponse, JanamKundliResult } from './types'

function panchangFor(p: PreparedChart): BirthPanchang | null {
  const { chart, utcMs } = p
  if (!chart.timeKnown) return null
  const lon = (id: string) => chart.planets.find(x => x.id === id)!.longitude
  const sun = lon('sun')
  const moon = lon('moon')
  const [y, m, d] = chart.birth.localDate.split('-').map(Number)
  const { startUtc } = localDayBounds(y, m, d, chart.birth.timezone)
  const sunrise = sunriseAfter(startUtc, chart.birth.latitude, chart.birth.longitude)
  // A sunrise found past the end of the local day means none occurred that day (polar).
  const sunriseToday = sunrise != null && sunrise - startUtc < 86_400_000 ? sunrise : null
  const civilWeekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return {
    tithi: tithiOf(sun, moon),
    yoga: yogaOf(sun, moon),
    karana: karanaOf(sun, moon),
    vara: varaOf(civilWeekday, sunriseToday != null && utcMs < sunriseToday),
    sunrise: sunriseToday == null ? null : new Date(sunriseToday).toISOString(),
  }
}

function assemble(p: PreparedChart, now: Date): JanamKundliResult {
  const { chart } = p
  const moonPadaKnown = chart.moon.pada != null
  return {
    methodologyVersion: METHODOLOGY.version,
    engine: ENGINE_INFO,
    computedAt: now.toISOString(),
    chart,
    navamsa: {
      lagnaRashiIndex: chart.lagna ? navamsaRashiIndex(chart.lagna.longitude) : null,
      planets: chart.planets.map(pl => {
        // The navamsa changes at every pada boundary, so an uncertain pada means an uncertain Moon navamsa.
        const known = pl.id !== 'moon' || moonPadaKnown
        const d9 = known ? navamsaRashiIndex(pl.longitude) : null
        return { id: pl.id, rashiIndex: d9, vargottama: d9 != null && d9 === pl.rashiIndex }
      }),
    },
    dignities: chart.planets.map(pl => ({ id: pl.id, dignity: dignityOf(pl.id, pl.rashiIndex) })),
    dasha: chart.timeKnown ? vimshottari(chart.moon.longitude, p.utcMs) : null,
    panchang: panchangFor(p),
    manglik: manglikFor(chart.planets, chart.lagna, chart.moon),
    warnings: p.warnings,
  }
}

export function computeJanamKundli(request: JanamKundliRequest, now: Date): JanamKundliResponse {
  const r = prepareChart(request.person, 'native', now)
  if (r.kind === 'choose') return { kind: 'needs_moon_choice', choices: r.choices }
  if (r.charts.length === 1) return { kind: 'result', result: assemble(r.charts[0], now) }
  return { kind: 'scenarios', scenarios: r.charts.map(c => ({ segment: c.segment ?? 0, result: assemble(c, now) })) }
}
