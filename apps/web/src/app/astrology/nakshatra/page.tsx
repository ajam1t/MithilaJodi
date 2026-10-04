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
  path: '/astrology/nakshatra',
  title: 'Nakshatra Calculator — Find Your Janma Nakshatra',
  description:
    'Find your Janma Nakshatra (birth star) from date, time, and place of birth. Understand nakshatra characteristics, dasha lords, and their significance in Mithila matrimonial tradition.',
  keywords: [
    'nakshatra calculator',
    'janma nakshatra',
    'birth star finder',
    'nakshatra by date of birth',
    'vedic nakshatra',
    'nakshatra mithila',
  ],
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/nakshatra#webpage`,
      url: `${SITE_URL}/astrology/nakshatra`,
      name: 'Nakshatra Calculator — Janma Nakshatra | Mithila Jodi',
      description: 'Find your Janma Nakshatra from date, time, and place of birth. Understand the birth star\'s lord, characteristics, and role in Mithila kundli tradition.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/nakshatra#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Nakshatra', path: '/astrology/nakshatra' },
    ]),
    webAppJsonLd({
      name: 'Nakshatra Calculator',
      path: '/astrology/nakshatra',
      description: 'Find your Janma Nakshatra from birth date, time, and place. Free Vedic nakshatra calculator.',
      languages: ['en'],
    }),
    organizationJsonLd(),
  ],
}

export default function NakshatraPage() {
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
            <li className="text-gold-lt" aria-current="page">Nakshatra</li>
          </ol>
        </nav>

        <ComingSoon
          tool="Nakshatra"
          tagline="Your Janma Nakshatra — the Moon's birth star"
          description="The Janma Nakshatra is the lunar mansion the Moon occupies at the moment of birth. In Vedic tradition, it is one of the most significant indicators in a kundli — central to naming traditions, dasha calculations, and matrimonial compatibility in Mithila practice."
          whatItDoes={[
            'Enter your name, date of birth, birth time, and place of birth. The tool computes the Moon\'s sidereal longitude and identifies which of the 27 Nakshatras it falls in, along with the Pada (1–4) within that Nakshatra.',
            'See your Nakshatra\'s ruling planet (lord), its characteristics in the Vedic tradition, and how it is positioned relative to other Nakshatras in Tara compatibility calculations.',
            'Understand how your Nakshatra is used in the Tara Koota of Kundli Match — how the Janma Nakshatras of two people are counted from each other to assess their Tara relationship.',
            'See the name-syllables (Aksharas) traditionally associated with your Nakshatra and Pada — used in the baby name tradition and in personal identification within family practice.',
            'Understand the Nakshatra\'s Gana (Deva, Manushya, or Rakshasa) — one of the inputs to Gana Koota in Ashtakoota matching.',
          ]}
          relatedLinks={[
            { href: '/blogs/horoscope-marriage/what-is-nakshatra', label: 'What is Nakshatra? The 27 Birth Stars in Mithila Tradition' },
            { href: '/blogs/horoscope-marriage/kundli-matching-explained', label: 'How Kundli Matching Works — Ashtakoota Explained' },
          ]}
        />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
