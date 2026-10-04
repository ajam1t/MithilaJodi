/**
 * Vivah Muhurat — every stretch of time in a date range when the panchang
 * meets the marriage rules in rules/vivah.ts, for a given place.
 *
 * Method: scan the sky every two hours, find each instant the nakshatra,
 * karana (and so tithi), yoga or solar sign changes by bisection to the
 * second, and add the local sunrises. Between consecutive boundaries nothing
 * changes, so each piece is judged once. Day-level conditions (Guru and Shukra
 * asta) are judged at that Vedic day's sunrise. Server-only by convention.
 */
import { KundliInputError } from './birthChart'
import { METHODOLOGY_VERSION } from './methodology'
import { siderealLongitudesAt, siderealSunMoonAt, wholeSignHouse, angularDelta } from './vedic/chart'
import { lunationAt, lunationsBetween, type Lunation } from './vedic/lunarMonth'
import { VARA, tithiOf } from './vedic/panchang'
import { NAKSHATRAS, NAKSHATRA_SPAN, PADA_SPAN, RASHIS, normalizeDeg, rashiIndexOf } from './vedic/zodiac'
import { sunriseAfter } from './ephemeris/positions'
import { localDayBounds, utcToLocal } from './time/localTime'
import {
  ASTA_ORB, AVOIDED_YOGAS, PREFERRED_VARAS, VIVAH_NAKSHATRAS, VIVAH_SUN_RASHIS,
  chandraBal, guruBal, inChaturmas, inHolashtak, isAvoidedKarana, isGandanta, isRikta, suryaBal,
} from './rules/vivah'
import type {
  MuhuratClosedKey, MuhuratClosedPeriod, MuhuratDay, MuhuratWindow, VivahMuhuratRequest, VivahMuhuratResult,
} from './types'

const MINUTE = 60_000
const STEP = 2 * 3_600_000
/** Shorter windows are dropped: too brief for the ceremony. */
export const MIN_WINDOW_MINUTES = 10

type Sky = { pada: number; karana: number; yoga: number; sunRashi: number }

function skyAt(t: number): Sky {
  const { sun, moon } = siderealSunMoonAt(t)
  return {
    pada: Math.floor(moon / PADA_SPAN + 1e-9),
    karana: Math.floor(normalizeDeg(moon - sun) / 6 + 1e-9),
    yoga: Math.floor(normalizeDeg(sun + moon) / NAKSHATRA_SPAN + 1e-9) + 1,
    sunRashi: rashiIndexOf(sun),
  }
}

const KEYS = ['pada', 'karana', 'yoga', 'sunRashi'] as const

/** First instant after `lo` (to the second) at which `key` differs from its value at `lo`. */
function changeOf(key: (typeof KEYS)[number], lo: number, hi: number, before: number): number {
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2)
    if (skyAt(mid)[key] === before) lo = mid
    else hi = mid
  }
  return hi
}

const pad = (n: number) => String(n).padStart(2, '0')
/** Local date and time, rounded to the nearest minute as panchangs print them. */
function local(t: number, tz: string) {
  const l = utcToLocal(Math.round(t / MINUTE) * MINUTE, tz)
  return { date: `${l.year}-${pad(l.month)}-${pad(l.day)}`, time: `${pad(l.hour)}:${pad(l.minute)}` }
}

type Verdict = { ok: boolean; rikta: boolean; tithi: number; closed: MuhuratClosedKey[] }

/**
 * `udaya` is the lunar month and tithi prevailing at the Vedic day's sunrise:
 * Chaturmas and Holashtak are observances, so — as in every panchang — they
 * follow the sunrise tithi and cover whole days.
 */
function judge(sky: Sky, lunation: Lunation | undefined, udaya: { month: number; tithi: number } | null): Verdict {
  const tithi = Math.floor(sky.karana / 2) + 1
  const closed: MuhuratClosedKey[] = []
  if (!VIVAH_SUN_RASHIS.has(sky.sunRashi)) closed.push(sky.sunRashi === 8 || sky.sunRashi === 11 ? 'kharmas' : 'sun')
  if (!lunation || lunation.kind !== 'normal') closed.push('adhika')
  if (udaya && inChaturmas(udaya.month, udaya.tithi)) closed.push('chaturmas')
  if (udaya && inHolashtak(udaya.month, udaya.tithi)) closed.push('holashtak')
  const ok = closed.length === 0
    && VIVAH_NAKSHATRAS.has(Math.floor(sky.pada / 4))
    && !isGandanta(sky.pada)
    && !AVOIDED_YOGAS.has(sky.yoga)
    && !isAvoidedKarana(sky.karana)
  return { ok, rikta: isRikta(tithi), tithi, closed }
}

