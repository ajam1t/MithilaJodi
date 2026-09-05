import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { FestivalCard } from '@/components/festivals/FestivalCard'
import { FESTIVALS } from '@/lib/festivals'
import { SITE_URL } from '@/lib/constants'

const CANONICAL = `${SITE_URL}/festivals`

export const metadata: Metadata = {
  title: 'Mithila Festivals — Chhath, Sama Chakeva, Madhushravani & More',
  description:
    'A guide to the festivals of Mithila: Chhath Puja, Sama Chakeva, Vivah Panchami, Phaguwa, Durga Puja, Diwali, Madhushravani and Kojagara — their stories, rituals and Maithili songs.',
  keywords: [
    'Mithila festivals', 'Maithili festivals', 'Maithil festivals', 'festivals of Mithila',
    'Chhath Puja', 'Sama Chakeva', 'Madhushravani', 'Kojagara', 'Vivah Panchami',
    'Mithila culture', 'Bihar festivals', 'Maithili geet', 'Mithila traditions',
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'website',
    images: ['/og-card.png'],
    url: CANONICAL,
    siteName: 'Mithila Jodi',
    title: 'Mithila Festivals — Stories, Rituals & Songs',
    description:
      'Explore the festival year of Mithila — from the four days of Chhath to Sama Chakeva, Madhushravani and Kojagara, with the Maithili songs that belong to each.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mithila Festivals — Stories, Rituals & Songs',
    description: 'The festival year of Mithila: stories, rituals and Maithili songs.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${CANONICAL}#webpage`,
      url: CANONICAL,
      name: 'Mithila Festivals',
      description:
        'A guide to the festivals of Mithila — stories, rituals, cultural context and Maithili songs.',
      inLanguage: 'en',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      breadcrumb: { '@id': `${CANONICAL}#breadcrumb` },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: FESTIVALS.map((f, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: f.name,
          url: `${SITE_URL}/festivals/${f.slug}`,
        })),
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${CANONICAL}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Mithila Festivals', item: CANONICAL },
      ],
    },
  ],
}

export default function FestivalsIndexPage() {
  const uniqueCount = FESTIVALS.filter((f) => f.uniquelyMithila).length

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main id="main-content" className="flex-1">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-maroon-deep">
          <div className="absolute inset-0 opacity-[0.16]" aria-hidden="true">
            <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="xMidYMid slice" fill="none">
              {[[60, 50, 34], [200, 34, 26], [340, 58, 30], [120, 150, 28], [280, 158, 32]].map(
                ([cx, cy, r], gi) => (
                  <g key={gi}>
                    {[0, 45, 90, 135].map((a) => (
                      <ellipse
                        key={a} cx={cx} cy={cy} rx={r * 0.32} ry={r}
                        stroke="#E4C572" strokeWidth="1" transform={`rotate(${a} ${cx} ${cy})`}
                      />
                    ))}
                    <circle cx={cx} cy={cy} r={r * 0.26} fill="#E8912A" opacity="0.55" />
                  </g>
                )
              )}
            </svg>
          </div>
          <div className="gold-strip absolute top-0 inset-x-0" aria-hidden="true" />

          <div className="wrap relative py-12 sm:py-16 text-center">
            <nav aria-label="Breadcrumb" className="mb-5">
              <ol className="flex items-center justify-center gap-2 text-[12.5px] text-paper-3/70">
                <li><Link href="/" className="hover:text-gold-lt transition-colors">Home</Link></li>
                <li aria-hidden="true" className="text-gold/60">›</li>
                <li className="text-gold-lt" aria-current="page">Festivals</li>
              </ol>
            </nav>

            <p className="eyebrow !text-marigold mb-3">The Mithila Year</p>
            <h1 className="font-serif text-[32px] sm:text-[46px] leading-[1.1] text-paper">
              Mithila Festivals
            </h1>
            <p className="font-deva text-[17px] sm:text-[21px] text-gold-lt mt-3" lang="hi">
              मिथिलाक पाबनि-तिहार
            </p>

            <p className="text-paper-2/85 text-[15px] sm:text-[16.5px] leading-relaxed max-w-xl mx-auto mt-5">
              Mithila keeps a festival year unlike anywhere else in India. Some of these you will
              know. {uniqueCount} of them are celebrated almost nowhere but here.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-7">
              <span className="badge badge-gold">{FESTIVALS.length} festivals</span>
              <span className="badge bg-cream/10 text-paper-2 border border-gold/30">Stories &amp; rituals</span>
              <span className="badge bg-cream/10 text-paper-2 border border-gold/30">Maithili songs</span>
            </div>
          </div>
        </section>

        <MithilaBorder variant="bottom" className="h-6 sm:h-9 overflow-hidden" />

        {/* ── Grid ─────────────────────────────────────────── */}
        <section className="wrap py-10 sm:py-14" aria-label="All Mithila festivals">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FESTIVALS.map((f, i) => (
              <FestivalCard key={f.slug} festival={f} priority={i < 2} />
            ))}
          </div>
        </section>

        {/* ── Closing note + internal links ────────────────── */}
        <section className="bg-cream border-t border-paper-3 py-11 sm:py-14">
          <div className="wrap max-w-2xl text-center">
            <p className="eyebrow mb-2.5">Why it matters</p>
            <h2 className="section-heading text-[24px] sm:text-[30px]">
              Festivals are how Mithila remembers itself
            </h2>
            <div className="ornament-line mj-line w-16 mx-auto my-5" />
            <p className="text-ink-soft text-[15px] sm:text-[16px] leading-relaxed">
              Songs, rituals and floor drawings carry the Maithili language and the region’s
              memory from one generation to the next — often through the women of the household.
              The same songs that mark a festival return at a wedding.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-7">
              <Link href="/blogs/mithila-marriage-traditions" className="btn-ghost btn-sm">
                Read about Maithil marriage rituals
              </Link>
              <Link href="/blogs/mithila-culture-heritage" className="btn-ghost btn-sm">
                Explore Mithila culture &amp; heritage
              </Link>
              <Link href="/biodata" className="btn-primary btn-sm">
                Create your marriage biodata
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
