import Link from 'next/link'
import { ArticleCard } from '@/components/journal/ArticleCard'
import { formatDate, wasUpdated, type Heading, type JournalCta, type JournalTool } from '@/lib/journal'
import type { JournalPost } from '@/lib/journalData'

export function ArticleHeader({ post }: { post: JournalPost }) {
  const updated = wasUpdated(post.publishedAt, post.updatedAt)
  return (
    <header className="max-w-3xl">
      {post.category && (
        <Link href={`/blogs/${post.category.slug}`} className="eyebrow inline-block transition-colors hover:text-maroon">
          {post.category.name}
        </Link>
      )}
      <h1 className="mt-3 font-serif text-[30px] leading-[1.15] text-maroon sm:text-[40px]">{post.title}</h1>
      {post.excerpt && <p className="mt-4 text-[16px] leading-relaxed text-ink-soft sm:text-[18px]">{post.excerpt}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-soft">
        <span className="font-medium text-ink">By {post.author}</span>
        {post.publishedAt && (
          <>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>Published <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></span>
          </>
        )}
        {updated && post.updatedAt && (
          <>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time></span>
          </>
        )}
        <span aria-hidden="true" className="opacity-40">·</span>
        <span>{post.minutes} min read</span>
      </div>
    </header>
  )
}

function TocList({ headings }: { headings: Heading[] }) {
  return (
    <ol className="space-y-1 text-[14px]">
      {headings.map(h => (
        <li key={h.id} className={h.depth === 3 ? 'pl-4' : ''}>
          <a href={`#${h.id}`} className="block rounded-mj-sm px-2 py-1.5 leading-snug text-ink-soft transition-colors hover:bg-paper hover:text-maroon">
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  )
}

/** Collapsible "On this page" — shown above the article on phones and tablets. */
export function ArticleTOCMobile({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null
  return (
    <details className="group mb-8 rounded-mj border border-paper-3 bg-cream lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[14px] font-semibold text-maroon [&::-webkit-details-marker]:hidden">
        On this page
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-180" aria-hidden="true">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="border-t border-paper-3 px-2 py-2"><TocList headings={headings} /></div>
    </details>
  )
}

/** Sticky contents column on desktop. */
export function ArticleTOCDesktop({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null
  return (
    <nav aria-label="On this page" className="sticky top-28 hidden max-h-[calc(100vh-8rem)] overflow-y-auto lg:block">
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-terra">On this page</p>
      <TocList headings={headings} />
    </nav>
  )
}

/**
 * "Read it, then try it" — only for articles that explain a real tool. It
 * carries the Explore Astrology Tools call, so the page shows no second CTA.
 */
export function ArticleToolLinks({ tools }: { tools: JournalTool[] }) {
  if (tools.length === 0) return null
  return (
    <aside className="mt-10 rounded-mj border border-paper-3 bg-paper/60 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-terra">Try the free tool</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {tools.map(t => (
          <li key={t.slug}>
            <Link href={t.href} className="group flex items-center justify-between gap-3 rounded-mj-sm border border-paper-3 bg-cream px-4 py-3 transition-colors hover:border-gold">
              <span>
                <span className="block font-serif text-[16px] text-maroon">{t.title}</span>
                <span className="block text-[12px] text-ink-soft">{t.subtitle}</span>
              </span>
              <span className="text-maroon transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-[12px] leading-relaxed text-ink-soft">
          For understanding and family conversation — not a prediction or a guarantee about any marriage.
        </p>
        <Link href="/astrology" className="btn-primary btn-sm">Explore Astrology Tools →</Link>
      </div>
    </aside>
  )
}

export function JournalCTA({ cta }: { cta: JournalCta }) {
  if (!cta) return null
  return (
    <aside className="mt-10 flex flex-col gap-4 rounded-mj border border-gold/50 bg-cream p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="eyebrow">{cta.eyebrow}</p>
        <p className="mt-1 font-serif text-[20px] leading-snug text-maroon">{cta.title}</p>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{cta.text}</p>
      </div>
      <Link href={cta.href} className="btn-primary btn-sm shrink-0 self-start sm:self-center">{cta.label}</Link>
    </aside>
  )
}

export function RelatedArticles({ posts, title = 'Read next' }: { posts: JournalPost[]; title?: string }) {
  if (posts.length === 0) return null
  return (
    <section aria-labelledby="related-heading" className="wrap pb-14">
      <div className="border-t border-paper-3 pt-10">
        <h2 id="related-heading" className="mb-6 font-serif text-[24px] text-maroon">{title}</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(p => <ArticleCard key={p.id} post={p} />)}
        </div>
      </div>
    </section>
  )
}
