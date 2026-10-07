import Link from 'next/link'
import { ToolEmblem } from '@/components/astrology/ToolEmblem'
import { MoreTools } from '@/components/astrology/MoreTools'
import '@/styles/kundli.css'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { BabyNamesExperience } from '@/components/astrology/baby/BabyNamesExperience'
import { LazyCosmicBackdrop } from '@/components/astrology/kundli/LazyCosmicBackdrop'
import { AstrologyMethodology } from '@/components/astrology/AstrologyMethodology'
import { RASHIS } from '@/lib/astrology/vedic/zodiac'
import { rashiSyllables } from '@/lib/astrology/vedic/nameSyllable'
import { SITE_URL } from '@/lib/constants'
import {
  breadcrumbJsonLd, faqJsonLd, jsonLdScript, organizationJsonLd, organizationRef, pageMetadata, webAppJsonLd,
} from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/astrology/baby-names',
  title: 'Baby Name Letters by Nakshatra — Naamkaran Syllable',
  description:
    'Find the traditional first syllable for your baby’s name from the birth nakshatra and pada, see the rashi letters, and check whether a name you like fits. Free, no login.',
  keywords: [
    'baby name by nakshatra', 'nakshatra name letters', 'rashi name letters', 'naamkaran', 'baby name syllable',
    'hindu baby names by birth star', 'maithili baby names', 'name akshar by date of birth',
  ],
})

const FAQ = [
  {
    q: 'How is the name syllable decided?',
    a: 'From the child’s Janma nakshatra and its pada — the quarter of the nakshatra the Moon was in at birth. Each of the 108 padas has a traditional syllable (the Avakahada Chakra), and the name traditionally begins with it.',
  },
  {
    q: 'What are rashi letters?',
    a: 'The syllables of all nine padas that make up the Moon’s rashi. Many families accept a name starting with any of them, especially when the pada syllable is hard to build a name on.',
  },
  {
    q: 'Do I need the exact birth time?',
    a: 'For a single syllable, yes — the Moon moves through a pada in about six hours. Without the time the tool lists every syllable possible for that part of the day.',
  },
  {
    q: 'Does the tool suggest names?',
    a: 'No. Mithila Jodi gives the syllables and lets you check names you are considering; the choice of name belongs to the family.',
  },
  {
    q: 'Does a name that follows the syllable bring luck?',
    a: 'That is a matter of tradition and belief, not science. The tool tells you what the tradition says the first sound should be — nothing more.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/baby-names#webpage`,
      url: `${SITE_URL}/astrology/baby-names`,
      name: 'Baby Name Letters by Nakshatra — Naamkaran Syllable',
      description: 'Traditional first syllable for a baby’s name from the birth nakshatra and pada, rashi letters and a name checker.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/baby-names#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    { ...breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Baby Names', path: '/astrology/baby-names' },
    ]), '@id': `${SITE_URL}/astrology/baby-names#breadcrumb` },
    {
      ...webAppJsonLd({
        name: 'Baby Name Syllable Finder',
        path: '/astrology/baby-names',
        description: 'Free Naamkaran syllable from the baby’s nakshatra pada, with rashi letters and a name checker.',
        languages: ['en', 'hi'],
      }),
      publisher: organizationRef(),
    },
    faqJsonLd(FAQ),
    organizationJsonLd(),
  ],
}

const LINK = 'text-maroon underline underline-offset-4 decoration-gold/50 hover:text-terra'

export default function BabyNamesPage() {
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
              <li className="text-terra" aria-current="page">Baby Names</li>
            </ol>
          </nav>

          <section className="relative wrap pt-10 pb-8 sm:pt-14 lg:pt-16 text-center">
            <ToolEmblem tool="baby-names" size={68} className="mx-auto mb-4 drop-shadow-md" />
            <p className="text-[11px] uppercase tracking-[0.3em] text-terra font-semibold">Naamkaran</p>
            <h1 className="mt-3 font-serif text-maroon text-[40px] sm:text-[52px] lg:text-[60px] leading-[1.04]">
              Baby Name Letters
              <span className="block font-deva text-terra text-[26px] sm:text-[32px] mt-2">नामाक्षर</span>
            </h1>
            <p className="mt-5 text-[17px] sm:text-[18px] text-ink leading-relaxed max-w-2xl mx-auto">
              Find the syllable a child’s name traditionally begins with — from the nakshatra and pada of the Moon at
              birth — see the rashi letters, and check whether a name you are considering fits.
            </p>
            <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-ink-soft">
              <li>✦ Devanagari and English</li>
              <li>✦ Name checker</li>
              <li>✦ Free · no login · nothing stored</li>
            </ul>
            <a href="#baby-form" className="kd-cta mt-7">Enter the birth details</a>
          </section>

          <section id="baby-form" aria-label="Baby name syllable finder" className="relative wrap py-10 sm:py-14 scroll-mt-20">
            <BabyNamesExperience />
          </section>
          <div className="kd-mithila-strip" aria-hidden="true" />
        </div>

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="about-names">
          <div className="wrap max-w-3xl space-y-10">
            <div>
              <p className="eyebrow mb-2">Understanding name letters</p>
              <h2 id="about-names" className="section-heading text-[30px] sm:text-[36px]">How nakshatra naming works</h2>
              <div className="ornament-line w-16 mt-3 mb-5" />
              <p className="text-[16px] text-ink leading-relaxed">
                Each of the 27 nakshatras has four padas, and each of the 108 padas has a syllable. The child’s name
                traditionally begins with the syllable of the pada the Moon was in at birth. A Moon in the fourth pada
                of Punarvasu, for example, gives “Hi” (ही) — Himanshu, Himani, Hitesh. The full list of syllables is on
                the <Link href="/astrology/nakshatra" className={LINK}>Nakshatra page</Link>.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">Rashi letters</h2>
              <div className="mt-4 card overflow-x-auto">
                <table className="w-full min-w-[520px] text-[14px]">
                  <thead>
                    <tr className="border-b border-gold/25 text-left text-[11px] uppercase tracking-[0.14em] text-terra">
                      <th scope="col" className="px-3 py-2.5 font-semibold">Rashi</th>
                      <th scope="col" className="px-3 py-2.5 font-semibold">Letters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RASHIS.map((r, i) => (
                      <tr key={r.slug} className="border-b border-gold/10 last:border-0">
                        <th scope="row" className="px-3 py-2 text-left font-normal text-ink whitespace-nowrap"><span className="font-deva text-maroon">{r.hi}</span> {r.name}</th>
                        <td className="px-3 py-2 text-ink">
                          <span className="font-deva">{rashiSyllables(i).map(s => s.hi).join(' ')}</span>
                          <span className="text-ink-soft"> — {rashiSyllables(i).map(s => s.en).join(', ')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <MithilaBorder variant="top" />
        <AstrologyMethodology show={['baby']} />

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="faq-title">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Questions families ask</p>
            <h2 id="faq-title" className="section-heading text-[30px] sm:text-[36px]">Baby names — FAQ</h2>
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
              <h2 className="font-serif text-maroon text-[20px]">Read more</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/blogs/horoscope-marriage/what-is-nakshatra" className={LINK}>What is Nakshatra?</Link></li>
                <li><Link href="/blogs/horoscope-marriage/what-is-rashi" className={LINK}>What is Rashi?</Link></li>
              </ul>
            </div>
          </div>
        </section>
        <MoreTools current="baby-names" />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
