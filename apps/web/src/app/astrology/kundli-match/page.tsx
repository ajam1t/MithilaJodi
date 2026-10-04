import Link from 'next/link'
import '@/styles/kundli.css'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { KundliMatchExperience } from '@/components/astrology/kundli/KundliMatchExperience'
import { LazyCosmicBackdrop } from '@/components/astrology/kundli/LazyCosmicBackdrop'
import { ZodiacWheel } from '@/components/astrology/kundli/ZodiacWheel'
import { METHODOLOGY } from '@/lib/astrology/methodology'
import { SITE_URL } from '@/lib/constants'
import {
  breadcrumbJsonLd, faqJsonLd, jsonLdScript, organizationJsonLd, organizationRef, pageMetadata, webAppJsonLd,
} from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/astrology/kundli-match',
  title: 'Kundli Match — Free Kundli Milan & 36 Guna Matching',
  description:
    'Free Kundli Match for marriage: 36-Guna Ashtakoota matching with all eight kootas explained, Manglik analysis and North Indian charts. Lahiri ayanamsha, no login.',
  keywords: [
    'kundli match', 'kundli matching', 'kundli milan', 'kundli milan 36 guna', 'guna milan', 'ashtakoota matching',
    'manglik compatibility', 'marriage kundli matching', 'maithili kundli matching', 'mithila matrimonial astrology',
  ],
})

const KOOTA_TABLE = [
  ['Varna', 1, 'Disposition and spiritual temperament, from the Moon rashi.'],
  ['Vashya', 2, 'Mutual attraction and balance of influence, from the Moon rashi’s group.'],
  ['Tara', 3, 'Wellbeing and fortune, by counting from one birth star to the other.'],
  ['Yoni', 4, 'Instinctive and physical compatibility, an animal for each nakshatra.'],
  ['Graha Maitri', 5, 'Mental affinity, from the friendship of the two Moon-sign lords.'],
  ['Gana', 6, 'Temperament — Deva, Manushya or Rakshasa.'],
  ['Bhakoot', 7, 'Family welfare and emotional bond, from how the two Moon rashis sit.'],
  ['Nadi', 8, 'Health and progeny — the most heavily weighted koota.'],
] as const

const FAQ = [
  {
    q: 'Is Kundli Match on Mithila Jodi free?',
    a: 'Yes. Kundli Match is free for everyone and works without an account or login.',
  },
  {
    q: 'How many Guna are needed for marriage?',
    a: 'Most Ashtakoota traditions treat 18 of 36 Guna as the minimum. Mithila Jodi reports 0–17 as traditionally challenging, 18–23 as moderate, 24–31 as good and 32–36 as very strong — always alongside the individual kootas and any doshas, which families and pandits weigh separately.',
  },
  {
    q: 'Do I need the exact birth time?',
    a: 'The 36-Guna score depends only on the Moon’s rashi and nakshatra, so it can often be calculated from the date alone. The Lagna, the houses and the Lagna-based Manglik check need the birth time. If you tick “Birth time unknown”, the tool tells you what it can and cannot calculate, and if the Moon changed rashi or nakshatra that day it asks roughly when the birth was instead of guessing.',
  },
  {
    q: 'Are our birth details stored?',
    a: 'No. The calculation runs on our server and nothing is saved. If you choose to create a share link, only the Guna scores, Moon signs and Manglik status are stored — never birth dates, times, places or planet positions — and the link expires after 90 days.',
  },
  {
    q: 'Why might the result differ from another website?',
    a: 'Calculators differ in their ayanamsha, ephemeris and tables. Mithila Jodi uses the Lahiri ayanamsha, mean Rahu/Ketu, whole-sign houses and the tables published in the methodology below. The Guna total only differs when a Moon is very close to a rashi or nakshatra boundary — the result warns you when that is the case.',
  },
  {
    q: 'Is Kundli matching scientifically proven?',
    a: 'No. Kundli matching is a traditional practice, not a science, and no scientific study has shown that Guna scores predict marital happiness. Mithila Jodi calculates the traditional method accurately and transparently so families can use it as one consideration among many.',
  },
]

