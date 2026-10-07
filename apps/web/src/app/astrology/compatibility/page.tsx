import Link from 'next/link'
import { ToolEmblem } from '@/components/astrology/ToolEmblem'
import { MoreTools } from '@/components/astrology/MoreTools'
import '@/styles/kundli.css'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { CompatibilityExperience } from '@/components/astrology/compatibility/CompatibilityExperience'
import { LazyCosmicBackdrop } from '@/components/astrology/kundli/LazyCosmicBackdrop'
import { NorthIndianChart } from '@/components/astrology/kundli/KundliChart'
import { AstrologyMethodology } from '@/components/astrology/AstrologyMethodology'
import { SITE_URL } from '@/lib/constants'
import {
  breadcrumbJsonLd, faqJsonLd, jsonLdScript, organizationJsonLd, organizationRef, pageMetadata, webAppJsonLd,
} from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/astrology/compatibility',
  title: 'Horoscope Compatibility — Beyond the 36 Guna',
  description:
    'Horoscope compatibility beyond the 36 Guna: Ashtakoota and Manglik, plus Lagna and 7th house, Navamsa (D9) and cross-chart aspects, with every rule published.',
  keywords: [
    'horoscope compatibility', 'vedic compatibility', 'kundli compatibility', 'navamsa matching',
    '7th house marriage', 'synastry vedic', 'guna milan', 'marriage compatibility astrology',
  ],
})

const FAQ = [
  {
    q: 'How is this different from Kundli Match?',
    a: 'Kundli Match is the Ashtakoota — 36 Guna from the two Moon charts — with the Manglik check. Compatibility shows exactly that result first, then the factors a pandit looks at next: the two Lagnas, the 7th house and its lord, the Navamsa, where each person’s Moon, Venus and Jupiter fall in the other’s chart, and the aspects between the charts.',
  },
  {
    q: 'Is there a compatibility percentage?',
    a: 'No. The Guna total is the only score, because it is the only one tradition defines. The other factors are listed as facts — with the rule that produced each — for a pandit or family to weigh. Mixing them into one number would hide more than it shows.',
  },
  {
    q: 'Why does it need the birth time?',
    a: 'The Lagna changes about every two hours, and the 7th house, the Navamsa Lagna and the house positions all depend on it. Without a birth time those parts are left out rather than guessed; the Moon-based parts still work.',
  },
  {
    q: 'What is the Navamsa and why does it matter for marriage?',
    a: 'The Navamsa (D9) divides each sign into nine parts. Tradition treats it as the chart of marriage and partnership, and pandits compare the two Navamsa Lagnas and the positions of the Moon and Venus in it.',
  },
  {
    q: 'Are aspects between two charts a classical idea?',
    a: 'Comparing how one chart’s planets fall in and aspect the other’s is a long-standing part of Indian practice, though less codified than the Ashtakoota. Mithila Jodi uses only whole-sign graha drishti — the standard Parashari aspects — and leaves Rahu and Ketu out because their aspects are disputed.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/compatibility#webpage`,
      url: `${SITE_URL}/astrology/compatibility`,
      name: 'Horoscope Compatibility — Beyond the 36 Guna | Mithila Jodi',
      description: 'The Ashtakoota and Manglik result plus the Lagna, 7th house, Navamsa and cross-chart factors, with every rule published.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/compatibility#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    { ...breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Compatibility', path: '/astrology/compatibility' },
    ]), '@id': `${SITE_URL}/astrology/compatibility#breadcrumb` },
    {
      ...webAppJsonLd({
        name: 'Vedic Horoscope Compatibility',
        path: '/astrology/compatibility',
        description: 'Free two-chart Vedic compatibility: Ashtakoota, Manglik, Lagna and 7th house, Navamsa and cross-chart aspects.',
        languages: ['en'],
      }),
      publisher: organizationRef(),
    },
    faqJsonLd(FAQ),
    organizationJsonLd(),
  ],
}

