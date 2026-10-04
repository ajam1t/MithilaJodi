/**
 * Ashtakoota (Guna Milan) — eight kootas, 36 points.
 *
 * Pure: consumes two MoonProfiles, never the ephemeris. Every koota returns its
 * score, its maximum, the values it used for each person, and a plain-language
 * reason. Scores are never adjusted for cancellation rules; recognised
 * cancellations are listed beside the dosha instead (see methodology.ts).
 */
import { NAKSHATRAS, RASHIS, grahaInfo } from '../vedic/zodiac'
import {
  GANA_LABEL, INAUSPICIOUS_TARAS, NADI_LABEL, TARA_NAMES, VARNA_LABEL, VARNA_RANK, VASHYA_LABEL,
  YONI_ENEMIES, YONI_LABEL, ganaPoints, grahaMaitriPoints, relation, vashyaPoints, yoniPoints,
} from './tables'
import type { KootaResult, MoonProfile } from '../types'

const rashiName = (i: number) => RASHIS[i].name
const nakName = (i: number) => NAKSHATRAS[i].name
const lordName = (id: Parameters<typeof grahaInfo>[0]) => grahaInfo(id).name.split(' (')[0]

export function fmtPoints(n: number): string {
  const whole = Math.floor(n)
  const half = n - whole >= 0.5
  if (!half) return String(whole)
  return whole === 0 ? '½' : `${whole}½`
}

function rashiWithHalf(m: MoonProfile): string {
  if (m.rashiIndex === 8 || m.rashiIndex === 9) {
    return `${m.degreeInRashi < 15 ? 'first' : 'second'} half of ${rashiName(m.rashiIndex)}`
  }
  return rashiName(m.rashiIndex)
}

export function varnaKoota(bride: MoonProfile, groom: MoonProfile): KootaResult {
  const score = VARNA_RANK[groom.varna] >= VARNA_RANK[bride.varna] ? 1 : 0
  return {
    key: 'varna', name: 'Varna', maxScore: 1, score,
    measures: 'Traditionally, the disposition and spiritual temperament each partner brings to the marriage.',
    bride: `${VARNA_LABEL[bride.varna]} (Moon in ${rashiName(bride.rashiIndex)})`,
    groom: `${VARNA_LABEL[groom.varna]} (Moon in ${rashiName(groom.rashiIndex)})`,
    explanation:
      `Varna comes from the Moon rashi: the bride's ${rashiName(bride.rashiIndex)} is ${VARNA_LABEL[bride.varna]}, ` +
      `the groom's ${rashiName(groom.rashiIndex)} is ${VARNA_LABEL[groom.varna]}. The rule awards 1 point when the ` +
      `groom's Varna is the same as or above the bride's in the traditional order (Brahmin, Kshatriya, Vaishya, Shudra). ` +
      (score ? 'It is, so 1 of 1.' : 'Here it is below, so 0 of 1.'),
  }
}

export function vashyaKoota(bride: MoonProfile, groom: MoonProfile): KootaResult {
  const score = vashyaPoints(groom.vashya, bride.vashya)
  return {
    key: 'vashya', name: 'Vashya', maxScore: 2, score,
    measures: 'Traditionally, mutual attraction and the balance of influence between the partners.',
    bride: `${VASHYA_LABEL[bride.vashya]} (${rashiWithHalf(bride)})`,
    groom: `${VASHYA_LABEL[groom.vashya]} (${rashiWithHalf(groom)})`,
    explanation:
      `Each Moon rashi belongs to a Vashya group: the bride's (${rashiWithHalf(bride)}) is ${VASHYA_LABEL[bride.vashya]}, ` +
      `the groom's (${rashiWithHalf(groom)}) is ${VASHYA_LABEL[groom.vashya]}. ` +
      (groom.vashya === bride.vashya
        ? `The same group scores the full 2 of 2.`
        : `In the Vashya table a ${VASHYA_LABEL[groom.vashya].split(' ')[0]} groom with a ${VASHYA_LABEL[bride.vashya].split(' ')[0]} bride scores ${fmtPoints(score)} of 2.`),
  }
}

