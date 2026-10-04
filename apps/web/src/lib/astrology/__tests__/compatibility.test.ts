import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeCompatibility } from '../compatibility'
import { computeKundliMatch } from '../engine'
import { compareCharts, houseClasses, signRelation, seventhLordOf } from '../rules/compatibility'
import { navamsaRashiIndex } from '../vedic/divisions'
import { wholeSignHouse } from '../vedic/chart'
import type { ChartData, PersonInput } from '../types'

const NOW = new Date('2026-10-05T06:00:00Z')
const DARBHANGA = { label: 'Darbhanga, Bihar', latitude: 26.1542, longitude: 85.8918, timezone: 'Asia/Kolkata', source: 'mithila-jodi' as const }
const MADHUBANI = { label: 'Madhubani, Bihar', latitude: 26.3483, longitude: 86.0712, timezone: 'Asia/Kolkata', source: 'mithila-jodi' as const }
const sita: PersonInput = { name: 'Sita', dateOfBirth: '1995-03-12', timeOfBirth: '14:20', place: DARBHANGA }
const ram: PersonInput = { name: 'Ram', dateOfBirth: '1992-08-21', timeOfBirth: '06:45', place: MADHUBANI }

const result = () => {
  const r = computeCompatibility({ bride: sita, groom: ram }, NOW)
  assert.equal(r.kind, 'result')
  return (r as Extract<typeof r, { kind: 'result' }>).result
}
const sign = (c: ChartData, id: string) => c.planets.find(p => p.id === id)!.rashiIndex

test('sign relations count inclusively both ways, like Bhakoot', () => {
  assert.equal(signRelation(0, 0).label, 'same')
  assert.equal(signRelation(0, 6).label, '7/7')
  const r = signRelation(0, 4) // Mesha → Simha: 5th one way, 9th the other
  assert.equal(r.aToB, 5)
  assert.equal(r.bToA, 9)
  assert.equal(r.label, '5/9')
  assert.equal(signRelation(11, 0).label, '2/12')
  assert.equal(signRelation(2, 9).label, '6/8')
  assert.equal(signRelation(0, 3).label, '4/10')
  assert.equal(signRelation(0, 2).label, '3/11')
  // Mesha (Mars) and Simha (Sun) are natural friends both ways.
  assert.deepEqual(r.lords, { aToB: 'friend', bToA: 'friend' })
  // Mesha and Vrishchik share Mars as lord.
  assert.deepEqual(signRelation(0, 7).lords, { aToB: 'same', bToA: 'same' })
})

test('house classes', () => {
  assert.deepEqual(houseClasses(1), ['kendra', 'trikona'])
  assert.deepEqual(houseClasses(6), ['dusthana', 'upachaya'])
  assert.deepEqual(houseClasses(10), ['kendra', 'upachaya'])
  assert.deepEqual(houseClasses(2), [])
})

test('the Ashtakoota and Manglik parts are exactly Kundli Match', () => {
  const km = computeKundliMatch({ bride: sita, groom: ram }, NOW)
  assert.equal(km.kind, 'result')
  if (km.kind !== 'result') return
  const r = result()
  assert.deepEqual({ ...r.match, computedAt: '' }, { ...km.result, computedAt: '' })
})

test('every comparison fact follows from the two charts by the stated rules', () => {
  const { match, comparison: c } = result()
  const { bride, groom } = match
  assert.ok(bride.lagna && groom.lagna)

  assert.deepEqual(c.lagna, signRelation(bride.lagna.rashiIndex, groom.lagna.rashiIndex))

  // 7th lord: lord of the sign opposite the Lagna, and its house from the Lagna.
  for (const ch of [bride, groom]) {
    const s = seventhLordOf(ch)!
    assert.equal(s.seventhSign, (ch.lagna!.rashiIndex + 6) % 12)
    assert.equal(s.lordHouse, wholeSignHouse(sign(ch, s.lord), ch.lagna!.rashiIndex))
  }

  assert.equal(c.navamsa.bride.lagna, navamsaRashiIndex(bride.lagna.longitude))
  assert.equal(c.navamsa.groom.venus, navamsaRashiIndex(groom.planets.find(p => p.id === 'venus')!.longitude))

  // Cross placements: six entries, each counted from the partner's Lagna.
  assert.equal(c.cross.length, 6)
  for (const x of c.cross) {
    const own = x.from === 'bride' ? bride : groom
    const partner = x.from === 'bride' ? groom : bride
    assert.equal(x.sign, sign(own, x.planet))
    assert.equal(x.house, wholeSignHouse(x.sign, partner.lagna!.rashiIndex))
  }

  // Aspects: recompute independently from the drishti table.
  const reach: Record<string, number[]> = { jupiter: [1, 5, 7, 9], venus: [1, 7], mars: [1, 4, 7, 8], saturn: [1, 3, 7, 10] }
  let expected = 0
  for (const [from, to] of [[bride, groom], [groom, bride]] as const) {
    for (const id of Object.keys(reach)) {
      for (const t of [to.moon.rashiIndex, to.lagna!.rashiIndex, (to.lagna!.rashiIndex + 6) % 12]) {
        if (reach[id].includes(((t - sign(from, id) + 12) % 12) + 1)) expected++
      }
    }
  }
  assert.equal(c.contacts.length, expected)
})

