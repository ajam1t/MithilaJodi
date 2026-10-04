import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeKundliMatch, KundliInputError } from '../engine'
import { astroMoment, meanNodeLongitude, tropicalAscendant } from '../ephemeris/positions'
import { lahiriAyanamsha } from '../vedic/ayanamsha'
import { siderealLongitudesAt } from '../vedic/chart'
import { kundliMatchRequestSchema } from '../schema'
import { toSharedSummary } from '../share'
import type { KundliMatchRequest, PersonInput } from '../types'

const NOW = new Date('2026-10-04T06:00:00Z')

const DARBHANGA = { label: 'Darbhanga, Bihar', latitude: 26.1542, longitude: 85.8918, timezone: 'Asia/Kolkata', source: 'mithila-jodi' as const }
const MADHUBANI = { label: 'Madhubani, Bihar', latitude: 26.3483, longitude: 86.0712, timezone: 'Asia/Kolkata', source: 'mithila-jodi' as const }

const bride: PersonInput = { name: 'Sita', dateOfBirth: '1995-03-12', timeOfBirth: '14:20', place: DARBHANGA }
const groom: PersonInput = { name: 'Ram', dateOfBirth: '1992-08-21', timeOfBirth: '06:45', place: MADHUBANI }

const match = (req: KundliMatchRequest) => computeKundliMatch(req, NOW)
const result = (req: KundliMatchRequest) => {
  const r = match(req)
  assert.equal(r.kind, 'result')
  return (r as Extract<typeof r, { kind: 'result' }>).result
}

test('Lahiri ayanamsha anchor and J2000 value', () => {
  assert.ok(Math.abs(lahiriAyanamsha(2435553.5 - 2451545) - 23.245522556) < 1e-9)
  // Swiss Ephemeris SE_SIDM_LAHIRI gives 23.8571° at J2000; IAU 2006 precession reproduces it to 0.2″.
  assert.ok(Math.abs(lahiriAyanamsha(0) - 23.85705) < 0.0001)
})

test('mean node matches Meeus, Astronomical Algorithms, example 47.a', () => {
  assert.ok(Math.abs(meanNodeLongitude(2448724.5 - 2451545) - 274.400656) < 1e-5)
})

test('sidereal positions agree with NASA JPL DE421 (Skyfield) to within 1 arcminute', () => {
  // Reference values: DE421 apparent geocentric longitude − IAU 2000A nutation − the same Lahiri ayanamsha.
  const cases = [
    { iso: '1995-03-12T08:50:00Z', sun: 327.5214, moon: 90.1421, mars: 110.3369 },
    { iso: '1992-08-21T01:15:00Z', sun: 124.4776, moon: 30.0677, mars: 52.8564 },
  ]
  for (const c of cases) {
    const { longitudes } = siderealLongitudesAt(Date.parse(c.iso))
    for (const body of ['sun', 'moon', 'mars'] as const) {
      const diff = Math.abs(((longitudes[body] - c[body] + 540) % 360) - 180) * 3600
      assert.ok(diff < 60, `${c.iso} ${body}: ${diff.toFixed(1)}″`)
    }
  }
})

test('Lagna is the ecliptic point on the eastern horizon', () => {
  const rad = Math.PI / 180
  const places = [[26.15, 85.89], [28.61, 77.21], [-33.87, 151.21], [51.5, -0.12], [0, 0]]
  const instants = ['1995-03-12T08:50:00Z', '2001-07-01T22:10:00Z', '1987-12-25T03:33:00Z']
  for (const iso of instants) {
    const m = astroMoment(Date.parse(iso))
    for (const [lat, lng] of places) {
      const asc = tropicalAscendant(m, lat, lng) + m.nutationLonDeg // back to the true equinox
      const eps = m.trueObliquityDeg * rad
      const lam = asc * rad
      const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam))
      const dec = Math.asin(Math.sin(eps) * Math.sin(lam))
      const ha = (m.gastDeg + lng) * rad - ra
      const alt = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(ha))
      assert.ok(Math.abs(alt / rad) < 1e-6, `${iso} ${lat},${lng}: altitude ${alt / rad}`)
      assert.ok(Math.sin(ha) < 0, `${iso} ${lat},${lng}: not on the eastern side`)
    }
  }
})

