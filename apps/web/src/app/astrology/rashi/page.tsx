import Link from 'next/link'
import { ToolEmblem } from '@/components/astrology/ToolEmblem'
import { MoreTools } from '@/components/astrology/MoreTools'
import '@/styles/kundli.css'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { RashiExperience } from '@/components/astrology/rashi/RashiExperience'
import { LazyCosmicBackdrop } from '@/components/astrology/kundli/LazyCosmicBackdrop'
import { ZodiacWheel } from '@/components/astrology/kundli/ZodiacWheel'
import { AstrologyMethodology } from '@/components/astrology/AstrologyMethodology'
import { grahaShort } from '@/components/astrology/kundli/format'
import { RASHIS, NAKSHATRAS } from '@/lib/astrology/vedic/zodiac'
import { QUALITY_LABEL, TATTVA_LABEL, padasInRashi, rashiAttributes } from '@/lib/astrology/vedic/rashiInfo'
import { SITE_URL } from '@/lib/constants'
import {
  breadcrumbJsonLd, faqJsonLd, jsonLdScript, organizationJsonLd, organizationRef, pageMetadata, webAppJsonLd,
} from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/astrology/rashi',
  title: 'Rashi Calculator — Find Your Moon Sign (Janma Rashi)',
  description:
    'Find your Janma rashi — the Vedic Moon sign — from date, time and place of birth, with its lord and element, your Vedic and Western Sun signs, and Moon-sign compatibility. Free.',
  keywords: [
    'rashi calculator', 'janma rashi', 'moon sign calculator', 'vedic moon sign', 'rashi by date of birth',
    'vedic vs western sign', 'chandra rashi', 'maithili rashi',
  ],
})

const FAQ = [
  {
    q: 'What is a Janma rashi?',
    a: 'It is the sign of the sidereal zodiac the Moon was in when you were born — your Moon sign. In Indian practice it is used far more than the Sun sign: for Kundli matching, naming traditions and the Chandra Kundli.',
  },
  {
    q: 'Why is my Vedic sign different from my Western star sign?',
    a: 'Western astrology uses the tropical zodiac, tied to the seasons; Vedic astrology uses the sidereal zodiac, tied to the stars. They are about 24° apart today, so the Vedic Sun sign is usually one sign earlier than the Western one — and the Western “star sign” is a Sun sign, while the Janma rashi is a Moon sign.',
  },
  {
    q: 'Can I find my rashi without the birth time?',
    a: 'Usually yes. The Moon stays in a rashi for about two and a half days, so the date alone fixes it on most days. If the Moon changed rashi that day, the tool asks roughly when the birth was, or shows both possibilities.',
  },
  {
    q: 'Does the same rashi mean a good match?',
    a: 'Not on its own. The Moon signs decide two of the eight kootas — Bhakoot and Graha Maitri, 12 of 36 points. The rest need both nakshatras, which is what Kundli Match calculates.',
  },
  {
    q: 'Does my rashi describe my personality?',
    a: 'Mithila Jodi gives the traditional attributes of the sign — its lord, element and quality — and makes no claims about character or the future. What a rashi means is a matter of tradition, not science.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/rashi#webpage`,
      url: `${SITE_URL}/astrology/rashi`,
      name: 'Rashi Calculator — Find Your Moon Sign (Janma Rashi)',
      description: 'Find your Janma rashi with its lord and element, your Vedic and Western Sun signs, and Moon-sign compatibility.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/rashi#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    { ...breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Rashi', path: '/astrology/rashi' },
    ]), '@id': `${SITE_URL}/astrology/rashi#breadcrumb` },
    {
      ...webAppJsonLd({
        name: 'Rashi Calculator',
        path: '/astrology/rashi',
        description: 'Free Janma rashi (Moon sign) calculator with Vedic and Western sign comparison and Moon-sign compatibility.',
        languages: ['en'],
      }),
      publisher: organizationRef(),
    },
    faqJsonLd(FAQ),
    organizationJsonLd(),
  ],
}

const LINK = 'text-maroon underline underline-offset-4 decoration-gold/50 hover:text-terra'

