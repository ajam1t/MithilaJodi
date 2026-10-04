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
  path: '/astrology/rashi',
  title: 'Rashi Calculator — Find Your Moon Sign',
  description:
    'Find your Janma Rashi — the Moon\'s sign at birth — from your date of birth, birth time, and place of birth. Free Vedic Rashi calculator in the Mithila Jyotish tradition.',
  keywords: [
    'rashi calculator',
    'janma rashi finder',
    'moon sign calculator vedic',
    'rashi by date of birth',
    'rashi mithila',
    'moon sign vedic astrology',
  ],
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/rashi#webpage`,
      url: `${SITE_URL}/astrology/rashi`,
      name: 'Rashi Calculator — Moon Sign | Mithila Jodi',
      description: 'Find your Janma Rashi from date, time, and place of birth. Free Vedic Moon sign calculator.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/rashi#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Rashi', path: '/astrology/rashi' },
    ]),
    webAppJsonLd({
      name: 'Rashi Calculator',
      path: '/astrology/rashi',
      description: 'Find your Janma Rashi (Moon sign) from birth date, time, and place. Free Vedic Rashi calculator.',
      languages: ['en'],
    }),
    organizationJsonLd(),
  ],
}

export default function RashiPage() {
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
            <li className="text-gold-lt" aria-current="page">Rashi</li>
          </ol>
        </nav>

        <ComingSoon
          tool="Rashi"
          tagline="Find your Janma Rashi — the Moon's sign at birth"
          description="In Vedic astrology, the Rashi (Moon sign) is defined by the position of the Moon in the sidereal zodiac at the moment of birth — not the Sun's position as in Western astrology. The Janma Rashi is the primary identifier in a kundli and is used throughout Ashtakoota matching."
          whatItDoes={[
            'Enter your date of birth, time of birth, and place of birth. The tool computes the Moon\'s sidereal longitude and identifies which of the 12 Rashis (Mesh through Meen) it falls in.',
            'Understand the difference between Vedic and Western zodiac signs: the sidereal zodiac used in Jyotish differs from the tropical zodiac by the ayanamsha (approximately 23–24 degrees), which is why your Vedic Rashi may differ from your Western "star sign".',
            'See your Rashi\'s ruling planet, its characteristics in the Vedic tradition, and how it is used in Graha Maitri Koota and Bhakoot Koota in Kundli Match.',
            'The Rashi is also visible on your Mithila Jodi profile — members who have not filled in their Rashi can use this tool to determine it accurately.',
          ]}
          relatedLinks={[
            { href: '/blogs/horoscope-marriage/what-is-rashi', label: 'What is Rashi? Moon Signs in Vedic Astrology' },
            { href: '/blogs/horoscope-marriage/kundli-matching-explained', label: 'How Rashi is Used in Kundli Matching' },
          ]}
        />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