test('a full match: 8 kootas, consistent totals, charts and Manglik', () => {
  const r = result({ bride, groom })
  assert.equal(r.kootas.length, 8)
  assert.equal(r.maxTotal, 36)
  assert.equal(r.total, r.kootas.reduce((s, k) => s + k.score, 0))
  assert.ok(r.total >= 0 && r.total <= 36)
  assert.equal(r.methodologyVersion, '1.0.0')
  for (const c of [r.bride, r.groom]) {
    assert.equal(c.planets.length, 9)
    assert.ok(c.lagna)
    const moon = c.planets.find(p => p.id === 'moon')!
    assert.equal(moon.rashi, c.moon.rashi)
    assert.equal(moon.nakshatra, c.moon.nakshatra)
    assert.equal(moon.house, ((moon.rashiIndex - c.lagna!.rashiIndex + 12) % 12) + 1)
    const rahu = c.planets.find(p => p.id === 'rahu')!
    const ketu = c.planets.find(p => p.id === 'ketu')!
    assert.ok(Math.abs(((rahu.longitude - ketu.longitude + 360) % 360) - 180) < 1e-9)
    assert.equal(rahu.retrograde, true)
  }
  // Bride's Moon at 90.14° (Karka 0°08′) and groom's at 30.07° (Vrishabha 0°04′).
  assert.equal(r.bride.moon.rashi, 'kark')
  assert.equal(r.bride.moon.nakshatra, 'punarvasu')
  assert.equal(r.groom.moon.rashi, 'vrishabh')
  assert.equal(r.groom.moon.nakshatra, 'krittika')
  // Both Moons are minutes from a rashi boundary, so both carry a birth-time sensitivity warning.
  assert.equal(r.warnings.filter(w => /minutes of changing rashi/.test(w)).length, 2)
  assert.ok(['yes', 'no', 'anshik'].includes(r.manglik.bride.status))
  assert.ok(r.insights.length >= 2)
})

test('deterministic: the same input always gives the same result', () => {
  assert.deepEqual(match({ bride, groom }), match({ bride, groom }))
})

test('swapping bride and groom can change the score (roles matter)', () => {
  const a = result({ bride, groom })
  const b = result({ bride: groom, groom: bride })
  // Bhakoot, Nadi, Yoni and Graha Maitri are symmetric; Varna, Vashya and Gana are not.
  for (const key of ['bhakoot', 'nadi', 'yoni', 'grahaMaitri', 'tara'] as const) {
    assert.equal(a.kootas.find(k => k.key === key)!.score, b.kootas.find(k => k.key === key)!.score, key)
  }
})

test('unknown birth time on a day the Moon changes rashi asks which part of the day', () => {
  const r = match({ bride: { ...bride, timeOfBirth: null }, groom })
  assert.equal(r.kind, 'needs_moon_choice')
  if (r.kind !== 'needs_moon_choice') return
  const choices = r.choices.bride!
  assert.ok(choices.length >= 2)
  assert.equal(choices[0].fromLocal, '00:00')
  assert.equal(choices[choices.length - 1].toLocal, '23:59')
  assert.ok(choices.some(c => c.rashi === 'mithun') && choices.some(c => c.rashi === 'kark'))
  assert.equal(r.choices.groom, undefined)
})

test('unknown birth time with a chosen window: no Lagna, no houses, Manglik incomplete', () => {
  const r = result({ bride: { ...bride, timeOfBirth: null, moonSegment: 0 }, groom })
  assert.equal(r.bride.timeKnown, false)
  assert.equal(r.bride.lagna, null)
  assert.ok(r.bride.planets.every(p => p.house === null))
  assert.equal(r.bride.moon.rashi, 'mithun')
  assert.equal(r.manglik.bride.status, 'incomplete')
  assert.ok(r.bride.moon.range)
  assert.ok(r.bride.notes.some(n => /Birth time not given/.test(n)))
})

test("'all' windows returns one scenario per possibility", () => {
  const first = match({ bride: { ...bride, timeOfBirth: null }, groom })
  assert.equal(first.kind, 'needs_moon_choice')
  const n = first.kind === 'needs_moon_choice' ? first.choices.bride!.length : 0
  const r = match({ bride: { ...bride, timeOfBirth: null, moonSegment: 'all' }, groom })
  assert.equal(r.kind, 'scenarios')
  if (r.kind === 'scenarios') {
    assert.equal(r.scenarios.length, n)
    assert.deepEqual(r.scenarios.map(s => s.brideSegment), Array.from({ length: n }, (_, i) => i))
  }
})

