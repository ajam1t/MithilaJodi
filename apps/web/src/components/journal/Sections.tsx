import Link from 'next/link'
import { ArticleRow } from '@/components/journal/ArticleCard'
import { ArticleCover } from '@/components/journal/ArticleCover'
import { FESTIVALS } from '@/lib/festivals'
import { ASTROLOGY_TOOLS, MARRIAGE_GUIDE, MITHILA_101, PILLARS } from '@/lib/journal'
import { pick, type JournalCategory, type JournalPost } from '@/lib/journalData'

export function SectionHeading({ id, eyebrow, title, intro, action }: {
  id: string
  eyebrow?: string
  title: string
  intro?: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 id={id} className="font-serif text-[26px] leading-tight text-maroon sm:text-[30px]">{title}</h2>
        {intro && <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{intro}</p>}
      </div>
      {action && (
        <Link href={action.href} className="text-[14px] font-semibold text-maroon underline-offset-4 hover:underline">
          {action.label} →
        </Link>
      )}
    </div>
  )
}

/** Five evergreen guides, numbered — the reading order for someone new. */
export function StartHere({ posts }: { posts: JournalPost[] }) {
  if (posts.length === 0) return null
  return (
    <section aria-labelledby="start-here" className="wrap py-12">
      <div className="grid gap-8 rounded-mj border border-gold/40 bg-cream p-6 sm:p-8 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="eyebrow mb-2">New to the Journal?</p>
          <h2 id="start-here" className="font-serif text-[26px] leading-tight text-maroon sm:text-[30px]">Start here</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            The essentials of a Mithila marriage, in the order families usually meet them: lineage first, then the
            wedding, the biodata and the horoscope.
          </p>
        </div>
        <ol className="divide-y divide-paper-3">
          {posts.map((p, i) => <li key={p.id}><ArticleRow post={p} index={i} /></li>)}
        </ol>
      </div>
    </section>
  )
}

