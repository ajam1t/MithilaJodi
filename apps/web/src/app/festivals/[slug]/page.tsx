import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { FestivalHeroArt } from '@/components/festivals/FestivalHeroArt'
import { FestivalSongsTeaser } from '@/components/festivals/FestivalSongsTeaser'
import { FestivalCard } from '@/components/festivals/FestivalCard'
import { FESTIVALS, getFestival, getRelatedFestivals } from '@/lib/festivals'
import { SITE_URL } from '@/lib/constants'

/** Statically generate all 8 festival routes at build time. */
export function generateStaticParams() {
  return FESTIVALS.map((f) => ({ slug: f.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const festival = getFestival(slug)
  if (!festival) {
    return { title: 'Festival Not Found', robots: { index: false, follow: true } }
  }

  const canonical = `${SITE_URL}/festivals/${festival.slug}`
  const { title, description, keywords } = festival.seo

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      siteName: 'Mithila Jodi',
      title,
      description,
      images: [festival.heroImage ?? '/hero-couple.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [festival.heroImage ?? '/hero-couple.jpg'],
    },
  }
}

function SectionTitle({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h2 className="font-serif text-[23px] sm:text-[29px] text-maroon leading-tight">{children}</h2>
      <div className="ornament-line w-14 mt-3.5" />
    </div>
  )
}

function Diamond() {
  return (
    <svg viewBox="0 0 10 10" width="9" height="9" className="mt-[7px] flex-shrink-0" aria-hidden="true">
      <path d="M5 1 L9 5 L5 9 L1 5 Z" fill="#B98A2E" />
    </svg>
  )
}

export default async function FestivalPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const festival = getFestival(slug)
  if (!festival) notFound()

  const related = getRelatedFestivals(festival)
  const canonical = `${SITE_URL}/festivals/${festival.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonical}#article`,
        headline: `${festival.name} in Mithila`,
        description: festival.seo.description,
        about: festival.name,
        inLanguage: 'en',
        articleSection: 'Mithila Festivals',
        keywords: festival.seo.keywords.join(', '),
        image: festival.heroImage ? `${SITE_URL}${festival.heroImage}` : `${SITE_URL}/hero-couple.jpg`,
        author: { '@type': 'Organization', name: 'Mithila Jodi', url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: 'Mithila Jodi',
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Mithila Festivals', item: `${SITE_URL}/festivals` },
          { '@type': 'ListItem', position: 3, name: festival.name, item: canonical },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="flex-1 pb-16 lg:pb-0">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative">
          <FestivalHeroArt festival={festival} className="h-[190px] sm:h-[300px] lg:h-[360px]" priority />

          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-maroon-deep/85 via-maroon-deep/25 to-transparent">
            <div className="wrap w-full pb-5 sm:pb-9">
              <nav aria-label="Breadcrumb" className="mb-3">
                <ol className="flex flex-wrap items-center gap-1.5 text-[12px] sm:text-[13px] text-paper-3/80">
                  <li><Link href="/" className="hover:text-gold-lt transition-colors">Home</Link></li>
                  <li aria-hidden="true" className="opacity-50">/</li>
                  <li><Link href="/festivals" className="hover:text-gold-lt transition-colors">Festivals</Link></li>
                  <li aria-hidden="true" className="opacity-50">/</li>
                  <li className="text-gold-lt font-medium">{festival.name}</li>
                </ol>
              </nav>

              {festival.uniquelyMithila && (
                <span className="badge badge-gold mb-2.5 inline-flex">Celebrated only in Mithila</span>
              )}

              <h1 className="font-serif text-[28px] sm:text-[42px] lg:text-[50px] leading-[1.08] text-paper">
                {festival.name}
              </h1>
              <p className="font-deva text-[18px] sm:text-[24px] text-gold-lt mt-1.5" lang="hi">
                {festival.nameDeva}
              </p>
              <p className="font-serif italic text-[14px] sm:text-[16.5px] text-paper-2/90 mt-2.5 max-w-xl">
                {festival.tagline}
              </p>
            </div>
          </div>
        </section>

        {/* ── When / how long ─────────────────────────────── */}
        <section className="bg-cream border-b border-paper-3">
          <div className="wrap py-4 flex flex-wrap items-center gap-x-7 gap-y-2.5">
            <span className="flex items-center gap-2 text-[13.5px]">
              <span className="text-gold" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 11h18" />
                </svg>
              </span>
              <span className="text-ink-soft">When:</span>
              <span className="text-ink font-medium">{festival.season}</span>
            </span>
            <span className="flex items-center gap-2 text-[13.5px]">
              <span className="text-gold" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-ink-soft">Duration:</span>
              <span className="text-ink font-medium">{festival.duration}</span>
            </span>
          </div>
        </section>

        {/* ── Intro pull-quote ────────────────────────────── */}
        <section className="wrap py-9 sm:py-12 max-w-3xl">
          <p className="font-serif text-[18px] sm:text-[23px] leading-[1.55] text-ink">
            {festival.intro}
          </p>
        </section>

        {/* ── Story ───────────────────────────────────────── */}
        <section className="wrap pb-10 sm:pb-14 max-w-3xl" aria-label={`The story of ${festival.name}`}>
          <SectionTitle eyebrow="The Story">Where it comes from</SectionTitle>
          <div className="space-y-4">
            {festival.story.map((para, i) => (
              <p key={i} className="text-[15.5px] sm:text-[16.5px] leading-[1.75] text-ink">
                {para}
              </p>
            ))}
          </div>
        </section>

        {/* ── Significance ────────────────────────────────── */}
        <section className="bg-paper-2/50 border-y border-paper-3 py-10 sm:py-14">
          <div className="wrap max-w-3xl">
            <SectionTitle eyebrow="Significance">Why it matters</SectionTitle>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
              {festival.significance.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <Diamond />
                  <span className="text-[14.5px] sm:text-[15.5px] leading-relaxed text-ink">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Rituals timeline ────────────────────────────── */}
        <section className="wrap py-10 sm:py-14 max-w-3xl" aria-label={`Rituals of ${festival.name}`}>
          <SectionTitle eyebrow="Rituals &amp; Traditions">How it is observed</SectionTitle>

          <ol className="relative space-y-4">
            {/* vertical thread */}
            <span
              className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-gold/70 via-gold/30 to-transparent hidden sm:block"
              aria-hidden="true"
            />
            {festival.rituals.map((ritual, i) => (
              <li key={ritual.title} className="relative sm:pl-12">
                <span
                  className="hidden sm:flex absolute left-0 top-1 w-8 h-8 rounded-full bg-maroon-gradient
                             text-cream text-[12.5px] font-semibold items-center justify-center shadow-mj-xs"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="card p-4 sm:p-5">
                  {ritual.when && (
                    <span className="badge badge-warning mb-2 inline-flex">{ritual.when}</span>
                  )}
                  <h3 className="font-serif text-[17px] sm:text-[19px] text-maroon leading-snug">
                    {ritual.title}
                  </h3>
                  <p className="text-[14.5px] sm:text-[15.5px] leading-[1.7] text-ink-soft mt-1.5">
                    {ritual.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Mithila connection ──────────────────────────── */}
        <section className="relative overflow-hidden bg-maroon-deep py-11 sm:py-16">
          <div className="absolute inset-0 opacity-[0.13]" aria-hidden="true">
            <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="xMidYMid slice" fill="none">
              {[[70, 60, 30], [330, 70, 26], [200, 160, 32]].map(([cx, cy, r], gi) => (
                <g key={gi}>
                  {[0, 60, 120].map((a) => (
                    <ellipse
                      key={a} cx={cx} cy={cy} rx={r * 0.3} ry={r}
                      stroke="#E4C572" strokeWidth="1" transform={`rotate(${a} ${cx} ${cy})`}
                    />
                  ))}
                </g>
              ))}
            </svg>
          </div>

          <div className="wrap relative max-w-3xl">
            <p className="eyebrow !text-marigold mb-2">The Mithila Thread</p>
            <h2 className="font-serif text-[23px] sm:text-[30px] text-paper leading-tight">
              What makes it Maithil
            </h2>
            <div className="h-px w-14 bg-gold-lt/60 mt-3.5 mb-6" aria-hidden="true" />

            <ul className="space-y-3.5">
              {festival.mithilaConnection.map((point) => (
                <li key={point} className="flex items-start gap-3.5">
                  <svg viewBox="0 0 10 10" width="9" height="9" className="mt-[8px] flex-shrink-0" aria-hidden="true">
                    <path d="M5 1 L9 5 L5 9 L1 5 Z" fill="#E4C572" />
                  </svg>
                  <span className="text-[14.5px] sm:text-[16px] leading-[1.7] text-paper-2/90">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Songs ───────────────────────────────────────── */}
        <section className="wrap py-10 sm:py-14 max-w-3xl" aria-label={`Songs of ${festival.name}`}>
          <FestivalSongsTeaser festival={festival} />
        </section>

        {/* ── Related festivals ───────────────────────────── */}
        {related.length > 0 && (
          <section className="bg-cream border-t border-paper-3 py-10 sm:py-14" aria-label="Related festivals">
            <div className="wrap">
              <div className="text-center mb-7">
                <p className="eyebrow mb-2">Keep exploring</p>
                <h2 className="section-heading text-[23px] sm:text-[29px]">Related Festivals</h2>
                <div className="ornament-line w-14 mx-auto mt-3.5" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {related.map((f) => (
                  <FestivalCard key={f.slug} festival={f} />
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/festivals" className="btn-ghost btn-sm">
                  ← All Mithila festivals
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ─────────────────────────────────────────── */}
        <section className="wrap py-11 sm:py-14 max-w-3xl">
          <div className="card overflow-hidden text-center">
            <div className="gold-strip" />
            <div className="p-7 sm:p-9">
              <p className="font-deva text-[19px] sm:text-[23px] text-maroon" lang="hi">
                मिथिला जोड़ी
              </p>
              <h2 className="font-serif text-[21px] sm:text-[26px] text-maroon mt-2 leading-snug">
                Marriage, rooted in Mithila
              </h2>
              <div className="ornament-line w-14 mx-auto my-4" />
              <p className="text-ink-soft text-[14.5px] sm:text-[15.5px] leading-relaxed max-w-md mx-auto">
                The same songs that carry our festivals carry our weddings. Create a marriage
                biodata in Maithili, Hindi, English or Sanskrit, and find a match who shares
                these roots.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Link href="/biodata" className="btn-ghost btn-sm">Create your biodata</Link>
                <Link href="/register" className="btn-primary btn-sm">Find your match</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MithilaFooter />
      <MobileBottomNav />
    </div>
  )
}
