import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { FestivalHeroArt } from '@/components/festivals/FestivalHeroArt'
import { SongsPlayer } from '@/components/festivals/SongsPlayer'
import { festivalsWithSongs, getFestival, getRelatedFestivals } from '@/lib/festivals'
import { SITE_URL } from '@/lib/constants'

/** One page per festival that has songs — statically generated. */
export function generateStaticParams() {
  return festivalsWithSongs().map((f) => ({ slug: f.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const festival = getFestival(slug)
  if (!festival || festival.songs.length === 0) {
    return { title: 'Songs Not Found', robots: { index: false, follow: true } }
  }

  const short = festival.name.split('—')[0].trim()
  const canonical = `${SITE_URL}/festival-songs/${festival.slug}`
  const title = `${short} Songs — Maithili ${short} Geet to Listen Online`
  const description =
    `Listen to ${festival.songs.length} Maithili ${short} songs on Mithila Jodi — ` +
    `${festival.songs.slice(0, 3).map((s) => s.title).join(', ')} and more. Plays here, no app needed.`

  return {
    title,
    description,
    keywords: [
      `${short} songs`, `${short} geet`, `Maithili ${short} geet`,
      `${short} songs Maithili`, 'Maithili festival songs', 'Mithila festival songs',
      ...festival.songs.slice(0, 4).map((s) => s.title),
    ],
    alternates: { canonical },
    openGraph: {
      type: 'website',
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

export default async function FestivalSongsPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const festival = getFestival(slug)
  if (!festival || festival.songs.length === 0) notFound()

  const short = festival.name.split('—')[0].trim()
  const canonical = `${SITE_URL}/festival-songs/${festival.slug}`
  const related = getRelatedFestivals(festival).filter((f) => f.songs.length > 0)

  // Only breadcrumbs are described in structured data. We deliberately do NOT
  // emit MusicRecording/ItemList markup for individual songs — Mithila Jodi is
  // not the rights holder or publisher of these recordings.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Festivals', item: `${SITE_URL}/festivals` },
      { '@type': 'ListItem', position: 3, name: 'Festival Songs', item: `${SITE_URL}/festival-songs` },
      { '@type': 'ListItem', position: 4, name: `${short} Songs`, item: canonical },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="flex-1 pb-16 lg:pb-0">
        {/* ── Hero ── */}
        <section className="relative">
          <FestivalHeroArt festival={festival} className="h-[150px] sm:h-[220px]" priority />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-maroon-deep/88 via-maroon-deep/30 to-transparent">
            <div className="wrap w-full pb-4 sm:pb-7">
              <nav aria-label="Breadcrumb" className="mb-2.5">
                <ol className="flex flex-wrap items-center gap-1.5 text-[12px] sm:text-[13px] text-paper-3/80">
                  <li><Link href="/" className="hover:text-gold-lt transition-colors">Home</Link></li>
                  <li aria-hidden="true" className="opacity-50">/</li>
                  <li><Link href="/festivals" className="hover:text-gold-lt transition-colors">Festivals</Link></li>
                  <li aria-hidden="true" className="opacity-50">/</li>
                  <li><Link href="/festival-songs" className="hover:text-gold-lt transition-colors">Songs</Link></li>
                </ol>
              </nav>
              <h1 className="font-serif text-[25px] sm:text-[38px] leading-[1.1] text-paper">
                {short} Songs
              </h1>
              <p className="font-deva text-[15px] sm:text-[18px] text-gold-lt mt-1" lang="hi">
                {festival.nameDeva}
              </p>
            </div>
          </div>
        </section>

        {/* ── Description (server-rendered, indexable) ── */}
        <section className="bg-cream border-b border-paper-3">
          <div className="wrap py-5 max-w-3xl">
            <p className="text-[14.5px] sm:text-[15.5px] text-ink leading-relaxed">
              {festival.intro}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-[12.5px]">
              <span className="text-ink-soft">
                <span className="text-terra font-medium">{festival.songs.length}</span>{' '}
                {festival.songs.length === 1 ? 'recording' : 'recordings'}
              </span>
              <span className="text-ink-soft">{festival.season}</span>
              <Link
                href={`/festivals/${festival.slug}`}
                className="text-maroon font-semibold hover:text-terra transition-colors"
              >
                Read about {short} →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Song list + player ── */}
        <section className="wrap py-7 sm:py-10 max-w-3xl" aria-label={`${short} songs`}>
          <h2 className="font-serif text-[20px] sm:text-[24px] text-maroon mb-1">
            Listen
          </h2>
          <p className="text-[13.5px] text-ink-soft mb-5">
            Tap a song to play it here — you will not be taken to another site.
          </p>

          <SongsPlayer songs={festival.songs} festivalName={short} festivalSlug={festival.slug} />

          <p className="text-[12px] text-ink-soft/80 leading-relaxed mt-6">
            Recordings play through an embedded player from the publishing channel. Mithila Jodi
            does not host, copy or distribute any music.
          </p>
        </section>

        {/* ── Other festivals ── */}
        {related.length > 0 && (
          <section className="bg-cream border-t border-paper-3 py-9 sm:py-12" aria-label="Songs from other festivals">
            <div className="wrap max-w-3xl">
              <h2 className="font-serif text-[19px] sm:text-[22px] text-maroon mb-4">
                Songs of other festivals
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {related.map((f) => (
                  <Link
                    key={f.slug}
                    href={`/festival-songs/${f.slug}`}
                    className="card card-hover p-3.5 flex items-center gap-3 min-h-[64px] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <span
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: f.palette.from }}
                      aria-hidden="true"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={f.palette.accent} strokeWidth="2">
                        <circle cx="8" cy="18" r="3" /><circle cx="18" cy="15" r="3" />
                        <path d="M11 18V6l10-2v11" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-serif text-[14.5px] text-maroon leading-snug truncate">
                        {f.name.split('—')[0].trim()}
                      </span>
                      <span className="block text-[11.5px] text-ink-soft">{f.songs.length} songs</span>
                    </span>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link href="/festival-songs" className="btn-ghost btn-sm">← All festival songs</Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <MithilaFooter />
      <MobileBottomNav />
    </div>
  )
}