export default function RashiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <MithilaHeader />

      <main id="main-content" className="flex-1">
        <div className="kd-cosmic">
          <div className="kd-stars" aria-hidden="true" />
          <LazyCosmicBackdrop />

          <nav aria-label="Breadcrumb" className="relative border-b kd-hairline">
            <ol className="wrap flex items-center gap-2 py-3 text-[12px] text-ink-soft">
              <li><Link href="/" className="hover:text-maroon transition-colors">Home</Link></li>
              <li aria-hidden="true" className="text-gold/40">›</li>
              <li><Link href="/astrology" className="hover:text-maroon transition-colors">Astrology Tools</Link></li>
              <li aria-hidden="true" className="text-gold/40">›</li>
              <li className="text-terra" aria-current="page">Rashi</li>
            </ol>
          </nav>

          <section className="relative wrap pt-10 pb-8 sm:pt-14 lg:pt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="text-center lg:text-left">
              <ToolEmblem tool="rashi" size={68} className="mx-auto lg:mx-0 mb-4 drop-shadow-md" />
              <p className="text-[11px] uppercase tracking-[0.3em] text-terra font-semibold">Moon sign</p>
              <h1 className="mt-3 font-serif text-maroon text-[40px] sm:text-[52px] lg:text-[60px] leading-[1.04]">
                Rashi
                <span className="block font-deva text-terra text-[26px] sm:text-[32px] mt-2">जन्म राशि</span>
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] text-ink leading-relaxed max-w-xl mx-auto lg:mx-0">
                Find your Janma rashi — the sign the Moon was in at birth — with its lord, element and quality, how it
                compares with your Western star sign, and how the twelve Moon signs sit with it for matching.
              </p>
              <ul className="mt-5 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-[13px] text-ink-soft">
                <li>✦ Works from the date alone on most days</li>
                <li>✦ Lahiri ayanamsha</li>
                <li>✦ Free · no login · nothing stored</li>
              </ul>
              <a href="#rashi-form" className="kd-cta mt-7">Enter birth details</a>
            </div>
            <div className="hidden lg:block mx-auto w-full max-w-[420px] opacity-90">
              <div className="kd-wheel-spin"><ZodiacWheel size={420} decorative /></div>
            </div>
          </section>

          <section id="rashi-form" aria-label="Rashi calculator" className="relative wrap py-10 sm:py-14 scroll-mt-20">
            <RashiExperience />
          </section>
          <div className="kd-mithila-strip" aria-hidden="true" />
        </div>

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="about-rashi">
          <div className="wrap max-w-3xl space-y-10">
            <div>
              <p className="eyebrow mb-2">Understanding rashis</p>
              <h2 id="about-rashi" className="section-heading text-[30px] sm:text-[36px]">What is a rashi?</h2>
              <div className="ornament-line w-16 mt-3 mb-5" />
              <p className="text-[16px] text-ink leading-relaxed">
                The zodiac is divided into twelve rashis of 30°. In Indian practice the most important is the
                <strong> Janma rashi</strong> — the sign of the Moon at birth — rather than the Sun sign of Western
                horoscopes. It is the rashi written in a Mithila biodata, the first house of the Chandra Kundli, and
                the basis of two of the eight kootas in Kundli matching.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">The twelve rashis</h2>
              <div className="mt-4 card overflow-x-auto">
                <table className="w-full min-w-[640px] text-[14px]">
                  <thead>
                    <tr className="border-b border-gold/25 text-left text-[11px] uppercase tracking-[0.14em] text-terra">
                      <th scope="col" className="px-3 py-2.5 font-semibold">Rashi</th>
                      <th scope="col" className="px-3 py-2.5 font-semibold">Western</th>
                      <th scope="col" className="px-3 py-2.5 font-semibold">Lord</th>
                      <th scope="col" className="px-3 py-2.5 font-semibold">Element · quality</th>
                      <th scope="col" className="px-3 py-2.5 font-semibold">Nakshatras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RASHIS.map((r, i) => {
                      const a = rashiAttributes(i)
                      return (
                        <tr key={r.slug} className="border-b border-gold/10 last:border-0 align-top">
                          <th scope="row" className="px-3 py-2 text-left font-normal text-ink whitespace-nowrap"><span className="font-deva text-maroon">{r.hi}</span> {r.name}</th>
                          <td className="px-3 py-2 text-ink">{r.western}</td>
                          <td className="px-3 py-2 text-ink">{grahaShort(r.lord)}</td>
                          <td className="px-3 py-2 text-ink">{TATTVA_LABEL[a.tattva].split(' ')[0]} · {QUALITY_LABEL[a.quality].split(' ')[0]}</td>
                          <td className="px-3 py-2 text-ink-soft text-[13px]">
                            {padasInRashi(i).map(g => `${NAKSHATRAS[g.nakshatraIndex].name}${g.padas.length < 4 ? ` (${g.padas.join(', ')})` : ''}`).join(', ')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <MithilaBorder variant="top" />
        <AstrologyMethodology show={['rashi']} />

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="faq-title">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Questions families ask</p>
            <h2 id="faq-title" className="section-heading text-[30px] sm:text-[36px]">Rashi — FAQ</h2>
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
            <div className="mt-12">
              <div>
                <h2 className="font-serif text-maroon text-[20px]">Read more</h2>
                <ul className="mt-3 space-y-2">
                  <li><Link href="/blogs/horoscope-marriage/what-is-rashi" className={LINK}>What is Rashi?</Link></li>
                  <li><Link href="/blogs/horoscope-marriage/kundli-matching-explained" className={LINK}>Kundli Matching Explained</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <MoreTools current="rashi" />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
