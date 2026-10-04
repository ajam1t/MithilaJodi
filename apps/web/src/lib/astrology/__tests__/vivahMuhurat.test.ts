import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeVivahMuhurat } from '../vivahMuhurat'
import { KundliInputError } from '../birthChart'
import { lunationsBetween } from '../vedic/lunarMonth'
import { siderealSunMoonAt } from '../vedic/chart'
import { PADA_SPAN, NAKSHATRA_SPAN, normalizeDeg, rashiIndexOf } from '../vedic/zodiac'
import {
  AVOIDED_YOGAS, VIVAH_NAKSHATRAS, VIVAH_SUN_RASHIS, inChaturmas, inHolashtak, isAvoidedKarana, isGandanta, isRikta,
} from '../rules/vivah'

const NOW = new Date('2026-10-05T06:00:00Z')
// The location Drik Panchang's published list uses by default.
const DIU = { label: 'Diu', latitude: 20 + 42 / 60 + 50 / 3600, longitude: 70 + 58 / 60 + 56 / 3600, timezone: 'Asia/Kolkata', source: 'manual' as const }

test('rule tables', () => {
  assert.deepEqual([...Array(30)].map((_, i) => i + 1).filter(isRikta), [4, 9, 14, 19, 24, 29])
  // Karana 0 Kimstughna; 1 Bava … 7 Vishti; 57–59 the fixed Shakuni, Chatushpada, Naga.
  assert.equal(isAvoidedKarana(0), false)
  assert.equal(isAvoidedKarana(1), false)
  assert.equal(isAvoidedKarana(7), true)
  assert.equal(isAvoidedKarana(14), true)
  assert.equal(isAvoidedKarana(56), true) // the last Vishti
  assert.equal(isAvoidedKarana(57), true)
  // Gandanta: Revati pada 4, Magha and Mula pada 1 (and the non-marriage Ashlesha/Jyeshtha/Ashwini edges).
  assert.equal(isGandanta(26 * 4 + 3), true)
  assert.equal(isGandanta(26 * 4 + 2), false)
  assert.equal(isGandanta(9 * 4), true)
  assert.equal(isGandanta(9 * 4 + 1), false)
  assert.equal(isGandanta(18 * 4), true)
  // Chaturmas: Ashadha (3) Shukla Ekadashi … Kartika (7) Shukla Ekadashi.
  assert.equal(inChaturmas(3, 10), false)
  assert.equal(inChaturmas(3, 11), true)
  assert.equal(inChaturmas(5, 30), true)
  assert.equal(inChaturmas(7, 11), true)
  assert.equal(inChaturmas(7, 12), false)
  assert.equal(inHolashtak(11, 8), true)
  assert.equal(inHolashtak(11, 16), false)
})

test('lunar months: Chaitra 2026 begins on 19 March; 2026 has an Adhika Jyeshtha (17 May – 15 June)', () => {
  const ls = lunationsBetween(Date.parse('2026-03-01T00:00:00Z'), Date.parse('2026-08-01T00:00:00Z'))
  const chaitra = ls.find(l => l.name === 'Chaitra')!
  assert.equal(new Date(chaitra.start + 5.5 * 3_600_000).toISOString().slice(0, 10), '2026-03-19')
  const adhika = ls.filter(l => l.kind === 'adhika')
  assert.equal(adhika.length, 1)
  assert.equal(adhika[0].name, 'Adhika Jyeshtha')
  assert.equal(new Date(adhika[0].start + 5.5 * 3_600_000).toISOString().slice(0, 10), '2026-05-17')
  assert.equal(new Date(adhika[0].end + 5.5 * 3_600_000).toISOString().slice(0, 10), '2026-06-15')
  assert.deepEqual(ls.map(l => l.name).slice(0, 6), ['Phalguna', 'Chaitra', 'Vaishakha', 'Adhika Jyeshtha', 'Jyeshtha', 'Ashadha'])
})

/** Drik Panchang, Diu, November–December 2026 (Rikta windows included, as Drik lists them). */
const DRIK: Array<[string, string, string, string]> = [
  ['2026-11-21', '06:59', '2026-11-22', '00:08'],
  ['2026-11-24', '23:25', '2026-11-25', '07:02'],
  ['2026-11-25', '07:02', '2026-11-26', '07:03'],
  ['2026-11-26', '07:03', '2026-11-26', '17:47'],
  ['2026-12-02', '10:32', '2026-12-03', '07:07'],
  ['2026-12-03', '07:07', '2026-12-03', '10:53'],
  ['2026-12-03', '23:03', '2026-12-04', '07:08'],
  ['2026-12-04', '07:08', '2026-12-04', '10:22'],
  ['2026-12-05', '11:48', '2026-12-06', '07:09'],
  ['2026-12-06', '07:09', '2026-12-06', '07:42'],
  ['2026-12-12', '03:04', '2026-12-12', '07:13'],
  ['2026-12-12', '07:13', '2026-12-13', '03:27'],
]

