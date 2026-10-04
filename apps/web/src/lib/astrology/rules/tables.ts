/**
 * Traditional Ashtakoota lookup tables — data, not logic.
 *
 * Kept in one file, in the same order as the zodiac tables (rashi 0 = Mesha,
 * nakshatra 0 = Ashwini), so a pandit can review them line by line without
 * reading the scoring code. See methodology.ts for the conventions chosen.
 *
 * Client-safe: no astronomy imports.
 */
import type { GrahaId } from '../vedic/zodiac'

// ─── Varna (by Moon rashi) ───────────────────────────────────────────────────

export type Varna = 'brahmin' | 'kshatriya' | 'vaishya' | 'shudra'

export const VARNA_LABEL: Record<Varna, string> = {
  brahmin: 'Brahmin', kshatriya: 'Kshatriya', vaishya: 'Vaishya', shudra: 'Shudra',
}

/** Higher rank = "higher" Varna in the koota's ordering. */
export const VARNA_RANK: Record<Varna, number> = { brahmin: 4, kshatriya: 3, vaishya: 2, shudra: 1 }

//                         Mesh        Vrishabh   Mithun    Kark       Simha        Kanya
export const VARNA_BY_RASHI: Varna[] = ['kshatriya', 'vaishya', 'shudra', 'brahmin', 'kshatriya', 'vaishya',
//                         Tula      Vrishchik  Dhanu        Makar      Kumbh     Meen
                                      'shudra', 'brahmin', 'kshatriya', 'vaishya', 'shudra', 'brahmin']

// ─── Vashya (by Moon rashi; Dhanu and Makar split at 15°) ────────────────────

export type Vashya = 'chatushpada' | 'manava' | 'jalachara' | 'vanachara' | 'keeta'

export const VASHYA_LABEL: Record<Vashya, string> = {
  chatushpada: 'Chatushpada (quadruped)',
  manava: 'Manava (human)',
  jalachara: 'Jalachara (water-dwelling)',
  vanachara: 'Vanachara (wild)',
  keeta: 'Keeta (insect)',
}

export function vashyaOf(rashiIndex: number, degreeInRashi: number): Vashya {
  switch (rashiIndex) {
    case 0: case 1: return 'chatushpada'
    case 2: case 5: case 6: case 10: return 'manava'
    case 3: case 11: return 'jalachara'
    case 4: return 'vanachara'
    case 7: return 'keeta'
    case 8: return degreeInRashi < 15 ? 'manava' : 'chatushpada'
    case 9: return degreeInRashi < 15 ? 'chatushpada' : 'jalachara'
    default: throw new Error(`invalid rashi index ${rashiIndex}`)
  }
}

const VASHYA_ORDER: Vashya[] = ['chatushpada', 'manava', 'jalachara', 'vanachara', 'keeta']

/** Rows: groom's Vashya. Columns: bride's Vashya. Same order as VASHYA_ORDER. */
const VASHYA_MATRIX: number[][] = [
  //   chat  manava jala  vana  keeta
  [2, 1, 1, 0.5, 1], // chatushpada
  [1, 2, 0.5, 0, 1], // manava
  [1, 0.5, 2, 1, 1], // jalachara
  [0, 0, 0, 2, 0], // vanachara
  [1, 1, 1, 0, 2], // keeta
]

export function vashyaPoints(groom: Vashya, bride: Vashya): number {
  return VASHYA_MATRIX[VASHYA_ORDER.indexOf(groom)][VASHYA_ORDER.indexOf(bride)]
}

// ─── Tara ─────────────────────────────────────────────────────────────────────

export const TARA_NAMES = [
  'Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyari', 'Sadhaka', 'Vadha', 'Mitra', 'Ati-Mitra',
] as const

/** Taras 3, 5 and 7 (1-based) are inauspicious. */
export const INAUSPICIOUS_TARAS = new Set([3, 5, 7])

// ─── Yoni (by nakshatra) ─────────────────────────────────────────────────────

export type Yoni =
  | 'horse' | 'elephant' | 'sheep' | 'serpent' | 'dog' | 'cat' | 'rat'
  | 'cow' | 'buffalo' | 'tiger' | 'deer' | 'monkey' | 'mongoose' | 'lion'

export const YONI_ORDER: Yoni[] = [
  'horse', 'elephant', 'sheep', 'serpent', 'dog', 'cat', 'rat',
  'cow', 'buffalo', 'tiger', 'deer', 'monkey', 'mongoose', 'lion',
]

export const YONI_LABEL: Record<Yoni, string> = {
  horse: 'Ashwa (horse)', elephant: 'Gaja (elephant)', sheep: 'Mesha (sheep)', serpent: 'Sarpa (serpent)',
  dog: 'Shvana (dog)', cat: 'Marjara (cat)', rat: 'Mushaka (rat)', cow: 'Go (cow)',
  buffalo: 'Mahisha (buffalo)', tiger: 'Vyaghra (tiger)', deer: 'Mriga (deer)', monkey: 'Vanara (monkey)',
  mongoose: 'Nakula (mongoose)', lion: 'Simha (lion)',
}

export const YONI_BY_NAKSHATRA: Yoni[] = [
  'horse', 'elephant', 'sheep', 'serpent', 'serpent', 'dog', 'cat', // Ashwini … Punarvasu
  'sheep', 'cat', 'rat', 'rat', 'cow', 'buffalo', 'tiger', // Pushya … Chitra
  'buffalo', 'tiger', 'deer', 'deer', 'dog', 'monkey', 'mongoose', // Swati … Uttara Ashadha
  'monkey', 'lion', 'horse', 'lion', 'cow', 'elephant', // Shravana … Revati
]

