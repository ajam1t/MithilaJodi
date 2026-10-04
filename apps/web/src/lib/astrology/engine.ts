/**
 * Kundli Match engine — the single source of truth.
 *
 *   birth data → local time → UTC (IANA zones) → ephemeris → sidereal (Lahiri)
 *   → rashi / nakshatra / pada / Lagna / houses → Ashtakoota + Manglik → result
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
import {
  dailyMotion, lagnaPosition, moonProfile, planetPositions, siderealLagna, siderealLongitudesAt,
} from './vedic/chart'
import { moonSegments, type MoonSegment } from './vedic/moonWindow'
import {
  GRAHAS, NAKSHATRAS, RASHIS, distanceToNakshatraBoundary, distanceToRashiBoundary, grahaInfo,
  padaOf, rashiIndexOf,
} from './vedic/zodiac'
import { formatOffset, localDayBounds, localToUtc, utcToLocal } from './time/localTime'
import type {
  ChartData, KundliMatchRequest, KundliMatchResponse, MatchResult, MoonSegmentChoice, PersonInput, Role,
} from './types'

export class KundliInputError extends Error {
  constructor(
    public readonly code: string,
    public readonly userMessage: string,
    public readonly field?: string,
  ) {
    super(code)
  }
}

const ROLE_NAME: Record<Role, string> = { bride: 'bride', groom: 'groom' }

/** Above this latitude the ecliptic can lie along the horizon and the Lagna is not meaningful. */
const MAX_LAGNA_LATITUDE = 66

function parseDate(s: string) {
  const [year, month, day] = s.split('-').map(Number)
  return { year, month, day }
}

function parseTime(s: string) {
  const [hour, minute] = s.split(':').map(Number)
  return { hour, minute }
}

const hhmm = (utcMs: number, tz: string) => {
  const l = utcToLocal(utcMs, tz)
  return `${String(l.hour).padStart(2, '0')}:${String(l.minute).padStart(2, '0')}`
}

type Resolution =
  | { kind: 'fixed'; utcMs: number; offsetMinutes: number; warnings: string[] }
  | { kind: 'unknown'; segments: MoonSegment[]; offsetMinutes: number }

function resolveTime(person: PersonInput, role: Role, now: Date): Resolution {
  const { year, month, day } = parseDate(person.dateOfBirth)
  const tz = person.place.timezone
  const field = `${role}.timeOfBirth`

  if (person.timeOfBirth) {
    const r = localToUtc({ year, month, day, ...parseTime(person.timeOfBirth) }, tz)
    if (r.status === 'nonexistent') {
      throw new KundliInputError(
        'time_nonexistent',
        `${person.timeOfBirth} did not exist on ${person.dateOfBirth} in ${tz} — the clocks moved forward over it ` +
          `for daylight saving. Please check the ${ROLE_NAME[role]}'s birth time.`,
        field,
      )
    }
    const warnings: string[] = []
    let chosen: { utcMs: number; offsetMinutes: number }
    if (r.status === 'ambiguous') {
      chosen = person.repeatedTime === 'later' ? r.later : r.earlier
      warnings.push(
        `${person.timeOfBirth} occurred twice on ${person.dateOfBirth} in ${tz} because the clocks went back. ` +
          `The ${ROLE_NAME[role]}'s chart uses the ${person.repeatedTime === 'later' ? 'second' : 'first'} occurrence ` +
          `(UTC${formatOffset(chosen.offsetMinutes)}); the Lagna differs for the other one.`,
      )
    } else {
      chosen = r
    }
    if (chosen.utcMs > now.getTime()) {
      throw new KundliInputError('date_future', `The ${ROLE_NAME[role]}'s birth date and time are in the future.`, `${role}.dateOfBirth`)
    }
    return { kind: 'fixed', utcMs: chosen.utcMs, offsetMinutes: chosen.offsetMinutes, warnings }
  }

  const { startUtc, endUtc } = localDayBounds(year, month, day, tz)
  if (startUtc > now.getTime()) {
    throw new KundliInputError('date_future', `The ${ROLE_NAME[role]}'s birth date is in the future.`, `${role}.dateOfBirth`)
  }
  const noon = localToUtc({ year, month, day, hour: 12, minute: 0 }, tz)
  const offsetMinutes = noon.status === 'ok' ? noon.offsetMinutes : noon.status === 'ambiguous' ? noon.earlier.offsetMinutes : 0
  return { kind: 'unknown', segments: moonSegments(startUtc, Math.min(endUtc, now.getTime())), offsetMinutes }
}

