import { GOTRAS } from '@/lib/mithilaRoots'
import { COMPETITORS } from '@/lib/compare'
import { FESTIVALS } from '@/lib/festivals'
import { BIODATA_LANGUAGE_PAGES } from '@/lib/biodataLanguagePages'

/**
 * When these hand-written pages last actually changed — the sitemap's lastmod
 * and the dateModified of the pages' own Article JSON-LD, from one table so
 * the two can never disagree.
 *
 * This used to be `new Date()`. Combined with the sitemap's `revalidate = 3600`
 * that made 30 of the 61 entries claim a fresh modification date every hour
 * and on every deploy, whether or not a single word had changed. Google treats
 * a lastmod that is always "now" as noise and stops using it to decide what to
 * re-crawl, which removes the one signal that tells it which pages are worth
 * its limited crawl budget — and unindexed pages showed up in Search Console
 * as "Discovered – currently not indexed".
 *
 * So these are real dates, edited by hand when a page's content changes. A
 * slightly stale date is honest and useful; a date that is always current is
 * neither. The blog entries in the sitemap already do the right thing by
 * reading `updated_at` from the database.
 */
const CONTENT_UPDATED = {
  // 2026-10-21: the ecosystem wheel's links all in the server HTML.
  '/': '2026-10-21',
  // Legal documents gained the published Grievance Officer section.
  '/legal/terms': '2026-09-07',
  '/legal/privacy': '2026-09-07',
  // Astrology tools — Phase 1 launch date; Kundli Match went live 2026-10-04.
  // 2026-10-21: Kundli Match gained the "Kundli milan in a Maithil match" section.
  '/astrology/kundli-match': '2026-10-21',
  '/astrology/nakshatra': '2026-10-05',
  '/astrology/manglik': '2026-10-05',
  '/astrology/janam-kundli': '2026-10-05',
  '/astrology/rashi': '2026-10-05',
  '/astrology/vivah-muhurat': '2026-10-05',
  '/astrology/baby-names': '2026-10-05',
  '/astrology/compatibility': '2026-10-05',
  '/digital-profile': '2026-10-07',
  // 2026-10-21: link to the match-score explainer.
  '/explore': '2026-10-21',
  // 2026-10-07: the Journal redesign, and Journal reading lists added to the
  // biodata maker, invitation pages and every festival guide.
  '/blogs': '2026-10-07',
  // 2026-10-21: new title, intro and the per-language pages.
  '/marriage-biodata': '2026-10-21',
  '/marriage-invitation': '2026-10-07',
  '/marriage-invitation/basic': '2026-10-07',
  '/marriage-invitation/premium': '2026-10-07',
  '/marriage-invitation/scratch-reveal': '2026-10-18',
  '/marriage-invitation/blush-lace': '2026-10-19',
  '/festivals': '2026-10-21',
  '/festivals/chhath-puja': '2026-10-07',
  '/festivals/sama-chakeva': '2026-10-07',
  '/festivals/madhushravani': '2026-10-07',
  '/festivals/vivah-panchami': '2026-10-07',
  '/festivals/kojagara': '2026-10-07',
  '/festivals/diwali': '2026-10-07',
  '/festivals/durga-puja': '2026-10-07',
  '/festivals/holi': '2026-10-07',
  // Hub description now names all eight tools.
  '/astrology': '2026-10-07',
  // Everything else last had a substantive content change with the content
  // build on this date. Bump a path here when you actually edit that page.
  // New: the gotra and mool guides and the comparison pages.
  // 2026-10-21: the mool list groups spelling variants.
  '/gotra': '2026-10-20', '/mool': '2026-10-21', '/compare': '2026-10-20', '/match-score': '2026-10-21',
  ...Object.fromEntries([
    ...GOTRAS.map(g => [`/gotra/${g.slug}`, '2026-10-20']),
    ...COMPETITORS.map(c => [`/compare/${c.slug}`, '2026-10-20']),
    ...BIODATA_LANGUAGE_PAGES.map(l => [`/marriage-biodata/${l.slug}`, '2026-10-21']),
    // 2026-10-21: song pages rebuilt from the songs' own details.
    ...FESTIVALS.filter(f => f.songs.length > 0).map(f => [`/festival-songs/${f.slug}`, '2026-10-21']),
  ]),
  DEFAULT: '2026-08-23',
} as const

/**
 * When a page first went up, for Article `datePublished`. Pages not listed
 * here date from the content build (CONTENT_UPDATED.DEFAULT).
 */
const CONTENT_PUBLISHED: Record<string, string> = Object.fromEntries(
  GOTRAS.map(g => [`/gotra/${g.slug}`, '2026-10-20']),
)

/** When a hand-written page last changed (sitemap lastmod, Article dateModified). */
export function contentDate(path: string): Date {
  const map = CONTENT_UPDATED as Record<string, string>
  return new Date(map[path] ?? CONTENT_UPDATED.DEFAULT)
}

/** When a hand-written page was first published (Article datePublished). */
export function contentPublished(path: string): Date {
  return new Date(CONTENT_PUBLISHED[path] ?? CONTENT_UPDATED.DEFAULT)
}

/** Article `datePublished` / `dateModified` for a hand-written page, as ISO dates. */
export function articleDates(path: string): { datePublished: string; dateModified: string } {
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { datePublished: iso(contentPublished(path)), dateModified: iso(contentDate(path)) }
}
