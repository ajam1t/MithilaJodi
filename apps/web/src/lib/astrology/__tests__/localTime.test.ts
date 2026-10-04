import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatOffset, isRealCalendarDate, isValidTimeZone, localDayBounds, localToUtc, offsetMsAt,
} from '../time/localTime'

const ok = (r: ReturnType<typeof localToUtc>) => {
  assert.equal(r.status, 'ok')
  return r as Extract<typeof r, { status: 'ok' }>
}

test('India: IST +05:30 for modern births', () => {
  const r = ok(localToUtc({ year: 1995, month: 3, day: 12, hour: 14, minute: 20 }, 'Asia/Kolkata'))
  assert.equal(r.offsetMinutes, 330)
  assert.equal(new Date(r.utcMs).toISOString(), '1995-03-12T08:50:00.000Z')
})

test('India: historical war time (+06:30, 1942–45) and Madras time before 1906', () => {
  assert.equal(ok(localToUtc({ year: 1943, month: 6, day: 1, hour: 12, minute: 0 }, 'Asia/Kolkata')).offsetMinutes, 390)
  // Between the two war-time periods India was back on +05:30.
  assert.equal(ok(localToUtc({ year: 1942, month: 7, day: 1, hour: 12, minute: 0 }, 'Asia/Kolkata')).offsetMinutes, 330)
  const madras = ok(localToUtc({ year: 1900, month: 6, day: 1, hour: 12, minute: 0 }, 'Asia/Kolkata'))
  assert.equal(formatOffset(madras.offsetMinutes), '+05:21:10')
})

test('US (New York): EST/EDT, the spring-forward gap and the fall-back repeat', () => {
  assert.equal(ok(localToUtc({ year: 2021, month: 1, day: 15, hour: 9, minute: 0 }, 'America/New_York')).offsetMinutes, -300)
  assert.equal(ok(localToUtc({ year: 2021, month: 7, day: 15, hour: 9, minute: 0 }, 'America/New_York')).offsetMinutes, -240)
  assert.equal(localToUtc({ year: 2021, month: 3, day: 14, hour: 2, minute: 30 }, 'America/New_York').status, 'nonexistent')
  const amb = localToUtc({ year: 2021, month: 11, day: 7, hour: 1, minute: 30 }, 'America/New_York')
  assert.equal(amb.status, 'ambiguous')
  if (amb.status === 'ambiguous') {
    assert.equal(amb.earlier.offsetMinutes, -240)
    assert.equal(amb.later.offsetMinutes, -300)
    assert.equal(amb.later.utcMs - amb.earlier.utcMs, 3_600_000)
  }
  // Arizona does not observe DST.
  assert.equal(ok(localToUtc({ year: 2021, month: 7, day: 15, hour: 9, minute: 0 }, 'America/Phoenix')).offsetMinutes, -420)
})

test('UK (London): GMT/BST, gap and repeat', () => {
  assert.equal(ok(localToUtc({ year: 2020, month: 1, day: 10, hour: 8, minute: 0 }, 'Europe/London')).offsetMinutes, 0)
  assert.equal(ok(localToUtc({ year: 2020, month: 6, day: 1, hour: 8, minute: 0 }, 'Europe/London')).offsetMinutes, 60)
  assert.equal(localToUtc({ year: 2021, month: 3, day: 28, hour: 1, minute: 30 }, 'Europe/London').status, 'nonexistent')
  assert.equal(localToUtc({ year: 2021, month: 10, day: 31, hour: 1, minute: 30 }, 'Europe/London').status, 'ambiguous')
})

test('Australia (Sydney): southern-hemisphere DST runs October–April', () => {
  assert.equal(ok(localToUtc({ year: 2021, month: 1, day: 10, hour: 8, minute: 0 }, 'Australia/Sydney')).offsetMinutes, 660)
  assert.equal(ok(localToUtc({ year: 2021, month: 7, day: 10, hour: 8, minute: 0 }, 'Australia/Sydney')).offsetMinutes, 600)
  assert.equal(localToUtc({ year: 2021, month: 10, day: 3, hour: 2, minute: 30 }, 'Australia/Sydney').status, 'nonexistent')
  assert.equal(localToUtc({ year: 2021, month: 4, day: 4, hour: 2, minute: 30 }, 'Australia/Sydney').status, 'ambiguous')
})

test('midnight and 23:59 births', () => {
  const midnight = ok(localToUtc({ year: 2000, month: 1, day: 1, hour: 0, minute: 0 }, 'Asia/Kolkata'))
  assert.equal(new Date(midnight.utcMs).toISOString(), '1999-12-31T18:30:00.000Z')
  const late = ok(localToUtc({ year: 2000, month: 1, day: 1, hour: 23, minute: 59 }, 'Asia/Kolkata'))
  assert.equal(new Date(late.utcMs).toISOString(), '2000-01-01T18:29:00.000Z')
  const { startUtc, endUtc } = localDayBounds(2000, 1, 1, 'Asia/Kolkata')
  assert.equal(new Date(startUtc).toISOString(), '1999-12-31T18:30:00.000Z')
  assert.equal(new Date(endUtc).toISOString(), '2000-01-01T18:29:59.000Z')
})

test('leap years', () => {
  assert.equal(isRealCalendarDate(2024, 2, 29), true)
  assert.equal(isRealCalendarDate(2000, 2, 29), true) // divisible by 400
  assert.equal(isRealCalendarDate(1900, 2, 29), false) // divisible by 100, not 400
  assert.equal(isRealCalendarDate(2023, 2, 29), false)
  assert.equal(isRealCalendarDate(2023, 4, 31), false)
  assert.equal(isRealCalendarDate(2023, 13, 1), false)
})

test('time-zone validation and offset formatting', () => {
  assert.equal(isValidTimeZone('Asia/Kolkata'), true)
  assert.equal(isValidTimeZone('Asia/Calcutta'), true)
  assert.equal(isValidTimeZone('Mars/Olympus_Mons'), false)
  assert.equal(isValidTimeZone(''), false)
  assert.equal(formatOffset(330), '+05:30')
  assert.equal(formatOffset(-240), '-04:00')
  assert.equal(offsetMsAt('Asia/Kolkata', Date.UTC(2020, 0, 1)), 19_800_000)
})
