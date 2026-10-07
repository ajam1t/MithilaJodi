/*
 * Mithila Jodi Journal — the editorial architecture, in one place.
 *
 * Everything here points at things that exist: article slugs from the
 * blog_posts table (audited 2026-10-07), the eight astrology tool routes in
 * /astrology, and the festival pages. A slug that is not (or no longer)
 * published is simply skipped wherever it is used, so a stale entry can never
 * produce a dead link — but keep this list honest rather than relying on that.
 */

// ─── Pillars (category order and short labels) ───────────────────────────────

export type Pillar = {
  slug: string
  /** Short label for navigation chips. The category page H1 uses the DB name. */
  label: string
  /** Line-art motif for cover fallbacks. */
  motif: 'kalash' | 'lotus' | 'fish' | 'rings' | 'stars' | 'scroll'
}

/** The Journal's six pillars, in priority order. Astrology sits fifth on purpose. */
export const PILLARS: Pillar[] = [
  { slug: 'mithila-marriage-traditions', label: 'Mithila Marriage', motif: 'kalash' },
  { slug: 'gotra-family-lineage', label: 'Gotra & Lineage', motif: 'lotus' },
  { slug: 'mithila-culture-heritage', label: 'Mithila Culture', motif: 'fish' },
  { slug: 'matrimonial-marriage-guide', label: 'Matrimonial Guide', motif: 'rings' },
  { slug: 'horoscope-marriage', label: 'Horoscope & Marriage', motif: 'stars' },
  { slug: 'biodata-matrimonial-tips', label: 'Biodata & Matrimonial Tips', motif: 'scroll' },
]

export function pillarFor(slug: string | null | undefined): Pillar | undefined {
  return PILLARS.find(p => p.slug === slug)
}

/** Order categories by pillar priority; anything unknown keeps DB order after. */
export function pillarRank(slug: string): number {
  const i = PILLARS.findIndex(p => p.slug === slug)
  return i === -1 ? 100 : i
}

/** Category-page introductions that replace the DB description where set. */
export const CATEGORY_INTRO: Record<string, string> = {
  'horoscope-marriage':
    'A practical guide to horoscope, compatibility and traditional astrology concepts commonly explored during the marriage journey.',
}

// ─── Editorial hubs ──────────────────────────────────────────────────────────

/** Mithila 101: evergreen questions, each answered by an existing article or page. */
export const MITHILA_101: Array<{ q: string; slug?: string; href?: string }> = [
  { q: 'What is Mithila?', slug: 'what-is-mithila-culture' },
  { q: 'What is Maithili?', slug: 'maithili-language-identity' },
  { q: 'What is Gotra?', slug: 'what-is-gotra' },
  { q: 'What is Maternal Gotra?', slug: 'what-is-maternal-gotra' },
  { q: 'What is Mool?', slug: 'what-is-mool-in-mithila' },
  { q: 'What is Gram?', slug: 'what-is-gram-in-mithila' },
  { q: 'Mithila heritage & Madhubani art', slug: 'mithila-heritage' },
  { q: 'Important Mithila festivals', href: '/festivals' },
]

/** Mithila Marriage Guide: the journey in stages. Stages with no article are left out. */
export const MARRIAGE_GUIDE: Array<{ stage: string; slugs: string[] }> = [
  { stage: 'Before marriage', slugs: ['family-questions-before-marriage'] },
  { stage: 'Family & conversations', slugs: ['role-of-family-mithila-marriage'] },
  { stage: 'Gotra & lineage', slugs: ['why-gotra-matters-in-marriage', 'same-gotra-marriage', 'gotra-marriage-compatibility'] },
  { stage: 'Matrimonial biodata', slugs: ['how-to-create-matrimonial-biodata', 'matrimonial-biodata-mistakes'] },
  { stage: 'Horoscope & compatibility', slugs: ['kundli-matching-explained', 'what-is-manglik'] },
  { stage: 'Finding a match', slugs: ['effective-matrimonial-profile', 'matrimonial-profile-information', 'evaluate-matrimonial-profile'] },
  { stage: 'The wedding', slugs: ['mithila-wedding-rituals', 'mithila-marriage-customs'] },
]

