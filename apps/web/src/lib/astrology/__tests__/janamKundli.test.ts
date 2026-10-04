import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeJanamKundli } from '../janamKundli'
import { dignityOf, navamsaRashiIndex } from '../vedic/divisions'
import { DASHA_YEARS, DASHA_YEAR_MS, vimshottari } from '../vedic/dasha'
import { karanaOf, tithiOf, varaOf, yogaOf } from '../vedic/panchang'
import { siderealLongitudesAt } from '../vedic/chart'
import { sunriseAfter } from '../ephemeris/positions'
import { NAKSHATRA_SPAN } from '../vedic/zodiac'
import type { PersonInput } from '../types'

const NOW = new Date('2026-10-05T06:00:00Z')
const DARBHANGA = { label: 'Darbhanga, Bihar', latitude: 26.1542, longitude: 85.8918, timezone: 'Asia/Kolkata', source: 'mithila-jodi' as const }
const person: PersonInput = { name: 'Sita', dateOfBirth: '1995-03-12', timeOfBirth: '14:20', place: DARBHANGA }

test('navamsa follows the classical starting signs (movable: itself, fixed: 9th, dual: 5th)', () => {
  assert.equal(navamsaRashiIndex(0.5), 0) // Mesha (movable) starts from Mesha
  assert.equal(navamsaRashiIndex(30.5), 9) // Vrishabha (fixed) starts from Makara, its 9th
  assert.equal(navamsaRashiIndex(60.5), 6) // Mithuna (dual) starts from Tula, its 5th
  assert.equal(navamsaRashiIndex(90.5), 3) // Karka (movable) starts from Karka
  assert.equal(navamsaRashiIndex(29.9), 8) // last navamsa of Mesha is Dhanu
  assert.equal(navamsaRashiIndex(359.9), 11) // last navamsa of Meena is Meena (vargottama)
  for (let k = 0; k < 108; k += 1) assert.equal(navamsaRashiIndex(k * (30 / 9) + 0.01), k % 12)
})

test('dignity: exaltation, debilitation, own sign, friendship, nodes', () => {
  assert.equal(dignityOf('sun', 0), 'exalted')
  assert.equal(dignityOf('sun', 6), 'debilitated')
  assert.equal(dignityOf('sun', 4), 'own')
  assert.equal(dignityOf('mercury', 5), 'exalted') // exaltation outranks own sign
  assert.equal(dignityOf('saturn', 0), 'debilitated')
  assert.equal(dignityOf('mars', 4), 'friendly') // Sun's sign, Sun is Mars's friend
  assert.equal(dignityOf('venus', 4), 'enemy') // Venus regards the Sun as an enemy
  assert.equal(dignityOf('jupiter', 2), 'enemy') // Mercury's sign
  assert.equal(dignityOf('saturn', 8), 'neutral') // Jupiter's sign
  assert.equal(dignityOf('rahu', 1), null)
})

test('Vimshottari: starts from the Moon nakshatra lord, 120 years, contiguous, proportional antardashas', () => {
  const birth = Date.UTC(1995, 2, 12, 8, 50)
  // Moon exactly halfway through Bharani (Venus, 20 years) → 10 years left.
  const d = vimshottari(NAKSHATRA_SPAN * 1.5, birth)
  assert.equal(d.balanceAtBirth.lord, 'venus')
  assert.deepEqual([d.balanceAtBirth.years, d.balanceAtBirth.months], [10, 0])
  assert.deepEqual(d.mahadashas.map(m => m.lord), ['venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury', 'ketu'])
  assert.equal(d.mahadashas.reduce((s, m) => s + m.years, 0), 120)
  assert.ok(Math.abs(Date.parse(d.mahadashas[0].end) - (birth + 10 * DASHA_YEAR_MS)) < 2)
  for (let i = 1; i < 9; i += 1) assert.equal(d.mahadashas[i].start, d.mahadashas[i - 1].end)
  for (const m of d.mahadashas) {
    assert.equal(m.antardashas![0].lord, m.lord)
    assert.equal(m.antardashas![0].start, m.start)
    assert.ok(Math.abs(Date.parse(m.antardashas![8].end) - Date.parse(m.end)) < 2)
    const total = m.antardashas!.reduce((s, a) => s + (Date.parse(a.end) - Date.parse(a.start)), 0)
    assert.ok(Math.abs(total - DASHA_YEARS[m.lord] * DASHA_YEAR_MS) < 20)
  }
  // At the very start of Ashwini the whole Ketu period is still to run.
  assert.equal(vimshottari(0.000001, birth).balanceAtBirth.years, 6)
  assert.equal(vimshottari(0.000001, birth).balanceAtBirth.months, 11)
})