/** Symmetric. Rows and columns in YONI_ORDER. */
const YONI_MATRIX: number[][] = [
  //Ho El Sh Se Do Ca Ra Co Bu Ti De Mo Mg Li
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1], // horse
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0], // elephant
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1], // sheep
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2], // serpent
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1], // dog
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1], // cat
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2], // rat
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1], // cow
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1], // buffalo
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1], // tiger
  [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1], // deer
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2], // monkey
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2], // mongoose
  [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4], // lion
]

export function yoniPoints(a: Yoni, b: Yoni): number {
  return YONI_MATRIX[YONI_ORDER.indexOf(a)][YONI_ORDER.indexOf(b)]
}

/** The seven sworn-enemy pairs (score 0). Exported for tests and explanations. */
export const YONI_ENEMIES: ReadonlyArray<[Yoni, Yoni]> = [
  ['horse', 'buffalo'], ['elephant', 'lion'], ['sheep', 'monkey'], ['serpent', 'mongoose'],
  ['dog', 'deer'], ['cat', 'rat'], ['cow', 'tiger'],
]

// ─── Gana (by nakshatra) ─────────────────────────────────────────────────────

export type Gana = 'deva' | 'manushya' | 'rakshasa'

export const GANA_LABEL: Record<Gana, string> = { deva: 'Deva', manushya: 'Manushya', rakshasa: 'Rakshasa' }

export const GANA_BY_NAKSHATRA: Gana[] = [
  'deva', 'manushya', 'rakshasa', 'manushya', 'deva', 'manushya', 'deva', // Ashwini … Punarvasu
  'deva', 'rakshasa', 'rakshasa', 'manushya', 'manushya', 'deva', 'rakshasa', // Pushya … Chitra
  'deva', 'rakshasa', 'deva', 'rakshasa', 'rakshasa', 'manushya', 'manushya', // Swati … Uttara Ashadha
  'deva', 'rakshasa', 'rakshasa', 'manushya', 'manushya', 'deva', // Shravana … Revati
]

const GANA_ORDER: Gana[] = ['deva', 'manushya', 'rakshasa']

/** Rows: groom's Gana. Columns: bride's Gana. */
const GANA_MATRIX: number[][] = [
  // deva manushya rakshasa
  [6, 6, 1], // deva
  [5, 6, 0], // manushya
  [1, 0, 6], // rakshasa
]

export function ganaPoints(groom: Gana, bride: Gana): number {
  return GANA_MATRIX[GANA_ORDER.indexOf(groom)][GANA_ORDER.indexOf(bride)]
}

// ─── Nadi (by nakshatra) ─────────────────────────────────────────────────────

export type Nadi = 'adi' | 'madhya' | 'antya'

export const NADI_LABEL: Record<Nadi, string> = {
  adi: 'Adi (Vata)', madhya: 'Madhya (Pitta)', antya: 'Antya (Kapha)',
}

/** The Nadi sequence runs Adi, Madhya, Antya, Antya, Madhya, Adi and repeats. */
export const NADI_BY_NAKSHATRA: Nadi[] = Array.from({ length: 27 }, (_, i) =>
  (['adi', 'madhya', 'antya', 'antya', 'madhya', 'adi'] as Nadi[])[i % 6],
)

// ─── Graha Maitri — natural (Parashari) friendship ───────────────────────────

export type Relation = 'friend' | 'neutral' | 'enemy'

type SevenLords = Exclude<GrahaId, 'rahu' | 'ketu'>

const FRIENDSHIP: Record<SevenLords, { friend: SevenLords[]; enemy: SevenLords[] }> = {
  sun: { friend: ['moon', 'mars', 'jupiter'], enemy: ['venus', 'saturn'] },
  moon: { friend: ['sun', 'mercury'], enemy: [] },
  mars: { friend: ['sun', 'moon', 'jupiter'], enemy: ['mercury'] },
  mercury: { friend: ['sun', 'venus'], enemy: ['moon'] },
  jupiter: { friend: ['sun', 'moon', 'mars'], enemy: ['mercury', 'venus'] },
  venus: { friend: ['mercury', 'saturn'], enemy: ['sun', 'moon'] },
  saturn: { friend: ['mercury', 'venus'], enemy: ['sun', 'moon', 'mars'] },
}

/** How `of` regards `toward`. Every planet not listed as friend or enemy is neutral. */
export function relation(of: GrahaId, toward: GrahaId): Relation {
  const row = FRIENDSHIP[of as SevenLords]
  if (!row) throw new Error(`no friendship row for ${of}`)
  if (row.friend.includes(toward as SevenLords)) return 'friend'
  if (row.enemy.includes(toward as SevenLords)) return 'enemy'
  return 'neutral'
}

export function grahaMaitriPoints(a: GrahaId, b: GrahaId): number {
  if (a === b) return 5
  const pair = [relation(a, b), relation(b, a)].sort().join('/')
  switch (pair) {
    case 'friend/friend': return 5
    case 'friend/neutral': return 4
    case 'neutral/neutral': return 3
    case 'enemy/friend': return 1
    case 'enemy/neutral': return 0.5
    case 'enemy/enemy': return 0
    default: throw new Error(`unhandled relation pair ${pair}`)
  }
}
