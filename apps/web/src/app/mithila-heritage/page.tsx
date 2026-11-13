import Image from 'next/image'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { HeritageLink } from '@/components/heritage/HeritageLink'
import { HERITAGE_ARTWORKS, JHAYRA_MITHILA_URL, artwork, heritageSrc } from '@/lib/heritage'
import { pageMetadata, breadcrumbJsonLd, canonicalUrl, jsonLdScript } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/mithila-heritage',
  title: 'Mithila Heritage',
  description: 'Celebrate the timeless art, culture and traditions of Mithila through its beautiful artistic heritage.',
  keywords: ['Mithila heritage', 'Madhubani painting', 'Mithila painting', 'Mithila art', 'Maithil culture', 'Madhubani wall art'],
  image: '/heritage/og-mithila-heritage.jpg',
})

/*
 * /mithila-heritage — public, no sign-in. A cultural page first: what Mithila
 * painting is and where it comes from, then the Mithila Heritage collection on
 * Jhayra (Mithila Jodi's sister brand), whose shopping happens entirely there.
 * Every shopping link goes to that one collection or to one of its products.
 */

const MOTIFS = [
  { name: 'Fish (माछ)', text: 'Almost always drawn in pairs, the fish is associated with fertility and good fortune, and is among the most common motifs in wedding art.' },
  { name: 'Lotus (कमल)', text: 'The lotus stands for beauty and purity, and in the kohbar painting of a wedding room it sits at the centre of the composition.' },
  { name: 'Bamboo (बाँस)', text: 'Bamboo grows quickly and in clusters, and is read as a wish for the family line to grow and continue.' },
  { name: 'Parrots and peacocks', text: 'Pairs of birds stand for love and companionship, and fill the borders and corners of many paintings.' },
  { name: 'Sun and moon', text: 'Painted above a married couple’s room, they ask that the bond last as long as the sun and moon do.' },
  { name: 'Gods and goddesses', text: 'Durga, Kali, Shiva, Krishna, and Ram and Sita — whose wedding Mithila holds as its own — are painted with the same flat colour and bold line as everyday life.' },
]

function Border() {
  // The red-and-gold triangle band of Mithila wall borders, as an inline SVG pattern (no image request).
  return (
    <svg aria-hidden="true" className="block h-3 w-full" preserveAspectRatio="none" viewBox="0 0 120 12">
      <defs>
        <pattern id="mh-tri" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 12 6 1 12 12Z" fill="#8B1E2D" /><path d="M3 12 6 6 9 12Z" fill="#C6A15B" />
        </pattern>
      </defs>
      <rect width="120" height="12" fill="url(#mh-tri)" />
    </svg>
  )
}