function taraFrom(fromNak: number, toNak: number) {
  const count = ((toNak - fromNak + 27) % 27) + 1
  const tara = ((count - 1) % 9) + 1
  return { count, tara, name: TARA_NAMES[tara - 1], good: !INAUSPICIOUS_TARAS.has(tara) }
}

export function taraKoota(bride: MoonProfile, groom: MoonProfile): KootaResult {
  const b2g = taraFrom(bride.nakshatraIndex, groom.nakshatraIndex)
  const g2b = taraFrom(groom.nakshatraIndex, bride.nakshatraIndex)
  const score = (b2g.good ? 1.5 : 0) + (g2b.good ? 1.5 : 0)
  const goodCount = Number(b2g.good) + Number(g2b.good)
  const verdict = (t: typeof b2g) => `${t.name}, ${t.good ? 'auspicious' : 'inauspicious'}`
  return {
    key: 'tara', name: 'Tara', maxScore: 3, score,
    measures: 'Traditionally, the wellbeing and good fortune each partner brings to the other, read by counting birth stars.',
    bride: `${nakName(bride.nakshatraIndex)} nakshatra`,
    groom: `${nakName(groom.nakshatraIndex)} nakshatra`,
    explanation:
      `Counting from the bride's ${nakName(bride.nakshatraIndex)} to the groom's ${nakName(groom.nakshatraIndex)} gives ` +
      `${b2g.count}, which is Tara ${b2g.tara} (${verdict(b2g)}). Counting back from the groom's to the bride's gives ` +
      `${g2b.count}, Tara ${g2b.tara} (${verdict(g2b)}). Taras 3, 5 and 7 are the inauspicious ones; each auspicious ` +
      `direction earns 1½ points. ${goodCount === 2 ? 'Both are' : goodCount === 1 ? 'One is' : 'Neither is'} auspicious, ` +
      `so ${fmtPoints(score)} of 3.`,
  }
}

export function yoniKoota(bride: MoonProfile, groom: MoonProfile): KootaResult {
  const score = yoniPoints(bride.yoni, groom.yoni)
  const enemies = YONI_ENEMIES.some(([a, b]) => (a === bride.yoni && b === groom.yoni) || (b === bride.yoni && a === groom.yoni))
  const quality = score === 3 ? 'friendly' : score === 2 ? 'neutral' : 'unfriendly'
  return {
    key: 'yoni', name: 'Yoni', maxScore: 4, score,
    measures: 'Traditionally, instinctive and physical compatibility, symbolised by an animal for each nakshatra.',
    bride: `${YONI_LABEL[bride.yoni]} — ${nakName(bride.nakshatraIndex)}`,
    groom: `${YONI_LABEL[groom.yoni]} — ${nakName(groom.nakshatraIndex)}`,
    explanation:
      bride.yoni === groom.yoni
        ? `Both nakshatras share the ${YONI_LABEL[bride.yoni]} Yoni — the highest Yoni score, 4 of 4.`
        : enemies
          ? `The bride's ${YONI_LABEL[bride.yoni]} and the groom's ${YONI_LABEL[groom.yoni]} are one of the seven ` +
            `traditional sworn-enemy (vaira) pairs, so 0 of 4.`
          : `The bride's ${YONI_LABEL[bride.yoni]} and the groom's ${YONI_LABEL[groom.yoni]} are a ${quality} pair in ` +
            `the Yoni table — ${score} of 4.`,
  }
}

