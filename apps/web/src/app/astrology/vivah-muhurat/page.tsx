import Link from 'next/link'
import '@/styles/kundli.css'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { VivahMuhuratExperience } from '@/components/astrology/vivah/VivahMuhuratExperience'
import { LazyCosmicBackdrop } from '@/components/astrology/kundli/LazyCosmicBackdrop'
import { AstrologyMethodology } from '@/components/astrology/AstrologyMethodology'
import { computeVivahMuhurat } from '@/lib/astrology/vivahMuhurat'
import { utcToLocal } from '@/lib/astrology/time/localTime'
import { SITE_URL } from '@/lib/constants'
import {
  breadcrumbJsonLd, faqJsonLd, jsonLdScript, organizationJsonLd, organizationRef, pageMetadata, webAppJsonLd,
} from '@/lib/seo'

// The default list (Darbhanga, the next twelve months) is recomputed daily.
export const revalidate = 86_400

const DARBHANGA = { label: 'Darbhanga, Bihar', latitude: 26.1542, longitude: 85.8918, timezone: 'Asia/Kolkata', source: 'mithila-jodi' as const }

function currentMonth() {
  const now = utcToLocal(Date.now(), 'Asia/Kolkata')
  return { year: now.year, from: `${now.year}-${String(now.month).padStart(2, '0')}` }
}

export function generateMetadata() {
  const { year } = currentMonth()
  return pageMetadata({
    path: '/astrology/vivah-muhurat',
    title: `Vivah Muhurat ${year}–${String(year + 1).slice(2)} — Shubh Marriage Dates`,
    description:
      'Every auspicious marriage muhurat for the next twelve months, with exact times for your city: nakshatra, tithi, yoga and karana checked, Kharmas, Chaturmas and Guru/Shukra asta excluded, and Guru bal for the couple. Free.',
    keywords: [
      'vivah muhurat', `vivah muhurat ${year}`, `shadi muhurat ${year + 1}`, 'marriage muhurat', 'shubh vivah dates',
      'shaadi ki tareekh', 'vivah muhurat mithila', 'guru bal', 'kharmas', 'chaturmas',
    ],
  })
}

const FAQ = [
  {
    q: 'How is a Vivah Muhurat chosen?',
    a: 'The panchang must be pure (shuddhi) at that time: the Moon in one of the eleven marriage nakshatras and not in Gandanta, a tithi that is not Rikta or Amavasya, and no Vishti karana or inauspicious yoga. The Sun must be in a marriage month — not Kharmas — the lunar month must not be Adhika, Chaturmas or Holashtak, and neither Jupiter nor Venus may be set (asta).',
  },
  {
    q: 'Why are there no wedding dates in some months?',
    a: 'During Kharmas (the Sun in Dhanu or Meena), Chaturmas (Devshayani to Prabodhini Ekadashi), an Adhika month, or while Jupiter or Venus is set, tradition holds no marriages. The list shows each of these periods with its dates.',
  },
  {
    q: 'Why do the times depend on the city?',
    a: 'The nakshatra and tithi change at the same instant everywhere, but the Vedic day starts at local sunrise and times are shown in local time. Choose the city of the wedding for exact times.',
  },
  {
    q: 'What are Guru bal and Surya bal?',
    a: 'Traditionally Jupiter’s position from the bride’s Moon sign (Guru bal) and the Sun’s from the groom’s (Surya bal) are checked for the year of the wedding, and the Moon’s for the day (Chandra bal). Add the two Moon signs to see them beside each date.',
  },
  {
    q: 'Is this the final muhurat for our wedding?',
    a: 'It lists the windows in which the panchang is suitable. Within the window the officiating pandit fixes the exact Lagna for the ceremony, and families often consider the couple’s charts too. Please confirm with your pandit.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/vivah-muhurat#webpage`,
      url: `${SITE_URL}/astrology/vivah-muhurat`,
      name: 'Vivah Muhurat — Shubh Marriage Dates | Mithila Jodi',
      description: 'Every auspicious marriage muhurat for the next twelve months with exact times for your city, and the rules used.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/vivah-muhurat#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    { ...breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Vivah Muhurat', path: '/astrology/vivah-muhurat' },
    ]), '@id': `${SITE_URL}/astrology/vivah-muhurat#breadcrumb` },
    {
      ...webAppJsonLd({
        name: 'Vivah Muhurat Calculator',
        path: '/astrology/vivah-muhurat',
        description: 'Free marriage muhurat finder: panchang shuddhi, Kharmas, Chaturmas, Guru/Shukra asta and Guru bal, with exact times for any city.',
        languages: ['en'],
      }),
      publisher: organizationRef(),
    },
    faqJsonLd(FAQ),
    organizationJsonLd(),
  ],
}

