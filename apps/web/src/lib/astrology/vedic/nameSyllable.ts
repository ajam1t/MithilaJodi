/**
 * Does a name begin with a given nakshatra-pada syllable? A phonetic
 * first-sound check, in Devanagari or in Roman letters. Pure; client-safe.
 *
 * Deliberately forgiving in the ways families are: long and short vowels count
 * as the same sound (हि / ही, "Hi" / "Hee"), and a syllable ending in "a"
 * matches the consonant with its inherent vowel (ला matches लक्ष्मी).
 */
import { NAKSHATRA_INFO } from './nakshatraInfo'
import { NAKSHATRAS, PADA_SPAN, normalizeDeg } from './zodiac'

export type Syllable = { nakshatraIndex: number; pada: number; hi: string; en: string }

export function syllableOf(nakshatraIndex: number, pada: number): Syllable {
  const [hi, en] = NAKSHATRA_INFO[NAKSHATRAS[nakshatraIndex].slug].syllables[pada - 1]
  return { nakshatraIndex, pada, hi, en }
}

/** Every pada the Moon passed through between two longitudes (inclusive), in order. */
export function syllablesBetween(fromLon: number, toLon: number): Syllable[] {
  const first = Math.floor(normalizeDeg(fromLon) / PADA_SPAN)
  let last = Math.floor(normalizeDeg(toLon) / PADA_SPAN)
  if (last < first) last += 108
  const out: Syllable[] = []
  for (let k = first; k <= last; k += 1) {
    const g = k % 108
    out.push(syllableOf(Math.floor(g / 4), (g % 4) + 1))
  }
  return out
}

/** The nine pada syllables of a rashi — the "rashi letters" many families also use. */
export function rashiSyllables(rashiIndex: number): Syllable[] {
  const out: Syllable[] = []
  for (let g = rashiIndex * 9; g < rashiIndex * 9 + 9; g += 1) out.push(syllableOf(Math.floor(g / 4), (g % 4) + 1))
  return out
}

// ─── Roman letters ───────────────────────────────────────────────────────────

function normaliseRoman(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z]/g, '')
    .replace(/aa/g, 'a')
    .replace(/ee|ii/g, 'i')
    .replace(/oo|uu/g, 'u')
    .replace(/w/g, 'v')
}

// ─── Devanagari ──────────────────────────────────────────────────────────────

const MATRAS = new Set(['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ', 'ं', 'ँ', 'ः', '्'])
const SHORT: Record<string, string> = { 'ी': 'ि', 'ू': 'ु', 'आ': 'अ', 'ई': 'इ', 'ऊ': 'उ' }
const short = (c: string | undefined) => (c ? SHORT[c] ?? c : c)
const isDevanagari = (s: string) => /[ऀ-ॿ]/.test(s)

function devanagariMatch(name: string, syllable: string): boolean {
  const n = [...name.trim()]
  const s = [...syllable]
  if (!n.length) return false
  // Independent vowel syllables: अ इ उ ए ओ (and their long forms).
  if (s.length === 1 && !/[क-ह]/.test(s[0])) return short(n[0]) === short(s[0])
  if (n[0] !== s[0]) return false
  const nameSign = n[1] && MATRAS.has(n[1]) ? n[1] : undefined
  const sylSign = s[1]
  // Syllable is a bare consonant (inherent "a") or ends in ा: accept the inherent vowel or ा.
  if (!sylSign || sylSign === 'ा') return nameSign === undefined || nameSign === 'ा' || nameSign === 'ं' || nameSign === 'ँ'
  return short(nameSign) === short(sylSign)
}

export function nameStartsWith(name: string, syllable: Pick<Syllable, 'hi' | 'en'>): boolean {
  if (isDevanagari(name)) return devanagariMatch(name, syllable.hi)
  const n = normaliseRoman(name)
  const s = normaliseRoman(syllable.en)
  return n.length > 0 && n.startsWith(s)
}
