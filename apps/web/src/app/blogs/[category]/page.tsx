import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { ArticleGrid, FeaturedArticle } from '@/components/journal/ArticleCard'
import { JournalCTA } from '@/components/journal/ArticleParts'
import { Breadcrumbs, CategoryNav, Pagination, breadcrumbJsonLd, type Crumb } from '@/components/journal/Navigation'
import { AstrologyToolsSection, ContentPillars, EmptyState, SectionHeading } from '@/components/journal/Sections'
import { createAdminClient } from '@/lib/supabase/server'
import { SITE_URL, stripBrandSuffix } from '@/lib/constants'
import { CATEGORY_INTRO, START_HERE, ctaFor } from '@/lib/journal'
import { card, getJournalCategories, getJournalPosts, pick, type JournalPost } from '@/lib/journalData'

export const dynamic = 'force-dynamic'

const PER_PAGE = 12

/** Per-category lead story, where the editors have a clear first read. */
const FEATURED_GUIDE: Record<string, { slug: string; label: string }> = {
  'horoscope-marriage': { slug: 'kundli-matching-explained', label: 'Featured Astrology Guide' },
}

/** Guides from other pillars that sit naturally beside a category. */
const RELATED_READING: Record<string, { title: string; slugs: string[] }> = {
  'horoscope-marriage': {
    title: 'Related marriage guides',
    slugs: ['gotra-marriage-compatibility', 'family-questions-before-marriage', 'why-gotra-matters-in-marriage'],
  },
}

type CategoryRow = { id: number; name: string; slug: string; description: string | null; seo_title: string | null; seo_description: string | null }

async function getCategory(slug: string): Promise<CategoryRow | null> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('blog_categories')
    .select('id, name, slug, description, seo_title, seo_description')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  return (data as CategoryRow | null) ?? null
}