function segmentChoice(seg: MoonSegment, tz: string): MoonSegmentChoice {
  const moon = moonProfile(seg.startLon)
  return {
    index: seg.index,
    fromLocal: hhmm(seg.startUtc, tz),
    toLocal: hhmm(seg.endUtc, tz),
    rashi: RASHIS[seg.rashiIndex].slug,
    nakshatra: NAKSHATRAS[seg.nakshatraIndex].slug,
    vashya: moon.vashya,
  }
}

function buildChart(
  role: Role,
  person: PersonInput,
  utcMs: number,
  offsetMinutes: number,
  window?: { segment: MoonSegment; total: number },
): { chart: ChartData; warnings: string[] } {
  const { place } = person
  const snap = siderealLongitudesAt(utcMs)
  const speeds = dailyMotion(utcMs)
  const timeKnown = !window
  const notes: string[] = []
  const warnings: string[] = []

  const lagnaPossible = timeKnown && Math.abs(place.latitude) <= MAX_LAGNA_LATITUDE
  const lagnaLon = lagnaPossible ? siderealLagna(snap, place.latitude, place.longitude) : null
  const lagna = lagnaLon == null ? null : lagnaPosition(lagnaLon)
  if (timeKnown && !lagnaPossible) {
    notes.push('The Lagna is not calculated above 66° latitude, where the ecliptic can run along the horizon.')
  }

  const planets = planetPositions(snap.longitudes, speeds, lagna ? lagna.rashiIndex : null)

  let moon = moonProfile(snap.longitudes.moon)
  if (window) {
    const { segment } = window
    const padaStart = padaOf(segment.startLon)
    const padaEnd = padaOf(segment.endLon)
    moon = { ...moonProfile(snap.longitudes.moon, padaStart === padaEnd ? padaStart : null), range: { fromLongitude: segment.startLon, toLongitude: segment.endLon } }

    const atStart = siderealLongitudesAt(segment.startUtc).longitudes
    const atEnd = siderealLongitudesAt(segment.endUtc).longitudes
    const shifting = GRAHAS.filter(g => g.id !== 'moon' && rashiIndexOf(atStart[g.id]) !== rashiIndexOf(atEnd[g.id]))
    notes.push(
      `Birth time not given. The Lagna, the houses and the Lagna-based Manglik check are not calculated. Other planets ` +
        `are shown for the middle of the possible window (${hhmm(segment.startUtc, place.timezone)}–${hhmm(segment.endUtc, place.timezone)}).`,
    )
    for (const g of shifting) {
      warnings.push(`${grahaInfo(g.id).name.split(' (')[0]} changes rashi during the ${ROLE_NAME[role]}'s possible birth window, so its sign is uncertain.`)
    }
    if (shifting.some(g => g.id === 'mars')) {
      warnings.push(`Because Mars changes rashi in that window, the ${ROLE_NAME[role]}'s Moon-based Manglik check is uncertain.`)
    }
  } else {
    // Sensitivity to the recorded time: how close are the values the match depends on to a boundary?
    const moonSpeed = Math.abs(speeds.moon)
    const nakMinutes = (distanceToNakshatraBoundary(moon.longitude) / moonSpeed) * 1440
    const rashiMinutes = (distanceToRashiBoundary(moon.longitude) / moonSpeed) * 1440
    if (rashiMinutes < 45) {
      warnings.push(
        `The ${ROLE_NAME[role]}'s Moon is within about ${Math.max(1, Math.round(rashiMinutes))} minutes of changing rashi. ` +
          `If the recorded birth time is out by more than that, the rashi — and several Koota scores — would change.`,
      )
    } else if (nakMinutes < 45) {
      warnings.push(
        `The ${ROLE_NAME[role]}'s Moon is within about ${Math.max(1, Math.round(nakMinutes))} minutes of changing nakshatra. ` +
          `If the recorded birth time is out by more than that, the nakshatra and some Koota scores would change.`,
      )
    }
    if (lagna) {
      const later = siderealLagna(siderealLongitudesAt(utcMs + 60_000), place.latitude, place.longitude)
      const perMinute = Math.abs(((later - lagna.longitude + 540) % 360) - 180)
      const lagnaMinutes = perMinute > 0 ? distanceToRashiBoundary(lagna.longitude) / perMinute : Infinity
      if (lagnaMinutes < 5) {
        warnings.push(
          `The ${ROLE_NAME[role]}'s Lagna is within about ${Math.max(1, Math.round(lagnaMinutes))} minute${Math.round(lagnaMinutes) === 1 ? '' : 's'} ` +
            `of changing rashi, so the houses and the Lagna-based Manglik check depend on an exact birth time.`,
        )
      }
    }
  }

  if (offsetMinutes % 30 !== 0) {
    notes.push(
      `For this date the time-zone database gives a local offset of UTC${formatOffset(offsetMinutes)} — the local standard ` +
        `time in force then — and that is what the calculation uses.`,
    )
  }

  const chart: ChartData = {
    role,
    name: person.name,
    birth: {
      localDate: person.dateOfBirth,
      localTime: person.timeOfBirth,
      timezone: place.timezone,
      utcOffset: formatOffset(offsetMinutes),
      calculatedAtUtc: new Date(utcMs).toISOString(),
      placeLabel: place.label,
      latitude: place.latitude,
      longitude: place.longitude,
      placeSource: place.source,
    },
    timeKnown,
    ...(window ? { moonWindow: { ...segmentChoice(window.segment, place.timezone), totalSegments: window.total } } : {}),
    ayanamsha: snap.ayanamsha,
    lagna,
    planets,
    moon,
    notes,
  }
  return { chart, warnings }
}