export function grahaMaitriKoota(bride: MoonProfile, groom: MoonProfile): KootaResult {
  const score = grahaMaitriPoints(bride.rashiLord, groom.rashiLord)
  const bl = lordName(bride.rashiLord)
  const gl = lordName(groom.rashiLord)
  return {
    key: 'grahaMaitri', name: 'Graha Maitri', maxScore: 5, score,
    measures: 'Traditionally, mental affinity and friendship, read from the lords of the two Moon rashis.',
    bride: `${bl} (lord of ${rashiName(bride.rashiIndex)})`,
    groom: `${gl} (lord of ${rashiName(groom.rashiIndex)})`,
    explanation:
      bride.rashiLord === groom.rashiLord
        ? `Both Moon rashis are ruled by ${bl}, which scores the full 5 of 5.`
        : `The bride's ${rashiName(bride.rashiIndex)} is ruled by ${bl}; the groom's ${rashiName(groom.rashiIndex)} by ${gl}. ` +
          `In the natural (Parashari) friendships, ${bl} regards ${gl} as ${relation(bride.rashiLord, groom.rashiLord) === 'enemy' ? 'an enemy' : `a ${relation(bride.rashiLord, groom.rashiLord)}`} ` +
          `and ${gl} regards ${bl} as ${relation(groom.rashiLord, bride.rashiLord) === 'enemy' ? 'an enemy' : `a ${relation(groom.rashiLord, bride.rashiLord)}`} — ` +
          `${fmtPoints(score)} of 5.`,
  }
}

export function ganaKoota(bride: MoonProfile, groom: MoonProfile): KootaResult {
  const score = ganaPoints(groom.gana, bride.gana)
  return {
    key: 'gana', name: 'Gana', maxScore: 6, score,
    measures: 'Traditionally, temperament — Deva (gentle), Manushya (worldly, balanced) or Rakshasa (intense, independent).',
    bride: `${GANA_LABEL[bride.gana]} — ${nakName(bride.nakshatraIndex)}`,
    groom: `${GANA_LABEL[groom.gana]} — ${nakName(groom.nakshatraIndex)}`,
    explanation:
      `The bride's ${nakName(bride.nakshatraIndex)} is ${GANA_LABEL[bride.gana]} Gana; the groom's ` +
      `${nakName(groom.nakshatraIndex)} is ${GANA_LABEL[groom.gana]} Gana. ` +
      (bride.gana === groom.gana
        ? 'The same Gana scores the full 6 of 6.'
        : `In the Gana table a ${GANA_LABEL[groom.gana]} groom with a ${GANA_LABEL[bride.gana]} bride scores ${score} of 6.`),
  }
}

const BHAKOOT_DOSHA: Record<string, string> = {
  '2/12': 'Dvi-Dvadasha (2/12)', '12/2': 'Dvi-Dvadasha (2/12)',
  '5/9': 'Nava-Pancham (5/9)', '9/5': 'Nava-Pancham (5/9)',
  '6/8': 'Shadashtak (6/8)', '8/6': 'Shadashtak (6/8)',
}

