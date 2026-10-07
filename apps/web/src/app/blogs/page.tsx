import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { ArticleGrid, FeaturedArticle } from '@/components/journal/ArticleCard'
import { Breadcrumbs, CategoryNav, JournalSearch, Pagination, breadcrumbJsonLd, type Crumb } from '@/components/journal/Navigation'
import {
  ContentPillars, EmptyState, MarriageGuide, Mithila101, MithilaCalendar, SectionHeading, StartHere,
} from '@/components/journal/Sections'
import { SITE_URL } from '@/lib/constants'
import { START_HERE, pillarRank } from '@/lib/journal'
import { card, getJournalCategories, getJournalPosts, pick, searchPosts } from '@/lib/journalData'
import { pageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

const TITLE = 'Mithila Jodi Blog | Mithila Marriage, Culture & Maithili Guide'
const DESCRIPTION =
  'Explore Mithila marriage traditions, Maithili culture, Gotra, Mool, family lineage, wedding customs, horoscope, biodata and practical matrimonial guides.'
const PER_PAGE = 9
const CRUMBS: Crumb[] = [{ name: 'Home', href: '/' }, { name: 'Journal', href: '/blogs' }]

type Search = { q?: string | string[]; page?: string | string[] }

function readParams(sp: Search) {
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 80) ?? ''
  const raw = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page)
  const page = Number.isInteger(raw) && raw > 1 ? raw : 1
  return { q, page }
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const { q, page } = readParams(await searchParams)
  const base = pageMetadata({ path: '/blogs', title: TITLE, description: DESCRIPTION, socialTitle: TITLE })
  // Search results are thin, endless and user-generated: never indexed.
  if (q) return { ...base, title: { absolute: `Search: ${q} | Mithila Jodi Journal` }, robots: { index: false, follow: true } }
  if (page > 1) {
    return {
      ...base,
      title: { absolute: `Mithila Jodi Journal — Page ${page} | Mithila Jodi` },
      alternates: { canonical: `${SITE_URL}/blogs?page=${page}` },
      openGraph: { ...base.openGraph, url: `${SITE_URL}/blogs?page=${page}` },
    }
  }
  return { ...base, title: { absolute: TITLE } }
}

export default async function JournalPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { q, page } = readParams(await searchParams)
  const all = await getJournalPosts()
  const posts = all.map(card)
  const categories = await getJournalCategories(posts)

  // The lead story: a featured guide, chosen by pillar priority (marriage and
  // tradition first), most recent within it.
  const featured = [...posts]
    .filter(p => p.featured)
    .sort((a, b) => pillarRank(a.category?.slug ?? '') - pillarRank(b.category?.slug ?? ''))[0]

  const results = q ? searchPosts(all, q).map(card) : []

  const latestAll = posts.filter(p => p.id !== featured?.id)
  const pages = Math.max(1, Math.ceil(latestAll.length / PER_PAGE))
  if (!q && page > pages) redirect('/blogs')
  const latest = latestAll.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const onFirstPage = !q && page === 1

  const listed = q ? results : onFirstPage && featured ? [featured, ...latest] : latest
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/blogs#collection`,
    url: `${SITE_URL}/blogs`,
    name: 'Mithila Jodi Journal',
    description: DESCRIPTION,
    inLanguage: 'en-IN',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: listed.length,
      itemListElement: listed.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}${p.href}`, name: p.title })),
    },
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-paper">
      <MithilaHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(CRUMBS)) }} />
      {!q && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />}

      <main id="main-content" className="flex-1">
        <Breadcrumbs items={CRUMBS} />

        {/* ── Masthead ─────────────────────────────────────────── */}
        <section className={`wrap text-center ${onFirstPage ? 'pb-8 pt-10 sm:pt-14' : 'pb-6 pt-8'}`}>
          <p className="eyebrow mb-3">Marriage • Mithila • Family • Culture</p>
          <h1 className="font-serif text-[36px] leading-tight text-maroon sm:text-[52px]">Mithila Jodi Journal</h1>
          <div className="ornament-line mx-auto my-5 w-24" />
          <p className="mx-auto mb-7 max-w-xl text-[16px] leading-relaxed text-ink-soft sm:text-[17px]">
            Stories, traditions, and practical guides for Mithila families.
          </p>
          <JournalSearch defaultValue={q} />
        </section>

        <div className="pb-2">
          <CategoryNav categories={categories} />
        </div>

        {q ? (
          /* ── Search results ──────────────────────────────────── */
          <section aria-labelledby="results" className="wrap py-10">
            {results.length > 0 ? (
              <>
                <SectionHeading id="results" title={`Results for “${q}”`} action={{ href: '/blogs', label: 'Clear search' }} />
                <ArticleGrid posts={results} />
              </>
            ) : (
              <>
                <h2 id="results" className="sr-only">Search results</h2>
                <EmptyState query={q} categories={categories} />
              </>
            )}
          </section>
        ) : (
          <>
            {onFirstPage && featured && (
              <section aria-label="Featured story" className="wrap pt-8">
                <FeaturedArticle post={featured} />
              </section>
            )}

            {onFirstPage && <StartHere posts={pick(posts, START_HERE)} />}

            {/* ── Latest ──────────────────────────────────────── */}
            <section aria-labelledby="latest-heading" id="latest" className="wrap scroll-mt-28 py-12">
              <SectionHeading
                id="latest-heading"
                eyebrow="Latest from Mithila Jodi"
                title={page === 1 ? 'New in the Journal' : `New in the Journal — page ${page}`}
              />
              {latest.length > 0 ? <ArticleGrid posts={latest} /> : <EmptyState categories={categories} />}
              <Pagination page={page} pages={pages} hrefFor={n => (n === 1 ? '/blogs#latest' : `/blogs?page=${n}#latest`)} />
            </section>

            {onFirstPage && (
              <>
                <ContentPillars categories={categories} posts={posts} />
                <Mithila101 posts={posts} />
                <MarriageGuide posts={posts} />
                <MithilaCalendar />
              </>
            )}
          </>
        )}
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
