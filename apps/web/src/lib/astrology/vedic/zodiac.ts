/**
 * Sidereal zodiac reference data and pure longitude → division helpers.
 *
 * Slugs match `community_masters` (types `rashi` and `nakshatra`) exactly, so
 * the tool's output agrees with stored profile data and generated biodata.
 *
 * Client-safe: no astronomy imports.
 */

export type GrahaId = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn' | 'rahu' | 'ketu'

export const GRAHAS: ReadonlyArray<{ id: GrahaId; name: string; hi: string; abbr: string }> = [
  { id: 'sun', name: 'Sun (Surya)', hi: 'सूर्य', abbr: 'Su' },
  { id: 'moon', name: 'Moon (Chandra)', hi: 'चन्द्र', abbr: 'Mo' },
  { id: 'mars', name: 'Mars (Mangal)', hi: 'मंगल', abbr: 'Ma' },
  { id: 'mercury', name: 'Mercury (Budh)', hi: 'बुध', abbr: 'Me' },
  { id: 'jupiter', name: 'Jupiter (Guru)', hi: 'गुरु', abbr: 'Ju' },
  { id: 'venus', name: 'Venus (Shukra)', hi: 'शुक्र', abbr: 'Ve' },
  { id: 'saturn', name: 'Saturn (Shani)', hi: 'शनि', abbr: 'Sa' },
  { id: 'rahu', name: 'Rahu', hi: 'राहु', abbr: 'Ra' },
  { id: 'ketu', name: 'Ketu', hi: 'केतु', abbr: 'Ke' },
]

export function grahaInfo(id: GrahaId) {
  return GRAHAS.find(g => g.id === id)!
}

export type RashiSlug =
  | 'mesh' | 'vrishabh' | 'mithun' | 'kark' | 'simha' | 'kanya'
  | 'tula' | 'vrishchik' | 'dhanu' | 'makar' | 'kumbh' | 'meen'

export const RASHIS: ReadonlyArray<{ slug: RashiSlug; name: string; western: string; hi: string; lord: GrahaId }> = [
  { slug: 'mesh', name: 'Mesha', western: 'Aries', hi: 'मेष', lord: 'mars' },
  { slug: 'vrishabh', name: 'Vrishabha', western: 'Taurus', hi: 'वृषभ', lord: 'venus' },
  { slug: 'mithun', name: 'Mithuna', western: 'Gemini', hi: 'मिथुन', lord: 'mercury' },
  { slug: 'kark', name: 'Karka', western: 'Cancer', hi: 'कर्क', lord: 'moon' },
  { slug: 'simha', name: 'Simha', western: 'Leo', hi: 'सिंह', lord: 'sun' },
  { slug: 'kanya', name: 'Kanya', western: 'Virgo', hi: 'कन्या', lord: 'mercury' },
  { slug: 'tula', name: 'Tula', western: 'Libra', hi: 'तुला', lord: 'venus' },
  { slug: 'vrishchik', name: 'Vrishchika', western: 'Scorpio', hi: 'वृश्चिक', lord: 'mars' },
  { slug: 'dhanu', name: 'Dhanu', western: 'Sagittarius', hi: 'धनु', lord: 'jupiter' },
  { slug: 'makar', name: 'Makara', western: 'Capricorn', hi: 'मकर', lord: 'saturn' },
  { slug: 'kumbh', name: 'Kumbha', western: 'Aquarius', hi: 'कुम्भ', lord: 'saturn' },
  { slug: 'meen', name: 'Meena', western: 'Pisces', hi: 'मीन', lord: 'jupiter' },
]

export type NakshatraSlug =
  | 'ashwini' | 'bharani' | 'krittika' | 'rohini' | 'mrigashira' | 'ardra' | 'punarvasu'
  | 'pushya' | 'ashlesha' | 'magha' | 'purva_phalguni' | 'uttara_phalguni' | 'hasta'
  | 'chitra' | 'swati' | 'vishakha' | 'anuradha' | 'jyeshtha' | 'mula' | 'purva_ashadha'
  | 'uttara_ashadha' | 'shravana' | 'dhanishta' | 'shatabhisha' | 'purva_bhadrapada'
  | 'uttara_bhadrapada' | 'revati'

