import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { ReadingProgress } from '@/components/motion/ReadingProgress'
import { ArticleCover } from '@/components/journal/ArticleCover'
import {
  ArticleHeader, ArticleTOCDesktop, ArticleTOCMobile, ArticleToolLinks, JournalCTA, RelatedArticles,
} from '@/components/journal/ArticleParts'
import { ArticleShare } from '@/components/journal/ArticleShare'
import { Breadcrumbs, breadcrumbJsonLd, type Crumb } from '@/components/journal/Navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { SITE_URL, stripBrandSuffix } from '@/lib/constants'
import { ctaFor, extractHeadings, headingId, toolsForArticle, wasUpdated } from '@/lib/journal'
import { card, getJournalPosts, relatedPosts } from '@/lib/journalData'
import { organizationJsonLd, organizationRef } from '@/lib/seo'

export const dynamic = 'force-dynamic'

const OG_IMAGE = { url: '/og-card.png', width: 1200, height: 630, alt: 'Mithila Jodi Journal' }

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ category: string; slug: string }> },
): Promise<Metadata> {
  const { category: categorySlug, slug } = await params
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('title, slug, excerpt, seo_title, seo_description, keywords, cover_url, published_at, updated_at, author_name, blog_categories(name, slug)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  // noindex: a missing article still renders 200 (soft 404).
  if (!data) return { title: 'Article Not Found', robots: { index: false, follow: true } }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = data as any
  const catSlug = p.blog_categories?.slug ?? categorySlug
  const canonical = `${SITE_URL}/blogs/${catSlug}/${p.slug}`
  // The root layout's template appends " | Mithila Jodi".
  const title = stripBrandSuffix(p.seo_title ?? p.title)
  const description = p.seo_description ?? p.excerpt ?? ''
  const keywords: string[] = Array.isArray(p.keywords) ? p.keywords : []
  const image = p.cover_url ? { url: p.cover_url, alt: p.title } : OG_IMAGE
  const modified = wasUpdated(p.published_at, p.updated_at) ? p.updated_at : p.published_at

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    authors: [{ name: p.author_name || 'Mithila Jodi Team' }],
    openGraph: {
      type: 'article',
      siteName: 'Mithila Jodi',
      locale: 'en_IN',
      url: canonical,
      title: `${title} | Mithila Jodi`,
      description,
      publishedTime: p.published_at ?? undefined,
      modifiedTime: modified ?? undefined,
      section: p.blog_categories?.name,
      tags: keywords,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: `${title} | Mithila Jodi`, description, images: [image.url] },
  }
}

// ── Markdown headings with stable anchors (for the contents list) ────────────

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (typeof node === 'object' && 'props' in node) return textOf((node as { props: { children?: ReactNode } }).props.children)
  return ''
}

const markdownComponents = {
  h2: ({ children }: { children?: ReactNode }) => <h2 id={headingId(textOf(children))} className="scroll-mt-28">{children}</h2>,
  h3: ({ children }: { children?: ReactNode }) => <h3 id={headingId(textOf(children))} className="scroll-mt-28">{children}</h3>,
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlePage(
  { params }: { params: Promise<{ category: string; slug: string }> },
) {
  const { category: categorySlug, slug } = await params
  const all = await getJournalPosts()
  const full = all.find(p => p.slug === slug)
  if (!full) notFound()

  // One URL per article: a stale or mistyped category segment moves permanently
  // to the real one instead of serving a duplicate.
  if (full.category && full.category.slug !== categorySlug) permanentRedirect(full.href)

  const post = card(full)
  const posts = all.map(card)
  const cat = post.category
  const canonical = `${SITE_URL}${post.href}`
  const headings = extractHeadings(full.text)
  const related = relatedPosts(posts, post, 3)
  const tools = toolsForArticle(post.slug)
  // The tool block already ends in the astrology call; one invitation is enough.
  const cta = tools.length > 0 ? null : ctaFor(cat?.slug, post.slug)
  const updated = wasUpdated(post.publishedAt, post.updatedAt)

  const crumbs: Crumb[] = [
    { name: 'Home', href: '/' },
    { name: 'Journal', href: '/blogs' },
    ...(cat ? [{ name: cat.name, href: `/blogs/${cat.slug}` }] : []),
    { name: post.title, href: post.href },
  ]

  const isBrand = /^Mithila Jodi/i.test(post.author)
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${canonical}#article`,
    headline: post.title.slice(0, 110),
    description: post.excerpt ?? '',
    // A brand byline references the canonical organisation rather than
    // creating a second, thinly described "Mithila Jodi" entity.
    author: isBrand ? organizationRef() : { '@type': 'Person', name: post.author },
    publisher: organizationJsonLd(),
    datePublished: post.publishedAt,
    // Only a genuine revision moves dateModified; otherwise it is the publish date.
    dateModified: updated ? post.updatedAt : post.publishedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    isPartOf: { '@type': 'Blog', '@id': `${SITE_URL}/blogs#blog`, name: 'Mithila Jodi Journal', url: `${SITE_URL}/blogs` },
    inLanguage: 'en-IN',
    image: post.coverUrl ?? `${SITE_URL}/og-card.png`,
    wordCount: full.text.trim().split(/\s+/).length,
    timeRequired: `PT${post.minutes}M`,
    ...(cat && { articleSection: cat.name }),
    ...(post.keywords.length > 0 && { keywords: post.keywords }),
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-paper">
      <ReadingProgress />
      <MithilaHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />

      <main id="main-content" className="flex-1">
        <Breadcrumbs items={crumbs} />

        <article className="wrap pb-12 pt-8">
          <ArticleHeader post={post} />

          <div className="mt-8 max-w-3xl overflow-hidden rounded-mj">
            <ArticleCover coverUrl={post.coverUrl} categorySlug={cat?.slug} title={post.title} ratio="aspect-[5/2] sm:aspect-[3/1]" eager />
          </div>

          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,48rem)_15rem] lg:justify-between">
            <div className="min-w-0">
              <ArticleTOCMobile headings={headings} />

              <div className="prose-mj">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {full.text}
                </ReactMarkdown>
              </div>

              <div className="mt-10 border-t border-paper-3 pt-6">
                <ArticleShare url={canonical} title={post.title} />
              </div>

              <ArticleToolLinks tools={tools} />
              <JournalCTA cta={cta} />

              {cat && (
                <p className="mt-8 text-[14px]">
                  <Link href={`/blogs/${cat.slug}`} className="font-semibold text-maroon underline-offset-4 hover:underline">
                    More in {cat.name} →
                  </Link>
                </p>
              )}
            </div>

            <aside className="hidden lg:block">
              <ArticleTOCDesktop headings={headings} />
            </aside>
          </div>
        </article>

        <RelatedArticles posts={related} />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
