/**
 * One person's birth chart from birth details — shared by every astrology tool.
 *
 *   birth data → local time → UTC (IANA zones) → ephemeris → sidereal (Lahiri)
 *   → rashi / nakshatra / pada / Lagna / whole-sign houses
 *
 * Handles the two awkward cases honestly: a local time skipped or repeated by
 * daylight saving, and an unknown birth time (which part of the day the Moon's
 * rashi/nakshatra could be in, rather than an assumed time).
 *
 * Server-only by convention — it reaches the ephemeris.
 */
import {
  dailyMotion, lagnaPosition, moonProfile, planetPositions, siderealLagna, siderealLongitudesAt,
} from './vedic/chart'
import { moonSegments, type MoonSegment } from './vedic/moonWindow'
import {
  GRAHAS, NAKSHATRAS, RASHIS, distanceToNakshatraBoundary, distanceToRashiBoundary, grahaInfo, padaOf, rashiIndexOf,
} from './vedic/zodiac'
import { formatOffset, localDayBounds, localToUtc, utcToLocal } from './time/localTime'
import type { ChartData, MoonSegmentChoice, PersonInput, Subject } from './types'

export class KundliInputError extends Error {
  constructor(
    public readonly code: string,
    public readonly userMessage: string,
    public readonly field?: string,
  ) {
    super(code)
  }
}

/** "the bride's birth time" / "the birth time". */
const POSSESSIVE: Record<Subject, string> = { bride: "the bride's", groom: "the groom's", native: 'the' }
const Possessive = (s: Subject) => POSSESSIVE[s].charAt(0).toUpperCase() + POSSESSIVE[s].slice(1)
/** Prefix of the request field the error points at. */
const FIELD: Record<Subject, string> = { bride: 'bride', groom: 'groom', native: 'person' }

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

export const hhmm = (utcMs: number, tz: string) => {
  const l = utcToLocal(utcMs, tz)
  return `${String(l.hour).padStart(2, '0')}:${String(l.minute).padStart(2, '0')}`
}

type Resolution =
  | { kind: 'fixed'; utcMs: number; offsetMinutes: number; warnings: string[] }
  | { kind: 'unknown'; segments: MoonSegment[]; offsetMinutes: number }