/** Vimshottari lords repeat Ketu → Mercury three times across the 27. */
const VIMSHOTTARI: GrahaId[] = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury']

const NAK_BASE: ReadonlyArray<[NakshatraSlug, string, string]> = [
  ['ashwini', 'Ashwini', 'अश्विनी'],
  ['bharani', 'Bharani', 'भरणी'],
  ['krittika', 'Krittika', 'कृत्तिका'],
  ['rohini', 'Rohini', 'रोहिणी'],
  ['mrigashira', 'Mrigashira', 'मृगशिरा'],
  ['ardra', 'Ardra', 'आर्द्रा'],
  ['punarvasu', 'Punarvasu', 'पुनर्वसु'],
  ['pushya', 'Pushya', 'पुष्य'],
  ['ashlesha', 'Ashlesha', 'आश्लेषा'],
  ['magha', 'Magha', 'मघा'],
  ['purva_phalguni', 'Purva Phalguni', 'पूर्वाफाल्गुनी'],
  ['uttara_phalguni', 'Uttara Phalguni', 'उत्तराफाल्गुनी'],
  ['hasta', 'Hasta', 'हस्त'],
  ['chitra', 'Chitra', 'चित्रा'],
  ['swati', 'Swati', 'स्वाती'],
  ['vishakha', 'Vishakha', 'विशाखा'],
  ['anuradha', 'Anuradha', 'अनुराधा'],
  ['jyeshtha', 'Jyeshtha', 'ज्येष्ठा'],
  ['mula', 'Mula', 'मूल'],
  ['purva_ashadha', 'Purva Ashadha', 'पूर्वाषाढ़ा'],
  ['uttara_ashadha', 'Uttara Ashadha', 'उत्तराषाढ़ा'],
  ['shravana', 'Shravana', 'श्रवण'],
  ['dhanishta', 'Dhanishta', 'धनिष्ठा'],
  ['shatabhisha', 'Shatabhisha', 'शतभिषा'],
  ['purva_bhadrapada', 'Purva Bhadrapada', 'पूर्वाभाद्रपद'],
  ['uttara_bhadrapada', 'Uttara Bhadrapada', 'उत्तराभाद्रपद'],
  ['revati', 'Revati', 'रेवती'],
]

export const NAKSHATRAS: ReadonlyArray<{ slug: NakshatraSlug; name: string; hi: string; lord: GrahaId }> =
  NAK_BASE.map(([slug, name, hi], i) => ({ slug, name, hi, lord: VIMSHOTTARI[i % 9] }))

export const NAKSHATRA_SPAN = 360 / 27 // 13°20′
export const PADA_SPAN = NAKSHATRA_SPAN / 4 // 3°20′

export function normalizeDeg(x: number): number {
  const r = x % 360
  return r < 0 ? r + 360 : r
}

export function rashiIndexOf(lon: number): number {
  return Math.min(11, Math.floor(normalizeDeg(lon) / 30))
}

export function nakshatraIndexOf(lon: number): number {
  return Math.min(26, Math.floor((normalizeDeg(lon) * 27) / 360))
}

export function padaOf(lon: number): 1 | 2 | 3 | 4 {
  const pos = (normalizeDeg(lon) * 27) / 360
  const frac = pos - Math.floor(pos)
  return (Math.min(3, Math.floor(frac * 4)) + 1) as 1 | 2 | 3 | 4
}

export function degreeInRashi(lon: number): number {
  return normalizeDeg(lon) - rashiIndexOf(lon) * 30
}

/** Degrees within a rashi as 12°34′, truncated (never rounded up into the next sign). */
export function formatDegree(deg: number): string {
  const totalMinutes = Math.floor(deg * 60 + 1e-9)
  return `${Math.floor(totalMinutes / 60)}°${String(totalMinutes % 60).padStart(2, '0')}′`
}

/** Distance in degrees from `lon` to the nearest nakshatra boundary. */
export function distanceToNakshatraBoundary(lon: number): number {
  const pos = normalizeDeg(lon) % NAKSHATRA_SPAN
  return Math.min(pos, NAKSHATRA_SPAN - pos)
}

export function distanceToRashiBoundary(lon: number): number {
  const pos = normalizeDeg(lon) % 30
  return Math.min(pos, 30 - pos)
}
