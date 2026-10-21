import { BIODATA_LABELS, BIODATA_LANGUAGES, type BiodataLanguage } from '@/lib/biodata'

/**
 * The per-language landing pages of the public biodata maker
 * (/marriage-biodata/maithili, /hindi, /sanskrit).
 *
 * Each is a real page in its own right — the field names of the printed
 * document in that language beside English, straight from BIODATA_LABELS, so
 * the table can never disagree with what the maker prints. The button opens
 * the maker with `?lang=` set, which BiodataBuilder reads on mount.
 */

export type BiodataLanguagePage = {
  slug: string
  code: Exclude<BiodataLanguage, 'en'>
  /** English name of the language. */
  name: string
  /** As the maker's language switch shows it. */
  native: string
  title: string
  description: string
}

const native = (code: BiodataLanguage) => BIODATA_LANGUAGES.find(l => l.code === code)?.label ?? code

export const BIODATA_LANGUAGE_PAGES: BiodataLanguagePage[] = [
  {
    slug: 'maithili',
    code: 'mai',
    name: 'Maithili',
    native: native('mai'),
    title: 'Marriage Biodata in Maithili (मैथिली) — Free Maker',
    description:
      'Make a marriage biodata in Maithili free: every heading in मैथिली, with gotra, mool and gram near the top. See the Maithili field names and download a PDF — no login.',
  },
  {
    slug: 'hindi',
    code: 'hi',
    name: 'Hindi',
    native: native('hi'),
    title: 'Marriage Biodata in Hindi (हिन्दी) — Free Maker',
    description:
      'Make a marriage biodata in Hindi free: every heading in हिन्दी, including गोत्र, मूल and ग्राम. See the Hindi field names beside English and download a PDF — no login.',
  },
  {
    slug: 'sanskrit',
    code: 'sa',
    name: 'Sanskrit',
    native: native('sa'),
    title: 'Marriage Biodata in Sanskrit (संस्कृत) — Free Maker',
    description:
      'Make a marriage biodata in Sanskrit free: विवाहार्थं परिचयपत्रम् with gotra, mool and gram. See the Sanskrit field names beside English and download a PDF — no login.',
  },
]

export const getBiodataLanguagePage = (slug: string) => BIODATA_LANGUAGE_PAGES.find(p => p.slug === slug)

/** The document's headings and fields, in the order the printed biodata uses them. */
const TABLE_KEYS = [
  'title',
  'community', 'self_gotra', 'maternal_gotra', 'mool', 'gram', 'sub_caste',
  'personal', 'dob', 'age', 'height', 'complexion', 'marital_status', 'mother_tongue', 'diet',
  'career', 'education', 'profession', 'employer', 'income',
  'family', 'father_name', 'mother_name', 'siblings', 'family_type',
  'astrology', 'birth_time', 'birth_place', 'rashi', 'nakshatra', 'mangalik',
  'location', 'native_place', 'current_location',
  'contact', 'mobile', 'email', 'address',
] as const

/** [English, that language] for every field above that the language labels. */
export function biodataLabelRows(code: BiodataLanguage): Array<{ key: string; en: string; local: string }> {
  const en = BIODATA_LABELS.en
  const local = BIODATA_LABELS[code]
  return TABLE_KEYS.filter(k => en[k] && local[k]).map(k => ({ key: k, en: en[k], local: local[k] }))
}
