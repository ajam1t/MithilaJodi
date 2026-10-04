/**
 * Kundli Match engine — two birth charts (birthChart.ts) → Ashtakoota +
 * Manglik → result.
 *
 * Deterministic: the same request and methodology version always produce the
 * same numbers. `now` is injected (it only stamps `computedAt` and rejects
 * future births), and nothing here is random.
 *
 * Server-only by convention — import from API routes, never from client code.
 */
import { METHODOLOGY, scoreBandFor } from './methodology'
import { computeAshtakoota, fmtPoints } from './rules/ashtakoota'
import { manglikFor, manglikPair } from './rules/manglik'
import { prepareChart, type PreparedChart } from './birthChart'
import type { KundliMatchRequest, KundliMatchResponse, MatchResult } from './types'

export { KundliInputError } from './birthChart'

export const ENGINE_INFO = {
  ephemeris: `${METHODOLOGY.ephemeris.library} ${METHODOLOGY.ephemeris.libraryVersion}`,
  ayanamsha: METHODOLOGY.ayanamsha.name,
  nodes: 'Mean node',
  houses: 'Whole-sign',
}

function buildInsights(result: Omit<MatchResult, 'insights'>): string[] {
  const out: string[] = []
  const { total, band, kootas, manglik, bride, groom } = result
  out.push(
    `According to the Ashtakoota methodology used here, ${fmtPoints(total)} of 36 Guna falls in the ` +
      `“${band.label}” band (${band.min}–${band.max}). The traditional minimum usually cited for marriage is 18.`,
  )
  const full = kootas.filter(k => k.score === k.maxScore).map(k => k.name)
  if (full.length) out.push(`Full points in ${full.length === 8 ? 'all eight kootas' : full.join(', ')}.`)
  const zero = kootas.filter(k => k.score === 0)
  if (zero.length) out.push(`No points in ${zero.map(k => k.name).join(', ')}.`)
  for (const k of kootas) {
    if (!k.dosha) continue
    out.push(
      k.dosha.cancellations.length
        ? `${k.dosha.name} is present; ${k.dosha.cancellations.length === 1 ? 'one classical cancellation applies' : `${k.dosha.cancellations.length} classical cancellations apply`} (see the ${k.name} card).`
        : `${k.dosha.name} is present, and none of the classical cancellations checked here apply.`,
    )
  }
  out.push(manglik.pair.summary)
  for (const c of [bride, groom]) {
    if (!c.timeKnown) {
      out.push(`The ${c.role}'s birth time is unknown, so their values come from the Moon's position for that part of the day; the Lagna and houses are not used.`)
    }
  }
  return out
}

function assemble(b: PreparedChart, g: PreparedChart, now: Date): MatchResult {
  const { kootas, total } = computeAshtakoota(b.chart.moon, g.chart.moon)
  const band = scoreBandFor(total)
  const brideManglik = manglikFor(b.chart.planets, b.chart.lagna, b.chart.moon)
  const groomManglik = manglikFor(g.chart.planets, g.chart.lagna, g.chart.moon)
  const base: Omit<MatchResult, 'insights'> = {
    methodologyVersion: METHODOLOGY.version,
    engine: ENGINE_INFO,
    computedAt: now.toISOString(),
    bride: b.chart,
    groom: g.chart,
    kootas,
    total,
    maxTotal: 36,
    band: { key: band.key, label: band.label, min: band.min, max: band.max },
    manglik: { bride: brideManglik, groom: groomManglik, pair: manglikPair(brideManglik, groomManglik) },
    warnings: [...b.warnings, ...g.warnings],
  }
  return { ...base, insights: buildInsights(base) }
}

export function computeKundliMatch(request: KundliMatchRequest, now: Date): KundliMatchResponse {
  const bride = prepareChart(request.bride, 'bride', now)
  const groom = prepareChart(request.groom, 'groom', now)

  if (bride.kind === 'choose' || groom.kind === 'choose') {
    return {
      kind: 'needs_moon_choice',
      choices: {
        ...(bride.kind === 'choose' ? { bride: bride.choices } : {}),
        ...(groom.kind === 'choose' ? { groom: groom.choices } : {}),
      },
    }
  }

  if (bride.charts.length === 1 && groom.charts.length === 1) {
    return { kind: 'result', result: assemble(bride.charts[0], groom.charts[0], now) }
  }

  const scenarios: Extract<KundliMatchResponse, { kind: 'scenarios' }>['scenarios'] = []
  for (const b of bride.charts) {
    for (const g of groom.charts) {
      scenarios.push({ brideSegment: b.segment, groomSegment: g.segment, result: assemble(b, g, now) })
    }
  }
  return { kind: 'scenarios', scenarios }
}
