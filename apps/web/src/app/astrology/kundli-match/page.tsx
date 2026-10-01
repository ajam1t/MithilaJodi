import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
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
  path: '/astrology/kundli-match',
  title: 'Kundli Match — Ashtakoota Compatibility for Mithila Matrimony',
  description:
    'Match two horoscopes with the Ashtakoota (36-point) system. Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi — per-Koota breakdown with Manglik analysis. Free kundli matching.',
  keywords: [
    'kundli match online free',
    'ashtakoota kundli matching',
    'kundli matching maithili',
    'horoscope matching mithila',
    '36 guna matching',
    'kundli milan',
    'kundli match vedic',
  ],
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/kundli-match#webpage`,
      url: `${SITE_URL}/astrology/kundli-match`,
      name: 'Kundli Match — Ashtakoota Compatibility | Mithila Jodi',
      description: 'Free Ashtakoota kundli matching — 36 points across Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi, with Manglik analysis.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/kundli-match#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Kundli Match', path: '/astrology/kundli-match' },
    ]),
    webAppJsonLd({
      name: 'Kundli Match — Ashtakoota',
      path: '/astrology/kundli-match',
      description: 'Free Ashtakoota kundli matching for Mithila matrimony — 36 points, per-Koota breakdown, Manglik analysis.',
      languages: ['en'],
    }),
    organizationJsonLd(),
  ],
}

export default function KundliMatchPage() {
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
            <li className="text-gold-lt" aria-current="page">Kundli Match</li>
          </ol>
        </nav>

        <ComingSoon
          tool="Kundli Match"
          tagline="Ashtakoota — the traditional eight-koota compatibility system"
          description="Match two birth charts using the Ashtakoota system — 36 points distributed across eight kootas, each measuring a different dimension of compatibility as defined in classical Vedic texts and refined within Mithila tradition."
          whatItDoes={[
            'Enter name, date of birth, time of birth, and place of birth for two people. The tool computes both charts server-side using a documented astronomical ephemeris and returns a complete result — the animation is purely presentation.',
            'See the Ashtakoota total (out of 36) alongside each of the eight Koota scores individually: Varna (1), Vashya (2), Tara (3), Yoni (4), Graha Maitri (5), Gana (6), Bhakoot (7), and Nadi (8).',
            'Understand each Koota in depth: what it measures, what both people\'s attribute values are, and exactly why the score was awarded — no black boxes.',
            'Get a full Manglik analysis for both people: which house Mars occupies, what that signifies in traditional Mithila kundli practice, and how the two charts relate to each other.',
            'See a deeper analysis section covering Rashi compatibility, Nakshatra relationship, and the broader chart context for those who want more than a score.',
            'Download the result as a PDF in the Mithila Jodi style, or generate a shareable link — with birth details never included in the share.',
          ]}
          relatedLinks={[
            { href: '/blogs/horoscope-marriage/kundli-matching-explained', label: 'How Kundli Matching Works — the Ashtakoota System Explained' },
            { href: '/blogs/horoscope-marriage/what-is-manglik', label: 'What is Manglik Dosha and How is it Assessed?' },
            { href: '/blogs/horoscope-marriage/what-is-nakshatra', label: 'What is Nakshatra? Birth Stars in Mithila Tradition' },
            { href: '/blogs/horoscope-marriage/what-is-rashi', label: 'What is Rashi? Moon Signs in Vedic Astrology' },
          ]}
        />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
    </div>
  )
}
