import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mithilajodi.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: Array<{
    path: string
    priority: number
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  }> = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/register', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/blogs', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/login', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ]

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  try {
    const supabase = await createAdminClient()

    // Fetch active blog categories
    const { data: cats } = await supabase
      .from('blog_categories')
      .select('slug, updated_at')
      .eq('is_active', true)

    // Fetch published blog posts with their category slug
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, blog_categories(slug)')
      .eq('status', 'published')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryEntries: MetadataRoute.Sitemap = (cats ?? []).map((cat: any) => ({
      url: `${SITE}/blogs/${cat.slug}`,
      lastModified: cat.updated_at ? new Date(cat.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postEntries: MetadataRoute.Sitemap = (posts ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((p: any) => p.blog_categories?.slug)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => ({
        url: `${SITE}/blogs/${p.blog_categories.slug}/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }))

    return [...staticEntries, ...categoryEntries, ...postEntries]
  } catch (err) {
    console.error('[sitemap] blog entries error:', err)
    return staticEntries
  }
}
