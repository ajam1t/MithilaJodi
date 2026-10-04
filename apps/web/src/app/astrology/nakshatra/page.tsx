import Link from 'next/link'
import '@/styles/kundli.css'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { NakshatraExperience } from '@/components/astrology/nakshatra/NakshatraExperience'
import { NakshatraWheel } from '@/components/astrology/nakshatra/NakshatraWheel'
import { LazyCosmicBackdrop } from '@/components/astrology/kundli/LazyCosmicBackdrop'
import { AstrologyMethodology } from '@/components/astrology/AstrologyMethodology'
import { NAKSHATRAS } from '@/lib/astrology/vedic/zodiac'
import { NAKSHATRA_INFO } from '@/lib/astrology/vedic/nakshatraInfo'
import { grahaShort } from '@/components/astrology/kundli/format'
import { GANA_BY_NAKSHATRA, GANA_LABEL } from '@/lib/astrology/rules/tables'
import { SITE_URL } from '@/lib/constants'
import {
  breadcrumbJsonLd, faqJsonLd, jsonLdScript, organizationJsonLd, organizationRef, pageMetadata, webAppJsonLd,
} from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/astrology/nakshatra',
  title: 'Nakshatra Calculator — Find Your Janma Nakshatra & Pada',
  description:
    'Find your Janma nakshatra and pada from date, time and place of birth — with its lord, deity, Gana, Yoni, Nadi, name syllables and the Navatara chart. Free, no login.',
  keywords: [
    'nakshatra calculator', 'janma nakshatra', 'birth star', 'nakshatra pada', 'nakshatra by date of birth',
    'name syllables by nakshatra', 'navatara', 'maithili nakshatra',
  ],
})

const FAQ = [
  {
    q: 'What is a Janma nakshatra?',
    a: 'It is the nakshatra — one of 27 equal divisions of the sidereal zodiac, each 13°20′ wide — that the Moon was in at the moment of birth. It is also called the birth star.',
  },
  {
    q: 'Can I find my nakshatra without the birth time?',
    a: 'Often, yes. The Moon spends about a day in each nakshatra, so the date alone frequently fixes it. If the Moon changed nakshatra that day, the tool asks roughly when the birth was, or shows both possibilities. The pada usually does need the time.',
  },
  {
    q: 'What is a pada?',
    a: 'Each nakshatra is divided into four padas of 3°20′. The pada decides the traditional first syllable of a name and the navamsa sign of the Moon.',
  },
  {
    q: 'Why is my nakshatra different on another website?',
    a: 'Only if the birth was very close to the moment the Moon changed nakshatra. Calculators differ slightly in ayanamsha and ephemeris; Mithila Jodi shows the exact times the Moon entered and left the nakshatra so you can see how close the birth was.',
  },
  {
    q: 'Is a nakshatra a scientific description of personality?',
    a: 'No. The Moon’s position is real astronomy; what a nakshatra means is a matter of tradition. Mithila Jodi gives the traditional attributes and makes no claims about character or the future.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/nakshatra#webpage`,
      url: `${SITE_URL}/astrology/nakshatra`,
      name: 'Nakshatra Calculator — Find Your Janma Nakshatra & Pada',
      description: 'Find your Janma nakshatra and pada with its lord, deity, Gana, Yoni, Nadi, name syllables and Navatara chart.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/nakshatra#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    { ...breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Nakshatra', path: '/astrology/nakshatra' },
    ]), '@id': `${SITE_URL}/astrology/nakshatra#breadcrumb` },
    {
      ...webAppJsonLd({
        name: 'Nakshatra Calculator',
        path: '/astrology/nakshatra',
        description: 'Free Janma nakshatra and pada calculator with traditional attributes, name syllables and Navatara.',
        languages: ['en'],
      }),
      publisher: organizationRef(),
    },
    faqJsonLd(FAQ),
    organizationJsonLd(),
  ],
}

const LINK = 'text-maroon underline underline-offset-4 decoration-gold/50 hover:text-terra'

