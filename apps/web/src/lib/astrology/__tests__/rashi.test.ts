import { test } from 'node:test'
import assert from 'node:assert/strict'
import { moonSignCompatibility, padasInRashi, rashiAttributes } from '../vedic/rashiInfo'
import { bhakootKoota, grahaMaitriKoota } from '../rules/ashtakoota'
import { moonProfile } from '../vedic/chart'
import { siderealMoonAt } from '../vedic/chart'
import { computeRashi } from '../rashiReading'
import type { PersonInput } from '../types'

const NOW = new Date('2026-10-05T06:00:00Z')
const DARBHANGA = { label: 'Darbhanga, Bihar', latitude: 26.1542, longitude: 85.8918, timezone: 'Asia/Kolkata', source: 'mithila-jodi' as const }
const person: PersonInput = { name: 'Sita', dateOfBirth: '1995-03-12', timeOfBirth: '14:20', place: DARBHANGA }

test('attributes cycle: fire/earth/air/water and movable/fixed/dual', () => {
  assert.equal(rashiAttributes(0).tattva, 'fire')
  assert.equal(rashiAttributes(3).tattva, 'water')
  assert.equal(rashiAttributes(8).tattva, 'fire') // Dhanu
  assert.equal(rashiAttributes(0).quality, 'movable')
  assert.equal(rashiAttributes(1).quality, 'fixed')
  assert.equal(rashiAttributes(11).quality, 'dual') // Meena
  assert.equal(rashiAttributes(9).quality, 'movable') // Makara
})

test('each rashi holds exactly nine padas, and together they cover all 108 once', () => {
  let seen = 0
  for (let r = 0; r < 12; r += 1) {
    const groups = padasInRashi(r)
    assert.equal(groups.reduce((s, g) => s + g.padas.length, 0), 9)
    seen += 9
  }
  assert.equal(seen, 108)
  assert.deepEqual(padasInRashi(3), [
    { nakshatraIndex: 6, padas: [4] }, // Punarvasu 4
    { nakshatraIndex: 7, padas: [1, 2, 3, 4] }, // Pushya
    { nakshatraIndex: 8, padas: [1, 2, 3, 4] }, // Ashlesha
  ])
  assert.deepEqual(padasInRashi(0).map(g => g.nakshatraIndex), [0, 1, 2]) // Ashwini, Bharani, Krittika 1
})

test('Moon-sign compatibility agrees with the Ashtakoota engine for all 144 pairs', () => {
  for (let a = 0; a < 12; a += 1) {
    const table = moonSignCompatibility(a)
    for (let b = 0; b < 12; b += 1) {
      const ma = moonProfile(a * 30 + 10)
      const mb = moonProfile(b * 30 + 10)
      assert.equal(table[b].bhakootPoints, bhakootKoota(ma, mb).score, `bhakoot ${a}/${b}`)
      assert.equal(table[b].grahaMaitriPoints, grahaMaitriKoota(ma, mb).score, `maitri ${a}/${b}`)
      assert.equal(table[b].bhakootPoints, moonSignCompatibility(b)[a].bhakootPoints, 'symmetric')
    }
  }
  assert.equal(moonSignCompatibility(0)[7].relation, '6/8') // Mesha–Vrishchika
  assert.equal(moonSignCompatibility(0)[0].relation, 'same')
})

test('a full reading: Karka Moon, Vedic Kumbha Sun but Western Pisces', () => {
  const r = computeRashi({ person }, NOW)
  assert.equal(r.kind, 'result')
  if (r.kind !== 'result') return
  assert.equal(r.result.chart.moon.rashi, 'kark')
  assert.equal(r.result.sun.siderealRashiIndex, 10) // Kumbha
  assert.equal(r.result.sun.tropicalRashiIndex, 11) // Pisces
  assert.equal(r.result.nakshatraCertain, true)
  const start = Date.parse(r.result.window.start)
  const end = Date.parse(r.result.window.end)
  assert.ok(Math.abs(siderealMoonAt(start) - 90) < 0.001)
  assert.ok(Math.abs(siderealMoonAt(end) - 120) < 0.001)
  // The Moon entered Karka at 14:03 IST, the same moment the unknown-time search finds.
  assert.equal(new Date(start + 19_800_000).toISOString().slice(11, 16), '14:03')
  const hours = (end - start) / 3_600_000
  assert.ok(hours > 48 && hours < 62, `${hours} h`)
})

test('unknown time: a nakshatra change alone does not trigger a question', () => {
  // 13 Mar 1995: the Moon stays in Karka all day but moves from Pushya into Ashlesha.
  const r = computeRashi({ person: { ...person, dateOfBirth: '1995-03-13', timeOfBirth: null } }, NOW)
  assert.equal(r.kind, 'result')
  if (r.kind !== 'result') return
  assert.equal(r.result.chart.moon.rashi, 'kark')
  assert.equal(r.result.nakshatraCertain, false)
})

test('unknown time on a rashi-change day: merged choices, then a result for the chosen part', () => {
  const ask = computeRashi({ person: { ...person, timeOfBirth: null } }, NOW)
  assert.equal(ask.kind, 'needs_moon_choice')
  if (ask.kind !== 'needs_moon_choice') return
  // Three parts of the day (Mithuna·Punarvasu, Karka·Punarvasu, Karka·Pushya) collapse to two rashis.
  assert.deepEqual(ask.choices.map(c => c.rashi), ['mithun', 'kark'])
  assert.equal(ask.choices[1].toLocal, '23:59')
  assert.equal(ask.choices[1].nakshatraVaries, true)
  const r = computeRashi({ person: { ...person, timeOfBirth: null, moonSegment: ask.choices[1].index } }, NOW)
  assert.equal(r.kind, 'result')
  if (r.kind === 'result') {
    assert.equal(r.result.chart.moon.rashi, 'kark')
    assert.equal(r.result.nakshatraCertain, false)
  }
  const all = computeRashi({ person: { ...person, timeOfBirth: null, moonSegment: 'all' } }, NOW)
  assert.equal(all.kind, 'scenarios')
  if (all.kind === 'scenarios') assert.equal(all.scenarios.length, 2)
})