const BLOG = [
  { href: '/blogs/horoscope-marriage/kundli-matching-explained', label: 'Kundli Matching Explained' },
  { href: '/blogs/horoscope-marriage/what-is-manglik', label: 'What is Manglik Dosha?' },
  { href: '/blogs/horoscope-marriage/what-is-nakshatra', label: 'What is Nakshatra?' },
  { href: '/blogs/horoscope-marriage/what-is-rashi', label: 'What is Rashi?' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/kundli-match#webpage`,
      url: `${SITE_URL}/astrology/kundli-match`,
      name: 'Kundli Match — Free Kundli Milan & 36 Guna Matching',
      description: 'Free 36-Guna Ashtakoota Kundli matching with Manglik analysis and North Indian charts.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/kundli-match#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    { ...breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Kundli Match', path: '/astrology/kundli-match' },
    ]), '@id': `${SITE_URL}/astrology/kundli-match#breadcrumb` },
    {
      ...webAppJsonLd({
        name: 'Kundli Match — 36 Guna Ashtakoota',
        path: '/astrology/kundli-match',
        description: 'Free Ashtakoota Kundli matching: all eight kootas with explanations, Manglik analysis and North Indian birth charts.',
        languages: ['en'],
      }),
      publisher: organizationRef(),
    },
    faqJsonLd(FAQ),
    organizationJsonLd(),
  ],
}