export default function NakshatraPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <MithilaHeader />

      <main id="main-content" className="flex-1">
        <div className="kd-cosmic">
          <div className="kd-stars" aria-hidden="true" />
          <LazyCosmicBackdrop />

          <nav aria-label="Breadcrumb" className="relative border-b kd-hairline">
            <ol className="wrap flex items-center gap-2 py-3 text-[12px] text-paper-3/60">
              <li><Link href="/" className="hover:text-gold-lt transition-colors">Home</Link></li>
              <li aria-hidden="true" className="text-gold/40">›</li>
              <li><Link href="/astrology" className="hover:text-gold-lt transition-colors">Astrology Tools</Link></li>
              <li aria-hidden="true" className="text-gold/40">›</li>
              <li className="text-gold-lt" aria-current="page">Nakshatra</li>
            </ol>
          </nav>

          <section className="relative wrap pt-10 pb-8 sm:pt-14 lg:pt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="text-[11px] uppercase tracking-[0.3em] text-marigold">Birth star</p>
              <h1 className="mt-3 font-serif text-cream text-[40px] sm:text-[52px] lg:text-[60px] leading-[1.04]">
                Nakshatra
                <span className="block font-deva text-gold-lt text-[26px] sm:text-[32px] mt-2">जन्म नक्षत्र</span>
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] text-paper-3/90 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Find the nakshatra and pada the Moon was in when you were born — with its lord, deity and symbol, the
                traditional name syllable, the exact hours the Moon spent there, and your Navatara.
              </p>
              <ul className="mt-5 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-[13px] text-paper-3/80">
                <li>✦ Works from the date alone in most cases</li>
                <li>✦ Lahiri ayanamsha</li>
                <li>✦ Free · no login · nothing stored</li>
              </ul>
              <a href="#nakshatra-form" className="kd-cta mt-7">Enter birth details</a>
            </div>
            <div className="hidden lg:block mx-auto w-full max-w-[400px] opacity-90" aria-hidden="true">
              <div className="kd-wheel-spin"><NakshatraWheel highlight={null} moonLongitude={null} size={400} label="" /></div>
            </div>
          </section>

          <section id="nakshatra-form" aria-label="Nakshatra calculator" className="relative wrap py-10 sm:py-14 scroll-mt-20">
            <NakshatraExperience />
          </section>
          <div className="kd-mithila-strip" aria-hidden="true" />
        </div>

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="about-nak">
          <div className="wrap max-w-3xl space-y-10">
            <div>
              <p className="eyebrow mb-2">Understanding nakshatras</p>
              <h2 id="about-nak" className="section-heading text-[30px] sm:text-[36px]">What is a nakshatra?</h2>
              <div className="ornament-line w-16 mt-3 mb-5" />
              <p className="text-[16px] text-ink leading-relaxed">
                The Moon circles the zodiac in about 27⅓ days. Jyotish divides its path into 27 nakshatras — lunar
                mansions of 13°20′ each — and the one holding the Moon at birth is the Janma nakshatra. In Mithila
                families it decides the first syllable of a child’s name, starts the Vimshottari dasha, and supplies
                four of the eight kootas in Kundli matching.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">The 27 nakshatras</h2>
              <div className="mt-4 card overflow-x-auto">
                <table className="w-full min-w-[560px] text-[14px]">
                  <thead>
                    <tr className="border-b border-gold/25 text-left text-[11px] uppercase tracking-[0.14em] text-terra">
                      <th scope="col" className="px-3 py-2.5 font-semibold">#</th>
                      <th scope="col" className="px-3 py-2.5 font-semibold">Nakshatra</th>
                      <th scope="col" className="px-3 py-2.5 font-semibold">Lord</th>
                      <th scope="col" className="px-3 py-2.5 font-semibold">Deity</th>
                      <th scope="col" className="px-3 py-2.5 font-semibold">Gana</th>
                      <th scope="col" className="px-3 py-2.5 font-semibold">Syllables</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NAKSHATRAS.map((n, i) => (
                      <tr key={n.slug} className="border-b border-gold/10 last:border-0">
                        <td className="px-3 py-2 text-ink-soft">{i + 1}</td>
                        <th scope="row" className="px-3 py-2 text-left font-normal text-ink"><span className="font-deva text-maroon">{n.hi}</span> {n.name}</th>
                        <td className="px-3 py-2 text-ink">{grahaShort(n.lord)}</td>
                        <td className="px-3 py-2 text-ink">{NAKSHATRA_INFO[n.slug].deity}</td>
                        <td className="px-3 py-2 text-ink">{GANA_LABEL[GANA_BY_NAKSHATRA[i]]}</td>
                        <td className="px-3 py-2 text-ink whitespace-nowrap">{NAKSHATRA_INFO[n.slug].syllables.map(s => s[1]).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <MithilaBorder variant="top" />
        <AstrologyMethodology show={['nakshatra']} />

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="faq-title">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Questions families ask</p>
            <h2 id="faq-title" className="section-heading text-[30px] sm:text-[36px]">Nakshatra — FAQ</h2>
            <div className="ornament-line w-16 mt-3 mb-6" />
            <div className="space-y-3">
              {FAQ.map(f => (
                <details key={f.q} className="card p-5 group">
                  <summary className="cursor-pointer font-serif text-maroon text-[18px] leading-snug list-none flex justify-between gap-4">
                    {f.q}<span className="text-gold group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 text-[15px] text-ink leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="font-serif text-maroon text-[20px]">Read more</h2>
                <ul className="mt-3 space-y-2">
                  <li><Link href="/blogs/horoscope-marriage/what-is-nakshatra" className={LINK}>What is Nakshatra?</Link></li>
                  <li><Link href="/blogs/horoscope-marriage/kundli-matching-explained" className={LINK}>Kundli Matching Explained</Link></li>
                </ul>
              </div>
              <div>
                <h2 className="font-serif text-maroon text-[20px]">More astrology tools</h2>
                <ul className="mt-3 space-y-2">
                  <li><Link href="/astrology/janam-kundli" className={LINK}>Janam Kundli — full birth chart</Link></li>
                  <li><Link href="/astrology/kundli-match" className={LINK}>Kundli Match — 36 Guna</Link></li>
                  <li><Link href="/astrology" className={LINK}>All astrology tools</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
