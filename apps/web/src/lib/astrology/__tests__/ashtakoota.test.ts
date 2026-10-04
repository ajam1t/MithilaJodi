import { test } from 'node:test'
import assert from 'node:assert/strict'
import { moonProfile } from '../vedic/chart'
import { NAKSHATRA_SPAN } from '../vedic/zodiac'
import {
  GANA_BY_NAKSHATRA, NADI_BY_NAKSHATRA, YONI_BY_NAKSHATRA, YONI_ENEMIES, YONI_ORDER,
  grahaMaitriPoints, vashyaOf, vashyaPoints, yoniPoints,
} from '../rules/tables'
import {
  bhakootKoota, computeAshtakoota, ganaKoota, grahaMaitriKoota, nadiKoota, taraKoota, varnaKoota,
  vashyaKoota, yoniKoota,
} from '../rules/ashtakoota'

/** A Moon in the middle of nakshatra `n` (0 = Ashwini). */
const inNak = (n: number) => moonProfile(n * NAKSHATRA_SPAN + NAKSHATRA_SPAN / 2)
/** A Moon at `deg` degrees into rashi `r` (0 = Mesha). */
const inRashi = (r: number, deg = 15.5) => moonProfile(r * 30 + deg)

test('the eight maxima add up to 36', () => {
  const { kootas } = computeAshtakoota(inNak(0), inNak(1))
  assert.equal(kootas.length, 8)
  assert.equal(kootas.reduce((s, k) => s + k.maxScore, 0), 36)
  assert.deepEqual(kootas.map(k => k.maxScore), [1, 2, 3, 4, 5, 6, 7, 8])
})

test('a pair scoring the full 36: Rohini bride, Mrigashira (Vrishabha) groom', () => {
  const bride = moonProfile(3 * NAKSHATRA_SPAN + 5) // Rohini, Vrishabha
  const groom = moonProfile(4 * NAKSHATRA_SPAN + 1) // Mrigashira pada 1, still Vrishabha
  assert.equal(bride.rashi, 'vrishabh')
  assert.equal(groom.rashi, 'vrishabh')
  const { kootas, total } = computeAshtakoota(bride, groom)
  for (const k of kootas) assert.equal(k.score, k.maxScore, `${k.name}: ${k.explanation}`)
  assert.equal(total, 36)
})

test('every koota explains itself with the values it used', () => {
  const { kootas } = computeAshtakoota(inNak(9), inNak(20))
  for (const k of kootas) {
    assert.ok(k.explanation.length > 40, k.name)
    assert.ok(k.bride.length > 0 && k.groom.length > 0, k.name)
    assert.ok(k.score >= 0 && k.score <= k.maxScore, k.name)
  }
})

test('Varna: 1 when the groom is equal or higher, else 0', () => {
  // Kark = Brahmin, Mesha = Kshatriya, Mithuna = Shudra
  assert.equal(varnaKoota(inRashi(0), inRashi(3)).score, 1) // Kshatriya bride, Brahmin groom
  assert.equal(varnaKoota(inRashi(3), inRashi(0)).score, 0) // Brahmin bride, Kshatriya groom
  assert.equal(varnaKoota(inRashi(2), inRashi(6)).score, 1) // Shudra, Shudra
})

test('Vashya: groups, the Dhanu/Makar half split, and the groom × bride matrix', () => {
  assert.equal(vashyaOf(8, 10), 'manava')
  assert.equal(vashyaOf(8, 20), 'chatushpada')
  assert.equal(vashyaOf(9, 10), 'chatushpada')
  assert.equal(vashyaOf(9, 20), 'jalachara')
  assert.equal(vashyaOf(4, 3), 'vanachara')
  assert.equal(vashyaOf(7, 3), 'keeta')
  assert.equal(vashyaPoints('manava', 'manava'), 2)
  assert.equal(vashyaPoints('chatushpada', 'vanachara'), 0.5)
  assert.equal(vashyaPoints('vanachara', 'chatushpada'), 0)
  assert.equal(vashyaPoints('manava', 'jalachara'), 0.5)
  // Mithuna bride (Manava), Simha groom (Vanachara)
  assert.equal(vashyaKoota(inRashi(2), inRashi(4)).score, 0)
})

test('Tara: counted both ways, 1½ per auspicious direction', () => {
  assert.equal(taraKoota(inNak(5), inNak(5)).score, 3) // Janma both ways
  // Ashwini → Krittika = 3 (Vipat, bad); Krittika → Ashwini = 26 → Tara 8 (Mitra, good)
  const t = taraKoota(inNak(0), inNak(2))
  assert.equal(t.score, 1.5)
  assert.match(t.explanation, /Tara 3 \(Vipat, inauspicious\)/)
  assert.match(t.explanation, /Tara 8 \(Mitra, auspicious\)/)
  // Ashwini → Mrigashira = 5 (Pratyari, bad); Mrigashira → Ashwini = 24 → Tara 6 (Sadhaka, good)
  assert.equal(taraKoota(inNak(0), inNak(4)).score, 1.5)
  // Ashwini → Punarvasu = 7 (Vadha); Punarvasu → Ashwini = 22 → Tara 4 (Kshema)
  assert.equal(taraKoota(inNak(0), inNak(6)).score, 1.5)
})

