import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { FESTIVALS } from '@/lib/festivals'
import { SITE_URL } from '@/lib/constants'
import { canonicalUrl } from '@/lib/seo'
import { INDEXABLE_GOTRAS } from '@/lib/mithilaRoots'
import { contentDate } from '@/lib/contentDates'
import { COMPETITORS } from '@/lib/compare'
import { BIODATA_LANGUAGE_PAGES } from '@/lib/biodataLanguagePages'

const SITE = SITE_URL

// The blog section of this sitemap is generated from the database, so a build
// artefact would go stale as soon as a new article is published. Regenerate
// hourly. (Until createAdminClient stopped reading cookies this route could not
// be statically rendered at all — it threw DYNAMIC_SERVER_USAGE mid-build and
// silently emitted a sitemap containing no blog URLs.)
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fallback only, for a database row with no updated_at of its own. Never used
  // as the lastmod of a hand-written page — see CONTENT_UPDATED in lib/contentDates.
  const now = new Date()

  // Only genuinely public, indexable, content-bearing pages belong here.
  // Auth pages (login/register/forgot) and all authenticated areas are excluded.
  const staticRoutes: Array<{
    path: string
    priority: number
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  }> = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/blogs', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/festivals', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/marriage-invitation', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/marriage-invitation/basic', priority: 0.8, changeFrequency: 'monthly' },
    // Indexable and linked from the hub, but was missing here.
    { path: '/marriage-invitation/premium', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/marriage-invitation/scratch-reveal', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/marriage-invitation/blush-lace', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/digital-profile', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/marriage-biodata', priority: 0.9, changeFrequency: 'monthly' },
    ...BIODATA_LANGUAGE_PAGES.map(l => ({ path: `/marriage-biodata/${l.slug}`, priority: 0.7, changeFrequency: 'monthly' as const })),
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/explore', priority: 0.7, changeFrequency: 'daily' },
    { path: '/safety', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/help', priority: 0.4, changeFrequency: 'monthly' },
    // 'Is it free?' is one of the first things a visitor wants answered, so this
    // page is indexable rather than hidden.
    { path: '/pricing', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' },
    // ── Astrology tools hub + 8 individual tool pages ─────────────────────────
    // All are public, indexable, content-bearing pages. Individual tools have
    // substantial explanatory content even while the calculator is coming soon.
    { path: '/astrology', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/astrology/kundli-match', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/astrology/nakshatra', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/astrology/manglik', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/astrology/janam-kundli', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/astrology/rashi', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/astrology/vivah-muhurat', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/astrology/baby-names', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/astrology/compatibility', priority: 0.7, changeFrequency: 'monthly' },
    // Mithila roots guides and the comparison pages.
    { path: '/gotra', priority: 0.9, changeFrequency: 'monthly' },
    // Only gotras with a lineage note; the rest are noindex (see isIndexableGotra).
    ...INDEXABLE_GOTRAS.map(g => ({ path: `/gotra/${g.slug}`, priority: 0.7, changeFrequency: 'monthly' as const })),
    { path: '/mool', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/compare', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/match-score', priority: 0.8, changeFrequency: 'monthly' },
    ...COMPETITORS.map(c => ({ path: `/compare/${c.slug}`, priority: 0.6, changeFrequency: 'monthly' as const })),
  ]

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    // canonicalUrl, not string concatenation: `${SITE}/` for the homepage does
    // not match the bare-origin canonical the page itself emits.
    url: canonicalUrl(r.path),
    lastModified: contentDate(r.path),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  // Festival pages — derived from lib/festivals so new festivals are included
  // automatically. Static content, so no DB call is needed.
  const festivalEntries: MetadataRoute.Sitemap = [
    ...FESTIVALS.map((f) => ({
      url: `${SITE}/festivals/${f.slug}`,
      lastModified: contentDate(`/festivals/${f.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // Festival Songs hub + one page per festival that has recordings.
    {
      url: `${SITE}/festival-songs`,
      lastModified: contentDate('/festival-songs'),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    ...FESTIVALS.filter((f) => f.songs.length > 0).map((f) => ({
      url: `${SITE}/festival-songs/${f.slug}`,
      lastModified: contentDate(`/festival-songs/${f.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]

  try {
    const supabase = await createAdminClient()

    // Published posts, with their category slug.
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, blog_categories(slug)')
      .eq('status', 'published')

    // Active categories.
    const { data: cats } = await supabase
      .from('blog_categories')
      .select('slug, updated_at')
      .eq('is_active', true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postRows = (posts ?? []) as any[]

    // Category slugs that actually have at least one published post. Empty
    // category pages are thin content and are intentionally left out of the
    // sitemap (they remain reachable but are not promoted to search engines).
    const nonEmptyCategorySlugs = new Set<string>()
    for (const p of postRows) {
      const slug = p.blog_categories?.slug
      if (slug) nonEmptyCategorySlugs.add(slug as string)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryEntries: MetadataRoute.Sitemap = ((cats ?? []) as any[])
      .filter((cat) => nonEmptyCategorySlugs.has(cat.slug as string))
      .map((cat) => ({
        url: `${SITE}/blogs/${cat.slug}`,
        lastModified: cat.updated_at ? new Date(cat.updated_at) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))

    const postEntries: MetadataRoute.Sitemap = postRows
      .filter((p) => p.blog_categories?.slug)
      .map((p) => ({
        url: `${SITE}/blogs/${p.blog_categories.slug}/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }))

    return [...staticEntries, ...festivalEntries, ...categoryEntries, ...postEntries]
  } catch (err) {
    console.error('[sitemap] blog entries error:', err)
    // Festivals are static data — still emit them even if the blog query failed.
    return [...staticEntries, ...festivalEntries]
  }
}
