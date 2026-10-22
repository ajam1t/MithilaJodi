import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { GotraChecker } from '@/components/roots/GotraChecker'
import { GuideFaq } from '@/components/roots/GuideFaq'
import { GOTRAS, getGotra, gotraAliases, isIndexableGotra } from '@/lib/mithilaRoots'
import { articleDates } from '@/lib/contentDates'
import { breadcrumbJsonLd, canonicalUrl, faqJsonLd, jsonLdScript, organizationJsonLd, organizationRef, pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return GOTRAS.map(g => ({ slug: g.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = getGotra((await params).slug)
  if (!g) return { title: 'Gotra not found', robots: { index: false } }
  const alias = gotraAliases(g)[0]
  const meta = pageMetadata({
    path: `/gotra/${g.slug}`,
    title: `${g.name} Gotra (${g.deva}) — Origin & Marriage Rules`,
    description: `${g.name}${alias ? ` (${alias})` : ''} gotra in Mithila: its lineage, can ${g.name} marry ${g.name}, which gotras it matches with, and a free gotra match checker.`,
    keywords: [
      `${g.name} gotra`, ...gotraAliases(g).map(a => `${a} gotra`), `${g.name} gotra marriage`,
      `can ${g.name} marry ${g.name}`, `${g.name} gotra maithil brahmin`, `${g.name} gotra rishi`,
    ],
    ogType: 'article',
  })
  // A gotra with no lineage note renders the shared template with only the
  // name changed — thin, near-duplicate pages. Keep them out of the index (but
  // followable, so their links still count) until a lineage is added to
  // lib/mithilaRoots; isIndexableGotra then turns indexing, the sitemap entry
  // and the llms.txt line back on together.
  return isIndexableGotra(g) ? meta : { ...meta, robots: { index: false, follow: true } }
}

export default async function GotraPage({ params }: Props) {
  const g = getGotra((await params).slug)
  if (!g) notFound()
  const aliases = gotraAliases(g)
  const others = GOTRAS.filter(o => o.slug !== g.slug)
  const path = `/gotra/${g.slug}`

  const faq = [
    {
      q: `Can a ${g.name} boy marry a ${g.name} girl?`,
      a: `Traditionally, no. Both would carry the ${g.name} gotra, so they are counted as one lineage, and a sagotra match is avoided in Maithil practice. It is a custom rather than a legal bar — the Hindu Marriage Act, 1955 does not mention gotra — and some families are more flexible than others.`,
    },
    {
      q: `Which gotras can ${g.name} marry into?`,
      a: `By the paternal-gotra rule, any of the other nineteen Mithila gotras: ${others.map(o => o.name).join(', ')}. Stricter families also avoid a match where ${g.name} is the other side’s maternal gotra, or where the other side’s gotra is your maternal gotra.`,
    },
    {
      q: `What is ${g.name} gotra in Hindi?`,
      a: `${g.name} gotra is written ${g.deva} गोत्र in Devanagari.${aliases.length ? ` Families also spell it ${aliases.join(', ')}.` : ''}`,
    },
    {
      q: `How should ${g.name} gotra be written on a biodata?`,
      a: `As “Gotra: ${g.name}”, with your maternal gotra, mool and gram beside it near the top of the biodata. The free Mithila Jodi biodata maker has a place for each and prints them in English, Hindi, Maithili or Sanskrit.`,
    },
  ]

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${g.name} Gotra — Origin & Marriage Rules`,
    about: `${g.name} gotra`,
    inLanguage: 'en',
    url: canonicalUrl(path),
    author: organizationRef(),
    publisher: organizationRef(),
    mainEntityOfPage: canonicalUrl(path),
    ...articleDates(path),
  }
  const crumbs = breadcrumbJsonLd([
    { name: 'Mithila Jodi', path: '/' },
    { name: 'Maithil Gotra List', path: '/gotra' },
    { name: `${g.name} Gotra`, path },
  ])

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd(), article, faqJsonLd(faq), crumbs)} />
      <MithilaHeader />
      <main id="main-content" className="flex-1">
        <section className="py-9 sm:py-12" style={{ background: 'radial-gradient(ellipse 90% 85% at 50% 0%, #FFFAF0 0%, #F5EBDD 100%)' }}>
          <div className="wrap max-w-3xl text-center">
            <nav aria-label="Breadcrumb" className="mb-3">
              <ol className="flex items-center justify-center gap-2 text-[12.5px] text-ink-soft">
                <li><Link href="/" className="hover:text-maroon">Home</Link></li>
                <li aria-hidden="true" className="text-gold">›</li>
                <li><Link href="/gotra" className="hover:text-maroon">Gotra list</Link></li>
                <li aria-hidden="true" className="text-gold">›</li>
                <li className="text-maroon" aria-current="page">{g.name}</li>
              </ol>
            </nav>
            <h1 className="font-serif text-maroon text-[28px] sm:text-[38px] leading-tight">{g.name} Gotra</h1>
            <p className="font-deva text-gold text-[19px] sm:text-[22px] mt-1" lang="hi">{g.deva} गोत्र</p>
            <div className="ornament-line w-16 mx-auto mt-3" />
            <p className="text-ink text-[15px] sm:text-[16px] leading-relaxed mt-4">
              {g.name} is one of the twenty gotras recorded in the Mithila Panji, the genealogy kept for Maithil
              families.{aliases.length ? ` It is also written ${aliases.join(', ')}.` : ''}
            </p>
          </div>
        </section>

        <section className="wrap max-w-3xl py-9 sm:py-11 space-y-8 text-ink text-[15px] leading-relaxed">
          {g.lineage && (
            <div>
              <h2 className="font-serif text-maroon text-[21px] sm:text-[24px] leading-tight mb-2">Origin of the {g.name} gotra</h2>
              <p>{g.lineage} Like every gotra it passes from father to children, so everyone born into a {g.name} family is {g.name}.</p>
            </div>
          )}

          <div>
            <h2 className="font-serif text-maroon text-[21px] sm:text-[24px] leading-tight mb-2">Can {g.name} marry {g.name}?</h2>
            <p>
              Traditionally, no. A {g.name} boy and a {g.name} girl share a lineage, so the match is <em>sagotra</em> —
              and sagotra matches are avoided in Maithil practice. Mithila Jodi’s match score shows a shared gotra as a
              blocker for exactly this reason.
            </p>
            <p className="mt-2">
              Stricter families add a second check: {g.name} should not be the other side’s maternal gotra, and the
              other side’s gotra should not be yours. Many families treat that as something to talk through with
              elders rather than a firm no.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-maroon text-[21px] sm:text-[24px] leading-tight mb-2">Gotras {g.name} can match with</h2>
            <p>By the paternal-gotra rule, a {g.name} family can match with any of the other nineteen:</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {others.map(o => (
                <li key={o.slug}>
                  <Link href={`/gotra/${o.slug}`} className="inline-flex items-baseline gap-1.5 rounded-pill border border-gold/40 bg-cream px-3 py-1 text-[13.5px] text-maroon hover:border-gold">
                    {o.name} <span className="font-deva text-gold text-[12.5px]" lang="hi">{o.deva}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="wrap max-w-3xl pb-9 sm:pb-11">
          <GotraChecker initial={g.slug} />
        </section>

        <section className="bg-paper-2 py-9 sm:py-11">
          <div className="wrap max-w-3xl text-ink text-[15px] leading-relaxed">
            <h2 className="font-serif text-maroon text-[21px] sm:text-[24px] leading-tight mb-2">{g.name} gotra on a biodata</h2>
            <p>
              Write it as <strong>Gotra: {g.name}</strong>, with maternal gotra, <Link href="/mool" className="text-maroon underline underline-offset-2">mool</Link> and
              gram beside it. These are the first details a Maithil family reads, so they belong near the top — which is
              where the free <Link href="/marriage-biodata" className="text-maroon underline underline-offset-2">Mithila Jodi biodata maker</Link> puts them.
            </p>
          </div>
        </section>

        <section className="wrap max-w-3xl py-9 sm:py-11">
          <GuideFaq items={faq} />
          <p className="text-center text-[13.5px] text-ink-soft mt-7">
            <Link href="/gotra" className="text-maroon underline underline-offset-2">All 20 Maithil gotras</Link> ·{' '}
            <Link href="/mool" className="text-maroon underline underline-offset-2">Mool list</Link> ·{' '}
            <Link href="/blogs/gotra-family-lineage/same-gotra-marriage" className="text-maroon underline underline-offset-2">Same-gotra marriage</Link>
          </p>
        </section>

        <section className="bg-maroon-gradient py-9 sm:py-11">
          <div className="wrap max-w-2xl text-center">
            <h2 className="font-serif text-cream text-[20px] sm:text-[25px] leading-tight">Looking for a match for a {g.name} family?</h2>
            <p className="text-paper-3 text-[14px] leading-relaxed mt-2.5">
              Every Mithila Jodi profile shows gotra, maternal gotra, mool and gram, and every match score flags a
              same-gotra clash. Free for every member.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              <Link href="/register" className="btn bg-cream text-maroon border-cream hover:bg-paper">Create a free profile</Link>
              <Link href="/explore" className="btn bg-transparent text-cream border-cream/40 hover:border-cream hover:bg-white/5">Browse profiles</Link>
            </div>
          </div>
        </section>
      </main>
      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
