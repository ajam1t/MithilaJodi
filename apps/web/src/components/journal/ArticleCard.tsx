import Link from 'next/link'
import { ArticleCover } from '@/components/journal/ArticleCover'
import { formatDate } from '@/lib/journal'
import type { JournalPost } from '@/lib/journalData'

/** "4 min read · 22 September 2026" */
export function ArticleMeta({ post, className = '' }: { post: JournalPost; className?: string }) {
  return (
    <p className={`text-[12px] text-ink-soft ${className}`}>
      {post.minutes} min read
      {post.publishedAt && (
        <>
          <span aria-hidden="true"> · </span>
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        </>
      )}
    </p>
  )
}

/**
 * The standard card. The whole card is one link (a single tab stop); the
 * category is plain text inside it rather than a second, nested link.
 */
export function ArticleCard({ post, headingLevel = 3 }: { post: JournalPost; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <article className="card mj-lift group relative flex overflow-hidden sm:flex-col">
      {/* Phones: a compact row with a square thumbnail. sm and up: cover on top. */}
      <ArticleCover
        coverUrl={post.coverUrl}
        categorySlug={post.category?.slug}
        title={post.title}
        ratio="aspect-square w-24 shrink-0 self-start sm:aspect-[16/9] sm:w-auto sm:self-auto"
        className="m-3 rounded-mj-sm sm:m-0 sm:rounded-none"
      />
      <div className="flex min-w-0 flex-1 flex-col py-3 pr-4 sm:p-5">
        {post.category && <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-terra sm:mb-2 sm:text-[11px] sm:tracking-[0.24em]">{post.category.name}</p>}
        <H className="mb-1.5 font-serif text-[16px] leading-snug text-maroon sm:mb-2 sm:text-[19px]">
          <Link href={post.href} className="after:absolute after:inset-0 after:content-[''] group-hover:underline underline-offset-2 focus-visible:outline-none">
            {post.title}
          </Link>
        </H>
        {post.excerpt && <p className="mb-4 line-clamp-3 hidden flex-1 text-[14px] leading-relaxed text-ink-soft sm:block">{post.excerpt}</p>}
        <ArticleMeta post={post} className="mt-auto sm:border-t sm:border-paper-3 sm:pt-3" />
      </div>
    </article>
  )
}

export function ArticleGrid({ posts, headingLevel = 3 }: { posts: JournalPost[]; headingLevel?: 2 | 3 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map(p => <ArticleCard key={p.id} post={p} headingLevel={headingLevel} />)}
    </div>
  )
}

/** A text-only row for hub lists (Start Here, Marriage Guide, related). */
export function ArticleRow({ post, index }: { post: JournalPost; index?: number }) {
  return (
    <Link href={post.href} className="group flex items-start gap-3 rounded-mj-sm px-1 py-3 transition-colors hover:bg-paper">
      {index !== undefined && (
        <span className="mt-0.5 font-serif text-[20px] leading-none text-gold tabular-nums" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[16px] leading-snug text-maroon group-hover:underline underline-offset-2">{post.title}</span>
        <span className="mt-0.5 block text-[12px] text-ink-soft">
          {post.category?.name}
          {post.category && ' · '}
          {post.minutes} min read
        </span>
      </span>
      <span className="mt-1 text-maroon/60 transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
    </Link>
  )
}

export function FeaturedArticle({ post, label = 'Featured' }: { post: JournalPost; label?: string }) {
  return (
    <article className="card mj-lift group relative grid overflow-hidden md:grid-cols-[1.1fr_1fr]">
      <div className="relative">
        <ArticleCover coverUrl={post.coverUrl} categorySlug={post.category?.slug} title={post.title} ratio="aspect-[16/9] md:aspect-auto md:h-full md:min-h-[300px]" eager />
        <span className="badge badge-gold absolute left-3 top-3">{label}</span>
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8">
        {post.category && <p className="eyebrow mb-2">{post.category.name}</p>}
        <h2 className="mb-3 font-serif text-[24px] leading-tight text-maroon sm:text-[30px]">
          <Link href={post.href} className="after:absolute after:inset-0 after:content-[''] group-hover:underline underline-offset-2 focus-visible:outline-none">
            {post.title}
          </Link>
        </h2>
        {post.excerpt && <p className="mb-5 line-clamp-3 text-[15px] leading-relaxed text-ink-soft">{post.excerpt}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="btn-primary btn-sm" aria-hidden="true">Read the guide →</span>
          <ArticleMeta post={post} />
        </div>
      </div>
    </article>
  )
}
