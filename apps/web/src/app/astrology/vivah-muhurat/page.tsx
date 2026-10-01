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
  path: '/astrology/vivah-muhurat',
  title: 'Vivah Muhurat — Auspicious Marriage Dates',
  description:
    'Find auspicious marriage dates based on the traditional Panchanga — Tithi, Vara, Nakshatra, Yoga, and Karana — with planetary considerations for the couple. Free Vivah Muhurat calculator.',
  keywords: [
    'vivah muhurat',
    'shadi muhurat 2025',
    'marriage muhurat calculator',
    'auspicious marriage dates',
    'wedding muhurat vedic',
    'vivah muhurat mithila',
    'shaadi muhurat',
  ],
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/vivah-muhurat#webpage`,
      url: `${SITE_URL}/astrology/vivah-muhurat`,
      name: 'Vivah Muhurat — Auspicious Marriage Dates | Mithila Jodi',
      description: 'Find auspicious marriage dates using the traditional Panchanga — Tithi, Vara, Nakshatra, Yoga, Karana — with planetary considerations for the couple.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/vivah-muhurat#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Vivah Muhurat', path: '/astrology/vivah-muhurat' },
    ]),
    webAppJsonLd({
      name: 'Vivah Muhurat Calculator',
      path: '/astrology/vivah-muhurat',
      description: 'Find auspicious marriage dates using the traditional Panchanga. Free Vivah Muhurat calculator.',
      languages: ['en'],
    }),
    organizationJsonLd(),
  ],
}

export default function VivahMuhuratPage() {
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
            <li className="text-gold-lt" aria-current="page">Vivah Muhurat</li>
          </ol>
        </nav>

        <ComingSoon
          tool="Vivah Muhurat"
          tagline="Find auspicious dates for marriage"
          description="Muhurat — an auspicious time — is selected by examining the Panchanga (five limbs of Vedic timekeeping) and planetary positions. A good Vivah Muhurat aligns the Tithi, Nakshatra, and other factors in a way that traditional Jyotish considers favourable for beginning a marriage."
          whatItDoes={[
            'Enter a date range to search, along with the couple\'s Janma Rashi and Nakshatra. The tool will check each day for the Panchanga quality (Tithi, Vara, Nakshatra, Yoga, Karana) and highlight days considered auspicious.',
            'See why each candidate date is included or excluded: the specific Tithi, the Nakshatra on that day, whether the Vara (weekday) is suitable, and which combinations create a strong muhurat.',
            'Understand Dwitiya, Tritiya, Panchami, Saptami, Dashami, Dwadashi, and Trayodashi Tithis — the traditionally preferred Tithis for Vivah — and which Nakshatras are considered auspicious for marriage.',
            'Filter results by the couple\'s constraints (preferred month, day of week, location-based sunrise time for Lagna calculation).',
            'The tool does not generate "any date" — it applies traditional selection criteria transparently and shows which dates meet them and which do not.',
          ]}
          relatedLinks={[
            { href: '/astrology/kundli-match', label: 'Kundli Match — check compatibility before selecting a date' },
          ]}
        />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
    </div>
  )
}
