import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { GuideFaq } from '@/components/roots/GuideFaq'
import { CHECKLIST, COMPETITORS, MJ_FEATURES, getCompetitor } from '@/lib/compare'
import { breadcrumbJsonLd, faqJsonLd, jsonLdScript, organizationJsonLd, pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return COMPETITORS.map(c => ({ slug: c.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getCompetitor((await params).slug)
  if (!c) return { title: 'Not found', robots: { index: false } }
  return pageMetadata({
    path: `/compare/${c.slug}`,
    title: `${c.name} Alternative for Maithil Families`,
    description: `Looking for a ${c.name} alternative for a Maithil match? Mithila Jodi is free, built around gotra, mool and gram, and checks gotra in every match.`,
    keywords: [
      `${c.searchName} alternative`, `${c.searchName} alternative for maithil`, `${c.searchName} vs mithila jodi`,
      `sites like ${c.searchName}`, 'maithil matrimony', 'maithil brahmin matrimony', 'free matrimony site',
    ],
  })
}

export default async function ComparePage({ params }: Props) {
  const c = getCompetitor((await params).slug)
  if (!c) notFound()
  const path = `/compare/${c.slug}`

  const faq = [
    {
      q: `Is Mithila Jodi a good alternative to ${c.name}?`,
      a: `It is a different kind of site. ${c.name} is a large all-India matrimony service for many communities. Mithila Jodi is built only for Maithil families, so gotra, maternal gotra, mool and gram are proper profile fields and every match checks gotra. Many families use both.`,
    },
    {
      q: 'Is Mithila Jodi free?',
      a: 'Yes. Registration, the profile, search, interests, messaging and the biodata maker are free for every member, with no paid tier.',
    },
    {
      q: `Can I keep my ${c.name} profile and join Mithila Jodi too?`,
      a: 'Yes. They are separate services, and nothing stops you having a profile on both. Your Mithila Jodi profile and Digital Profile link stay under your control.',
    },
    {
      q: 'Who is Mithila Jodi for?',
      a: 'Maithil families — in Mithila and wherever they now live — who want gotra, mool and gram to come first when they look for a match.',
    },
  ]
  const crumbs = breadcrumbJsonLd([
    { name: 'Mithila Jodi', path: '/' },
    { name: 'Compare', path: '/compare' },
    { name: `${c.name} alternative`, path },
  ])

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd(), faqJsonLd(faq), crumbs)} />
      <MithilaHeader />
      <main id="main-content" className="flex-1">
        <section className="py-9 sm:py-12" style={{ background: 'radial-gradient(ellipse 90% 85% at 50% 0%, #FFFAF0 0%, #F5EBDD 100%)' }}>
          <div className="wrap max-w-3xl text-center">
            <nav aria-label="Breadcrumb" className="mb-3">
              <ol className="flex items-center justify-center gap-2 text-[12.5px] text-ink-soft">
                <li><Link href="/" className="hover:text-maroon">Home</Link></li>
                <li aria-hidden="true" className="text-gold">›</li>
                <li><Link href="/compare" className="hover:text-maroon">Compare</Link></li>
                <li aria-hidden="true" className="text-gold">›</li>
                <li className="text-maroon" aria-current="page">{c.name} alternative</li>
              </ol>
            </nav>
            <h1 className="font-serif text-maroon text-[26px] sm:text-[36px] leading-tight">
              A {c.name} alternative for Maithil families
            </h1>
            <div className="ornament-line w-16 mx-auto mt-3" />
            <p className="text-ink text-[15px] sm:text-[16px] leading-relaxed mt-4">
              {c.name} is a large all-India matrimony service for many communities. If your family is Maithil and wants
              gotra, mool and gram to come first, Mithila Jodi is built for exactly that — and it is free.
            </p>
            <Link href="/register" className="btn-primary mt-6 inline-flex px-7 py-3 text-[15px]">Create a free profile →</Link>
          </div>
        </section>

        <section className="wrap max-w-4xl py-9 sm:py-11">
          <h2 className="font-serif text-maroon text-[21px] sm:text-[25px] leading-tight text-center">What Mithila Jodi does differently</h2>
          <div className="ornament-line w-14 mx-auto mt-2.5 mb-6" />
          <ul className="grid sm:grid-cols-2 gap-4">
            {MJ_FEATURES.map(f => (
              <li key={f.title} className="card p-5">
                <h3 className="font-serif text-maroon text-[17px] leading-tight flex gap-2">
                  <span className="text-green" aria-hidden="true">✓</span>{f.title}
                </h3>
                <p className="text-ink-soft text-[14px] leading-relaxed mt-1.5 pl-5">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-paper-2 py-9 sm:py-11">
          <div className="wrap max-w-3xl">
            <h2 className="font-serif text-maroon text-[21px] sm:text-[25px] leading-tight">Questions to ask any matrimony site</h2>
            <p className="text-ink-soft text-[14.5px] mt-1.5 leading-relaxed">
              Whichever you choose — {c.name}, Mithila Jodi or another — these are worth checking for a Maithil match:
            </p>
            <ol className="mt-4 space-y-2.5">
              {CHECKLIST.map((q, i) => (
                <li key={q} className="flex gap-3 text-ink text-[15px] leading-relaxed">
                  <span className="inline-grid place-items-center h-6 w-6 shrink-0 rounded-full bg-maroon text-cream text-[12px] font-semibold">{i + 1}</span>
                  {q}
                </li>
              ))}
            </ol>
            <p className="text-ink-soft text-[13.5px] mt-5 leading-relaxed">
              Try the free tools first, no account needed: the{' '}
              <Link href="/gotra" className="text-maroon underline underline-offset-2">gotra match checker</Link>, the{' '}
              <Link href="/marriage-biodata" className="text-maroon underline underline-offset-2">biodata maker</Link> and{' '}
              <Link href="/astrology/kundli-match" className="text-maroon underline underline-offset-2">kundli matching</Link>.
            </p>
          </div>
        </section>

        <section className="wrap max-w-3xl py-9 sm:py-11">
          <GuideFaq items={faq} />
          <p className="text-[12px] text-ink-soft mt-8 leading-relaxed text-center">
            {c.name} is a trademark of its owner. Mithila Jodi is an independent service and is not affiliated with,
            endorsed by or sponsored by {c.name}. Other services’ features change — check their own website for what they
            offer today.
          </p>
        </section>
      </main>
      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