const LINK = 'text-maroon underline underline-offset-2 decoration-gold/50 hover:text-terra'

export default function CompatibilityPage() {
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
              <li className="text-terra" aria-current="page">Compatibility</li>
            </ol>
          </nav>

          <section className="relative wrap pt-10 pb-8 sm:pt-14 lg:pt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="text-center lg:text-left">
              <ToolEmblem tool="compatibility" size={68} className="mx-auto lg:mx-0 mb-4 drop-shadow-md" />
              <p className="text-[11px] uppercase tracking-[0.3em] text-terra font-semibold">Beyond the 36 Guna</p>
              <h1 className="mt-3 font-serif text-maroon text-[40px] sm:text-[52px] lg:text-[60px] leading-[1.04]">
                Compatibility
                <span className="block font-deva text-terra text-[26px] sm:text-[32px] mt-2">विवाह मेलापक विचार</span>
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] text-ink leading-relaxed max-w-xl mx-auto lg:mx-0">
                The Ashtakoota and Manglik result, then what a pandit looks at next — the two Lagnas and the 7th house,
                the Navamsa, where each person’s planets fall in the other’s chart, and the aspects between them.
              </p>
              <ul className="mt-5 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-[13px] text-ink-soft">
                <li>✦ Same engine as Kundli Match</li>
                <li>✦ No made-up percentage</li>
                <li>✦ Free · no login · nothing stored</li>
              </ul>
              <a href="#compatibility-form" className="kd-cta mt-7">Enter birth details</a>
            </div>
            <div className="hidden lg:block mx-auto w-full max-w-[360px] opacity-90" aria-hidden="true">
              <NorthIndianChart firstRashiIndex={0} placements={[]} firstHouseLabel="1" shadeHouses={[1, 7]} description="" size={360} />
              <p className="mt-2 text-center text-[12px] text-ink-soft">The 1st house (Lagna) and the 7th, the house of marriage</p>
            </div>
          </section>

          <section id="compatibility-form" aria-label="Compatibility calculator" className="relative wrap py-10 sm:py-14 scroll-mt-20">
            <CompatibilityExperience />
          </section>
          <div className="kd-mithila-strip" aria-hidden="true" />
        </div>

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="about-compat">
          <div className="wrap max-w-3xl space-y-10">
            <div>
              <p className="eyebrow mb-2">Understanding the tool</p>
              <h2 id="about-compat" className="section-heading text-[30px] sm:text-[36px]">What does Compatibility add?</h2>
              <div className="ornament-line w-16 mt-3 mb-5" />
              <p className="text-[16px] text-ink leading-relaxed">
                The 36-Guna Ashtakoota compares only the two Moons. When a family pandit reads a match they go further:
                they look at each Lagna and the 7th house — the house of marriage — at the Navamsa, the divisional chart
                of partnership, and at how one person’s planets sit in and look at the other’s chart. This tool lays
                those facts out side by side, each with the rule that produced it.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">Why there is no single score</h2>
              <p className="mt-3 text-[16px] text-ink leading-relaxed">
                Tradition defines a score for the Ashtakoota and nothing else. Adding the other factors into a percentage
                would mean inventing weights no text gives, so the summary lists only what the Ashtakoota and Manglik rules
                establish, and everything else is shown for a pandit to weigh.
              </p>
            </div>
          </div>
        </section>

        <MithilaBorder variant="top" />
        <AstrologyMethodology show={['match', 'compat']} />

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="faq-title">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Questions families ask</p>
            <h2 id="faq-title" className="section-heading text-[30px] sm:text-[36px]">Compatibility — FAQ</h2>
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
                  <li><Link href="/blogs/horoscope-marriage/kundli-matching-explained" className={LINK}>Kundli Matching Explained</Link></li>
                  <li><Link href="/blogs/horoscope-marriage/what-is-manglik" className={LINK}>What is Manglik Dosha?</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <MoreTools current="compatibility" />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