/** Start Here: the evergreen guides a new reader should see first. */
export const START_HERE: string[] = [
  'what-is-gotra',
  'mithila-family-lineage',
  'mithila-wedding-rituals',
  'how-to-create-matrimonial-biodata',
  'kundli-matching-explained',
]

/**
 * Hand-picked "read next" clusters. Related articles rank these first, then
 * the same category, then shared keywords — never just "most recent".
 */
export const EDITORIAL_RELATED: Record<string, string[]> = {
  'what-is-gotra': ['what-is-mool-in-mithila', 'what-is-gram-in-mithila', 'mithila-family-lineage', 'same-gotra-marriage'],
  'what-is-mool-in-mithila': ['what-is-gotra', 'what-is-gram-in-mithila', 'mithila-family-lineage'],
  'what-is-gram-in-mithila': ['what-is-mool-in-mithila', 'what-is-gotra', 'mithila-family-lineage'],
  'mithila-family-lineage': ['what-is-gotra', 'what-is-mool-in-mithila', 'what-is-gram-in-mithila'],
  'what-is-maternal-gotra': ['gotra-vs-maternal-gotra', 'what-is-gotra', 'why-gotra-matters-in-marriage'],
  'gotra-vs-maternal-gotra': ['what-is-maternal-gotra', 'what-is-gotra', 'same-gotra-marriage'],
  'same-gotra-marriage': ['why-gotra-matters-in-marriage', 'gotra-marriage-compatibility', 'what-is-gotra'],
  'why-gotra-matters-in-marriage': ['same-gotra-marriage', 'gotra-marriage-compatibility', 'mithila-family-lineage'],
  'gotra-marriage-compatibility': ['same-gotra-marriage', 'why-gotra-matters-in-marriage', 'kundli-matching-explained'],
  'mithila-wedding-rituals': ['mithila-marriage-customs', 'role-of-family-mithila-marriage', 'family-questions-before-marriage'],
  'mithila-marriage-customs': ['mithila-wedding-rituals', 'role-of-family-mithila-marriage', 'why-gotra-matters-in-marriage'],
  'role-of-family-mithila-marriage': ['family-questions-before-marriage', 'mithila-marriage-customs', 'how-to-create-matrimonial-biodata'],
  'family-questions-before-marriage': ['role-of-family-mithila-marriage', 'evaluate-matrimonial-profile', 'kundli-matching-explained'],
  'how-to-create-matrimonial-biodata': ['matrimonial-biodata-mistakes', 'matrimonial-profile-information', 'effective-matrimonial-profile'],
  'matrimonial-biodata-mistakes': ['how-to-create-matrimonial-biodata', 'effective-matrimonial-profile', 'evaluate-matrimonial-profile'],
  'effective-matrimonial-profile': ['matrimonial-profile-information', 'how-to-create-matrimonial-biodata', 'evaluate-matrimonial-profile'],
  'matrimonial-profile-information': ['effective-matrimonial-profile', 'how-to-create-matrimonial-biodata', 'matrimonial-biodata-mistakes'],
  'evaluate-matrimonial-profile': ['family-questions-before-marriage', 'matrimonial-profile-information', 'gotra-marriage-compatibility'],
  'kundli-matching-explained': ['what-is-manglik', 'what-is-nakshatra', 'what-is-rashi', 'gotra-marriage-compatibility'],
  'what-is-manglik': ['kundli-matching-explained', 'what-is-nakshatra', 'what-is-rashi'],
  'what-is-nakshatra': ['what-is-rashi', 'kundli-matching-explained', 'what-is-manglik'],
  'what-is-rashi': ['what-is-nakshatra', 'kundli-matching-explained', 'what-is-manglik'],
  'what-is-mithila-culture': ['mithila-heritage', 'maithili-language-identity', 'mithila-wedding-rituals'],
  'mithila-heritage': ['what-is-mithila-culture', 'maithili-language-identity', 'mithila-family-lineage'],
  'maithili-language-identity': ['what-is-mithila-culture', 'mithila-heritage', 'mithila-family-lineage'],
}

// ─── Astrology tools (source of truth: components/astrology/hub/ToolGrid) ─────

