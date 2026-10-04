import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lagnaPosition, moonProfile, planetPositions } from '../vedic/chart'
import { GRAHAS, type GrahaId } from '../vedic/zodiac'
import { manglikFor, manglikPair } from '../rules/manglik'

const DOSHA = new Set([1, 2, 4, 7, 8, 12])

/** A chart with the Lagna in `lagnaRashi`, the Moon in `moonRashi` and Mars in `marsRashi`. */
function chart(lagnaRashi: number | null, moonRashi: number, marsRashi: number) {
  const lon = {} as Record<GrahaId, number>
  const speed = {} as Record<GrahaId, number>
  for (const g of GRAHAS) { lon[g.id] = 100; speed[g.id] = 1 }
  lon.moon = moonRashi * 30 + 10
  lon.mars = marsRashi * 30 + 12
  const lagna = lagnaRashi == null ? null : lagnaPosition(lagnaRashi * 30 + 5)
  const planets = planetPositions(lon, speed, lagna ? lagna.rashiIndex : null)
  return { planets, lagna, moon: moonProfile(lon.moon) }
}

test('Mars in each of the 12 houses from the Lagna, Moon fixed in Mithuna', () => {
  for (let house = 1; house <= 12; house += 1) {
    const marsRashi = house - 1 // Lagna is Mesha
    const c = chart(0, 2, marsRashi)
    const m = manglikFor(c.planets, c.lagna, c.moon)
    const fromMoonHouse = ((marsRashi - 2 + 12) % 12) + 1
    assert.equal(m.marsHouseFromLagna, house)
    assert.equal(m.marsHouseFromMoon, fromMoonHouse)
    assert.equal(m.fromLagna, DOSHA.has(house), `house ${house}`)
    assert.equal(m.fromMoon, DOSHA.has(fromMoonHouse), `house ${house} from Moon`)
    const expected = DOSHA.has(house) && DOSHA.has(fromMoonHouse) ? 'yes' : DOSHA.has(house) || DOSHA.has(fromMoonHouse) ? 'anshik' : 'no'
    assert.equal(m.status, expected, `house ${house}`)
    assert.ok(m.explanation.includes(`house`))
  }
})

test('status mapping to community_masters manglik values', () => {
  const yes = chart(0, 0, 6) // Mars 7th from both Lagna and Moon
  assert.equal(manglikFor(yes.planets, yes.lagna, yes.moon).masterValue, 'yes')
  const no = chart(0, 0, 2) // 3rd from both
  assert.equal(manglikFor(no.planets, no.lagna, no.moon).masterValue, 'no')
})

test('unknown birth time: only the Moon-based check, reported as incomplete', () => {
  const c = chart(null, 0, 3) // Mars 4th from the Moon
  const m = manglikFor(c.planets, c.lagna, c.moon)
  assert.equal(m.status, 'incomplete')
  assert.equal(m.masterValue, 'unknown')
  assert.equal(m.fromLagna, null)
  assert.equal(m.fromMoon, true)
  assert.match(m.explanation, /Without a birth time/)
})

test('own-sign and exaltation exceptions are reported, not applied', () => {
  const own = chart(0, 0, 0) // Mars in Mesha, 1st from both
  const m = manglikFor(own.planets, own.lagna, own.moon)
  assert.equal(m.status, 'yes')
  assert.equal(m.exceptions.length, 1)
  const exalted = chart(3, 3, 9) // Mars in Makara, 7th from both
  const e = manglikFor(exalted.planets, exalted.lagna, exalted.moon)
  assert.equal(e.status, 'yes')
  assert.match(e.exceptions[0], /exalted/)
})

test('pair assessment', () => {
  const yes = chart(0, 0, 6)
  const no = chart(0, 0, 2)
  const unknown = chart(null, 0, 2)
  const m = (c: ReturnType<typeof chart>) => manglikFor(c.planets, c.lagna, c.moon)
  assert.equal(manglikPair(m(yes), m(yes)).code, 'both')
  assert.equal(manglikPair(m(yes), m(no)).code, 'one')
  assert.equal(manglikPair(m(no), m(no)).code, 'neither')
  assert.equal(manglikPair(m(no), m(unknown)).code, 'incomplete')
})
