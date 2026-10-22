import Link from 'next/link'
import { SITE_URL } from '@/lib/constants'
import { PILLARS } from '@/lib/journal'
import type { JournalCategory } from '@/lib/journalData'

export type Crumb = { name: string; href: string }

/** Home → Journal → … The last crumb is the current page and is not a link. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="wrap pt-5">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-ink-soft">
        {items.map((c, i) => {
          const last = i === items.length - 1
          return (
            <li key={c.href} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <span className="select-none opacity-50" aria-hidden="true">/</span>}
              {last ? (
                <span aria-current="page" className="line-clamp-1 font-medium text-maroon">{c.name}</span>
              ) : (
                <Link href={c.href} className="transition-colors hover:text-maroon">{c.name}</Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function breadcrumbJsonLd(items: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.href === '/' ? SITE_URL : `${SITE_URL}${c.href}`,
    })),
  }
}

/**
 * Pillar navigation. A swipeable chip rail on phones (no wrapping into four
 * rows), wrapped and centred from `sm` up.
 */
export function CategoryNav({ categories, current }: { categories: JournalCategory[]; current?: string }) {
  const label = (c: JournalCategory) => PILLARS.find(p => p.slug === c.slug)?.label ?? c.name
  return (
    <nav aria-label="Journal categories" className="wrap">
      <ul className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
        <li className="shrink-0">
          <Link href="/blogs" className={current ? 'chip' : 'chip chip-on'} aria-current={current ? undefined : 'page'}>
            All stories
          </Link>
        </li>
        {categories.map(c => (
          <li key={c.slug} className="shrink-0">
            <Link
              href={`/blogs/${c.slug}`}
              className={c.slug === current ? 'chip chip-on' : 'chip'}
              aria-current={c.slug === current ? 'page' : undefined}
            >
              {label(c)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * A plain GET form: works without JavaScript, the result is a shareable URL,
 * and the results page is noindexed so search URLs never reach the index.
 */
export function JournalSearch({ defaultValue = '' }: { defaultValue?: string }) {
  return (
    <form action="/blogs" method="get" role="search" className="mx-auto w-full max-w-xl">
      <label htmlFor="journal-q" className="sr-only">Search the Journal</label>
      <div className="flex items-center gap-2 rounded-pill border border-gold/50 bg-cream p-1.5 pl-4 shadow-mj-xs focus-within:border-maroon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-soft" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          id="journal-q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="Search the Journal"
          maxLength={80}
          autoComplete="off"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-ink placeholder:text-ink-soft/80 focus:outline-none"
        />
        <button type="submit" className="btn-primary btn-sm shrink-0">Search</button>
      </div>
    </form>
  )
}

/** Numbered pages as real links (crawlable), with Previous/Next. */
export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (n: number) => string }) {
  if (pages <= 1) return null
  return (
    <nav aria-label="More stories" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && <Link href={hrefFor(page - 1)} className="btn-ghost btn-sm" rel="prev">← Newer</Link>}
      {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
        <Link
          key={n}
          href={hrefFor(n)}
          aria-current={n === page ? 'page' : undefined}
          aria-label={`Page ${n}`}
          className={`grid h-9 w-9 place-items-center rounded-full text-[14px] tabular-nums transition-colors ${
            n === page ? 'bg-maroon text-cream' : 'border border-paper-3 bg-cream text-maroon hover:border-gold'
          }`}
        >
          {n}
        </Link>
      ))}
      {page < pages && <Link href={hrefFor(page + 1)} className="btn-ghost btn-sm" rel="next">Older →</Link>}
    </nav>
  )
}
