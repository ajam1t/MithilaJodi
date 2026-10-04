import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  NAKSHATRAS, NAKSHATRA_SPAN, PADA_SPAN, RASHIS, degreeInRashi, formatDegree, nakshatraIndexOf,
  normalizeDeg, padaOf, rashiIndexOf,
} from '../vedic/zodiac'

// The exact `value` slugs in community_masters (types rashi and nakshatra), in sort order.
const MASTER_RASHI = 'mesh vrishabh mithun kark simha kanya tula vrishchik dhanu makar kumbh meen'.split(' ')
const MASTER_NAKSHATRA = (
  'ashwini bharani krittika rohini mrigashira ardra punarvasu pushya ashlesha magha purva_phalguni ' +
  'uttara_phalguni hasta chitra swati vishakha anuradha jyeshtha mula purva_ashadha uttara_ashadha ' +
  'shravana dhanishta shatabhisha purva_bhadrapada uttara_bhadrapada revati'
).split(' ')

test('rashi and nakshatra slugs match community_masters exactly', () => {
  assert.deepEqual(RASHIS.map(r => r.slug), MASTER_RASHI)
  assert.deepEqual(NAKSHATRAS.map(n => n.slug), MASTER_NAKSHATRA)
})

test('all 12 rashis: start, middle and last arc-second of each sign', () => {
  for (let i = 0; i < 12; i += 1) {
    assert.equal(rashiIndexOf(i * 30), i, `start of rashi ${i}`)
    assert.equal(rashiIndexOf(i * 30 + 15), i, `middle of rashi ${i}`)
    assert.equal(rashiIndexOf(i * 30 + 30 - 1 / 3600), i, `end of rashi ${i}`)
  }
})

test('all 27 nakshatras: start, middle and end of each', () => {
  for (let i = 0; i < 27; i += 1) {
    assert.equal(nakshatraIndexOf(i * NAKSHATRA_SPAN + 1e-6), i)
    assert.equal(nakshatraIndexOf(i * NAKSHATRA_SPAN + NAKSHATRA_SPAN / 2), i)
    assert.equal(nakshatraIndexOf((i + 1) * NAKSHATRA_SPAN - 1 / 3600), i)
  }
})

test('pada boundaries every 3°20′ across the whole zodiac', () => {
  for (let k = 0; k < 108; k += 1) {
    const expected = (k % 4) + 1
    assert.equal(padaOf(k * PADA_SPAN + 1e-6), expected, `just after boundary ${k}`)
    assert.equal(padaOf((k + 1) * PADA_SPAN - 1 / 3600), expected, `just before boundary ${k + 1}`)
  }
})

test('nakshatra lords follow the Vimshottari order', () => {
  assert.deepEqual(NAKSHATRAS.slice(0, 9).map(n => n.lord), ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'])
  assert.equal(NAKSHATRAS[26].lord, 'mercury') // Revati
  assert.equal(NAKSHATRAS[18].lord, 'ketu') // Mula
})

test('longitudes wrap at 0°/360° and negatives normalise', () => {
  assert.equal(normalizeDeg(360), 0)
  assert.equal(normalizeDeg(-30), 330)
  assert.equal(rashiIndexOf(359.9999), 11)
  assert.equal(nakshatraIndexOf(359.9999), 26)
  assert.equal(padaOf(359.9999), 4)
  assert.equal(rashiIndexOf(360), 0)
  assert.equal(nakshatraIndexOf(-0.0001), 26)
})

test('degree within rashi and its formatting', () => {
  assert.ok(Math.abs(degreeInRashi(275.5) - 5.5) < 1e-9)
  assert.equal(formatDegree(5.5), '5°30′')
  assert.equal(formatDegree(29.9999), '29°59′')
})
