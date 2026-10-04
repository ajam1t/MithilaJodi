import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NAKSHATRA_INFO, nakshatraBounds, navatara } from '../vedic/nakshatraInfo'
import { NAKSHATRAS } from '../vedic/zodiac'
import { siderealMoonAt } from '../vedic/chart'
import { computeNakshatra, nakshatraWindow } from '../nakshatraReading'
import type { PersonInput } from '../types'

const NOW = new Date('2026-10-05T06:00:00Z')
const DARBHANGA = { label: 'Darbhanga, Bihar', latitude: 26.1542, longitude: 85.8918, timezone: 'Asia/Kolkata', source: 'mithila-jodi' as const }
const person: PersonInput = { name: 'Sita', dateOfBirth: '1995-03-12', timeOfBirth: '14:20', place: DARBHANGA }

test('reference data covers all 27 nakshatras with a deity, symbol and four pada syllables', () => {
  for (const n of NAKSHATRAS) {
    const info = NAKSHATRA_INFO[n.slug]
    assert.ok(info, n.slug)
    assert.ok(info.deity.length > 2 && info.symbol.length > 2, n.slug)
    assert.equal(info.syllables.length, 4, n.slug)
    for (const [hi, en] of info.syllables) {
      assert.match(hi, /^[ऀ-ॿ]+$/, `${n.slug} Devanagari ${hi}`)
      assert.match(en, /^[A-Z][a-z]*$/, `${n.slug} transliteration ${en}`)
    }
  }
  // Spot checks against the commonly printed Avakahada Chakra.
  assert.deepEqual(NAKSHATRA_INFO.ashwini.syllables.map(s => s[1]), ['Chu', 'Che', 'Cho', 'La'])
  assert.deepEqual(NAKSHATRA_INFO.punarvasu.syllables.map(s => s[1]), ['Ke', 'Ko', 'Ha', 'Hi'])
  assert.deepEqual(NAKSHATRA_INFO.revati.syllables.map(s => s[1]), ['De', 'Do', 'Cha', 'Chi'])
})

test('nakshatra and pada bounds tile the zodiac', () => {
  const b = nakshatraBounds(26)
  assert.ok(Math.abs(b.end - 360) < 1e-9)
  assert.ok(Math.abs(b.padas[3].end - b.end) < 1e-9)
  assert.ok(Math.abs(nakshatraBounds(6).start - 80) < 1e-9) // Punarvasu starts at 80°
})

test('Navatara: nine taras of three, every nakshatra exactly once, Janma first', () => {
  const t = navatara(6) // Punarvasu
  assert.equal(t.length, 9)
  const all = t.flatMap(x => x.nakshatras)
  assert.equal(new Set(all).size, 27)
  assert.deepEqual(t[0].nakshatras, ['punarvasu', 'vishakha', 'purva_bhadrapada'])
  assert.deepEqual(t.filter(x => !x.auspicious).map(x => x.name), ['Vipat', 'Pratyari', 'Vadha'])
})

test('nakshatra window brackets the birth and ends exactly on the boundaries', () => {
  const birth = Date.UTC(1995, 2, 12, 8, 50)
  const w = nakshatraWindow(birth, 6)
  const start = Date.parse(w.start)
  const end = Date.parse(w.end)
  assert.ok(start < birth && birth < end)
  const hours = (end - start) / 3_600_000
  assert.ok(hours > 20 && hours < 29, `${hours} h`)
  assert.ok(Math.abs(siderealMoonAt(start) - 80) < 0.001)
  assert.ok(Math.abs(siderealMoonAt(end) - 80 - 360 / 27) < 0.001)
  // Matches the Punarvasu → Pushya change found by the unknown-time window search (20:28 IST).
  assert.equal(new Date(end + 19_800_000).toISOString().slice(11, 16), '20:28')
})

test('window across the 0° wrap (Revati → Ashwini)', () => {
  // Find a moment in Revati by scanning, then check the window ends at 360°/0°.
  let t = Date.UTC(2024, 0, 1)
  while (Math.floor((siderealMoonAt(t) * 27) / 360) !== 26) t += 3_600_000
  const w = nakshatraWindow(t, 26)
  const endLon = siderealMoonAt(Date.parse(w.end))
  assert.ok(endLon < 0.001 || endLon > 359.999, `end at ${endLon}`)
})

test('a full reading', () => {
  const r = computeNakshatra({ person }, NOW)
  assert.equal(r.kind, 'result')
  if (r.kind !== 'result') return
  assert.equal(r.result.chart.moon.nakshatra, 'punarvasu')
  assert.equal(r.result.chart.moon.pada, 4)
  assert.equal(r.result.padaNavamsaIndex, 3) // Punarvasu 4th pada = Karka navamsa
  // Moon at 90.142°; Punarvasu spans 80°–93.33°.
  assert.ok(Math.abs(r.result.progress! - (90.142 - 80) / (360 / 27)) < 0.001)
})

test('unknown time: the window still comes from the sky, progress is withheld', () => {
  const r = computeNakshatra({ person: { ...person, timeOfBirth: null, moonSegment: 2 } }, NOW)
  assert.equal(r.kind, 'result')
  if (r.kind !== 'result') return
  assert.equal(r.result.chart.moon.nakshatra, 'pushya')
  assert.equal(r.result.progress, null)
  assert.ok(Date.parse(r.result.window.start) < Date.parse(r.result.window.end))
})
