import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { FESTIVALS } from '@/lib/festivals'
import { SITE_URL } from '@/lib/constants'

const SITE = SITE_URL

// The blog section of this sitemap is generated from the database, so a build
// artefact would go stale as soon as a new article is published. Regenerate
// hourly. (Until createAdminClient stopped reading cookies this route could not
// be statically rendered at all — it threw DYNAMIC_SERVER_USAGE mid-build and
// silently emitted a sitemap containing no blog URLs.)
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/explore', priority: 0.7, changeFrequency: 'daily' },
    { path: '/safety', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/help', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ]

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  // Festival pages — derived from lib/festivals so new festivals are included
  // automatically. Static content, so no DB call is needed.
  const festivalEntries: MetadataRoute.Sitemap = [
    ...FESTIVALS.map((f) => ({
      url: `${SITE}/festivals/${f.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // Festival Songs hub + one page per festival that has recordings.
    {
      url: `${SITE}/festival-songs`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    ...FESTIVALS.filter((f) => f.songs.length > 0).map((f) => ({
      url: `${SITE}/festival-songs/${f.slug}`,
      lastModified: now,
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