const LINK = 'text-maroon underline underline-offset-2 decoration-gold/50 hover:text-terra'

export default function VivahMuhuratPage() {
  const { from } = currentMonth()
  const { result } = computeVivahMuhurat({ place: DARBHANGA, from, months: 12 }, new Date())

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
              <li className="text-gold-lt" aria-current="page">Vivah Muhurat</li>
            </ol>
          </nav>

          <section className="relative wrap pt-10 pb-6 sm:pt-14 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-marigold">Shubh vivah dates</p>
            <h1 className="mt-3 font-serif text-cream text-[40px] sm:text-[52px] lg:text-[60px] leading-[1.04]">
              Vivah Muhurat
              <span className="block font-deva text-gold-lt text-[26px] sm:text-[32px] mt-2">विवाह मुहूर्त</span>
            </h1>
            <p className="mt-5 text-[17px] sm:text-[18px] text-paper-3/90 leading-relaxed max-w-2xl mx-auto">
              Every auspicious marriage window in the coming months, with exact times for your city — and, for each
              season without muhurats, the reason why.
            </p>
            <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-paper-3/80">
              <li>✦ Checked against Drik Panchang</li>
              <li>✦ Kharmas, Chaturmas &amp; asta excluded</li>
              <li>✦ Free · no login · nothing stored</li>
            </ul>
          </section>

          <section id="vivah-form" aria-label="Vivah Muhurat finder" className="relative wrap py-8 sm:py-10 scroll-mt-20">
            <VivahMuhuratExperience initial={result} />
          </section>
          <div className="kd-mithila-strip" aria-hidden="true" />
        </div>

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="about-vivah">
          <div className="wrap max-w-3xl space-y-10">
            <div>
              <p className="eyebrow mb-2">Understanding muhurat</p>
              <h2 id="about-vivah" className="section-heading text-[30px] sm:text-[36px]">What makes a time auspicious for marriage?</h2>
              <div className="ornament-line w-16 mt-3 mb-5" />
              <p className="text-[16px] text-ink leading-relaxed">
                A muhurat is a window in which the five limbs of the panchang — tithi, vara, nakshatra, yoga and karana —
                are suitable together. For a marriage, tradition also asks that the Sun be in a marriage month, that the
                season not be Kharmas or Chaturmas, and that Jupiter and Venus — the planets of dharma and of married
                life — be visible rather than lost in the Sun’s glare.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">The wedding seasons of Mithila</h2>
              <p className="mt-3 text-[16px] text-ink leading-relaxed">
                In practice this gives two seasons: from Prabodhini Ekadashi in late autumn until Kharmas begins in
                mid-December, and from Makar Sankranti in mid-January until the Sun leaves Mithuna in mid-July — with gaps
                for Kharmas in March–April, Holashtak before Holi, and whenever Jupiter or Venus is set. Within a season, a
                date qualifies only while the Moon is in a marriage nakshatra.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-maroon text-[26px]">Before you fix the date</h2>
              <p className="mt-3 text-[16px] text-ink leading-relaxed">
                Families usually match the kundlis first — <Link href="/astrology/kundli-match" className={LINK}>Kundli Match</Link> and{' '}
                <Link href="/astrology/compatibility" className={LINK}>Compatibility</Link> — then choose a date from this list, and the
                pandit fixes the Lagna for the ceremony within it.
              </p>
            </div>
          </div>
        </section>

        <MithilaBorder variant="top" />
        <AstrologyMethodology show={['vivah']} />

        <section className="bg-paper py-14 sm:py-16" aria-labelledby="faq-title">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Questions families ask</p>
            <h2 id="faq-title" className="section-heading text-[30px] sm:text-[36px]">Vivah Muhurat — FAQ</h2>
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
                  <li><Link href="/blogs/horoscope-marriage/kundli-matching-explained" className={LINK}>Kundli Matching Explained</Link></li>
                </ul>
              </div>
              <div>
                <h2 className="font-serif text-maroon text-[20px]">More astrology tools</h2>
                <ul className="mt-3 space-y-2">
                  <li><Link href="/astrology/kundli-match" className={LINK}>Kundli Match — 36 Guna</Link></li>
                  <li><Link href="/astrology/rashi" className={LINK}>Rashi — find your Moon sign</Link></li>
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