type PreparedChart = { chart: ChartData; warnings: string[]; segment: number | null }

function prepare(person: PersonInput, role: Role, now: Date):
  | { kind: 'charts'; charts: PreparedChart[] }
  | { kind: 'choose'; choices: MoonSegmentChoice[] } {
  const r = resolveTime(person, role, now)
  if (r.kind === 'fixed') {
    const built = buildChart(role, person, r.utcMs, r.offsetMinutes)
    return { kind: 'charts', charts: [{ ...built, warnings: [...r.warnings, ...built.warnings], segment: null }] }
  }
  const { segments } = r
  const mid = (s: MoonSegment) => Math.floor((s.startUtc + s.endUtc) / 2)
  const chartFor = (s: MoonSegment): PreparedChart => ({
    ...buildChart(role, person, mid(s), r.offsetMinutes, { segment: s, total: segments.length }),
    segment: segments.length > 1 ? s.index : null,
  })
  if (segments.length === 1) return { kind: 'charts', charts: [chartFor(segments[0])] }
  if (person.moonSegment === 'all') return { kind: 'charts', charts: segments.map(chartFor) }
  if (typeof person.moonSegment === 'number') {
    const s = segments[person.moonSegment]
    if (!s) {
      throw new KundliInputError('segment_invalid', 'That part of the day is no longer valid for this date. Please choose again.', `${role}.moonSegment`)
    }
    return { kind: 'charts', charts: [chartFor(s)] }
  }
  return { kind: 'choose', choices: segments.map(s => segmentChoice(s, person.place.timezone)) }
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
      out.push(`The ${ROLE_NAME[c.role]}'s birth time is unknown, so their values come from the Moon's position for that part of the day; the Lagna and houses are not used.`)
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
    engine: {
      ephemeris: `${METHODOLOGY.ephemeris.library} ${METHODOLOGY.ephemeris.libraryVersion}`,
      ayanamsha: METHODOLOGY.ayanamsha.name,
      nodes: 'Mean node',
      houses: 'Whole-sign',
    },
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
  const bride = prepare(request.bride, 'bride', now)
  const groom = prepare(request.groom, 'groom', now)

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