function pageFrom(v: string | string[] | undefined) {
  const n = Number(Array.isArray(v) ? v[0] : v)
  return Number.isInteger(n) && n > 1 ? n : 1
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string | string[] }>
}): Promise<Metadata> {
  const { category: categorySlug } = await params
  const page = pageFrom((await searchParams).page)
  const c = await getCategory(categorySlug)
  // noindex: a missing category still renders 200, which would otherwise be
  // indexed as a soft 404.
  if (!c) return { title: 'Category Not Found', robots: { index: false, follow: true } }

  const supabase = await createAdminClient()
  const { count } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('category_id', c.id)

  // An empty category is noindexed (nothing to rank; it only spends crawl
  // budget) and becomes indexable by itself the moment it has a post.
  const isEmpty = (count ?? 0) === 0
  const path = `/blogs/${c.slug}${page > 1 ? `?page=${page}` : ''}`
  const canonical = `${SITE_URL}${path}`
  const base = stripBrandSuffix(c.seo_title ?? `${c.name} — Mithila Jodi Journal`)
  const title = page > 1 ? `${base} — Page ${page}` : base
  const description = c.seo_description ?? CATEGORY_INTRO[c.slug] ?? `Articles about ${c.name} on the Mithila Jodi Journal.`

  return {
    title,
    description,
    alternates: { canonical },
    ...(isEmpty ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'website',
      siteName: 'Mithila Jodi',
      locale: 'en_IN',
      url: canonical,
      title: `${title} | Mithila Jodi`,
      description,
      images: [{ url: '/og-card.png', width: 1200, height: 630, alt: 'Mithila Jodi Journal' }],
    },
    twitter: { card: 'summary_large_image', title: `${title} | Mithila Jodi`, description, images: ['/og-card.png'] },
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const { category: categorySlug } = await params
  const page = pageFrom((await searchParams).page)
  const cat = await getCategory(categorySlug)
  if (!cat) notFound()

  const posts = (await getJournalPosts()).map(card)
  const categories = await getJournalCategories(posts)
  const inCategory = posts.filter(p => p.category?.slug === cat.slug)

  // Lead story: the editors' pick, else a featured or Start Here guide, else the newest.
  const pinned = FEATURED_GUIDE[cat.slug]
  const featured: JournalPost | undefined =
    (pinned && pick(inCategory, [pinned.slug])[0]) ||
    inCategory.find(p => p.featured) ||
    pick(inCategory, START_HERE)[0] ||
    inCategory[0]
  const rest = inCategory.filter(p => p.id !== featured?.id)
  const pages = Math.max(1, Math.ceil(rest.length / PER_PAGE))
  if (page > pages) redirect(`/blogs/${cat.slug}`)
  const shown = rest.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const first = page === 1

  const related = RELATED_READING[cat.slug]
  const relatedPosts = related ? pick(posts, related.slugs) : []
  const intro = CATEGORY_INTRO[cat.slug] ?? cat.description
  const isAstrology = cat.slug === 'horoscope-marriage'

  const crumbs: Crumb[] = [
    { name: 'Home', href: '/' },
    { name: 'Journal', href: '/blogs' },
    { name: cat.name, href: `/blogs/${cat.slug}` },
  ]
  const listed = first && featured ? [featured, ...shown] : shown
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    url: `${SITE_URL}/blogs/${cat.slug}`,
    name: `${cat.name} — Mithila Jodi Journal`,
    ...(intro ? { description: intro } : {}),
    inLanguage: 'en-IN',
    isPartOf: { '@id': `${SITE_URL}/blogs#collection` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: listed.length,
      itemListElement: listed.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}${p.href}`, name: p.title })),
    },
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-paper">
      <MithilaHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      {listed.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />}

      <main id="main-content" className="flex-1">
        <Breadcrumbs items={crumbs} />

        <section className="wrap pb-8 pt-10 text-center">
          <p className="eyebrow mb-3">
            <Link href="/blogs" className="hover:text-maroon">Mithila Jodi Journal</Link>
          </p>
          <h1 className="font-serif text-[32px] leading-tight text-maroon sm:text-[44px]">{cat.name}</h1>
          <div className="ornament-line mx-auto my-5 w-24" />
          {intro && <p className="mx-auto max-w-2xl text-[16px] leading-relaxed text-ink-soft">{intro}</p>}
        </section>

        <div className="pb-2">
          <CategoryNav categories={categories} current={cat.slug} />
        </div>

        {inCategory.length === 0 ? (
          <section className="wrap py-12"><EmptyState categories={categories} /></section>
        ) : (
          <>
            {first && featured && (
              <section aria-label={pinned?.label ?? 'Featured guide'} className="wrap pt-8">
                <FeaturedArticle post={featured} label={pinned?.label ?? 'Featured guide'} />
              </section>
            )}

            {first && isAstrology && <AstrologyToolsSection posts={posts} />}

            {shown.length > 0 && (
              <section aria-labelledby="cat-latest" className="wrap py-12">
                <SectionHeading id="cat-latest" eyebrow="Latest" title={`More in ${cat.name}`} />
                <ArticleGrid posts={shown} />
                <Pagination page={page} pages={pages} hrefFor={n => (n === 1 ? `/blogs/${cat.slug}` : `/blogs/${cat.slug}?page=${n}`)} />
              </section>
            )}

            {first && relatedPosts.length > 0 && (
              <section aria-labelledby="cat-related" className="wrap pb-12">
                <SectionHeading id="cat-related" eyebrow="Beyond the horoscope" title={related!.title} />
                <ArticleGrid posts={relatedPosts} />
              </section>
            )}

            {first && (
              <div className="wrap pb-4">
                <JournalCTA cta={ctaFor(cat.slug, '')} />
              </div>
            )}
          </>
        )}

        {first && <ContentPillars categories={categories.filter(c => c.slug !== cat.slug)} posts={posts} title="Keep exploring the Journal" />}
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
