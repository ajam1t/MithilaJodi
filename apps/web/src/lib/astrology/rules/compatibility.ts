/**
 * Two-chart factors beyond the Ashtakoota — the classical considerations a
 * pandit looks at next. Pure: consumes two ChartData, never the ephemeris.
 *
 * Deliberately produces FACTS, not a score: each item carries the rule that
 * produced it. Nothing here is combined with the Guna total.
 */
import { relation, type Relation } from './tables'
import { wholeSignHouse } from '../vedic/chart'
import { navamsaRashiIndex } from '../vedic/divisions'
import { RASHIS, type GrahaId } from '../vedic/zodiac'
import type { ChartData, Role } from '../types'

export type HouseClass = 'kendra' | 'trikona' | 'dusthana' | 'upachaya'

/** Classical house groups: kendra 1/4/7/10, trikona 1/5/9, dusthana 6/8/12, upachaya 3/6/10/11. */
export function houseClasses(h: number): HouseClass[] {
  const out: HouseClass[] = []
  if ([1, 4, 7, 10].includes(h)) out.push('kendra')
  if ([1, 5, 9].includes(h)) out.push('trikona')
  if ([6, 8, 12].includes(h)) out.push('dusthana')
  if ([3, 6, 10, 11].includes(h)) out.push('upachaya')
  return out
}

export type SignRelation = {
  a: number
  b: number
  /** Position of b counted from a (1 = same sign). */
  aToB: number
  bToA: number
  label: 'same' | '3/11' | '4/10' | '7/7' | '2/12' | '5/9' | '6/8'
  /**
   * Natural friendship of each sign's lord towards the other's. No good/bad
   * verdict is attached: the Bhakoot reading of 2/12, 5/9 and 6/8 applies to
   * Moon signs, and is not extended here to Lagnas or Navamsas.
   */
  lords: { aToB: Relation | 'same'; bToA: Relation | 'same' }
}

export function signRelation(a: number, b: number): SignRelation {
  const aToB = ((b - a + 12) % 12) + 1
  const bToA = ((a - b + 12) % 12) + 1
  const label = (aToB === 1 ? 'same' : `${Math.min(aToB, bToA)}/${Math.max(aToB, bToA)}`) as SignRelation['label']
  const la = RASHIS[a].lord
  const lb = RASHIS[b].lord
  return {
    a, b, aToB, bToA, label,
    lords: la === lb ? { aToB: 'same', bToA: 'same' } : { aToB: relation(la, lb), bToA: relation(lb, la) },
  }
}

/**
 * Full (whole-sign) graha drishti. Every graha aspects the 7th sign from itself;
 * Mars also the 4th and 8th, Jupiter the 5th and 9th, Saturn the 3rd and 10th.
 * Position 1 (same sign) is a conjunction. Rahu/Ketu aspects are disputed and
 * are not used.
 */
export const DRISHTI: Readonly<Record<'jupiter' | 'venus' | 'mars' | 'saturn', number[]>> = {
  jupiter: [5, 7, 9], venus: [7], mars: [4, 7, 8], saturn: [3, 7, 10],
}
export const BENEFIC = new Set<GrahaId>(['jupiter', 'venus'])

export type Contact = {
  from: Role
  planet: keyof typeof DRISHTI
  target: 'moon' | 'lagna' | 'seventh'
  kind: 'conjunction' | 'aspect'
  /** Sign position of the target counted from the planet. */
  position: number
}

const other = (r: Role): Role => (r === 'bride' ? 'groom' : 'bride')
const planet = (c: ChartData, id: GrahaId) => c.planets.find(p => p.id === id)!

export type SeventhLord = { lord: GrahaId; seventhSign: number; lordSign: number; lordHouse: number; classes: HouseClass[] }

/** The lord of the 7th sign from the Lagna and the house it occupies — the classical marriage indicator. */
export function seventhLordOf(c: ChartData): SeventhLord | null {
  if (!c.lagna) return null
  const seventhSign = (c.lagna.rashiIndex + 6) % 12
  const lord = RASHIS[seventhSign].lord
  const p = planet(c, lord)
  const lordHouse = wholeSignHouse(p.rashiIndex, c.lagna.rashiIndex)
  return { lord, seventhSign, lordSign: p.rashiIndex, lordHouse, classes: houseClasses(lordHouse) }
}

export function compareCharts(bride: ChartData, groom: ChartData) {
  const charts: Record<Role, ChartData> = { bride, groom }

  const navamsa = (c: ChartData) => ({
    lagna: c.lagna ? navamsaRashiIndex(c.lagna.longitude) : null,
    // The navamsa changes with the pada, so it is only certain when the pada is.
    moon: c.moon.pada != null ? navamsaRashiIndex(c.moon.longitude) : null,
    venus: navamsaRashiIndex(planet(c, 'venus').longitude),
  })
  const d9 = { bride: navamsa(bride), groom: navamsa(groom) }

  const cross = (['bride', 'groom'] as const).flatMap(from =>
    (['moon', 'venus', 'jupiter'] as const).map(id => {
      const p = planet(charts[from], id)
      const target = charts[other(from)]
      const house = target.lagna ? wholeSignHouse(p.rashiIndex, target.lagna.rashiIndex) : null
      return { from, planet: id, sign: p.rashiIndex, house, classes: house ? houseClasses(house) : [] }
    }),
  )

  const contacts: Contact[] = []
  for (const from of ['bride', 'groom'] as const) {
    const target = charts[other(from)]
    const targets: Array<[Contact['target'], number]> = [['moon', target.moon.rashiIndex]]
    if (target.lagna) targets.push(['lagna', target.lagna.rashiIndex], ['seventh', (target.lagna.rashiIndex + 6) % 12])
    for (const id of Object.keys(DRISHTI) as Array<keyof typeof DRISHTI>) {
      const sign = planet(charts[from], id).rashiIndex
      for (const [name, tSign] of targets) {
        const position = ((tSign - sign + 12) % 12) + 1
        if (position === 1) contacts.push({ from, planet: id, target: name, kind: 'conjunction', position })
        else if (DRISHTI[id].includes(position)) contacts.push({ from, planet: id, target: name, kind: 'aspect', position })
      }
    }
  }

  return {
    lagna: bride.lagna && groom.lagna ? signRelation(bride.lagna.rashiIndex, groom.lagna.rashiIndex) : null,
    seventhLord: { bride: seventhLordOf(bride), groom: seventhLordOf(groom) },
    navamsa: {
      ...d9,
      moonRelation: d9.bride.moon != null && d9.groom.moon != null ? signRelation(d9.bride.moon, d9.groom.moon) : null,
      lagnaRelation: d9.bride.lagna != null && d9.groom.lagna != null ? signRelation(d9.bride.lagna, d9.groom.lagna) : null,
    },
    cross,
    contacts,
  }
}

export type ChartComparison = ReturnType<typeof compareCharts>