test('Sita (Karka Lagna) and Ram: hand-checked facts', () => {
  const { match, comparison: c } = result()
  // Sita's Lagna is Karka (Mars sits there in the 1st — see the Manglik tests); its 7th is Makara, ruled by Saturn.
  assert.equal(match.bride.lagna!.rashiIndex, 3)
  assert.equal(c.seventhLord.bride!.lord, 'saturn')
  assert.equal(c.seventhLord.bride!.seventhSign, 9)
  // Ram's Lagna is Simha: Karka → Simha is 2/12; Moon (Karka) and Sun (Simha) are mutual friends.
  assert.equal(c.lagna!.label, '2/12')
  assert.deepEqual(c.lagna!.lords, { aToB: 'friend', bToA: 'friend' })
  // Sita's Saturn is in Kumbha: 8th from Karka. Ram's 7th is Kumbha; its lord Saturn is in Makara, 6th from Simha.
  assert.equal(c.seventhLord.bride!.lordHouse, 8)
  assert.equal(c.seventhLord.groom!.lordHouse, 6)
  // Sita's Jupiter (Vrishchik) is the 4th from Ram's Simha Lagna; Ram's Venus and Jupiter (Simha) the 2nd from Karka.
  const at = (from: string, planet: string) => c.cross.find(x => x.from === from && x.planet === planet)!.house
  assert.equal(at('bride', 'jupiter'), 4)
  assert.equal(at('groom', 'venus'), 2)
  // Ram's Saturn in Makara: on Sita's 7th sign, and the 7th from her Karka Moon and Lagna.
  const has = (from: string, planet: string, target: string, kind: string) =>
    c.contacts.some(k => k.from === from && k.planet === planet && k.target === target && k.kind === kind)
  assert.ok(has('groom', 'saturn', 'seventh', 'conjunction'))
  assert.ok(has('groom', 'saturn', 'moon', 'aspect'))
  // Sita's Jupiter in Vrishchik aspects Ram's Vrishabha Moon by the 7th; her Mars in Karka his Kumbha 7th by the 8th.
  assert.ok(has('bride', 'jupiter', 'moon', 'aspect'))
  assert.ok(c.contacts.some(k => k.from === 'bride' && k.planet === 'mars' && k.target === 'seventh' && k.position === 8))
  assert.equal(c.contacts.length, 7)
})

test('unknown time: no Lagna-based facts, and they are null rather than guessed', () => {
  const r = computeCompatibility({ bride: { ...sita, timeOfBirth: null, moonSegment: 0 }, groom: ram }, NOW)
  assert.equal(r.kind, 'result')
  if (r.kind !== 'result') return
  const c = r.result.comparison
  assert.equal(c.lagna, null)
  assert.equal(c.seventhLord.bride, null)
  assert.ok(c.seventhLord.groom)
  assert.equal(c.navamsa.bride.lagna, null)
  assert.equal(c.navamsa.lagnaRelation, null)
  // Ram's planets in Sita's chart need Sita's Lagna.
  for (const x of c.cross.filter(x => x.from === 'groom')) assert.equal(x.house, null)
  for (const x of c.cross.filter(x => x.from === 'bride')) assert.notEqual(x.house, null)
  // Nothing can be aimed at Sita's Lagna or 7th.
  assert.ok(c.contacts.every(k => k.from === 'bride' || k.target === 'moon'))
})

test("unknown time: asks like Kundli Match, and 'all' gives one comparison per scenario", () => {
  const ask = computeCompatibility({ bride: { ...sita, timeOfBirth: null }, groom: ram }, NOW)
  const km = computeKundliMatch({ bride: { ...sita, timeOfBirth: null }, groom: ram }, NOW)
  assert.equal(ask.kind, 'needs_moon_choice')
  assert.deepEqual(ask, km)
  const all = computeCompatibility({ bride: { ...sita, timeOfBirth: null, moonSegment: 'all' }, groom: ram }, NOW)
  assert.equal(all.kind, 'scenarios')
  if (all.kind === 'scenarios') {
    assert.ok(all.scenarios.length >= 2)
    for (const s of all.scenarios) assert.deepEqual(s.result.comparison, compareCharts(s.result.match.bride, s.result.match.groom))
  }
})

test('compareCharts is symmetric under swapping roles', () => {
  const { match } = result()
  const a = compareCharts(match.bride, match.groom)
  const b = compareCharts(match.groom, match.bride)
  assert.equal(a.contacts.length, b.contacts.length)
  assert.equal(a.lagna!.label, b.lagna!.label)
})