export type JournalTool = { slug: string; href: string; title: string; subtitle: string; articles: string[] }

/** The eight tools, with the Journal articles that explain each one. */
export const ASTROLOGY_TOOLS: JournalTool[] = [
  { slug: 'kundli-match', href: '/astrology/kundli-match', title: 'Kundli Match', subtitle: 'Match two Kundlis', articles: ['kundli-matching-explained', 'what-is-manglik'] },
  { slug: 'compatibility', href: '/astrology/compatibility', title: 'Compatibility', subtitle: 'Beyond the 36 Guna', articles: ['kundli-matching-explained'] },
  { slug: 'janam-kundli', href: '/astrology/janam-kundli', title: 'Janam Kundli', subtitle: 'Your birth chart in the Vedic tradition', articles: [] },
  { slug: 'manglik', href: '/astrology/manglik', title: 'Manglik Check', subtitle: 'Understand Manglik dosha', articles: ['what-is-manglik'] },
  { slug: 'nakshatra', href: '/astrology/nakshatra', title: 'Nakshatra', subtitle: 'Find your Janma Nakshatra', articles: ['what-is-nakshatra'] },
  { slug: 'rashi', href: '/astrology/rashi', title: 'Rashi', subtitle: 'Find your Moon sign', articles: ['what-is-rashi'] },
  { slug: 'vivah-muhurat', href: '/astrology/vivah-muhurat', title: 'Vivah Muhurat', subtitle: 'Auspicious dates for marriage', articles: [] },
  { slug: 'baby-names', href: '/astrology/baby-names', title: 'Baby Names', subtitle: 'Name syllables from Janma Nakshatra', articles: [] },
]

/** Tools an article naturally leads to ("read what it is, then try it"). */
export function toolsForArticle(slug: string): JournalTool[] {
  return ASTROLOGY_TOOLS.filter(t => t.articles.includes(slug))
}

// ─── Contextual CTA ──────────────────────────────────────────────────────────

export type JournalCta = { eyebrow: string; title: string; text: string; href: string; label: string } | null

/** One natural next step per article; culture pieces get none. */
export function ctaFor(categorySlug: string | null | undefined, postSlug: string): JournalCta {
  if (categorySlug === 'biodata-matrimonial-tips' || /biodata/.test(postSlug)) {
    return { eyebrow: 'Put it into practice', title: 'Create Your Marriage Biodata', text: 'A free, print-ready biodata in English, Hindi, Maithili or Sanskrit.', href: '/marriage-biodata', label: 'Create Your Marriage Biodata →' }
  }
  if (categorySlug === 'horoscope-marriage') {
    return { eyebrow: 'Try it yourself', title: 'Explore Astrology Tools', text: 'Kundli matching, Manglik, Rashi, Nakshatra and more — free, with the method explained.', href: '/astrology', label: 'Explore Astrology Tools →' }
  }
  if (categorySlug === 'mithila-culture-heritage') return null
  return { eyebrow: 'When you are ready', title: 'Create Your Mithila Jodi Profile', text: 'A matrimonial profile with gotra, mool and family details — free to create.', href: '/register?start=1', label: 'Create Your Mithila Jodi Profile →' }
}

// ─── Text helpers ────────────────────────────────────────────────────────────

export function readingMinutes(content: string | null | undefined): number {
  const words = (content ?? '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

/** Stable, readable anchor id for a heading. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[*_`~[\]()!]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9ऀ-ॿ\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export type Heading = { depth: 2 | 3; text: string; id: string }

/** H2/H3 headings from the markdown, for the "On this page" list. */
export function extractHeadings(markdown: string | null | undefined): Heading[] {
  const out: Heading[] = []
  let inFence = false
  for (const line of (markdown ?? '').split('\n')) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!m) continue
    const text = m[2].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '')
    out.push({ depth: m[1].length as 2 | 3, text, id: headingId(text) })
  }
  return out
}

/** "Updated" only when an article was genuinely revised after publishing. */
export function wasUpdated(published: string | null | undefined, updated: string | null | undefined): boolean {
  if (!published || !updated) return false
  return Date.parse(updated) - Date.parse(published) > 864e5
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
}
