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
  path: '/astrology/compatibility',
  title: 'Compatibility — Broader Vedic Compatibility Analysis',
  description:
    'A broader Vedic compatibility reading beyond Ashtakoota — Rashi compatibility, Guna Milan principles, planetary aspects, and other traditional factors. Free horoscope compatibility tool.',
  keywords: [
    'vedic compatibility',
    'horoscope compatibility',
    'kundli compatibility',
    'rashi compatibility',
    'guna milan',
    'compatibility mithila astrology',
  ],
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/compatibility#webpage`,
      url: `${SITE_URL}/astrology/compatibility`,
      name: 'Compatibility — Vedic Horoscope Compatibility | Mithila Jodi',
      description: 'Broader Vedic compatibility analysis — Rashi compatibility, Guna Milan, planetary aspects, and traditional factors beyond Ashtakoota.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/compatibility#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Compatibility', path: '/astrology/compatibility' },
    ]),
    webAppJsonLd({
      name: 'Vedic Compatibility',
      path: '/astrology/compatibility',
      description: 'Broader Vedic horoscope compatibility — Rashi, Guna Milan, planetary factors. Free tool.',
      languages: ['en'],
    }),
    organizationJsonLd(),
  ],
}

export default function CompatibilityPage() {
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
            <li className="text-gold-lt" aria-current="page">Compatibility</li>
          </ol>
        </nav>

        <ComingSoon
          tool="Compatibility"
          tagline="Broader Vedic compatibility beyond Ashtakoota"
          description="Ashtakoota matching (36 points) is the most widely used compatibility method in North Indian astrology, and it is the primary tool on Mithila Jodi. But classical texts also describe additional compatibility factors — Rashi relationships, planetary aspects between two charts, and other considerations. This tool brings those into view alongside the Ashtakoota result."
          whatItDoes={[
            'Provides the full Ashtakoota result as the foundation, then layers additional compatibility factors on top — so the primary score is never buried or replaced.',
            'Rashi compatibility: how the two Janma Rashis relate to each other in classical terms — natural friendship, neutrality, or enmity — and what this means for the Graha Maitri assessment.',
            'Navamsa chart consideration: the Navamsa (D-9) chart is a key divisional chart for marriage in Vedic astrology. This tool shows the Navamsa Rashi for each person\'s Moon, Venus, and ascendant.',
            'Planetary aspects between the two charts: whether benefic planets in one chart aspect key positions in the other — a factor some traditions weigh alongside Ashtakoota.',
            'The tool presents these as supplementary considerations, not as a replacement for the primary Ashtakoota score, and never generates a "total compatibility percentage" that combines incompatible methods.',
          ]}
          relatedLinks={[
            { href: '/astrology/kundli-match', label: 'Kundli Match — the primary Ashtakoota tool' },
            { href: '/blogs/horoscope-marriage/kundli-matching-explained', label: 'How Kundli Matching Works — Ashtakoota Explained' },
          ]}
        />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
