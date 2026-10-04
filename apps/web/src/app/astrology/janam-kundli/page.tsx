import Link from 'next/link'
import { ToolEmblem } from '@/components/astrology/ToolEmblem'
import { MoreTools } from '@/components/astrology/MoreTools'
import '@/styles/kundli.css'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { JanamKundliExperience } from '@/components/astrology/janam/JanamKundliExperience'
import { LazyCosmicBackdrop } from '@/components/astrology/kundli/LazyCosmicBackdrop'
import { ZodiacWheel } from '@/components/astrology/kundli/ZodiacWheel'
import { AstrologyMethodology } from '@/components/astrology/AstrologyMethodology'
import { SITE_URL } from '@/lib/constants'
import {
  breadcrumbJsonLd, faqJsonLd, jsonLdScript, organizationJsonLd, organizationRef, pageMetadata, webAppJsonLd,
} from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/astrology/janam-kundli',
  title: 'Janam Kundli — Free Vedic Birth Chart Online',
  description:
    'Free Janam Kundli: Lagna, Chandra and Navamsa charts, nine planets with nakshatra and pada, Vimshottari dasha and the panchang at birth. Lahiri ayanamsha, no login.',
  keywords: [
    'janam kundli', 'janam kundli online', 'free kundli', 'birth chart', 'vedic birth chart', 'kundli by date of birth',
    'navamsa chart', 'vimshottari dasha', 'lagna kundli', 'maithili kundli',
  ],
})

const FAQ = [
  {
    q: 'What is a Janam Kundli?',
    a: 'A Janam Kundli is the Vedic birth chart: where the Sun, Moon, five planets and Rahu and Ketu stood in the sidereal zodiac at the moment and place of birth, arranged in twelve houses from the Lagna (the sign rising in the east).',
  },
  {
    q: 'Do I need the exact birth time?',
    a: 'For the Lagna, the houses, the Navamsa Lagna, the Vimshottari dasha dates and the panchang, yes — these change within minutes or hours. Without a time the tool still gives the planets’ signs and, where the date fixes it, the Moon’s rashi and nakshatra, and it tells you exactly what it could not calculate.',
  },
  {
    q: 'What is the difference between Lagna and Moon sign?',
    a: 'The Lagna is the sign rising on the eastern horizon at birth and changes about every two hours; it sets the houses. The Moon sign (Janma Rashi) is the sign the Moon was in and changes about every two and a half days; it is the basis of Kundli matching and the dasha.',
  },
  {
    q: 'What are the Navamsa and the dasha?',
    a: 'The Navamsa (D9) divides each sign into nine parts and is the divisional chart traditionally read for marriage. The Vimshottari dasha is a 120-year calendar of planetary periods that starts from the Moon’s nakshatra at birth.',
  },
  {
    q: 'Is my birth data stored?',
    a: 'No. The chart is calculated on our server and nothing is saved. There is no share link for a Janam Kundli, because a full birth chart reveals the date and time of birth.',
  },
  {
    q: 'Can a Janam Kundli predict the future?',
    a: 'No. The planetary positions are real astronomy, calculated precisely; what they mean is a matter of tradition, not science. Mithila Jodi presents the chart as traditional information and makes no predictions.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/janam-kundli#webpage`,
      url: `${SITE_URL}/astrology/janam-kundli`,
      name: 'Janam Kundli — Free Vedic Birth Chart Online',
      description: 'Free Vedic birth chart with Lagna, Chandra and Navamsa charts, planetary positions, Vimshottari dasha and panchang at birth.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/janam-kundli#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    { ...breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Janam Kundli', path: '/astrology/janam-kundli' },
    ]), '@id': `${SITE_URL}/astrology/janam-kundli#breadcrumb` },
    {
      ...webAppJsonLd({
        name: 'Janam Kundli — Vedic Birth Chart',
        path: '/astrology/janam-kundli',
        description: 'Free Vedic birth chart: Lagna, Chandra and Navamsa charts, nine grahas with nakshatra and pada, Vimshottari dasha and panchang.',
        languages: ['en'],
      }),
      publisher: organizationRef(),
    },
    faqJsonLd(FAQ),
    organizationJsonLd(),
  ],
}

const LINK = 'text-maroon underline underline-offset-4 decoration-gold/50 hover:text-terra'