test('Yoni: 27 assignments, symmetric matrix, same = 4, the seven enemy pairs = 0', () => {
  assert.equal(YONI_BY_NAKSHATRA.length, 27)
  for (const a of YONI_ORDER) {
    assert.equal(yoniPoints(a, a), 4)
    for (const b of YONI_ORDER) assert.equal(yoniPoints(a, b), yoniPoints(b, a), `${a}/${b}`)
  }
  for (const [a, b] of YONI_ENEMIES) assert.equal(yoniPoints(a, b), 0, `${a}/${b}`)
  // Ashwini (horse) and Hasta (buffalo) are enemies
  assert.equal(yoniKoota(inNak(0), inNak(12)).score, 0)
  // Ashwini and Shatabhisha are both horse
  assert.equal(yoniKoota(inNak(0), inNak(23)).score, 4)
})

test('Graha Maitri: natural friendship of the two Moon-rashi lords', () => {
  assert.equal(grahaMaitriPoints('sun', 'moon'), 5) // friends both ways
  assert.equal(grahaMaitriPoints('sun', 'mercury'), 4) // neutral / friend
  assert.equal(grahaMaitriPoints('mars', 'venus'), 3) // neutral both ways
  assert.equal(grahaMaitriPoints('moon', 'mercury'), 1) // friend / enemy
  assert.equal(grahaMaitriPoints('moon', 'saturn'), 0.5) // neutral / enemy
  assert.equal(grahaMaitriPoints('sun', 'saturn'), 0) // enemies both ways
  assert.equal(grahaMaitriPoints('jupiter', 'jupiter'), 5)
  // Dhanu and Meena share Jupiter
  assert.equal(grahaMaitriKoota(inRashi(8), inRashi(11)).score, 5)
})

test('Gana: nine nakshatras per Gana and the asymmetric groom × bride table', () => {
  for (const g of ['deva', 'manushya', 'rakshasa'] as const) {
    assert.equal(GANA_BY_NAKSHATRA.filter(x => x === g).length, 9, g)
  }
  // Ashwini = Deva, Bharani = Manushya, Krittika = Rakshasa
  assert.equal(ganaKoota(inNak(1), inNak(0)).score, 6) // Manushya bride, Deva groom
  assert.equal(ganaKoota(inNak(0), inNak(1)).score, 5) // Deva bride, Manushya groom
  assert.equal(ganaKoota(inNak(1), inNak(2)).score, 0) // Manushya bride, Rakshasa groom
  assert.equal(ganaKoota(inNak(2), inNak(2)).score, 6)
})

test('Bhakoot: all 12 relative positions — 2/12, 5/9, 6/8 are dosha', () => {
  const dosha = new Set([2, 5, 6, 8, 9, 12])
  for (let offset = 0; offset < 12; offset += 1) {
    const k = bhakootKoota(inRashi(0), inRashi(offset))
    const position = offset + 1
    assert.equal(k.score, dosha.has(position) ? 0 : 7, `position ${position}`)
    assert.equal(Boolean(k.dosha), dosha.has(position))
  }
  // Mesha–Vrishchika is 6/8, both ruled by Mars: dosha with a named cancellation
  const same = bhakootKoota(inRashi(0), inRashi(7))
  assert.equal(same.score, 0)
  assert.equal(same.dosha?.cancellations.length, 1)
})

test('Nadi: nine per Nadi; same Nadi = 0 with cancellations reported, never applied', () => {
  for (const n of ['adi', 'madhya', 'antya'] as const) {
    assert.equal(NADI_BY_NAKSHATRA.filter(x => x === n).length, 9, n)
  }
  assert.equal(nadiKoota(inNak(0), inNak(1)).score, 8) // Adi vs Madhya
  const same = nadiKoota(inNak(0), inNak(5)) // Ashwini and Ardra, both Adi
  assert.equal(same.score, 0)
  assert.equal(same.dosha?.name, 'Nadi dosha')
  // Krittika pada 1 (Mesha) and Krittika pada 2 (Vrishabha): same nakshatra, different rashi and pada
  const split = nadiKoota(moonProfile(2 * NAKSHATRA_SPAN + 1), moonProfile(2 * NAKSHATRA_SPAN + 4))
  assert.equal(split.score, 0)
  assert.equal(split.dosha?.cancellations.length, 2)
})

test('deterministic: identical input, identical output', () => {
  const a = computeAshtakoota(inNak(13), inNak(22))
  const b = computeAshtakoota(inNak(13), inNak(22))
  assert.deepEqual(a, b)
})
