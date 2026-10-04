import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nameStartsWith, rashiSyllables, syllableOf, syllablesBetween } from '../vedic/nameSyllable'
import { computeBabyNames } from '../babyNames'
import type { PersonInput } from '../types'

const NOW = new Date('2026-10-05T06:00:00Z')
const DARBHANGA = { label: 'Darbhanga, Bihar', latitude: 26.1542, longitude: 85.8918, timezone: 'Asia/Kolkata', source: 'mithila-jodi' as const }
const baby: PersonInput = { name: 'Baby', dateOfBirth: '1995-03-12', timeOfBirth: '14:20', place: DARBHANGA }

test('pada syllables come from the Avakahada table', () => {
  assert.deepEqual(syllableOf(6, 4), { nakshatraIndex: 6, pada: 4, hi: 'ही', en: 'Hi' })
  assert.equal(syllableOf(0, 1).en, 'Chu')
  assert.equal(syllableOf(26, 4).en, 'Chi')
})

test('rashi letters are the nine padas of the sign', () => {
  assert.deepEqual(rashiSyllables(3).map(s => s.en), ['Hi', 'Hu', 'He', 'Ho', 'Da', 'Di', 'Du', 'De', 'Do']) // Karka
  assert.deepEqual(rashiSyllables(0).map(s => s.en), ['Chu', 'Che', 'Cho', 'La', 'Li', 'Lu', 'Le', 'Lo', 'A']) // Mesha
  for (let r = 0; r < 12; r += 1) assert.equal(rashiSyllables(r).length, 9)
})

test('padas crossed between two longitudes, including the wrap at 360°', () => {
  assert.deepEqual(syllablesBetween(80.5, 86).map(s => s.en), ['Ke', 'Ko']) // Punarvasu 1 → 2
  assert.deepEqual(syllablesBetween(359, 2).map(s => s.en), ['Chi', 'Chu']) // Revati 4 → Ashwini 1
  assert.equal(syllablesBetween(10, 10).length, 1)
})

test('Roman-letter matching is forgiving about vowel length and spelling', () => {
  const hi = { hi: 'ही', en: 'Hi' }
  assert.equal(nameStartsWith('Himanshu', hi), true)
  assert.equal(nameStartsWith('Heena', hi), true) // ee → i
  assert.equal(nameStartsWith('Harsh', hi), false)
  assert.equal(nameStartsWith('  himani ', hi), true)
  assert.equal(nameStartsWith('Aarav', { hi: 'अ', en: 'A' }), true) // aa → a
  assert.equal(nameStartsWith('Vihaan', { hi: 'वी', en: 'Vi' }), true)
  assert.equal(nameStartsWith('Wiren', { hi: 'वी', en: 'Vi' }), true) // w → v
  assert.equal(nameStartsWith('Chhavi', { hi: 'छ', en: 'Chha' }), true)
  assert.equal(nameStartsWith('', hi), false)
})

test('Devanagari matching: long and short vowels, inherent a, independent vowels', () => {
  assert.equal(nameStartsWith('हिमांशु', { hi: 'ही', en: 'Hi' }), true) // ि for ी
  assert.equal(nameStartsWith('हरीश', { hi: 'ही', en: 'Hi' }), false)
  assert.equal(nameStartsWith('लक्ष्मी', { hi: 'ला', en: 'La' }), true) // inherent a
  assert.equal(nameStartsWith('लावण्या', { hi: 'ला', en: 'La' }), true)
  assert.equal(nameStartsWith('लीला', { hi: 'ला', en: 'La' }), false)
  assert.equal(nameStartsWith('आरव', { hi: 'अ', en: 'A' }), true) // आ counts as अ
  assert.equal(nameStartsWith('ईशान', { hi: 'इ', en: 'I' }), true)
  assert.equal(nameStartsWith('उमा', { hi: 'उ', en: 'U' }), true)
  assert.equal(nameStartsWith('कुणाल', { hi: 'कु', en: 'Ku' }), true)
  assert.equal(nameStartsWith('कूजन', { hi: 'कु', en: 'Ku' }), true)
  assert.equal(nameStartsWith('घनश्याम', { hi: 'घ', en: 'Gha' }), true)
  assert.equal(nameStartsWith('मोहन', { hi: 'मो', en: 'Mo' }), true)
  assert.equal(nameStartsWith('मेघा', { hi: 'मो', en: 'Mo' }), false)
})

test('a full reading with a known time: one pada, its syllable, and the rashi letters', () => {
  const r = computeBabyNames({ person: baby }, NOW)
  assert.equal(r.kind, 'result')
  if (r.kind !== 'result') return
  assert.deepEqual(r.result.candidates.map(s => s.en), ['Hi'])
  assert.equal(r.result.rashiSyllables.length, 9)
})

test('unknown time: every pada the Moon crossed in that part of the day is a candidate', () => {
  const r = computeBabyNames({ person: { ...baby, timeOfBirth: null, moonSegment: 2 } }, NOW)
  assert.equal(r.kind, 'result')
  if (r.kind !== 'result') return
  // 20:28–23:59 on 12 Mar 1995: the Moon is in the first pada of Pushya.
  assert.equal(r.result.candidates[0].en, 'Hu')
  assert.ok(r.result.candidates.every(c => c.nakshatraIndex === 7))
})
