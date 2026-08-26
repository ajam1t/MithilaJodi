import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
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
  { params }: { params: Promise<{ category: string }> }
): Promise<Metadata> {
  const { category: categorySlug } = await params
  const supabase = await createAdminClient()

  const { data: cat } = await supabase
    .from('blog_categories')
    .select('name, slug, seo_title, seo_description')
    .eq('slug', categorySlug)
    .eq('is_active', true)
    .single()

  if (!cat) {
    return { title: 'Category Not Found' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = cat as any
  const canonical = `${BASE}/blogs/${c.slug}`
  const title = c.seo_title ?? `${c.name} — Mithila Jodi Blog`
  const description = c.seo_description ?? `Articles about ${c.name} on the Mithila Jodi Journal.`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      images: ['/hero-couple.jpg'],
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  const { category: categorySlug } = await params
  const supabase = await createAdminClient()

  // Fetch category
  const { data: catData } = await supabase
    .from('blog_categories')
    .select('id, name, slug, description, seo_title')
    .eq('slug', categorySlug)
    .eq('is_active', true)
    .single()

  if (!catData) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cat = catData as any

  // Fetch published posts in this category
  const { data: postsData } = await supabase
    .from('blog_posts')
    .select(
      `id, title, slug, excerpt, author_name, published_at, featured, cover_url,
       blog_categories(id, name, slug)`
    )
    .eq('status', 'published')
    .eq('category_id', cat.id)
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts: any[] = postsData ?? []

  // All active categories for the chip nav
  const { data: catsData } = await supabase
    .from('blog_categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: any[] = catsData ?? []

  const canonical = `${BASE}/blogs/${cat.slug}`

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE}/blogs` },
      { '@type': 'ListItem', position: 3, name: cat.name, item: canonical },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="flex-1 pb-16 lg:pb-0">
        {/* ── Breadcrumb ────────────────────────────────────── */}
        <nav className="wrap pt-6 pb-0" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-soft">
            <li><Link href="/" className="hover:text-maroon transition-colors">Home</Link></li>
            <li className="select-none opacity-50">/</li>
            <li><Link href="/blogs" className="hover:text-maroon transition-colors">Blog</Link></li>
            <li className="select-none opacity-50">/</li>
            <li className="text-maroon font-medium">{cat.name}</li>
          </ol>
        </nav>

        {/* ── Category header ────────────────────────────────── */}
        <section className="wrap pt-10 pb-8 text-center">
          <p className="eyebrow mb-3">Mithila Jodi Journal</p>
          <h1 className="section-heading">{cat.name}</h1>
          <div className="ornament-line w-24 mx-auto my-5" />
          {cat.description && (
            <p className="text-ink-soft text-[15px] sm:text-[16px] leading-relaxed max-w-xl mx-auto">
              {cat.description}
            </p>
          )}
        </section>

        {/* ── Category filter chips ──────────────────────────── */}
        {categories.length > 0 && (
          <section className="wrap pb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              <Link href="/blogs" className="chip">All</Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/blogs/${c.slug}`}
                  className={c.slug === cat.slug ? 'chip chip-on' : 'chip'}
                  aria-current={c.slug === cat.slug ? 'page' : undefined}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Article grid ───────────────────────────────────── */}
        <section className="wrap pb-16">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-ink-soft text-[16px]">No articles in this category yet. Check back soon.</p>
              <div className="mt-6 flex justify-center gap-4">
                <Link href="/blogs" className="btn-ghost">← All Articles</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const catInfo = post.blog_categories
                const href = catInfo ? `/blogs/${catInfo.slug}/${post.slug}` : `/blogs`
                return (
                  <article key={post.id} className="card card-hover flex flex-col overflow-hidden">
                    {post.cover_url && (
                      <div className="aspect-[16/9] overflow-hidden bg-paper-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.cover_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="font-serif text-maroon text-[18px] sm:text-[19px] leading-snug mb-2">
                        <Link href={href} className="hover:underline underline-offset-2">
                          {post.title}
                        </Link>
                      </h2>
                      {post.excerpt && (
                        <p className="text-ink-soft text-[14px] leading-relaxed mb-4 line-clamp-3 flex-1">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-paper-3">
                        <span className="text-[12px] text-ink-soft">
                          {post.author_name ?? 'Mithila Jodi Team'}
                          {post.published_at && (
                            <> &middot; {formatDate(post.published_at)}</>
                          )}
                        </span>
                        <Link
                          href={href}
                          className="text-[13px] font-semibold text-maroon hover:text-terra transition-colors"
                        >
                          Read article →
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <MithilaFooter />
      <MobileBottomNav />
    </div>
  )
}