export default function JanamKundliPage() {
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
              <li className="text-terra" aria-current="page">Janam Kundli</li>
            </ol>
          </nav>

          <section className="relative wrap pt-10 pb-8 sm:pt-14 lg:pt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="text-center lg:text-left">
              <ToolEmblem tool="janam-kundli" size={68} className="mx-auto lg:mx-0 mb-4 drop-shadow-md" />
              <p className="text-[11px] uppercase tracking-[0.3em] text-terra font-semibold">Vedic birth chart</p>
              <h1 className="mt-3 font-serif text-maroon text-[40px] sm:text-[52px] lg:text-[60px] leading-[1.04]">
                Janam Kundli
                <span className="block font-deva text-terra text-[26px] sm:text-[32px] mt-2">जन्म कुण्डली</span>
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] text-ink leading-relaxed max-w-xl mx-auto lg:mx-0">
                Your birth chart as the sky actually stood: Lagna, Chandra and Navamsa charts, all nine grahas with
                nakshatra and pada, the Vimshottari dasha and the panchang of the moment you were born.
              </p>
              <ul className="mt-5 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-[13px] text-ink-soft">
                <li>✦ Lahiri ayanamsha</li>
                <li>✦ Real ephemeris, checked against NASA JPL</li>
                <li>✦ Free · no login · nothing stored</li>
              </ul>
              <a href="#janam-form" className="kd-cta mt-7">Enter birth details</a>
            </div>
            <div className="hidden lg:block mx-auto w-full max-w-[420px] opacity-90">
              <div className="kd-wheel-spin"><ZodiacWheel size={420} decorative /></div>
            </div>
          </section>

          <section id="janam-form" aria-label="Janam Kundli calculator" className="relative wrap py-10 sm:py-14 scroll-mt-20">
            <JanamKundliExperience />
          </section>
          <div className="kd-mithila-strip" aria-hidden="true" />
        </div>

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="about-janam">
          <div className="wrap max-w-3xl space-y-10">
            <div>
              <p className="eyebrow mb-2">Understanding the chart</p>
              <h2 id="about-janam" className="section-heading text-[30px] sm:text-[36px]">What is a Janam Kundli?</h2>
              <div className="ornament-line w-16 mt-3 mb-5" />
              <p className="text-[16px] text-ink leading-relaxed">
                The Janam Kundli — Janma Kundali, the birth chart — records where the Sun, the Moon, Mars, Mercury,
                Jupiter, Venus, Saturn, Rahu and Ketu stood in the sidereal zodiac at the moment and place of birth. In
                Mithila families it is made soon after a child is born, consulted for naming and important ceremonies,
                and brought out again when marriage is discussed.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">Lagna, Moon sign and houses</h2>
              <p className="mt-3 text-[16px] text-ink leading-relaxed">
                The <strong>Lagna</strong> is the sign rising on the eastern horizon at birth; it becomes the 1st house,
                and each following sign the next house. It changes roughly every two hours, which is why an accurate
                birth time matters. The <strong>Janma Rashi</strong> is the Moon’s sign and the <strong>Janma
                nakshatra</strong> the Moon’s lunar mansion — the starting point for Kundli matching, naming syllables
                and the dasha.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">Navamsa and Vimshottari dasha</h2>
              <p className="mt-3 text-[16px] text-ink leading-relaxed">
                The <strong>Navamsa</strong> (D9) divides each sign into nine parts of 3°20′ and is the divisional
                chart traditionally read alongside the birth chart for marriage. The <strong>Vimshottari dasha</strong>{' '}
                is a 120-year calendar of planetary periods that begins with the ruler of the Moon’s nakshatra; the
                tool lists every Mahadasha and Antardasha with its dates.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">Is a Janam Kundli scientific?</h2>
              <p className="mt-3 text-[16px] text-ink leading-relaxed">
                The astronomy is: every position here is calculated from a real ephemeris and checked against NASA’s.
                What the positions <em>mean</em> is tradition, not science, and no study has shown that a birth chart
                predicts a person’s life. Mithila Jodi presents the chart as traditional information and makes no
                predictions.
              </p>
            </div>
          </div>
        </section>

        <MithilaBorder variant="top" />
        <AstrologyMethodology show={['janam']} />

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="faq-title">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Questions families ask</p>
            <h2 id="faq-title" className="section-heading text-[30px] sm:text-[36px]">Janam Kundli — FAQ</h2>
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
                  <li><Link href="/blogs/horoscope-marriage/what-is-nakshatra" className={LINK}>What is Nakshatra?</Link></li>
                  <li><Link href="/blogs/horoscope-marriage/what-is-manglik" className={LINK}>What is Manglik Dosha?</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <MoreTools current="janam-kundli" />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
