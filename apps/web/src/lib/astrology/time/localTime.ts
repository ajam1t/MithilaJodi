/**
 * Local civil time at a birthplace → UTC instant.
 *
 * Uses the IANA time-zone database that ships with the JavaScript runtime
 * (Intl), so historical offsets and daylight saving are honoured — e.g. India
 * observed +06:30 "war time" in 1942–45, the UK and US shift twice a year, and
 * Australia's DST runs the other way round. The browser's own zone is never
 * consulted: everything is computed on the server from the zone the birthplace
 * resolved to.
 *
 * Pure. No dependencies.
 */

export type LocalDateTime = { year: number; month: number; day: number; hour: number; minute: number }

export type UtcResolution =
  | { status: 'ok'; utcMs: number; offsetMinutes: number }
  /** The wall-clock time occurred twice (clocks went back). Both instants given, earlier first. */
  | { status: 'ambiguous'; earlier: { utcMs: number; offsetMinutes: number }; later: { utcMs: number; offsetMinutes: number } }
  /** The wall-clock time never existed (clocks went forward over it). */
  | { status: 'nonexistent' }

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
    })
    formatters.set(timeZone, f)
  }
  return f
}

export function isValidTimeZone(timeZone: string): boolean {
  if (typeof timeZone !== 'string' || timeZone.length === 0 || timeZone.length > 64) return false
  try {
    formatterFor(timeZone)
    return true
  } catch {
    return false
  }
}

/** UTC offset of `timeZone` at the instant `utcMs`, in milliseconds (local − UTC). */
export function offsetMsAt(timeZone: string, utcMs: number): number {
  const instant = Math.floor(utcMs / 1000) * 1000
  const parts = formatterFor(timeZone).formatToParts(new Date(instant))
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - instant
}

const DAY = 86_400_000

export function localToUtc(local: LocalDateTime, timeZone: string): UtcResolution {
  const wall = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, 0)
  // Any transition near this wall time is bracketed by the offsets a day either
  // side. Each candidate offset is accepted only if it maps back to itself.
  const candidates = new Set([offsetMsAt(timeZone, wall - DAY), offsetMsAt(timeZone, wall), offsetMsAt(timeZone, wall + DAY)])
  const solutions: Array<{ utcMs: number; offsetMinutes: number }> = []
  for (const offset of candidates) {
    const utcMs = wall - offset
    if (offsetMsAt(timeZone, utcMs) === offset && !solutions.some(s => s.utcMs === utcMs)) {
      solutions.push({ utcMs, offsetMinutes: offset / 60_000 })
    }
  }
  solutions.sort((a, b) => a.utcMs - b.utcMs)
  if (solutions.length === 0) return { status: 'nonexistent' }
  if (solutions.length === 1) return { status: 'ok', ...solutions[0] }
  return { status: 'ambiguous', earlier: solutions[0], later: solutions[solutions.length - 1] }
}

/** UTC instant → wall-clock time in `timeZone`. */
export function utcToLocal(utcMs: number, timeZone: string): LocalDateTime & { second: number } {
  const parts = formatterFor(timeZone).formatToParts(new Date(Math.floor(utcMs / 1000) * 1000))
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') }
}

/** '+05:30', '-04:00', '+05:53:20' (LMT-era offsets keep their seconds). */
export function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? '-' : '+'
  const totalSeconds = Math.round(Math.abs(offsetMinutes) * 60)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const base = `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  return s ? `${base}:${String(s).padStart(2, '0')}` : base
}

export function isRealCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (month < 1 || month > 12 || day < 1) return false
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return day <= daysInMonth
}

/**
 * The first and last instants of a local calendar day. Midnight can itself be
 * skipped by a DST change in a few zones, so each end walks forward to the
 * first wall-clock minute that exists.
 */
export function localDayBounds(year: number, month: number, day: number, timeZone: string): { startUtc: number; endUtc: number } {
  const firstValid = (y: number, mo: number, d: number): number => {
    for (let minute = 0; minute < 24 * 60; minute += 1) {
      const r = localToUtc({ year: y, month: mo, day: d, hour: Math.floor(minute / 60), minute: minute % 60 }, timeZone)
      if (r.status === 'ok') return r.utcMs
      if (r.status === 'ambiguous') return r.earlier.utcMs
    }
    throw new Error('no valid minute in local day')
  }
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  return {
    startUtc: firstValid(year, month, day),
    endUtc: firstValid(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()) - 1000,
  }
}