function resolveTime(person: PersonInput, subject: Subject, now: Date): Resolution {
  const { year, month, day } = parseDate(person.dateOfBirth)
  const tz = person.place.timezone
  const field = FIELD[subject]

  if (person.timeOfBirth) {
    const r = localToUtc({ year, month, day, ...parseTime(person.timeOfBirth) }, tz)
    if (r.status === 'nonexistent') {
      throw new KundliInputError(
        'time_nonexistent',
        `${person.timeOfBirth} did not exist on ${person.dateOfBirth} in ${tz} — the clocks moved forward over it ` +
          `for daylight saving. Please check ${POSSESSIVE[subject]} birth time.`,
        `${field}.timeOfBirth`,
      )
    }
    const warnings: string[] = []
    let chosen: { utcMs: number; offsetMinutes: number }
    if (r.status === 'ambiguous') {
      chosen = person.repeatedTime === 'later' ? r.later : r.earlier
      warnings.push(
        `${person.timeOfBirth} occurred twice on ${person.dateOfBirth} in ${tz} because the clocks went back. ` +
          `${Possessive(subject)} chart uses the ${person.repeatedTime === 'later' ? 'second' : 'first'} occurrence ` +
          `(UTC${formatOffset(chosen.offsetMinutes)}); the Lagna differs for the other one.`,
      )
    } else {
      chosen = r
    }
    if (chosen.utcMs > now.getTime()) {
      throw new KundliInputError('date_future', `${Possessive(subject)} birth date and time are in the future.`, `${field}.dateOfBirth`)
    }
    return { kind: 'fixed', utcMs: chosen.utcMs, offsetMinutes: chosen.offsetMinutes, warnings }
  }

  const { startUtc, endUtc } = localDayBounds(year, month, day, tz)
  if (startUtc > now.getTime()) {
    throw new KundliInputError('date_future', `${Possessive(subject)} birth date is in the future.`, `${field}.dateOfBirth`)
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
  subject: Subject,
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
      warnings.push(`${grahaInfo(g.id).name.split(' (')[0]} changes rashi during ${POSSESSIVE[subject]} possible birth window, so its sign is uncertain.`)
    }
    if (shifting.some(g => g.id === 'mars')) {
      warnings.push(`Because Mars changes rashi in that window, ${POSSESSIVE[subject]} Moon-based Manglik check is uncertain.`)
    }
  } else {
    // How sensitive are the Moon-derived values to the recorded time?
    const moonSpeed = Math.abs(speeds.moon)
    const nakMinutes = (distanceToNakshatraBoundary(moon.longitude) / moonSpeed) * 1440
    const rashiMinutes = (distanceToRashiBoundary(moon.longitude) / moonSpeed) * 1440
    if (rashiMinutes < 45) {
      warnings.push(
        `${Possessive(subject)} Moon is within about ${Math.max(1, Math.round(rashiMinutes))} minutes of changing rashi. ` +
          `If the recorded birth time is out by more than that, the rashi — and everything read from it, including Koota scores — would change.`,
      )
    } else if (nakMinutes < 45) {
      warnings.push(
        `${Possessive(subject)} Moon is within about ${Math.max(1, Math.round(nakMinutes))} minutes of changing nakshatra. ` +
          `If the recorded birth time is out by more than that, the nakshatra — and what is read from it, including some Koota scores — would change.`,
      )
    }
    if (lagna) {
      const later = siderealLagna(siderealLongitudesAt(utcMs + 60_000), place.latitude, place.longitude)
      const perMinute = Math.abs(((later - lagna.longitude + 540) % 360) - 180)
      const lagnaMinutes = perMinute > 0 ? distanceToRashiBoundary(lagna.longitude) / perMinute : Infinity
      if (lagnaMinutes < 5) {
        warnings.push(
          `${Possessive(subject)} Lagna is within about ${Math.max(1, Math.round(lagnaMinutes))} minute${Math.round(lagnaMinutes) === 1 ? '' : 's'} ` +
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
    role: subject,
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

export type PreparedChart = { chart: ChartData; warnings: string[]; segment: number | null; utcMs: number; window: MoonSegment | null }

export type RashiResolved = { prepared: PreparedChart; nakshatraCertain: boolean; mergedTo?: string }

/**
 * Like prepareChart, for tools whose answer depends on the Moon's rashi but
 * not its nakshatra (Rashi, Manglik). With an unknown time, consecutive parts
 * of the day with the same Moon rashi are merged, so a nakshatra change alone
 * never triggers a question.
 */
export function prepareChartByRashi(person: PersonInput, now: Date):
  | { kind: 'one'; resolved: RashiResolved }
  | { kind: 'many'; resolved: Array<RashiResolved & { segment: number }> }
  | { kind: 'choose'; choices: MoonSegmentChoice[] } {
  const base = prepareChart({ ...person, moonSegment: undefined }, 'native', now)
  if (base.kind === 'charts') return { kind: 'one', resolved: { prepared: base.charts[0], nakshatraCertain: true } }

  const groups: MoonSegmentChoice[][] = []
  for (const c of base.choices) {
    const last = groups[groups.length - 1]
    if (last && last[0].rashi === c.rashi) last.push(c)
    else groups.push([c])
  }
  const resolve = (group: MoonSegmentChoice[]): RashiResolved => {
    const r = prepareChart({ ...person, moonSegment: group[0].index }, 'native', now)
    if (r.kind !== 'charts') throw new Error('segment did not resolve')
    const mergedTo = group.length > 1 ? group[group.length - 1].toLocal : undefined
    const prepared = mergedTo && r.charts[0].chart.moonWindow
      ? { ...r.charts[0], chart: { ...r.charts[0].chart, moonWindow: { ...r.charts[0].chart.moonWindow, toLocal: mergedTo } } }
      : r.charts[0]
    return { prepared, nakshatraCertain: group.length === 1 }
  }

  if (groups.length === 1) return { kind: 'one', resolved: resolve(groups[0]) }
  if (person.moonSegment === 'all') return { kind: 'many', resolved: groups.map(g => ({ ...resolve(g), segment: g[0].index })) }
  if (typeof person.moonSegment === 'number') {
    const group = groups.find(g => g.some(c => c.index === person.moonSegment))
    if (group) return { kind: 'one', resolved: resolve(group) }
  }
  return {
    kind: 'choose',
    choices: groups.map(g => ({ ...g[0], toLocal: g[g.length - 1].toLocal, ...(g.length > 1 ? { nakshatraVaries: true } : {}) })),
  }
}

/**
 * Resolve the birth details into one chart, several (one per part of the day
 * when the time is unknown and 'all' was asked for), or a question.
 */
export function prepareChart(person: PersonInput, subject: Subject, now: Date):
  | { kind: 'charts'; charts: PreparedChart[] }
  | { kind: 'choose'; choices: MoonSegmentChoice[] } {
  const r = resolveTime(person, subject, now)
  if (r.kind === 'fixed') {
    const built = buildChart(subject, person, r.utcMs, r.offsetMinutes)
    return { kind: 'charts', charts: [{ ...built, warnings: [...r.warnings, ...built.warnings], segment: null, utcMs: r.utcMs, window: null }] }
  }
  const { segments } = r
  const mid = (s: MoonSegment) => Math.floor((s.startUtc + s.endUtc) / 2)
  const chartFor = (s: MoonSegment): PreparedChart => ({
    ...buildChart(subject, person, mid(s), r.offsetMinutes, { segment: s, total: segments.length }),
    segment: segments.length > 1 ? s.index : null,
    utcMs: mid(s),
    window: s,
  })
  if (segments.length === 1) return { kind: 'charts', charts: [chartFor(segments[0])] }
  if (person.moonSegment === 'all') return { kind: 'charts', charts: segments.map(chartFor) }
  if (typeof person.moonSegment === 'number') {
    const s = segments[person.moonSegment]
    if (!s) {
      throw new KundliInputError('segment_invalid', 'That part of the day is no longer valid for this date. Please choose again.', `${FIELD[subject]}.moonSegment`)
    }
    return { kind: 'charts', charts: [chartFor(s)] }
  }
  return { kind: 'choose', choices: segments.map(s => segmentChoice(s, person.place.timezone)) }
}
