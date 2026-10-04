import Link from 'next/link'
import { ToolEmblem } from '@/components/astrology/ToolEmblem'
import { MoreTools } from '@/components/astrology/MoreTools'
import '@/styles/kundli.css'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { ManglikExperience } from '@/components/astrology/manglik/ManglikExperience'
import { LazyCosmicBackdrop } from '@/components/astrology/kundli/LazyCosmicBackdrop'
import { NorthIndianChart } from '@/components/astrology/kundli/KundliChart'
import { AstrologyMethodology } from '@/components/astrology/AstrologyMethodology'
import { METHODOLOGY } from '@/lib/astrology/methodology'
import { SITE_URL } from '@/lib/constants'
import {
  breadcrumbJsonLd, faqJsonLd, jsonLdScript, organizationJsonLd, organizationRef, pageMetadata, webAppJsonLd,
} from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/astrology/manglik',
  title: 'Manglik Check — Is My Kundli Manglik?',
  description:
    'Check Manglik (Kuja) dosha from your birth chart: Mars counted from the Lagna and the Moon, Anshik vs full Manglik, the traditional exceptions, and what it means for matching. Free.',
  keywords: [
    'manglik check', 'manglik dosha calculator', 'am i manglik', 'kuja dosha', 'anshik manglik',
    'mangal dosha', 'manglik kundli', 'manglik marriage',
  ],
})

const FAQ = [
  {
    q: 'What is Manglik dosha?',
    a: `A chart is called Manglik when Mars (Mangal) sits in one of the houses ${METHODOLOGY.manglik.houses.join(', ')} counted from the Lagna or the Moon. It is also called Kuja dosha or Mangal dosha.`,
  },
  {
    q: 'What is Anshik (partial) Manglik?',
    a: 'Mithila Jodi checks Mars from both the Lagna and the Moon. If both counts place Mars in a Manglik house the chart is Manglik; if only one does, it is Anshik — partially Manglik.',
  },
  {
    q: 'Can I check Manglik without the birth time?',
    a: 'Only partly. The Moon-based count needs just the date (and sometimes roughly the time of day); the Lagna-based count, which most families rely on, needs the birth time. Without it the result is reported as incomplete rather than guessed.',
  },
  {
    q: 'Is a Manglik chart bad for marriage?',
    a: 'Tradition treats it as something to balance, not a verdict. Two Manglik charts are traditionally considered to balance each other, several classical exceptions exist, and a pandit weighs the whole Kundli match. There is no scientific evidence that Mars’s position affects a marriage.',
  },
  {
    q: 'Why does another website give a different answer?',
    a: 'Traditions differ: some omit the 2nd house, some count only from the Lagna, some add Venus, and many apply cancellation rules automatically. Mithila Jodi publishes exactly which rules it uses and shows both counts so you can see how the answer was reached.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/manglik#webpage`,
      url: `${SITE_URL}/astrology/manglik`,
      name: 'Manglik Check — Is My Kundli Manglik?',
      description: 'Free Manglik check: Mars from the Lagna and the Moon, Anshik vs full Manglik, exceptions and what it means for matching.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/manglik#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    { ...breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Manglik Check', path: '/astrology/manglik' },
    ]), '@id': `${SITE_URL}/astrology/manglik#breadcrumb` },
    {
      ...webAppJsonLd({
        name: 'Manglik Check',
        path: '/astrology/manglik',
        description: 'Free Manglik (Kuja) dosha check from the birth chart, with both counts shown and the rules published.',
        languages: ['en'],
      }),
      publisher: organizationRef(),
    },
    faqJsonLd(FAQ),
    organizationJsonLd(),
  ],
}

const LINK = 'text-maroon underline underline-offset-4 decoration-gold/50 hover:text-terra'

