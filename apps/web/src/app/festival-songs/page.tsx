import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { FestivalHeroArt } from '@/components/festivals/FestivalHeroArt'
import { festivalsWithSongs, totalSongCount } from '@/lib/festivals'
import { SITE_URL } from '@/lib/constants'

const CANONICAL = `${SITE_URL}/festival-songs`

export const metadata: Metadata = {
  title: 'Mithila Festival Songs — Maithili Geet for Chhath, Sama Chakeva & More',
  description:
    'Listen to Maithili festival songs on Mithila Jodi — Chhath geet, Sama Chakeva geet, Vivah Panchami vivah geet, Jogira, Devi geet, Madhushravani and Kojagara songs. Plays right here, no app needed.',
  keywords: [
    'Maithili festival songs', 'Mithila festival songs', 'Maithili geet',
    'Chhath geet', 'Sama Chakeva geet', 'Madhushravani geet', 'Kojagara geet',
    'Maithili Devi geet', 'Jogira', 'Vivah Panchami geet', 'Maithili folk songs',
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'website',
    url: CANONICAL,
    siteName: 'Mithila Jodi',
    title: 'Mithila Festival Songs — Maithili Geet',
    description:
      'Chhath geet, Sama Chakeva geet, Jogira, Devi geet and more — listen without leaving Mithila Jodi.',
    images: ['/hero-couple.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mithila Festival Songs — Maithili Geet',
    description: 'Listen to Maithili festival songs on Mithila Jodi.',
    images: ['/hero-couple.jpg'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${CANONICAL}#webpage`,
      url: CANONICAL,
      name: 'Mithila Festival Songs',
      description:
        'Maithili festival songs organised by festival — Chhath, Sama Chakeva, Vivah Panchami, Holi, Durga Puja, Diwali, Madhushravani and Kojagara.',
      inLanguage: 'en',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      breadcrumb: { '@id': `${CANONICAL}#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${CANONICAL}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Festivals', item: `${SITE_URL}/festivals` },
        { '@type': 'ListItem', position: 3, name: 'Festival Songs', item: CANONICAL },
      ],
    },
  ],
}

export default function FestivalSongsHubPage() {
  const festivals = festivalsWithSongs()

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main id="main-content" className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-maroon-deep">
          <div className="gold-strip absolute top-0 inset-x-0" aria-hidden="true" />
          <div className="wrap relative py-11 sm:py-14 text-center">
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex items-center justify-center gap-2 text-[12.5px] text-paper-3/70">
                <li><Link href="/" className="hover:text-gold-lt transition-colors">Home</Link></li>
                <li aria-hidden="true" className="text-gold/60">›</li>
                <li><Link href="/festivals" className="hover:text-gold-lt transition-colors">Festivals</Link></li>
                <li aria-hidden="true" className="text-gold/60">›</li>
                <li className="text-gold-lt" aria-current="page">Songs</li>
              </ol>
            </nav>

            <p className="eyebrow !text-marigold mb-3">Maithili Geet</p>
            <h1 className="font-serif text-[30px] sm:text-[44px] leading-[1.1] text-paper">
              Festival Songs
            </h1>
            <p className="font-deva text-[16px] sm:text-[20px] text-gold-lt mt-2.5" lang="hi">
              मिथिलाक पाबनि गीत
            </p>
            <p className="text-paper-2/85 text-[15px] sm:text-[16.5px] leading-relaxed max-w-xl mx-auto mt-4">
              {totalSongCount()} recordings across {festivals.length} festivals — the geet that
              actually get sung in Maithil courtyards. Everything plays right here.
            </p>
          </div>
        </section>

        <MithilaBorder variant="bottom" className="h-6 sm:h-9 overflow-hidden" />

        {/* ── Festival picker ── */}
        <section className="wrap py-9 sm:py-12" aria-label="Choose a festival">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {festivals.map((f, i) => (
              <Link
                key={f.slug}
                href={`/festival-songs/${f.slug}`}
                className="group card card-hover overflow-hidden flex items-stretch min-h-[112px] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <FestivalHeroArt festival={f} className="w-[104px] sm:w-[120px] flex-shrink-0" priority={i < 3} />

                <span className="flex-1 min-w-0 p-4 flex flex-col justify-center">
                  <span className="font-serif text-[17px] sm:text-[19px] text-maroon leading-snug group-hover:text-terra transition-colors">
                    {f.name.split('—')[0].trim()}
                  </span>
                  <span className="font-deva text-[13px] text-ink-soft mt-0.5" lang="hi">
                    {f.nameDeva}
                  </span>
                  <span className="flex items-center gap-1.5 mt-2 text-[12.5px] text-terra font-medium">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                      <circle cx="8" cy="18" r="3" /><circle cx="18" cy="15" r="3" />
                      <path d="M11 18V6l10-2v11" strokeLinecap="round" />
                    </svg>
                    {f.songs.length} {f.songs.length === 1 ? 'song' : 'songs'}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Note + internal links ── */}
        <section className="bg-cream border-t border-paper-3 py-10 sm:py-14">
          <div className="wrap max-w-2xl text-center">
            <p className="eyebrow mb-2.5">About these recordings</p>
            <h2 className="section-heading text-[22px] sm:text-[28px]">
              Songs kept alive by the singers who record them
            </h2>
            <div className="ornament-line mj-line w-16 mx-auto my-5" />
            <p className="text-ink-soft text-[14.5px] sm:text-[15.5px] leading-relaxed">
              Mithila Jodi does not host or distribute any music. Each song plays through an
              embedded player from the publishing channel, so the artists and channels keep
              their views and credit.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-7">
              <Link href="/festivals" className="btn-ghost btn-sm">Explore the festivals</Link>
              <Link href="/blogs/mithila-marriage-traditions" className="btn-ghost btn-sm">
                Maithil marriage rituals
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