test('tithi, yoga and karana from longitudes', () => {
  assert.deepEqual(tithiOf(0, 5), { number: 1, name: 'Shukla Pratipada', paksha: 'shukla' })
  assert.equal(tithiOf(0, 175).name, 'Shukla Purnima')
  assert.equal(tithiOf(0, 185).name, 'Krishna Pratipada')
  assert.equal(tithiOf(0, 355).name, 'Krishna Amavasya')
  assert.equal(tithiOf(100, 100 + 12 * 10.5).name, 'Shukla Ekadashi')
  assert.equal(yogaOf(0, 1).name, 'Vishkumbha')
  assert.equal(yogaOf(200, 159.9).name, 'Vaidhriti')
  assert.equal(karanaOf(0, 3).name, 'Kimstughna')
  assert.equal(karanaOf(0, 7).name, 'Bava')
  assert.equal(karanaOf(0, 6 * 7 + 1).name, 'Vishti')
  assert.equal(karanaOf(0, 6 * 8 + 1).name, 'Bava') // the seven movable karanas repeat
  assert.equal(karanaOf(0, 6 * 57 + 1).name, 'Shakuni')
  assert.equal(karanaOf(0, 359).name, 'Naga')
})

test('real lunar phases: Purnima on 23 Apr 2024, Amavasya on 8 Apr 2024 (solar eclipse day)', () => {
  const at = (iso: string) => siderealLongitudesAt(Date.parse(iso)).longitudes
  const purnima = at('2024-04-23T06:30:00Z')
  assert.equal(tithiOf(purnima.sun, purnima.moon).name, 'Shukla Purnima')
  const amavasya = at('2024-04-08T06:30:00Z')
  assert.equal(tithiOf(amavasya.sun, amavasya.moon).name, 'Krishna Amavasya')
})

test('vara runs sunrise to sunrise', () => {
  assert.equal(varaOf(2, false).name, 'Mangalavara (Tuesday)')
  assert.equal(varaOf(2, true).name, 'Somavara (Monday)')
  assert.equal(varaOf(0, true).name, 'Shanivara (Saturday)')
  // Delhi, 23 Apr 2024: sunrise ≈ 05:48 IST.
  const sunrise = sunriseAfter(Date.parse('2024-04-22T18:30:00Z'), 28.6139, 77.209)!
  const local = new Date(sunrise + 19_800_000)
  assert.equal(local.getUTCHours(), 5)
  assert.ok(local.getUTCMinutes() >= 40 && local.getUTCMinutes() <= 55, `sunrise ${local.toISOString()}`)
})

test('a full Janam Kundli: chart, navamsa, dignities, dasha, panchang, manglik', () => {
  const r = computeJanamKundli({ person }, NOW)
  assert.equal(r.kind, 'result')
  if (r.kind !== 'result') return
  const k = r.result
  assert.equal(k.chart.role, 'native')
  assert.ok(k.chart.lagna)
  assert.equal(k.navamsa.planets.length, 9)
  assert.ok(k.navamsa.lagnaRashiIndex != null)
  assert.equal(k.dignities.find(d => d.id === 'mars')!.dignity, 'debilitated') // Mars in Karka
  assert.equal(k.dasha!.balanceAtBirth.lord, 'jupiter') // Moon in Punarvasu
  assert.equal(k.panchang!.vara.name, 'Ravivara (Sunday)') // 12 Mar 1995 was a Sunday; birth after sunrise
  assert.equal(k.panchang!.vara.beforeSunrise, false)
  assert.equal(k.manglik.status, 'yes')
  assert.ok(k.warnings.some(w => /^The Moon is within/.test(w)))
  assert.deepEqual(computeJanamKundli({ person }, NOW), r)
})

test('before sunrise the vara is the previous day', () => {
  const r = computeJanamKundli({ person: { ...person, timeOfBirth: '04:30' } }, NOW)
  assert.equal(r.kind, 'result')
  if (r.kind === 'result') {
    assert.equal(r.result.panchang!.vara.beforeSunrise, true)
    assert.equal(r.result.panchang!.vara.name, 'Shanivara (Saturday)')
  }
})

test('unknown birth time: asks, then gives a chart without Lagna, dasha or panchang', () => {
  const ask = computeJanamKundli({ person: { ...person, timeOfBirth: null } }, NOW)
  assert.equal(ask.kind, 'needs_moon_choice')
  const r = computeJanamKundli({ person: { ...person, timeOfBirth: null, moonSegment: 1 } }, NOW)
  assert.equal(r.kind, 'result')
  if (r.kind !== 'result') return
  assert.equal(r.result.chart.lagna, null)
  assert.equal(r.result.dasha, null)
  assert.equal(r.result.panchang, null)
  assert.equal(r.result.navamsa.lagnaRashiIndex, null)
  assert.equal(r.result.manglik.status, 'incomplete')
  const all = computeJanamKundli({ person: { ...person, timeOfBirth: null, moonSegment: 'all' } }, NOW)
  assert.equal(all.kind, 'scenarios')
})
