import Link from 'next/link'
import '@/styles/kundli.css'
import { AstroHero } from '@/components/astrology/hub/AstroHero'
import { ToolGrid } from '@/components/astrology/hub/ToolGrid'
import { HubClosing, HubTrust } from '@/components/astrology/hub/HubClosing'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { ContextualPromoStrip } from '@/components/home/ContextualPromoStrip'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
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
  path: '/astrology',
  title: 'Vedic Astrology Tools for Mithila Matrimony',
  description:
    'Eight free tools families use in the marriage conversation: Kundli Match, Compatibility, Manglik, Nakshatra, Rashi, Janam Kundli, Vivah Muhurat and baby names.',
  keywords: [
    'kundli match mithila',
    'kundli matching maithili',
    'nakshatra calculator',
    'rashi calculator',
    'manglik check',
    'janam kundli online',
    'vivah muhurat',
    'kundli milan 36 guna',
    'ashtakoota matching',
    'vedic astrology mithila',
    'horoscope matching maithili',
  ],
})

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/astrology#webpage`,
        url: `${SITE_URL}/astrology`,
        name: 'Vedic Astrology Tools for Mithila Matrimony | Mithila Jodi',
        description:
          'Eight free tools families use in the marriage conversation: Kundli Match, Compatibility, Manglik, Nakshatra, Rashi, Janam Kundli, Vivah Muhurat and baby names.',
        breadcrumb: { '@id': `${SITE_URL}/astrology#breadcrumb` },
        publisher: organizationRef(),
        inLanguage: 'en',
      },
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Astrology Tools', path: '/astrology' },
      ]),
      webAppJsonLd({
        name: 'Mithila Jodi Astrology Tools',
        path: '/astrology',
        description:
          'Vedic Jyotish tools for Mithila matrimony — Kundli Match, Nakshatra, Rashi, Manglik, and more.',
        languages: ['en'],
      }),
      organizationJsonLd(),
    ],
  },
]

const BLOG_POSTS = [
  { href: '/blogs/horoscope-marriage/kundli-matching-explained', label: 'Kundli Matching Explained — How the Ashtakoota System Works' },
  { href: '/blogs/horoscope-marriage/what-is-manglik', label: 'What is Manglik Dosha and How is it Assessed?' },
  { href: '/blogs/horoscope-marriage/what-is-nakshatra', label: 'What is Nakshatra? The Role of Birth Stars in Mithila Matching' },
  { href: '/blogs/horoscope-marriage/what-is-rashi', label: 'What is Rashi? Understanding Moon Signs in Vedic Astrology' },
]

export default function AstrologyHubPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(...jsonLd)} />
      <MithilaHeader />
      <ContextualPromoStrip set="astrology" />

      <main id="main-content" className="flex-1">
        <AstroHero />

        <section id="tools" className="relative bg-[#FFF8EC] pb-10 pt-5 sm:pb-14 sm:pt-8" aria-labelledby="tools-heading">
          <div className="mx-auto w-full max-w-[1280px] px-3 sm:px-6">
            <h2 id="tools-heading" className="sr-only">Astrology tools</h2>
            <ToolGrid />
          </div>
        </section>

        <section className="bg-[#FFF8EC] pb-10 sm:pb-14" aria-labelledby="trust-heading">
          <div className="mx-auto w-full max-w-[1280px] px-3 sm:px-6">
            <div className="mb-5 flex items-center gap-4" aria-hidden="true">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/60" />
              <svg width="18" height="18" viewBox="0 0 12 12" fill="#C99532"><polygon points="6 0 7.6 4.2 12 4.6 8.8 7.4 9.8 12 6 9.6 2.2 12 3.2 7.4 0 4.6 4.4 4.2 6 0" /></svg>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/60" />
            </div>
            <h2 id="trust-heading" className="sr-only">Why families trust these tools</h2>
            <HubTrust />
            <nav aria-label="Astrology articles" className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-center text-[13px]">
              {BLOG_POSTS.map(({ href, label }) => (
                <Link key={href} href={href} className="text-maroon underline underline-offset-4 decoration-gold/50 hover:text-terra">{label}</Link>
              ))}
            </nav>
          </div>
        </section>

        <HubClosing />
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