export default function ManglikPage() {
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
              <li className="text-terra" aria-current="page">Manglik Check</li>
            </ol>
          </nav>

          <section className="relative wrap pt-10 pb-8 sm:pt-14 lg:pt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="text-center lg:text-left">
              <ToolEmblem tool="manglik" size={68} className="mx-auto lg:mx-0 mb-4 drop-shadow-md" />
              <p className="text-[11px] uppercase tracking-[0.3em] text-terra font-semibold">Mangal dosha</p>
              <h1 className="mt-3 font-serif text-maroon text-[40px] sm:text-[52px] lg:text-[60px] leading-[1.04]">
                Manglik Check
                <span className="block font-deva text-terra text-[26px] sm:text-[32px] mt-2">मांगलिक विचार</span>
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] text-ink leading-relaxed max-w-xl mx-auto lg:mx-0">
                See exactly where Mars falls — counted from the Lagna and from the Moon — whether the chart is Manglik,
                Anshik or not, which traditional exceptions apply, and what it means when two charts are matched.
              </p>
              <ul className="mt-5 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-[13px] text-ink-soft">
                <li>✦ Both counts shown, rules published</li>
                <li>✦ Same rule as Kundli Match</li>
                <li>✦ Free · no login · nothing stored</li>
              </ul>
              <a href="#manglik-form" className="kd-cta mt-7">Enter birth details</a>
            </div>
            <div className="hidden lg:block mx-auto w-full max-w-[360px] opacity-90" aria-hidden="true">
              <NorthIndianChart firstRashiIndex={0} placements={[]} firstHouseLabel="1" shadeHouses={[...METHODOLOGY.manglik.houses]} description="" size={360} />
              <p className="mt-2 text-center text-[12px] text-ink-soft">The Manglik houses: {METHODOLOGY.manglik.houses.join(', ')}</p>
            </div>
          </section>

          <section id="manglik-form" aria-label="Manglik calculator" className="relative wrap py-10 sm:py-14 scroll-mt-20">
            <ManglikExperience />
          </section>
          <div className="kd-mithila-strip" aria-hidden="true" />
        </div>

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="about-manglik">
          <div className="wrap max-w-3xl space-y-10">
            <div>
              <p className="eyebrow mb-2">Understanding Manglik</p>
              <h2 id="about-manglik" className="section-heading text-[30px] sm:text-[36px]">What is Manglik dosha?</h2>
              <div className="ornament-line w-16 mt-3 mb-5" />
              <p className="text-[16px] text-ink leading-relaxed">
                In Jyotish, Mars (Mangal) in certain houses of the birth chart is called Manglik, Kuja or Mangal dosha.
                It is one of the first things Mithila families ask about when a match is proposed, and also one of the
                most misunderstood: different traditions count it differently, and a chart that is “Manglik” by one
                method may not be by another.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">How Mithila Jodi checks it</h2>
              <p className="mt-3 text-[16px] text-ink leading-relaxed">
                Mars is counted from the Lagna and from the Moon, in houses {METHODOLOGY.manglik.houses.join(', ')}.
                Both counts: <strong>Manglik</strong>. One count: <strong>Anshik</strong> (partial). Neither: <strong>not
                Manglik</strong>. Without a birth time only the Moon count is possible, so the result is reported as
                incomplete. Classical exceptions — Mars in its own sign or exalted — are listed beside the result but
                never change it, and the same rule is used in Kundli Match and Janam Kundli.
              </p>
            </div>
          </div>
        </section>

        <MithilaBorder variant="top" />
        <AstrologyMethodology show={[]} />

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="faq-title">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Questions families ask</p>
            <h2 id="faq-title" className="section-heading text-[30px] sm:text-[36px]">Manglik — FAQ</h2>
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
                  <li><Link href="/blogs/horoscope-marriage/what-is-manglik" className={LINK}>What is Manglik Dosha?</Link></li>
                  <li><Link href="/blogs/horoscope-marriage/kundli-matching-explained" className={LINK}>Kundli Matching Explained</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <MoreTools current="manglik" />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
