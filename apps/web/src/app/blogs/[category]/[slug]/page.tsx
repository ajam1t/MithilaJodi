import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { createAdminClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const BASE = SITE_URL

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ category: string; slug: string }> }
): Promise<Metadata> {
  const { category: categorySlug, slug } = await params
  const supabase = await createAdminClient()

  const { data } = await supabase
    .from('blog_posts')
    .select(
      `title, slug, excerpt, seo_title, seo_description, keywords, cover_url,
       published_at, updated_at, author_name,
       blog_categories(slug)`
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  // noindex: a missing article still renders 200 (soft 404).
  if (!data) return { title: 'Article Not Found', robots: { index: false, follow: true } }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = data as any
  const catSlug = p.blog_categories?.slug ?? categorySlug
  const canonical = `${BASE}/blogs/${catSlug}/${p.slug}`
  const title = p.seo_title ?? p.title
  const description = p.seo_description ?? p.excerpt ?? ''
  const keywords = Array.isArray(p.keywords) ? p.keywords : []

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title,
      description,
      publishedTime: p.published_at ?? undefined,
      modifiedTime: p.updated_at ?? undefined,
      images: [p.cover_url ?? '/hero-couple.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [p.cover_url ?? '/hero-couple.jpg'],
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ArticlePage(
  { params }: { params: Promise<{ category: string; slug: string }> }
) {
  const { category: categorySlug, slug } = await params
  const supabase = await createAdminClient()

  // Fetch full post
  const { data: postData } = await supabase
    .from('blog_posts')
    .select(
      `id, title, slug, excerpt, content, cover_url, author_name,
       seo_title, seo_description, keywords, featured,
       published_at, created_at, updated_at, category_id,
       blog_categories(id, name, slug)`
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!postData) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const post = postData as any
  const cat = post.blog_categories

  // Verify route matches (redirect safety — if slug category differs, still render)
  const resolvedCatSlug = cat?.slug ?? categorySlug

  // Fetch related posts
  const { data: relatedData } = await supabase
    .from('blog_posts')
    .select(
      `id, title, slug, excerpt, author_name, published_at, cover_url,
       blog_categories(id, name, slug)`
    )
    .eq('status', 'published')
    .eq('category_id', post.category_id)
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(4)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const related: any[] = relatedData ?? []

  const canonical = `${BASE}/blogs/${resolvedCatSlug}/${post.slug}`
  const keywords = Array.isArray(post.keywords) ? post.keywords : []

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seo_description ?? post.excerpt ?? '',
    author: {
      '@type': 'Organization',
      name: post.author_name ?? 'Mithila Jodi Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Mithila Jodi',
      url: BASE,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE}/logo.png`,
      },
    },
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at ?? post.published_at ?? post.created_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    inLanguage: 'en',
    ...(cat && { articleSection: cat.name }),
    ...(keywords.length > 0 && { keywords: keywords.join(', ') }),
    image: post.cover_url ?? `${BASE}/hero-couple.jpg`,
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE}/blogs` },
      ...(cat ? [{ '@type': 'ListItem', position: 3, name: cat.name, item: `${BASE}/blogs/${cat.slug}` }] : []),
      { '@type': 'ListItem', position: cat ? 4 : 3, name: post.title, item: canonical },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="flex-1 pb-16 lg:pb-0">
        {/* ── Breadcrumb ─────────────────────────────────────── */}
        <nav className="wrap pt-6" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-soft">
            <li><Link href="/" className="hover:text-maroon transition-colors">Home</Link></li>
            <li className="select-none opacity-50">/</li>
            <li><Link href="/blogs" className="hover:text-maroon transition-colors">Blog</Link></li>
            {cat && (
              <>
                <li className="select-none opacity-50">/</li>
                <li>
                  <Link href={`/blogs/${cat.slug}`} className="hover:text-maroon transition-colors">
                    {cat.name}
                  </Link>
                </li>
              </>
            )}
            <li className="select-none opacity-50">/</li>
            <li className="text-maroon font-medium line-clamp-1">{post.title}</li>
          </ol>
        </nav>

        {/* ── Article ────────────────────────────────────────── */}
        <article className="wrap pt-8 pb-12 max-w-3xl">
          {/* Category badge */}
          {cat && (
            <Link
              href={`/blogs/${cat.slug}`}
              className="inline-block mb-4 text-[11px] tracking-[0.3em] uppercase text-terra font-semibold
                         hover:text-maroon transition-colors"
            >
              {cat.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="font-serif text-maroon text-[28px] sm:text-[36px] leading-tight mb-4">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-soft mb-6">
            <span>{post.author_name ?? 'Mithila Jodi Team'}</span>
            {post.published_at && (
              <>
                <span className="opacity-40">·</span>
                <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
              </>
            )}
            {post.updated_at && post.updated_at !== post.published_at && (
              <>
                <span className="opacity-40">·</span>
                <span>Updated {formatDate(post.updated_at)}</span>
              </>
            )}
          </div>

          <div className="ornament-line w-20 mb-8" />

          {/* Cover image */}
          {post.cover_url && (
            <div className="mb-8 rounded-mj overflow-hidden aspect-[16/9] bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Markdown content */}
          <div className="prose-mj">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content ?? ''}
            </ReactMarkdown>
          </div>
        </article>

        {/* ── Related articles ───────────────────────────────── */}
        {related.length > 0 && (
          <section className="wrap pb-12 max-w-3xl">
            <div className="border-t border-paper-3 pt-10">
              <h2 className="font-serif text-maroon text-[22px] mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map((r) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const rCat = (r as any).blog_categories
                  const rHref = rCat ? `/blogs/${rCat.slug}/${r.slug}` : `/blogs`
                  return (
                    <Link
                      key={r.id}
                      href={rHref}
                      className="card p-4 flex flex-col gap-1 hover:-translate-y-0.5 transition-transform"
                    >
                      <h3 className="font-serif text-maroon text-[16px] leading-snug">
                        {r.title}
                      </h3>
                      {r.excerpt && (
                        <p className="text-ink-soft text-[13px] line-clamp-2 leading-relaxed">
                          {r.excerpt}
                        </p>
                      )}
                      {r.published_at && (
                        <p className="text-[12px] text-ink-soft mt-1">{formatDate(r.published_at)}</p>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="wrap pb-16 max-w-3xl">
          <div className="card p-8 text-center">
            <p className="eyebrow mb-3">Ready to begin?</p>
            <h2 className="font-serif text-maroon text-[24px] mb-2">Find Your Match on Mithila Jodi</h2>
            <div className="ornament-line w-16 mx-auto my-4" />
            <p className="text-ink-soft text-[15px] leading-relaxed mb-6 max-w-md mx-auto">
              Explore Mithila profiles, create your marriage biodata, and connect with families
              rooted in Maithili heritage.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/explore" className="btn-ghost">Explore Mithila Profiles</Link>
              <Link href="/biodata" className="btn-ghost">Create Your Biodata</Link>
              <Link href="/register" className="btn-primary">Find Your Match</Link>
            </div>
          </div>
        </section>
      </main>

      <MithilaFooter />
      <MobileBottomNav />
    </div>
  )
}
