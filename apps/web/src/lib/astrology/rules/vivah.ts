/**
 * Vivah (marriage) muhurta rules — Muhurta Chintamani as applied by published
 * North Indian panchangs. Pure tables and predicates; the engine supplies the
 * sky. Every rule here is stated in METHODOLOGY.vivahMuhurat.
 */

/** Rohini, Mrigashira, Magha, Uttara Phalguni, Hasta, Swati, Anuradha, Mula, Uttara Ashadha, Uttara Bhadrapada, Revati (0 = Ashwini). */
export const VIVAH_NAKSHATRAS: ReadonlySet<number> = new Set([3, 4, 9, 11, 12, 14, 16, 18, 20, 25, 26])

/**
 * Gandanta: the junctions of water and fire signs — the last pada of Ashlesha,
 * Jyeshtha and Revati and the first pada of Magha, Mula and Ashwini. `pada` is
 * the absolute pada 0–107 from 0° Mesha.
 */
export function isGandanta(pada: number): boolean {
  const nak = Math.floor(pada / 4)
  const q = pada % 4
  return (q === 3 && (nak === 8 || nak === 17 || nak === 26)) || (q === 0 && (nak === 9 || nak === 18 || nak === 0))
}

/** Solar months open for marriage: Sun in Mesha, Vrishabha, Mithuna, Vrishchika, Makara or Kumbha. */
export const VIVAH_SUN_RASHIS: ReadonlySet<number> = new Set([0, 1, 2, 7, 9, 10])

/** Vishkumbha, Atiganda, Shula, Ganda, Vyaghata, Vyatipata, Vaidhriti (1-based yoga numbers). */
export const AVOIDED_YOGAS: ReadonlySet<number> = new Set([1, 6, 9, 10, 13, 17, 27])

/** Weekdays panchangs prefer (0 = Sunday): Monday, Wednesday, Thursday, Friday. Shown, not enforced. */
export const PREFERRED_VARAS: ReadonlySet<number> = new Set([1, 3, 4, 5])

/** Rikta tithis — Chaturthi, Navami, Chaturdashi of either paksha. */
export function isRikta(tithi: number): boolean {
  const within = ((tithi - 1) % 15) + 1
  return within === 4 || within === 9 || within === 14
}

/**
 * Karana index 0–59 (half-tithis from the new moon). Avoided: Vishti (Bhadra)
 * and the fixed Shakuni, Chatushpada and Naga at the month's end.
 */
export function isAvoidedKarana(k: number): boolean {
  if (k === 0) return false // Kimstughna
  if (k >= 57) return true
  return (k - 1) % 7 === 6 // Vishti
}

/**
 * Chaturmas: Devshayani Ekadashi (Ashadha Shukla 11) to Prabodhini Ekadashi
 * (Kartika Shukla 11), inclusive. Amanta months, 0 = Chaitra; tithi 1–30.
 */
export function inChaturmas(month: number, tithi: number): boolean {
  return (month === 3 && tithi >= 11) || month === 4 || month === 5 || month === 6 || (month === 7 && tithi <= 11)
}

/** Holashtak: Phalguna Shukla Ashtami to Purnima, observed across North India. */
export function inHolashtak(month: number, tithi: number): boolean {
  return month === 11 && tithi >= 8 && tithi <= 15
}

/**
 * Asta (combustion): within this angular distance of the Sun the planet is
 * "set". Surya Siddhanta kalamsha: Jupiter 11°, Venus 10° (8° when retrograde).
 */
export const ASTA_ORB = { jupiter: 11, venus: 10, venusRetrograde: 8 } as const

export type Bal = 'shubh' | 'pujya' | 'ashubh'

/** Guru bal of the bride: Jupiter's house counted from her Moon sign. */
export function guruBal(house: number): Bal {
  if ([2, 5, 7, 9, 11].includes(house)) return 'shubh'
  if ([1, 3, 6, 10].includes(house)) return 'pujya'
  return 'ashubh'
}

/** Surya bal of the groom: the Sun's house counted from his Moon sign. */
export function suryaBal(house: number): Bal {
  if ([3, 6, 10, 11].includes(house)) return 'shubh'
  if ([1, 2, 5, 7, 9].includes(house)) return 'pujya'
  return 'ashubh'
}

/** Chandra bal: the transiting Moon in the 4th, 8th or 12th from the Moon sign is weak. */
export function chandraBal(house: number): Bal {
  return [4, 8, 12].includes(house) ? 'ashubh' : 'shubh'
}