export default function MithilaHeritagePage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Mithila Jodi', path: '/' },
    { name: 'Mithila Heritage', path: '/mithila-heritage' },
  ])
  const page = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Mithila Heritage',
    url: canonicalUrl('/mithila-heritage'),
    description: 'Celebrate the timeless art, culture and traditions of Mithila through its beautiful artistic heritage.',
    inLanguage: 'en-IN',
    isPartOf: { '@type': 'WebSite', name: 'Mithila Jodi', url: canonicalUrl('/') },
    about: { '@type': 'Thing', name: 'Mithila (Madhubani) painting' },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: HERITAGE_ARTWORKS.map((a, i) => ({ '@type': 'ListItem', position: i + 1, name: a.name, url: a.url })),
    },
  }
  // Kohbar Ghar in front, Siya Ram and Chhath behind it.
  const [hero1, hero2, hero3] = [artwork('p081'), artwork('p082'), artwork('p086')]

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumb, page)} />
      <MithilaHeader />
      <main id="main-content" className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section aria-labelledby="mh-title" className="relative overflow-hidden bg-[#5A0E1C] text-cream">
          <Border />
          <div className="wrap grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.1fr_1fr]">
            <div className="mh-rise">
              <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#E7C77A]">Mithila Heritage</p>
              <h1 id="mh-title" className="mt-3 font-serif text-[32px] leading-[1.12] sm:text-[44px]">
                The Art. The Culture.<br />The Heritage of Mithila.
              </h1>
              <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-[#F3E6CC]">
                A timeless tradition of artistic expression, stories and colours. Discover the beauty of Mithila through its extraordinary cultural heritage.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <a href="#heritage" className="inline-flex items-center rounded-full bg-[#E7C77A] px-6 py-3 text-[14.5px] font-semibold text-[#4A0B16] transition-transform hover:-translate-y-0.5">Our heritage</a>
                <a href="#collection" className="text-[14.5px] font-semibold text-[#F3E6CC] underline-offset-4 hover:underline">The collection →</a>
              </div>
            </div>
            {/* Three paintings from the collection, fanned like frames on a wall. */}
            <div className="relative mx-auto h-[300px] w-full max-w-[420px] sm:h-[360px]" aria-hidden="true">
              {[[hero2, '-rotate-6 left-0 top-6'], [hero3, 'rotate-6 right-0 top-8'], [hero1, 'left-1/2 -translate-x-1/2 top-0 z-10']].map(([a, pos], i) => {
                const art = a as typeof hero1
                return (
                  <div key={art.id} className={`mh-frame absolute w-[46%] rounded-[6px] border-[5px] border-[#E7C77A] bg-[#E7C77A] shadow-2xl ${pos as string}`} style={{ animationDelay: `${i * 120}ms` }}>
                    <Image src={heritageSrc(art.id)} alt="" width={art.w} height={art.h} priority={i === 2} sizes="(max-width: 640px) 45vw, 200px" className="block h-auto w-full rounded-[2px]" />
                  </div>
                )
              })}
            </div>
          </div>
          <Border />
        </section>

        {/* ── Our heritage ────────────────────────────────────── */}
        <section id="heritage" aria-labelledby="mh-heritage" className="wrap py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-terra">Our heritage</p>
            <h2 id="mh-heritage" className="mt-2 font-serif text-[28px] leading-tight text-maroon sm:text-[34px]">Painted on the walls of home</h2>
          </div>
          <div className="mx-auto mt-6 max-w-2xl space-y-4 text-[15.5px] leading-relaxed text-ink">
            <p>
              Mithila painting — known across the world as Madhubani, after the district where it is most widely practised — has been made for generations by the women of Mithila, the region of north Bihar and the neighbouring Terai of Nepal. It began on the freshly plastered mud walls and floors of the home: the <em>kohbar</em> painted in the room where a newly married couple first meet, and the <em>aripan</em> drawn on the floor in rice paste for festivals and rituals.
            </p>
            <p>
              Its look is unmistakable: bold outlines, every space filled with colour, pattern or fine lines, and borders of triangles, flowers and waves. Colours were traditionally made by hand — lamp soot for black, turmeric for yellow, flowers and leaves for reds and greens — and applied with twigs, bamboo slivers and cotton.
            </p>
            <p>
              The tradition came to wider notice in the twentieth century and, from the 1960s, was painted on paper and cloth as well as walls. Artists such as Sita Devi, Ganga Devi and Mahasundari Devi were honoured with the Padma Shri, and the art is now known far beyond Mithila — while it is still taught the way it always was, from mother and grandmother to daughter.
            </p>
          </div>

          <h3 className="mt-12 text-center font-serif text-[22px] text-maroon">Motifs and what they carry</h3>
          <ul className="mx-auto mt-5 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MOTIFS.map(m => (
              <li key={m.name} className="rounded-mj border border-gold/30 bg-cream p-4 shadow-mj-xs">
                <p className="font-serif text-[17px] text-maroon">{m.name}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{m.text}</p>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[13px] text-ink-soft">
            Meanings vary between families and painters; these are the readings most often given.{' '}
            <Link href="/blogs" className="text-maroon underline underline-offset-2">Read more about Mithila’s wedding traditions</Link>
          </p>
        </section>

        {/* ── The collection ──────────────────────────────────── */}
        <section id="collection" aria-labelledby="mh-collection" className="bg-[#F6EEDD] py-12 sm:py-16">
          <div className="wrap">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-terra">From our sister brand, Jhayra</p>
              <h2 id="mh-collection" className="mt-2 font-serif text-[28px] leading-tight text-maroon sm:text-[34px]">The Mithila Heritage Collection</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                Mithila paintings as framed wall art, curated by Jhayra. Browse, choose a size and frame, and order on Jhayra — prices, delivery and checkout are all there.
              </p>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {HERITAGE_ARTWORKS.map(a => (
                <li key={a.id}>
                  <HeritageLink href={a.url} place={a.id} ariaLabel={`${a.name} — opens on Jhayra in a new tab`}
                    className="group block rounded-mj border border-gold/40 bg-cream p-2.5 shadow-mj-xs transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-mj focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon">
                    <div className="overflow-hidden rounded-[4px] bg-[#EFE5D4]">
                      <Image src={heritageSrc(a.id)} alt={`${a.name}, a Mithila (Madhubani) painting`} width={a.w} height={a.h} loading="lazy"
                        sizes="(max-width: 1024px) 46vw, 280px" className="block aspect-[4/5] h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    </div>
                    <p className="mt-2.5 px-1 font-serif text-[15px] leading-snug text-maroon sm:text-[16.5px]">{a.name}</p>
                    <p className="px-1 pb-1 text-[12.5px] text-ink-soft">View on Jhayra ↗</p>
                  </HeritageLink>
                </li>
              ))}
            </ul>
            <div className="mt-8 text-center">
              <HeritageLink href={JHAYRA_MITHILA_URL} place="collection" className="btn-primary inline-flex px-7 py-3 text-[15px]">Explore Mithila Heritage ↗</HeritageLink>
              <p className="mt-2 text-[12.5px] text-ink-soft">Opens jhayra.com in a new tab</p>
            </div>
          </div>
        </section>

        {/* ── Closing ─────────────────────────────────────────── */}
        <section aria-labelledby="mh-close" className="relative overflow-hidden bg-[#5A0E1C] text-cream">
          <Border />
          <div className="wrap py-12 text-center sm:py-16">
            <h2 id="mh-close" className="font-serif text-[28px] leading-tight sm:text-[38px]">Our Roots. Our Identity. Our Mithila.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-[#F3E6CC]">
              Mithila is not just a place. It is an emotion, an identity and a heritage worth celebrating and preserving.
            </p>
            <HeritageLink href={JHAYRA_MITHILA_URL} place="closing" className="mt-6 inline-flex items-center rounded-full bg-[#E7C77A] px-7 py-3 text-[15px] font-semibold text-[#4A0B16] transition-transform hover:-translate-y-0.5">Discover Mithila Heritage ↗</HeritageLink>
            <p className="mt-6 font-deva text-[16px] text-[#E7C77A]" lang="hi">जहाँ परंपरा मिले, प्रेम से</p>
          </div>
          <Border />
        </section>
      </main>
      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
