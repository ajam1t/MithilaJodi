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
  path: '/astrology/manglik',
  title: 'Manglik Check — Manglik Dosha from Your Birth Chart',
  description:
    'Check Manglik status from your birth chart. See which house Mars occupies, what it means in Mithila kundli tradition, and how Manglik dosha is assessed — with full transparency.',
  keywords: [
    'manglik check online',
    'manglik dosha calculator',
    'am i manglik',
    'manglik kundli',
    'kuja dosha checker',
    'manglik mithila',
    'manglik in vedic astrology',
  ],
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/manglik#webpage`,
      url: `${SITE_URL}/astrology/manglik`,
      name: 'Manglik Check — Manglik Dosha from Birth Chart | Mithila Jodi',
      description: 'Check Manglik status from your birth chart — which house Mars occupies, what it means, and how it\'s assessed in Mithila kundli tradition.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/manglik#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Manglik Check', path: '/astrology/manglik' },
    ]),
    webAppJsonLd({
      name: 'Manglik Check',
      path: '/astrology/manglik',
      description: 'Check Manglik dosha from your birth chart — free, chart-based, transparent.',
      languages: ['en'],
    }),
    organizationJsonLd(),
  ],
}

export default function ManglikPage() {
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
            <li className="text-gold-lt" aria-current="page">Manglik Check</li>
          </ol>
        </nav>

        <ComingSoon
          tool="Manglik Check"
          tagline="Understand Manglik dosha from your birth chart"
          description="Manglik dosha arises when Mars occupies certain houses in the birth chart. This tool computes it from your actual kundli — not from date of birth alone or generic tables — and shows you exactly which house Mars occupies and what it means, with no hidden logic."
          whatItDoes={[
            'Enter your date of birth, birth time, and place of birth. The tool computes your full birth chart, identifies Mars\'s house position in the sidereal zodiac, and determines Manglik status — Manglik, Non-Manglik, or Anshik (partial).',
            'See the exact house Mars occupies from your Lagna (ascendant), along with which houses are traditionally considered for Manglik assessment in the Maithil tradition.',
            'Understand the basis of the verdict: the tool shows the relevant chart data, not just a binary "Manglik / Not Manglik" — because an unexplained verdict is not useful to families.',
            'For Kundli Match purposes: see how both people\'s Manglik status compares, what traditional considerations apply, and how the Manglik analysis relates to the Ashtakoota score.',
            'The "anshik" (partial) category is explicitly supported — it acknowledges that Mars\'s influence can be moderate in certain chart configurations, as recognised in traditional texts.',
          ]}
          relatedLinks={[
            { href: '/blogs/horoscope-marriage/what-is-manglik', label: 'What is Manglik Dosha? A Detailed Explanation' },
            { href: '/blogs/horoscope-marriage/kundli-matching-explained', label: 'How Kundli Matching Works — Ashtakoota Explained' },
          ]}
        />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
    </div>
  )
}