export function ContentPillars({ categories, posts, title = 'The Journal’s pillars' }: { categories: JournalCategory[]; posts: JournalPost[]; title?: string }) {
  const count = (slug: string) => posts.filter(p => p.category?.slug === slug).length
  return (
    <section aria-labelledby="pillars" className="wrap py-12">
      <SectionHeading id="pillars" eyebrow="Explore by topic" title={title} />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(c => {
          const n = count(c.slug)
          return (
            <li key={c.slug}>
              <Link href={`/blogs/${c.slug}`} className="card mj-lift group flex h-full items-stretch overflow-hidden">
                <ArticleCover coverUrl={null} categorySlug={c.slug} title={c.name} ratio="aspect-square w-24 shrink-0 sm:w-28" />
                <span className="flex min-w-0 flex-col justify-center p-4">
                  <span className="font-serif text-[18px] leading-snug text-maroon group-hover:underline underline-offset-2">{c.name}</span>
                  {c.description && <span className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">{c.description}</span>}
                  <span className="mt-1.5 text-[12px] font-medium text-terra">{n} {n === 1 ? 'article' : 'articles'}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Mithila 101: the questions people actually search, answered in one place. */
export function Mithila101({ posts }: { posts: JournalPost[] }) {
  const items = MITHILA_101.map(item => {
    if (item.href) return { q: item.q, href: item.href, sub: 'Festival guides' }
    const p = pick(posts, [item.slug!])[0]
    return p ? { q: item.q, href: p.href, sub: `${p.minutes} min read` } : null
  }).filter((x): x is { q: string; href: string; sub: string } => !!x)
  if (items.length === 0) return null
  return (
    <section aria-labelledby="mithila-101" className="bg-paper-2/60 py-12">
      <div className="wrap">
        <SectionHeading
          id="mithila-101"
          eyebrow="Mithila 101"
          title="Understanding Mithila"
          intro="Short, clear answers to the questions families, and those marrying into Mithila, ask most often."
        />
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {items.map(it => (
            <li key={it.href}>
              <Link href={it.href} className="group flex h-full items-center justify-between gap-2 rounded-mj border border-paper-3 bg-cream px-3.5 py-3.5 transition-colors hover:border-gold sm:gap-3 sm:px-4 sm:py-4">
                <span>
                  <span className="block font-serif text-[15px] leading-snug text-maroon sm:text-[16px]">{it.q}</span>
                  <span className="mt-0.5 block text-[12px] text-ink-soft">{it.sub}</span>
                </span>
                <span className="text-maroon/60 transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** The marriage journey in stages, each stage linking to the guides for it. */
export function MarriageGuide({ posts }: { posts: JournalPost[] }) {
  const stages = MARRIAGE_GUIDE.map(s => ({ stage: s.stage, items: pick(posts, s.slugs) })).filter(s => s.items.length > 0)
  if (stages.length === 0) return null
  return (
    <section aria-labelledby="marriage-guide" className="wrap py-12">
      <SectionHeading
        id="marriage-guide"
        eyebrow="Mithila Marriage Guide"
        title="From the first conversation to the wedding"
        intro="Practical guides for each stage of the marriage journey, written for families as much as for the couple."
      />
      <ol className="relative grid gap-4 md:grid-cols-2">
        {stages.map((s, i) => (
          <li key={s.stage} className="rounded-mj border border-paper-3 bg-cream p-5">
            <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-terra">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-maroon text-[11px] tracking-normal text-cream">{i + 1}</span>
              {s.stage}
            </p>
            <ul className="mt-2 divide-y divide-paper-3">
              {s.items.map(p => (
                <li key={p.id}>
                  <Link href={p.href} className="group flex items-center justify-between gap-3 py-2.5">
                    <span className="font-serif text-[15px] leading-snug text-maroon group-hover:underline underline-offset-2">{p.title}</span>
                    <span className="shrink-0 text-[12px] text-ink-soft">{p.minutes} min</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}

/**
 * The eight real astrology tools, each with the guide that explains it where
 * one exists. Framed as tools families use for understanding — Mithila Jodi is
 * a matrimonial platform, not an astrology service.
 */
export function AstrologyToolsSection({ posts }: { posts: JournalPost[] }) {
  return (
    <section aria-labelledby="astro-tools" className="wrap py-12">
      <SectionHeading
        id="astro-tools"
        eyebrow="Free tools"
        title="Astrology tools"
        intro="Many families still look at the horoscope during the marriage conversation. These free tools explain the traditional method in plain language. They are for understanding, not a prediction or a guarantee."
        action={{ href: '/astrology', label: 'All astrology tools' }}
      />
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {ASTROLOGY_TOOLS.map(t => {
          const guide = pick(posts, t.articles)[0]
          return (
            <li key={t.slug} className="flex flex-col rounded-mj border border-paper-3 bg-cream p-3.5 sm:p-4">
              <Link href={t.href} className="group flex-1">
                <span className="block font-serif text-[16px] text-maroon group-hover:underline underline-offset-2 sm:text-[17px]">{t.title}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-ink-soft sm:text-[13px]">{t.subtitle}</span>
              </Link>
              {guide && (
                <Link href={guide.href} title={guide.title} className="mt-3 border-t border-paper-3 pt-2 text-[12px] font-medium text-terra hover:text-maroon">
                  <span className="sr-only">{guide.title}: </span>Read the guide →
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/**
 * Festivals whose season covers this month or next, from the festival guides
 * (lib/festivals). Seasons follow the lunar calendar, so only the season is
 * shown — never an exact date the data does not hold.
 */
export function MithilaCalendar({ now = new Date() }: { now?: Date }) {
  const month = Number(new Intl.DateTimeFormat('en-IN', { month: 'numeric', timeZone: 'Asia/Kolkata' }).format(now)) - 1
  const thisMonth = MONTHS[month]
  const nextMonth = MONTHS[(month + 1) % 12]
  const upcoming = FESTIVALS
    .map(f => ({ f, rank: f.season.includes(thisMonth) ? 0 : f.season.includes(nextMonth) ? 1 : 2 }))
    .filter(x => x.rank < 2)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 4)
    .map(x => x.f)
  if (upcoming.length === 0) return null
  return (
    <section aria-labelledby="mithila-calendar" className="wrap py-12">
      <SectionHeading
        id="mithila-calendar"
        eyebrow={`${thisMonth} – ${nextMonth}`}
        title="From the Mithila calendar"
        intro="The festivals Mithila families are preparing for this season."
        action={{ href: '/festivals', label: 'All festivals' }}
      />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {upcoming.map(f => (
          <li key={f.slug}>
            <Link href={`/festivals/${f.slug}`} className="card mj-lift group flex h-full flex-col p-5">
              <span className="font-deva text-[22px] leading-none text-gold" lang="hi">{f.nameDeva}</span>
              <span className="mt-2 font-serif text-[18px] text-maroon group-hover:underline underline-offset-2">{f.name}</span>
              <span className="mt-1 text-[12px] font-medium text-terra">{f.season}</span>
              <span className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">{f.tagline}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function EmptyState({ query, categories }: { query?: string; categories: JournalCategory[] }) {
  return (
    <div className="mx-auto max-w-lg rounded-mj border border-paper-3 bg-cream px-6 py-12 text-center">
      <p className="font-serif text-[24px] text-maroon">No stories found</p>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
        {query ? <>Nothing in the Journal matches “{query}”. Try a shorter or different word, such as gotra, biodata or wedding.</> : 'There are no stories here yet.'}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {query && <Link href="/blogs" className="btn-ghost btn-sm">Clear search</Link>}
        <Link href="/blogs#latest" className="btn-primary btn-sm">View all articles</Link>
      </div>
      {categories.length > 0 && (
        <div className="mt-6 border-t border-paper-3 pt-5">
          <p className="mb-3 text-[13px] text-ink-soft">Or explore a category</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {categories.map(c => (
              <li key={c.slug}>
                <Link href={`/blogs/${c.slug}`} className="chip">{PILLARS.find(p => p.slug === c.slug)?.label ?? c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