export default function KundliMatchPage() {
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
              <li className="text-gold-lt" aria-current="page">Kundli Match</li>
            </ol>
          </nav>

          <section className="relative wrap pt-10 pb-8 sm:pt-14 lg:pt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="text-[11px] uppercase tracking-[0.3em] text-marigold">Ashtakoota · 36 Guna Milan</p>
              <h1 className="mt-3 font-serif text-cream text-[40px] sm:text-[52px] lg:text-[60px] leading-[1.04]">
                Kundli Match
                <span className="block font-deva text-gold-lt text-[26px] sm:text-[32px] mt-2">कुण्डली मिलान</span>
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] text-paper-3/90 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Discover your traditional Kundli compatibility. Enter the bride’s and the groom’s birth details to see
                all eight kootas, the 36-Guna score, Manglik analysis and both birth charts — every number explained.
              </p>
              <ul className="mt-5 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-[13px] text-paper-3/80">
                <li>✦ Lahiri ayanamsha</li>
                <li>✦ Real ephemeris, checked against NASA JPL</li>
                <li>✦ Free · no login · nothing stored</li>
              </ul>
              <a href="#kundli-form" className="kd-cta mt-7">Enter birth details</a>
            </div>
            <div className="hidden lg:block mx-auto w-full max-w-[420px] opacity-90">
              <div className="kd-wheel-spin"><ZodiacWheel size={420} decorative /></div>
            </div>
          </section>

          <div className="kd-lotus-rule wrap" aria-hidden="true">
            <svg width="22" height="14" viewBox="0 0 22 14" fill="currentColor"><path d="M11 0c2 3 2 7 0 10-2-3-2-7 0-10zM4 5c3 0 6 2 7 5-3 0-6-2-7-5zm14 0c-1 3-4 5-7 5 1-3 4-5 7-5zM2 11h18v1H2z" opacity="0.8" /></svg>
          </div>

          <section id="kundli-form" aria-label="Kundli Match calculator" className="relative wrap py-10 sm:py-14 scroll-mt-20">
            <KundliMatchExperience />
          </section>
          <div className="kd-mithila-strip" aria-hidden="true" />
        </div>

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="about-kundli">
          <div className="wrap max-w-3xl space-y-10">
            <div>
              <p className="eyebrow mb-2">Understanding the tool</p>
              <h2 id="about-kundli" className="section-heading text-[30px] sm:text-[36px]">What is Kundli Match?</h2>
              <div className="ornament-line w-16 mt-3 mb-5" />
              <p className="text-[16px] text-ink leading-relaxed">
                Kundli Match — Kundli Milan — compares the birth charts of a prospective bride and groom using the
                traditional rules of Jyotish. In Mithila, as across North India, families have long consulted the
                kundli alongside gotra, mool and family background before a marriage is settled.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">What is Guna Milan?</h2>
              <p className="mt-3 text-[16px] text-ink leading-relaxed">
                Guna Milan is the scoring step of Kundli Match. The Ashtakoota (“eight kootas”) system compares eight
                attributes of the two Moon charts and awards up to 36 points — the Guna. Each koota has its own weight,
                rising from Varna (1) to Nadi (8).
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">The eight kootas</h2>
              <div className="mt-4 card overflow-x-auto">
                <table className="w-full min-w-[480px] text-[14px]">
                  <thead>
                    <tr className="border-b border-gold/25 text-left text-[11px] uppercase tracking-[0.14em] text-terra">
                      <th scope="col" className="px-4 py-3 font-semibold">Koota</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Points</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Traditionally indicates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {KOOTA_TABLE.map(([name, pts, desc]) => (
                      <tr key={name} className="border-b border-gold/10 last:border-0">
                        <th scope="row" className="px-4 py-2.5 text-left font-serif text-maroon text-[16px] font-normal">{name}</th>
                        <td className="px-4 py-2.5 text-ink">{pts}</td>
                        <td className="px-4 py-2.5 text-ink-soft">{desc}</td>
                      </tr>
                    ))}
                    <tr><th scope="row" className="px-4 py-2.5 text-left font-semibold text-ink">Total</th><td className="px-4 py-2.5 font-semibold text-ink">36</td><td /></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">What is Manglik dosha?</h2>
              <p className="mt-3 text-[16px] text-ink leading-relaxed">
                A chart is called Manglik when Mars (Mangal) occupies certain houses — Mithila Jodi checks houses{' '}
                {METHODOLOGY.manglik.houses.join(', ')} counted from both the Lagna and the Moon. Tradition treats it as
                something to balance rather than a verdict: two Manglik charts are generally considered to balance
                each other, and several classical cancellations exist. The tool shows where Mars is and why the status
                was reached, so it can be discussed with a pandit.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">How does Mithila Jodi calculate compatibility?</h2>
              <p className="mt-3 text-[16px] text-ink leading-relaxed">
                Planet positions come from a real astronomical ephemeris, converted to the sidereal zodiac with the
                Lahiri ayanamsha — the Indian national standard. The local birth time is converted with the time-zone
                history of the birthplace. The Moon’s rashi and nakshatra then drive the eight kootas, using the tables
                published in full below. The same details always give the same result.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">Is Kundli matching scientifically proven?</h2>
              <p className="mt-3 text-[16px] text-ink leading-relaxed">
                No. Kundli matching is a traditional belief and practice; it has not been shown scientifically to
                predict whether a marriage will be happy. The astronomy behind it is real and calculated precisely
                here, but what the positions mean is a matter of tradition. Mithila Jodi presents the result as
                traditional guidance — never as a guarantee or a reason on its own to accept or reject a match.
              </p>
            </div>
          </div>
        </section>

        <MithilaBorder variant="top" />

        <section id="methodology" className="bg-cream py-14 sm:py-16 scroll-mt-20" aria-labelledby="methodology-title">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Methodology v{METHODOLOGY.version}</p>
            <h2 id="methodology-title" className="section-heading text-[30px] sm:text-[36px]">Exactly how the calculation works</h2>
            <div className="ornament-line w-16 mt-3 mb-6" />
            <p className="text-[15px] text-ink-soft leading-relaxed">
              Mithila Jodi uses this methodology consistently for all its astrology calculations. Every result records
              the methodology version that produced it.
            </p>

            <dl className="mt-6 space-y-5">
              {([
                ['Zodiac and ayanamsha', `${METHODOLOGY.zodiac}, ${METHODOLOGY.ayanamsha.name}. Anchored to the Calendar Reform Committee value for 21 March 1956 and carried to any date with the ${METHODOLOGY.ayanamsha.precessionModel}.`],
                ['Ephemeris', `${METHODOLOGY.ephemeris.library} ${METHODOLOGY.ephemeris.libraryVersion} (${METHODOLOGY.ephemeris.licence} licence): ${METHODOLOGY.ephemeris.planets}; Moon: ${METHODOLOGY.ephemeris.moon}. Checked against NASA JPL’s DE421 ephemeris for 40 dates from 1900 to 2045: the Moon agrees within 20 arcseconds and the planets within 13 — far finer than the 3°20′ of a nakshatra pada.`],
                ['Why not Swiss Ephemeris?', METHODOLOGY.ephemeris.whyNotSwissEphemeris],
                ['Rahu and Ketu', METHODOLOGY.nodes],
                ['Houses and chart', `${METHODOLOGY.houses}. ${METHODOLOGY.chartStyle}.`],
                ['Lagna', METHODOLOGY.lagna],
                ['Time zones', METHODOLOGY.timezones],
                ['Unknown birth time', 'No time is assumed. The Lagna, houses and Lagna-based Manglik check are left out. If the Moon changed rashi, nakshatra or Vashya group during the birth date, you are asked which part of the day the birth fell in — or shown every possibility.'],
              ] as const).map(([k, v]) => (
                <div key={k}>
                  <dt className="font-serif text-maroon text-[18px]">{k}</dt>
                  <dd className="mt-1 text-[15px] text-ink leading-relaxed">{v}</dd>
                </div>
              ))}
            </dl>

            <h3 className="mt-10 font-serif text-maroon text-[22px]">Ashtakoota rules</h3>
            <p className="mt-2 text-[15px] text-ink-soft leading-relaxed">{METHODOLOGY.ashtakoota.basis}</p>
            <dl className="mt-4 space-y-3">
              {Object.entries(METHODOLOGY.ashtakoota.kootas).map(([key, rule]) => (
                <div key={key} className="rounded-mj-sm bg-paper px-4 py-3">
                  <dt className="font-semibold text-ink capitalize">{key === 'grahaMaitri' ? 'Graha Maitri' : key}</dt>
                  <dd className="mt-0.5 text-[14px] text-ink leading-relaxed">{rule}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[15px] text-ink leading-relaxed">{METHODOLOGY.ashtakoota.cancellations}</p>

            <h3 className="mt-10 font-serif text-maroon text-[22px]">Manglik rules</h3>
            <p className="mt-2 text-[15px] text-ink leading-relaxed">
              Houses {METHODOLOGY.manglik.houses.join(', ')}, reckoned from {METHODOLOGY.manglik.reckonedFrom}. {METHODOLOGY.manglik.status}{' '}
              {METHODOLOGY.manglik.notedExceptions} {METHODOLOGY.manglik.houseVariantNote}
            </p>

            <h3 className="mt-10 font-serif text-maroon text-[22px]">Score bands</h3>
            <ul className="mt-3 space-y-1.5 text-[15px] text-ink">
              {METHODOLOGY.scoreBands.map(b => <li key={b.key}><strong>{b.min}–{b.max}</strong> · {b.label}</li>)}
            </ul>

            <h3 className="mt-10 font-serif text-maroon text-[22px]">Compared with other calculators</h3>
            <p className="mt-2 text-[15px] text-ink leading-relaxed">
              Published Sankranti times from Drik Panchang run 2 to 16 minutes later than this engine’s. The difference
              follows the 18.6-year nutation cycle exactly: Drik Panchang applies an ayanamsha about 23″ larger to
              longitudes that still include nutation, whereas Mithila Jodi follows the Swiss Ephemeris convention, in
              which nutation cancels. For the Moon this is at most about a minute and a half of birth time, so rashi,
              nakshatra and Guna results differ only for a birth within roughly a minute of a boundary.
            </p>

            <p className="mt-8 rounded-mj border border-gold/30 bg-paper-2/70 px-5 py-4 text-[14px] text-ink leading-relaxed">{METHODOLOGY.review}</p>
          </div>
        </section>

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="faq-title">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Questions families ask</p>
            <h2 id="faq-title" className="section-heading text-[30px] sm:text-[36px]">Kundli Match — FAQ</h2>
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
                  {BLOG.map(b => <li key={b.href}><Link href={b.href} className="text-maroon underline underline-offset-4 decoration-gold/50 hover:text-terra">{b.label}</Link></li>)}
                </ul>
              </div>
              <div>
                <h2 className="font-serif text-maroon text-[20px]">More astrology tools</h2>
                <ul className="mt-3 space-y-2">
                  <li><Link href="/astrology" className="text-maroon underline underline-offset-4 decoration-gold/50 hover:text-terra">All astrology tools</Link></li>
                  <li><Link href="/astrology/manglik" className="text-maroon underline underline-offset-4 decoration-gold/50 hover:text-terra">Manglik Check</Link></li>
                  <li><Link href="/marriage-biodata" className="text-maroon underline underline-offset-4 decoration-gold/50 hover:text-terra">Create a marriage biodata</Link></li>
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
