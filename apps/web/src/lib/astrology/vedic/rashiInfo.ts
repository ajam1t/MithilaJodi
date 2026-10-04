/**
 * Traditional rashi reference data and the Moon-sign-only compatibility read.
 * Data, not logic; same order as RASHIS (0 = Mesha). Client-safe.
 */
import { grahaMaitriPoints } from '../rules/tables'
import { RASHIS } from './zodiac'

export type Tattva = 'fire' | 'earth' | 'air' | 'water'
export type Quality = 'movable' | 'fixed' | 'dual'

export const TATTVA_LABEL: Record<Tattva, string> = { fire: 'Agni (fire)', earth: 'Prithvi (earth)', air: 'Vayu (air)', water: 'Jala (water)' }
export const QUALITY_LABEL: Record<Quality, string> = { movable: 'Chara (movable)', fixed: 'Sthira (fixed)', dual: 'Dvisvabhava (dual)' }

const SYMBOL = [
  'Ram', 'Bull', 'Couple', 'Crab', 'Lion', 'Maiden in a boat', 'Balance (scales)', 'Scorpion',
  'Archer, half horse', 'Makara (sea-creature)', 'Man with a water-pot', 'Two fish',
]
const DIRECTION = ['East', 'South', 'West', 'North'] as const

/** Fire, earth, air, water repeating from Mesha; movable, fixed, dual repeating likewise. */
export function rashiAttributes(index: number) {
  return {
    tattva: (['fire', 'earth', 'air', 'water'] as const)[index % 4],
    quality: (['movable', 'fixed', 'dual'] as const)[index % 3],
    parity: index % 2 === 0 ? 'Odd (masculine)' : 'Even (feminine)',
    direction: DIRECTION[index % 4],
    symbol: SYMBOL[index],
  }
}

/**
 * The nine nakshatra padas inside a rashi (each rashi holds exactly 9 of the 108),
 * grouped by nakshatra: e.g. Karka = Punarvasu 4, Pushya 1–4, Ashlesha 1–4.
 */
export function padasInRashi(rashiIndex: number): Array<{ nakshatraIndex: number; padas: number[] }> {
  const out: Array<{ nakshatraIndex: number; padas: number[] }> = []
  for (let k = rashiIndex * 9; k < rashiIndex * 9 + 9; k += 1) {
    const nakshatraIndex = Math.floor(k / 4)
    const pada = (k % 4) + 1
    const last = out[out.length - 1]
    if (last && last.nakshatraIndex === nakshatraIndex) last.padas.push(pada)
    else out.push({ nakshatraIndex, padas: [pada] })
  }
  return out
}

export type BhakootRelation = 'same' | '3/11' | '4/10' | '7/7' | '2/12' | '5/9' | '6/8'

/**
 * How another Moon sign relates to this one on the two kootas that depend only
 * on Moon signs: Bhakoot (7 points) and Graha Maitri (5 points). Both are
 * symmetric, so this does not depend on who is the bride or the groom. The
 * rules are exactly those of the Ashtakoota engine.
 */
export function moonSignCompatibility(rashiIndex: number) {
  return RASHIS.map((other, j) => {
    const a = ((j - rashiIndex + 12) % 12) + 1
    const b = ((rashiIndex - j + 12) % 12) + 1
    const relation = (a === 1 ? 'same' : `${Math.min(a, b)}/${Math.max(a, b)}`) as BhakootRelation
    const dosha = relation === '2/12' || relation === '5/9' || relation === '6/8'
    return {
      rashiIndex: j,
      slug: other.slug,
      relation,
      bhakootPoints: dosha ? 0 : 7,
      grahaMaitriPoints: grahaMaitriPoints(RASHIS[rashiIndex].lord, other.lord),
    }
  })
}

export const BHAKOOT_NAME: Record<BhakootRelation, string> = {
  same: 'Same rashi', '3/11': '3rd / 11th', '4/10': '4th / 10th', '7/7': '7th (opposite)',
  '2/12': 'Dvi-Dvadasha (2/12) — dosha', '5/9': 'Nava-Pancham (5/9) — dosha', '6/8': 'Shadashtak (6/8) — dosha',
}