const minutesOf = (date: string, hhmm: string) => Date.parse(`${date}T${hhmm}:00+05:30`) / 60_000

test('Diu, Nov–Dec 2026: the same windows as Drik Panchang, within a minute (one documented exception)', () => {
  const { result } = computeVivahMuhurat({ place: DIU, from: '2026-11', months: 2 }, NOW)
  // Within a day, windows that touch are split only by the Rikta flag; Drik lists them as one.
  const ours: Array<{ s: number; e: number }> = []
  for (const d of result.days) {
    const first = ours.length
    for (const w of d.windows) {
      const s = minutesOf(w.startDate, w.startLocal)
      const e = minutesOf(w.endDate, w.endLocal)
      const last = ours[ours.length - 1]
      if (ours.length > first && last.e === s) last.e = e
      else ours.push({ s, e })
    }
  }
  assert.equal(ours.length, DRIK.length, JSON.stringify(result.days.map(d => [d.date, d.windows.map(w => `${w.startLocal}-${w.endLocal}`)])))
  DRIK.forEach(([sd, st, ed, et], i) => {
    assert.ok(Math.abs(ours[i].s - minutesOf(sd, st)) <= 1, `start ${sd} ${st}`)
    // Drik ends the Revati window 5 minutes earlier than the start of Revati's last pada (Gandanta) — documented.
    const tolerance = sd === '2026-11-21' ? 6 : 1
    assert.ok(Math.abs(ours[i].e - minutesOf(ed, et)) <= tolerance, `end ${ed} ${et}`)
  })
})

test('every minute of every window satisfies every rule (Darbhanga, 12 months)', () => {
  const { result } = computeVivahMuhurat(
    { place: { label: 'Darbhanga', latitude: 26.1542, longitude: 85.8918, timezone: 'Asia/Kolkata', source: 'mithila-jodi' }, from: '2026-10', months: 12 },
    NOW,
  )
  assert.ok(result.days.length > 40)
  for (const d of result.days) for (const w of d.windows) {
    const a = Date.parse(w.start)
    const b = Date.parse(w.end)
    for (let t = a + 1000; t < b; t += 10 * 60_000) {
      const { sun, moon } = siderealSunMoonAt(t)
      assert.ok(VIVAH_NAKSHATRAS.has(Math.floor(moon / NAKSHATRA_SPAN)), `${d.date} nakshatra`)
      assert.ok(!isGandanta(Math.floor(moon / PADA_SPAN)), `${d.date} gandanta`)
      assert.ok(VIVAH_SUN_RASHIS.has(rashiIndexOf(sun)), `${d.date} sun`)
      assert.ok(!AVOIDED_YOGAS.has(Math.floor(normalizeDeg(sun + moon) / NAKSHATRA_SPAN) + 1), `${d.date} yoga`)
      assert.ok(!isAvoidedKarana(Math.floor(normalizeDeg(moon - sun) / 6)), `${d.date} karana`)
    }
  }
  // The closed seasons of this year are reported.
  const keys = new Set(result.closed.map(c => c.key))
  for (const k of ['chaturmas', 'kharmas', 'holashtak'] as const) assert.ok(keys.has(k), k)
  // No window inside Kharmas (Sun in Dhanu, mid-December to mid-January).
  assert.ok(!result.days.some(d => d.date >= '2026-12-17' && d.date <= '2027-01-13'))
})

test('Moon signs add Guru, Surya and Chandra bal without changing the windows', () => {
  const base = computeVivahMuhurat({ place: DIU, from: '2026-12', months: 1 }, NOW).result
  const withBal = computeVivahMuhurat({ place: DIU, from: '2026-12', months: 1, brideRashi: 3, groomRashi: 1 }, NOW).result
  assert.deepEqual(withBal.days.map(d => d.windows.map(w => w.start)), base.days.map(d => d.windows.map(w => w.start)))
  for (const d of withBal.days) {
    assert.ok(d.guruBal && d.suryaBal)
    for (const w of d.windows) assert.ok(w.chandraBal?.bride && w.chandraBal?.groom)
  }
  assert.equal(base.days[0].guruBal, undefined)
})

test('no Vedic day where the Sun does not rise', () => {
  assert.throws(
    () => computeVivahMuhurat({ place: { label: 'Svalbard', latitude: 78.2, longitude: 15.6, timezone: 'Europe/Oslo', source: 'manual' }, from: '2026-12', months: 1 }, NOW),
    (e: unknown) => e instanceof KundliInputError && e.code === 'no_sunrise',
  )
})
