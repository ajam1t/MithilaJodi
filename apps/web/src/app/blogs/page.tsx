import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { createAdminClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog — Mithila & Maithili Marriage Guides',
  description:
    'Thoughtful articles on Maithili marriage traditions, Mithila culture, Madhubani heritage, and practical guidance for creating a marriage biodata. Explore the Mithila Jodi Journal.',
  alternates: { canonical: `${SITE_URL}/blogs` },
  openGraph: {
    type: 'website',
    images: ['/og-card.png'],
    url: `${SITE_URL}/blogs`,
    title: 'Blog — Mithila & Maithili Marriage Guides',
    description:
      'Thoughtful articles on Maithili marriage traditions, Mithila culture, and practical guidance for creating a marriage biodata.',
  },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blogs` },
  ],
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogIndexPage() {
  const supabase = await createAdminClient()

  // Fetch published posts — featured first, then by date
  const { data: postsData } = await supabase
    .from('blog_posts')
    .select(
      `id, title, slug, excerpt, author_name, published_at, featured, cover_url,
       blog_categories(id, name, slug)`
    )
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(20)

  // Fetch active categories
  const { data: catsData } = await supabase
    .from('blog_categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts: any[] = postsData ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: any[] = catsData ?? []

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main id="main-content" className="flex-1">
        {/* ── Hero header ──────────────────────────────────────── */}
        <section className="wrap pt-14 pb-8 text-center">
          <p className="eyebrow mb-3">Mithila Jodi Journal</p>
          <h1 className="section-heading">Blog</h1>
          <div className="ornament-line w-24 mx-auto my-5" />
          <p className="text-ink-soft text-[15px] sm:text-[16px] leading-relaxed max-w-xl mx-auto">
            Stories, traditions, and guidance on Maithili marriage, Mithila culture, and creating
            a marriage biodata that honours your heritage.
          </p>
        </section>

        {/* ── Category filter chips ─────────────────────────────── */}
        {categories.length > 0 && (
          <section className="wrap pb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              <Link href="/blogs" className="chip chip-on">
                All
              </Link>
              {categories.map((cat) => (
                <Link key={cat.slug} href={`/blogs/${cat.slug}`} className="chip">
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Article grid ──────────────────────────────────────── */}
        <section className="wrap pb-16">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-ink-soft text-[16px]">Articles are being prepared. Check back soon.</p>
              <div className="mt-6 flex justify-center gap-4">
                <Link href="/" className="btn-ghost">← Back to Home</Link>
                <Link href="/register" className="btn-primary">Create Your Profile Free</Link>
              </div>
            </div>
          ) : (
            <>
              {posts[0]?.featured && <FeaturedArticle post={posts[0]} />}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(posts[0]?.featured ? posts.slice(1) : posts).map((post) => (
                  <ArticleCard key={post.id} post={post} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FeaturedArticle({ post }: { post: any }) {
  const category = post.blog_categories
  const href = category ? `/blogs/${category.slug}/${post.slug}` : `/blogs`

  return (
    <article className="card card-hover overflow-hidden mb-8 grid md:grid-cols-2">
      <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[280px] bg-paper-2">
        {post.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-deva text-6xl text-gold/40" aria-hidden="true">✦</span>
          </div>
        )}
        <span className="badge badge-gold absolute top-3 left-3">Featured</span>
      </div>
      <div className="p-6 sm:p-8 flex flex-col justify-center">
        {category && (
          <Link href={`/blogs/${category.slug}`} className="eyebrow mb-2 hover:text-maroon transition-colors">
            {category.name}
          </Link>
        )}
        <h2 className="font-serif text-maroon text-[24px] sm:text-[28px] leading-tight mb-3">
          <Link href={href} className="hover:underline underline-offset-2">
            {post.title}
          </Link>
        </h2>
        {post.excerpt && (
          <p className="text-ink-soft text-[15px] leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-3 mt-auto">
          <Link href={href} className="btn-primary btn-sm">Read article →</Link>
          <span className="text-[12px] text-ink-soft">
            {post.author_name ?? 'Mithila Jodi Team'}
            {post.published_at && <> &middot; {formatDate(post.published_at)}</>}
          </span>
        </div>
      </div>
    </article>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ArticleCard({ post }: { post: any }) {
  const category = post.blog_categories
  const href = category ? `/blogs/${category.slug}/${post.slug}` : `/blogs`

  return (
    <article className="card card-hover flex flex-col overflow-hidden">
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
        {category && (
          <Link
            href={`/blogs/${category.slug}`}
            className="inline-block mb-2 text-[11px] tracking-[0.3em] uppercase text-terra font-semibold
                       hover:text-maroon transition-colors"
          >
            {category.name}
          </Link>
        )}
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
}
