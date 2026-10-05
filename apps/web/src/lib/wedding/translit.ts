/**
 * Devanagari → the everyday Roman spelling of Indian names (मुस्कान → Muskan,
 * कमला → Kamla, अंकित → Ankit). Used only where Devanagari cannot be shaped —
 * the share-preview image renderer has no complex-script shaping and would
 * break conjuncts and vowel signs. Long and short vowels are written alike,
 * as names usually are, and the inherent “a” is dropped where Hindi and
 * Maithili speech drops it (word-final, and in the V·C·a·C·V pattern).
 */

const VOWELS: Record<string, string> = {
  'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
}
const SIGNS: Record<string, string> = {
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
}
const CONSONANTS: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n', 'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h', 'ड़': 'r', 'ढ़': 'rh', 'क़': 'q', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'z', 'फ़': 'f',
}
const HALANT = '्'
const NUKTA = '़'

type Unit = { c: string; v: string; inherent: boolean; nasal: boolean }

function word(w: string): string {
  const units: Unit[] = []
  const chars = [...w.normalize('NFC')]
  for (let i = 0; i < chars.length; i++) {
    let ch = chars[i]
    if (chars[i + 1] === NUKTA) { ch += NUKTA; i++ }
    if (CONSONANTS[ch]) {
      const next = chars[i + 1]
      if (next === HALANT) { units.push({ c: CONSONANTS[ch], v: '', inherent: false, nasal: false }); i++ }
      else if (next && SIGNS[next]) { units.push({ c: CONSONANTS[ch], v: SIGNS[next], inherent: false, nasal: false }); i++ }
      else units.push({ c: CONSONANTS[ch], v: 'a', inherent: true, nasal: false })
    } else if (VOWELS[ch]) {
      units.push({ c: '', v: VOWELS[ch], inherent: false, nasal: false })
    } else if (ch === 'ं' || ch === 'ँ') {
      if (units.length) units[units.length - 1].nasal = true
    } else if (ch === 'ः') {
      if (units.length) units[units.length - 1].v += 'h'
    } else {
      units.push({ c: ch, v: '', inherent: false, nasal: false })
    }
  }
  // Schwa deletion: word-final, then V·C(a)·C·V from the right.
  const last = units.length - 1
  // …except after a cluster: मिश्र is Mishra, शुक्र Shukra, not Mishr / Shukr.
  const afterCluster = last > 0 && units[last - 1].c && !units[last - 1].v
  if (last > 0 && units[last].inherent && !units[last].nasal && !afterCluster) units[last].v = ''
  for (let i = last - 1; i > 0; i--) {
    const u = units[i]
    if (!u.inherent || u.nasal) continue
    const prev = units[i - 1]
    const next = units[i + 1]
    if (prev.v && next.c && next.v) u.v = ''
  }
  return units.map(u => u.c + u.v + (u.nasal ? 'n' : '')).join('')
}

const DEVANAGARI = /[ऀ-ॿ]/

/** Romanise any Devanagari in the text; Latin text is returned unchanged. */
export function romanize(text: string): string {
  if (!DEVANAGARI.test(text)) return text
  return text.replace(/[ऀ-ॿ]+/g, w => {
    const r = word(w)
    return r ? r[0].toUpperCase() + r.slice(1) : r
  }).replace(/[।॥]/g, '.')
}
