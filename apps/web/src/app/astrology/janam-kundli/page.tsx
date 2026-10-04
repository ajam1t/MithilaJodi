import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { ComingSoon } from '@/components/astrology/ComingSoon'
import { SITE_URL } from '@/lib/constants'
import {
  pageMetadata,
  breadcrumbJsonLd,
  organizationJsonLd,
  organizationRef,
  jsonLdScript,
  webAppJsonLd,
} from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/astrology/janam-kundli',
  title: 'Janam Kundli — Free Vedic Birth Chart Online',
  description:
    'Generate your Janam Kundli — Vedic birth chart with planetary positions, Lagna, Rashi, and Nakshatra. Computed from a real astronomical ephemeris in the Mithila Jyotish tradition.',
  keywords: [
    'janam kundli online free',
    'birth chart vedic',
    'kundli generator',
    'janma kundali',
    'lagna chart',
    'vedic birth chart mithila',
    'kundli by date of birth',
  ],
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/janam-kundli#webpage`,
      url: `${SITE_URL}/astrology/janam-kundli`,
      name: 'Janam Kundli — Vedic Birth Chart | Mithila Jodi',
      description: 'Free Janam Kundli — Vedic birth chart with planetary positions in the sidereal zodiac, Lagna, Rashi, Nakshatra, and key chart information.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/janam-kundli#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Janam Kundli', path: '/astrology/janam-kundli' },
    ]),
    webAppJsonLd({
      name: 'Janam Kundli — Vedic Birth Chart',
      path: '/astrology/janam-kundli',
      description: 'Free Vedic birth chart — planetary positions, Lagna, Rashi, Nakshatra from a real astronomical ephemeris.',
      languages: ['en'],
    }),
    organizationJsonLd(),
  ],
}

export default function JanamKundliPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <MithilaHeader />

      <main id="main-content" className="flex-1">
        <nav aria-label="Breadcrumb" className="bg-cosmic-deep border-b border-gold/10 py-3">
          <ol className="wrap flex items-center gap-2 text-[12px] text-paper-3/50">
            <li><Link href="/" className="hover:text-gold-lt transition-colors">Home</Link></li>
            <li aria-hidden="true" className="text-gold/30">›</li>
            <li><Link href="/astrology" className="hover:text-gold-lt transition-colors">Astrology Tools</Link></li>
            <li aria-hidden="true" className="text-gold/30">›</li>
            <li className="text-gold-lt" aria-current="page">Janam Kundli</li>
          </ol>
        </nav>

        <ComingSoon
          tool="Janam Kundli"
          tagline="Your Vedic birth chart from a real ephemeris"
          description="The Janam Kundli is the foundational document of Jyotish — a map of the sky at the exact moment and place of birth, showing where each planet fell in the sidereal zodiac. This tool computes it from a documented astronomical ephemeris, not from approximate tables."
          whatItDoes={[
            'Enter your name, date of birth, time of birth, and place of birth. The tool computes the positions of all nine Vedic planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu) in the sidereal zodiac using a real astronomical ephemeris.',
            'See each planet\'s Rashi (sign), Nakshatra, and Pada, along with the Lagna (Ascendant) — the rising sign at the moment of birth, which requires an accurate birth time.',
            'View the chart in the North Indian diamond format (standard in Mithila) — houses laid out geometrically with planetary positions marked clearly.',
            'Understand each placement: which house each planet occupies in the whole-sign house system, and what its basic signification is.',
            'The result can be saved to your Mithila Jodi profile (for members) or downloaded as a PDF. Birth details are never included in shared links — only the computed chart output.',
          ]}
          relatedLinks={[
            { href: '/blogs/horoscope-marriage/kundli-matching-explained', label: 'How Kundli Matching Works — the Ashtakoota System Explained' },
            { href: '/astrology/kundli-match', label: 'Kundli Match — match two birth charts' },
          ]}
        />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