test('midnight, 23:59 and leap-day births all calculate', () => {
  for (const [dateOfBirth, timeOfBirth] of [['2000-02-29', '00:00'], ['2000-02-29', '23:59'], ['1996-12-31', '23:59']]) {
    const r = result({ bride: { ...bride, dateOfBirth, timeOfBirth }, groom })
    assert.equal(r.bride.birth.localDate, dateOfBirth)
  }
})

test('births abroad use the birthplace zone, including DST', () => {
  const ny = { label: 'New York, USA', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York', source: 'manual' as const }
  const summer = result({ bride: { ...bride, dateOfBirth: '1998-07-04', timeOfBirth: '10:00', place: ny }, groom })
  assert.equal(summer.bride.birth.utcOffset, '-04:00')
  assert.equal(summer.bride.birth.calculatedAtUtc, '1998-07-04T14:00:00.000Z')
})

test('a time skipped by daylight saving is rejected with a clear message', () => {
  const ny = { label: 'New York, USA', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York', source: 'manual' as const }
  assert.throws(
    () => match({ bride: { ...bride, dateOfBirth: '2021-03-14', timeOfBirth: '02:30', place: ny }, groom }),
    (e: unknown) => e instanceof KundliInputError && e.code === 'time_nonexistent' && /daylight saving/.test(e.userMessage),
  )
})

test('a repeated (fall-back) time uses the first occurrence unless told otherwise, and says so', () => {
  const london = { label: 'London, UK', latitude: 51.5072, longitude: -0.1276, timezone: 'Europe/London', source: 'manual' as const }
  const p = { ...bride, dateOfBirth: '2001-10-28', timeOfBirth: '01:30', place: london }
  const earlier = result({ bride: p, groom })
  const later = result({ bride: { ...p, repeatedTime: 'later' }, groom })
  assert.equal(Date.parse(later.bride.birth.calculatedAtUtc) - Date.parse(earlier.bride.birth.calculatedAtUtc), 3_600_000)
  assert.ok(earlier.warnings.some(w => /occurred twice/.test(w)))
})

test('future births are rejected', () => {
  assert.throws(
    () => match({ bride: { ...bride, dateOfBirth: '2027-01-01' }, groom }),
    (e: unknown) => e instanceof KundliInputError && e.code === 'date_future',
  )
})

test('a share summary carries no birth date, time, place, coordinates or degrees', () => {
  const r = result({ bride, groom })
  const withNames = JSON.stringify(toSharedSummary(r, true))
  for (const leak of ['1995', '1992', '14:20', '06:45', 'Darbhanga', 'Madhubani', '26.15', '85.89', 'latitude', 'longitude', 'degreeInRashi', 'calculatedAtUtc', '°']) {
    assert.ok(!withNames.includes(leak), `share summary leaks ${leak}`)
  }
  assert.ok(withNames.includes('"Sita"'))
  const anonymous = toSharedSummary(r, false)
  assert.deepEqual(anonymous.names, { bride: null, groom: null })
  assert.equal(anonymous.total, r.total)
})

test('schema rejects bad input with field-level messages', () => {
  const bad = (patch: Partial<PersonInput>) => kundliMatchRequestSchema.safeParse({ bride: { ...bride, ...patch }, groom })
  assert.equal(bad({}).success, true)
  assert.equal(bad({ dateOfBirth: '2023-02-29' }).success, false) // not a leap year
  assert.equal(bad({ dateOfBirth: '2023-02-30' }).success, false)
  assert.equal(bad({ dateOfBirth: '1899-12-31' }).success, false)
  assert.equal(bad({ timeOfBirth: '24:00' }).success, false)
  assert.equal(bad({ timeOfBirth: '7:5' }).success, false)
  assert.equal(bad({ name: '' }).success, false)
  assert.equal(bad({ name: 'R2D2' }).success, false)
  assert.equal(bad({ name: 'सीता' }).success, true)
  assert.equal(bad({ place: { ...DARBHANGA, latitude: 91 } }).success, false)
  assert.equal(bad({ place: { ...DARBHANGA, longitude: Number.NaN } }).success, false)
  assert.equal(bad({ place: { ...DARBHANGA, timezone: 'Nowhere/Land' } }).success, false)
  assert.equal(kundliMatchRequestSchema.safeParse({ bride: { ...bride, place: undefined }, groom }).success, false)
})