export function bhakootKoota(bride: MoonProfile, groom: MoonProfile): KootaResult {
  const fromBride = ((groom.rashiIndex - bride.rashiIndex + 12) % 12) + 1
  const fromGroom = ((bride.rashiIndex - groom.rashiIndex + 12) % 12) + 1
  const dosha = BHAKOOT_DOSHA[`${fromBride}/${fromGroom}`]
  const score = dosha ? 0 : 7

  const cancellations: string[] = []
  if (dosha) {
    if (bride.rashiLord === groom.rashiLord) {
      cancellations.push(`Both Moon rashis share the same lord (${lordName(bride.rashiLord)}); several texts treat this as cancelling Bhakoot dosha.`)
    } else if (relation(bride.rashiLord, groom.rashiLord) === 'friend' && relation(groom.rashiLord, bride.rashiLord) === 'friend') {
      cancellations.push(`The two rashi lords (${lordName(bride.rashiLord)} and ${lordName(groom.rashiLord)}) are natural friends of each other; several texts treat this as cancelling Bhakoot dosha.`)
    }
  }

  return {
    key: 'bhakoot', name: 'Bhakoot', maxScore: 7, score,
    measures: 'Traditionally, family welfare, prosperity and the emotional bond, from how the two Moon rashis sit relative to each other.',
    bride: `Moon in ${rashiName(bride.rashiIndex)}`,
    groom: `Moon in ${rashiName(groom.rashiIndex)}`,
    explanation:
      `Counting from the bride's ${rashiName(bride.rashiIndex)} to the groom's ${rashiName(groom.rashiIndex)} gives ${fromBride}; ` +
      `counting back gives ${fromGroom}. ` +
      (dosha
        ? `${dosha} is one of the three Bhakoot dosha relationships (2/12, 5/9, 6/8), so 0 of 7.`
        : fromBride === 1
          ? 'Both Moons are in the same rashi, which is not a dosha relationship — the full 7 of 7.'
          : `A ${fromBride}/${fromGroom} relationship is not one of the dosha positions (2/12, 5/9, 6/8), so the full 7 of 7.`),
    ...(dosha ? { dosha: { name: `Bhakoot dosha — ${dosha}`, cancellations } } : {}),
  }
}

export function nadiKoota(bride: MoonProfile, groom: MoonProfile): KootaResult {
  const same = bride.nadi === groom.nadi
  const score = same ? 0 : 8
  const cancellations: string[] = []
  if (same) {
    if (bride.rashiIndex === groom.rashiIndex && bride.nakshatraIndex !== groom.nakshatraIndex) {
      cancellations.push('Both Moons are in the same rashi but different nakshatras; some texts treat this as cancelling Nadi dosha.')
    }
    if (bride.nakshatraIndex === groom.nakshatraIndex && bride.rashiIndex !== groom.rashiIndex) {
      cancellations.push('Both Moons are in the same nakshatra but different rashis; some texts treat this as cancelling Nadi dosha.')
    }
    if (bride.nakshatraIndex === groom.nakshatraIndex && bride.pada != null && groom.pada != null && bride.pada !== groom.pada) {
      cancellations.push(`Same nakshatra but different padas (${bride.pada} and ${groom.pada}); some texts treat this as cancelling Nadi dosha.`)
    }
  }
  return {
    key: 'nadi', name: 'Nadi', maxScore: 8, score,
    measures: 'Traditionally, health and progeny; given the greatest weight of the eight kootas.',
    bride: `${NADI_LABEL[bride.nadi]} — ${nakName(bride.nakshatraIndex)}`,
    groom: `${NADI_LABEL[groom.nadi]} — ${nakName(groom.nakshatraIndex)}`,
    explanation: same
      ? `The bride's ${nakName(bride.nakshatraIndex)} and the groom's ${nakName(groom.nakshatraIndex)} are both ` +
        `${NADI_LABEL[bride.nadi]} Nadi. The same Nadi is Nadi dosha in the traditional rule, so 0 of 8.`
      : `The bride's ${nakName(bride.nakshatraIndex)} is ${NADI_LABEL[bride.nadi]} Nadi; the groom's ` +
        `${nakName(groom.nakshatraIndex)} is ${NADI_LABEL[groom.nadi]}. Different Nadis score the full 8 of 8.`,
    ...(same ? { dosha: { name: 'Nadi dosha', cancellations } } : {}),
  }
}

export function computeAshtakoota(bride: MoonProfile, groom: MoonProfile): { kootas: KootaResult[]; total: number } {
  const kootas = [
    varnaKoota(bride, groom),
    vashyaKoota(bride, groom),
    taraKoota(bride, groom),
    yoniKoota(bride, groom),
    grahaMaitriKoota(bride, groom),
    ganaKoota(bride, groom),
    bhakootKoota(bride, groom),
    nadiKoota(bride, groom),
  ]
  return { kootas, total: kootas.reduce((sum, k) => sum + k.score, 0) }
}