function astaAt(t: number) {
  const s = siderealLongitudesAt(t).longitudes
  const guru = Math.abs(angularDelta(s.sun, s.jupiter)) < ASTA_ORB.jupiter
  const venusGap = Math.abs(angularDelta(s.sun, s.venus))
  let shukra = venusGap < ASTA_ORB.venusRetrograde
  if (!shukra && venusGap < ASTA_ORB.venus) {
    // Only a direct Venus uses the wider orb.
    const motion = angularDelta(siderealLongitudesAt(t - 43_200_000).longitudes.venus, siderealLongitudesAt(t + 43_200_000).longitudes.venus)
    shukra = motion >= 0
  }
  return { guru, shukra, jupiter: rashiIndexOf(s.jupiter), sun: rashiIndexOf(s.sun) }
}

const CLOSED_LABEL: Record<MuhuratClosedKey, string> = {
  sun: 'Sun in a sign closed to marriage',
  kharmas: 'Kharmas',
  chaturmas: 'Chaturmas',
  adhika: 'Adhika (intercalary) month',
  holashtak: 'Holashtak',
  'guru-asta': 'Guru asta — Jupiter set',
  'shukra-asta': 'Shukra asta — Venus set',
}

export function computeVivahMuhurat(req: VivahMuhuratRequest, now: Date): { result: VivahMuhuratResult } {
  const { place } = req
  const tz = place.timezone
  const [y0, m0] = req.from.split('-').map(Number)
  const endMonth = new Date(Date.UTC(y0, m0 - 1 + req.months, 1))

  // Vedic days: one per local calendar date, sunrise to the next sunrise.
  const dates: Array<{ y: number; m: number; d: number }> = []
  for (let d = new Date(Date.UTC(y0, m0 - 1, 1)); d <= endMonth; d = new Date(d.getTime() + 86_400_000)) {
    dates.push({ y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() })
  }
  const sunrises = dates.map(({ y, m, d }) => sunriseAfter(localDayBounds(y, m, d, tz).startUtc, place.latitude, place.longitude))
  if (sunrises.some(s => s == null)) {
    throw new KundliInputError('no_sunrise', 'The Sun does not rise every day at this latitude, so a Vedic day cannot be defined there.', 'place')
  }
  const rise = sunrises as number[]
  const from = rise[0]
  const to = rise[rise.length - 1]

  // Every change of nakshatra, karana, yoga or solar sign in [from, to).
  const boundaries = new Set<number>(rise)
  let t0 = from
  let s0 = skyAt(t0)
  while (t0 < to) {
    const t1 = Math.min(t0 + STEP, to)
    const s1 = skyAt(t1)
    for (const k of KEYS) if (s1[k] !== s0[k]) boundaries.add(changeOf(k, t0, t1, s0[k]))
    t0 = t1
    s0 = s1
  }
  const edges = [...boundaries].filter(b => b >= from && b <= to).sort((a, b) => a - b)

  const lunations = lunationsBetween(from, to)
  const { brideRashi = null, groomRashi = null } = req

  const days: MuhuratDay[] = []
  const daily: Array<{ date: string; keys: MuhuratClosedKey[] }> = []
  let e = 0
  for (let i = 0; i + 1 < rise.length; i++) {
    const dayStart = rise[i]
    const dayEnd = rise[i + 1]
    const date = `${dates[i].y}-${pad(dates[i].m)}-${pad(dates[i].d)}`
    const asta = astaAt(dayStart)
    const riseSky = skyAt(dayStart + 1000)
    const riseLunation = lunationAt(lunations, dayStart + 1000)
    const udaya = riseLunation && riseLunation.kind === 'normal' ? { month: riseLunation.month, tithi: Math.floor(riseSky.karana / 2) + 1 } : null
    const atRise = judge(riseSky, riseLunation, udaya)
    daily.push({
      date,
      keys: [
        ...atRise.closed,
        ...(asta.guru ? (['guru-asta'] as const) : []),
        ...(asta.shukra ? (['shukra-asta'] as const) : []),
      ],
    })

    const windows: MuhuratWindow[] = []
    let open: { start: number; end: number; rikta: boolean; naks: Set<number>; tithis: Set<number> } | null = null
    const flush = () => {
      if (!open) return
      const s = local(open.start, tz)
      const en = local(open.end, tz)
      const minutes = Math.round((open.end - open.start) / MINUTE)
      if (minutes >= MIN_WINDOW_MINUTES) {
        const w: MuhuratWindow = {
          start: new Date(open.start).toISOString(), end: new Date(open.end).toISOString(),
          startLocal: s.time, endLocal: en.time, startDate: s.date, endDate: en.date, minutes,
          nakshatras: [...open.naks].map(n => NAKSHATRAS[n].name),
          tithis: [...open.tithis].map(n => tithiOf(0, (n - 1) * 12 + 6).name),
          rikta: open.rikta,
        }
        if (brideRashi != null || groomRashi != null) {
          const moon = rashiIndexOf(siderealSunMoonAt(open.start).moon)
          w.chandraBal = {
            ...(brideRashi != null ? { bride: chandraBal(wholeSignHouse(moon, brideRashi)) } : {}),
            ...(groomRashi != null ? { groom: chandraBal(wholeSignHouse(moon, groomRashi)) } : {}),
          }
        }
        windows.push(w)
      }
      open = null
    }

    if (!asta.guru && !asta.shukra) {
      while (e + 1 < edges.length && edges[e + 1] <= dayStart) e++
      for (let j = e; j + 1 < edges.length && edges[j] < dayEnd; j++) {
        const a = Math.max(edges[j], dayStart)
        const b = Math.min(edges[j + 1], dayEnd)
        if (b <= a) continue
        const mid = (a + b) / 2
        const sky = skyAt(mid)
        const v = judge(sky, lunationAt(lunations, mid), udaya)
        if (v.ok && open && open.rikta === v.rikta && open.end === a) {
          open.end = b
          open.naks.add(Math.floor(sky.pada / 4))
          open.tithis.add(v.tithi)
        } else {
          flush()
          if (v.ok) open = { start: a, end: b, rikta: v.rikta, naks: new Set([Math.floor(sky.pada / 4)]), tithis: new Set([v.tithi]) }
        }
      }
      flush()
    }

    if (windows.length) {
      const weekday = new Date(Date.UTC(dates[i].y, dates[i].m - 1, dates[i].d)).getUTCDay()
      days.push({
        date,
        weekday,
        vara: VARA[weekday].name,
        preferredVara: PREFERRED_VARAS.has(weekday),
        sunrise: local(dayStart, tz).time,
        lunarMonth: lunationAt(lunations, dayStart + 1000)?.name ?? '',
        windows,
        ...(brideRashi != null ? { guruBal: guruBal(wholeSignHouse(asta.jupiter, brideRashi)) } : {}),
        ...(groomRashi != null ? { suryaBal: suryaBal(wholeSignHouse(asta.sun, groomRashi)) } : {}),
      })
    }
  }

  const noonOf = (d: string) => {
    const [yy, mm, dd] = d.split('-').map(Number)
    return localDayBounds(yy, mm, dd, tz).startUtc + 43_200_000
  }

  // Closed periods: runs of consecutive days on which a condition held at sunrise.
  const closed: MuhuratClosedPeriod[] = []
  const running = new Map<MuhuratClosedKey, MuhuratClosedPeriod>()
  for (const { date, keys } of daily) {
    for (const [k, p] of running) if (!keys.includes(k)) { closed.push(p); running.delete(k) }
    for (const k of keys) {
      const p = running.get(k)
      if (p) p.to = date
      else running.set(k, { key: k, label: CLOSED_LABEL[k], from: date, to: date })
    }
  }
  closed.push(...running.values())
  closed.sort((a, b) => a.from.localeCompare(b.from))
  for (const p of closed) {
    if (p.key === 'kharmas' || p.key === 'sun') {
      const signAt = (d: string) => rashiIndexOf(siderealSunMoonAt(noonOf(d)).sun)
      const a = RASHIS[signAt(p.from)].name
      const b = RASHIS[signAt(p.to)].name
      const signs = a === b ? a : `${a} to ${b}`
      p.label = p.key === 'kharmas' ? `Kharmas — Sun in ${signs}` : `Sun in ${signs} — not a marriage month`
    }
    if (p.key === 'adhika') {
      const l = lunationAt(lunations, noonOf(p.from))
      if (l && l.kind !== 'normal') p.label = `${l.name} — intercalary month`
    }
  }

  const last = new Date(endMonth.getTime() - 86_400_000)
  return {
    result: {
      methodologyVersion: METHODOLOGY_VERSION,
      computedAt: now.toISOString(),
      place: { label: place.label, latitude: place.latitude, longitude: place.longitude, timezone: tz },
      range: { from: `${y0}-${pad(m0)}-01`, to: `${last.getUTCFullYear()}-${pad(last.getUTCMonth() + 1)}-${pad(last.getUTCDate())}` },
      days,
      closed,
      couple: { brideRashi, groomRashi },
    },
  }
}
