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
  path: '/astrology/baby-names',
  title: 'Baby Names by Nakshatra — Traditional Name Syllables',
  description:
    'Find traditional name-starting syllables (Aksharas) for a newborn based on their Janma Nakshatra and Pada, as per Vedic Jyotish tradition. Free baby name suggestion tool.',
  keywords: [
    'baby names by nakshatra',
    'naam akshara vedic',
    'janma nakshatra name syllables',
    'baby name rashi nakshatra',
    'naam karan vedic',
    'hindu baby names nakshatra',
    'maithili baby names',
  ],
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/astrology/baby-names#webpage`,
      url: `${SITE_URL}/astrology/baby-names`,
      name: 'Baby Names by Nakshatra — Traditional Aksharas | Mithila Jodi',
      description: 'Find name-starting syllables for a newborn based on Janma Nakshatra and Pada. Traditional Vedic Naam Karan guidance.',
      breadcrumb: { '@id': `${SITE_URL}/astrology/baby-names#breadcrumb` },
      publisher: organizationRef(),
      inLanguage: 'en',
    },
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Astrology Tools', path: '/astrology' },
      { name: 'Baby Names', path: '/astrology/baby-names' },
    ]),
    webAppJsonLd({
      name: 'Baby Names by Nakshatra',
      path: '/astrology/baby-names',
      description: 'Find traditional name syllables for a newborn from their Janma Nakshatra and Pada. Free Naam Karan tool.',
      languages: ['en'],
    }),
    organizationJsonLd(),
  ],
}

export default function BabyNamesPage() {
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
            <li className="text-gold-lt" aria-current="page">Baby Names</li>
          </ol>
        </nav>

        <ComingSoon
          tool="Baby Names"
          tagline="Name syllables from the Janma Nakshatra"
          description="In Vedic tradition, a child's name is chosen based on the Nakshatra and Pada at the moment of birth. Each of the 27 Nakshatras is associated with specific starting syllables (Aksharas), and each Pada within the Nakshatra narrows this further. This is the basis of the Naam Karan (naming ceremony) tradition."
          whatItDoes={[
            'Enter the newborn\'s date of birth, time of birth, and place of birth. The tool computes the Janma Nakshatra and Pada, then returns the Aksharas (name-starting syllables) traditionally associated with that Pada.',
            'See the syllables in Devanagari and transliteration, with notes on how they are traditionally pronounced in Maithili — relevant for families who want a name that fits the spoken language.',
            'Understand the tradition: the tool explains why this Nakshatra and Pada was determined, which lord governs it, and the traditional reasoning behind the Akshara assignments.',
            'The tool does not generate full names — it provides the syllables from which families can form a name according to their preference, language, and family tradition.',
          ]}
          relatedLinks={[
            { href: '/blogs/horoscope-marriage/what-is-nakshatra', label: 'What is Nakshatra? Understanding the 27 Birth Stars' },
            { href: '/astrology/nakshatra', label: 'Nakshatra tool — find the Janma Nakshatra' },
          ]}
        />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
    </div>
  )
}
