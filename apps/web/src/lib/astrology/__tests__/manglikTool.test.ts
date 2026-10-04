import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeManglik } from '../manglikReading'
import { computeKundliMatch } from '../engine'
import { computeJanamKundli } from '../janamKundli'
import type { PersonInput } from '../types'

const NOW = new Date('2026-10-05T06:00:00Z')
const DARBHANGA = { label: 'Darbhanga, Bihar', latitude: 26.1542, longitude: 85.8918, timezone: 'Asia/Kolkata', source: 'mithila-jodi' as const }
const MADHUBANI = { label: 'Madhubani, Bihar', latitude: 26.3483, longitude: 86.0712, timezone: 'Asia/Kolkata', source: 'mithila-jodi' as const }
const sita: PersonInput = { name: 'Sita', dateOfBirth: '1995-03-12', timeOfBirth: '14:20', place: DARBHANGA }
const ram: PersonInput = { name: 'Ram', dateOfBirth: '1992-08-21', timeOfBirth: '06:45', place: MADHUBANI }

const one = (p: PersonInput) => {
  const r = computeManglik({ person: p }, NOW)
  assert.equal(r.kind, 'result')
  return (r as Extract<typeof r, { kind: 'result' }>).result
}

test('the Manglik tool gives exactly the status Kundli Match and Janam Kundli give', () => {
  const match = computeKundliMatch({ bride: sita, groom: ram }, NOW)
  assert.equal(match.kind, 'result')
  if (match.kind !== 'result') return
  assert.deepEqual(one(sita).manglik, match.result.manglik.bride)
  assert.deepEqual(one(ram).manglik, match.result.manglik.groom)
  const janam = computeJanamKundli({ person: sita }, NOW)
  if (janam.kind === 'result') assert.deepEqual(one(sita).manglik, janam.result.manglik)
})

test('Sita: Mars in Karka in the 1st from both Lagna and Moon → Manglik; Mars debilitated there', () => {
  const r = one(sita)
  assert.equal(r.manglik.status, 'yes')
  assert.equal(r.manglik.marsHouseFromLagna, 1)
  assert.equal(r.manglik.marsHouseFromMoon, 1)
  assert.equal(r.marsDignity, 'debilitated')
  // Venus in Makara, Mars in Karka: the 7th from Venus.
  assert.equal(r.marsHouseFromVenus, 7)
})

test('Ram: Mars 10th from Lagna but 1st from the Moon → Anshik', () => {
  const r = one(ram)
  assert.equal(r.manglik.status, 'anshik')
  assert.equal(r.manglik.fromLagna, false)
  assert.equal(r.manglik.fromMoon, true)
})

test('unknown time: Moon-based only, reported incomplete; nakshatra-only change does not ask', () => {
  const r = computeManglik({ person: { ...sita, dateOfBirth: '1995-03-13', timeOfBirth: null } }, NOW)
  assert.equal(r.kind, 'result')
  if (r.kind !== 'result') return
  assert.equal(r.result.manglik.status, 'incomplete')
  assert.equal(r.result.manglik.masterValue, 'unknown')
  assert.equal(r.result.nakshatraCertain, false)
  const ask = computeManglik({ person: { ...sita, timeOfBirth: null } }, NOW)
  assert.equal(ask.kind, 'needs_moon_choice')
  if (ask.kind === 'needs_moon_choice') assert.deepEqual(ask.choices.map(c => c.rashi), ['mithun', 'kark'])
})
