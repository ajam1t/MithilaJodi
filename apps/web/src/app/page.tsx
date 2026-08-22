import type { Metadata } from 'next'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { HeroSection } from '@/components/home/HeroSection'
import { WhyMithilaJodi } from '@/components/home/FeatureStrip'
import { BiodataSection } from '@/components/home/BiodataSection'
import { FamilyRoots } from '@/components/home/SuccessStories'
import { CulturalStatement } from '@/components/home/CulturalStatement'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { IntroAnimation } from '@/components/IntroAnimation'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mithilajodi.com'

export const metadata: Metadata = {
  title: 'Mithila Jodi — Maithili Matrimonial & Marriage Biodata',
  description:
    'Mithila Jodi is a matrimonial platform for the Mithila community of India. Create a marriage biodata in English, Hindi, Maithili & Sanskrit, involve your family, and find matches rooted in Maithili heritage.',
  alternates: { canonical: SITE },
  openGraph: {
    type: 'website',
    url: SITE,
    siteName: 'Mithila Jodi',
    title: 'Mithila Jodi — Maithili Matrimonial & Marriage Biodata',
    description:
      'A matrimonial platform rooted in Mithila culture — create a marriage biodata in your language and connect Maithili families across India.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mithila Jodi — Maithili Matrimonial & Marriage Biodata',
    description: 'A matrimonial platform rooted in Mithila culture, for the Maithili community of India.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Mithila Jodi',
      url: SITE,
      slogan: 'जहाँ परम्परा मिले, प्रेम से | Where tradition meets love.',
      description:
        'A matrimonial platform for the Mithila (Maithili) community of India, offering marriage biodata creation in English, Hindi, Maithili and Sanskrit.',
      areaServed: { '@type': 'Country', name: 'India' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: SITE,
      name: 'Mithila Jodi',
      publisher: { '@id': `${SITE}/#organization` },
      inLanguage: ['en', 'hi', 'mai', 'sa'],
    },
  ],
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-hidden">
      <IntroAnimation />
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MithilaHeader />
      <MithilaBorder variant="bottom" />
      <main className="flex-1 pb-16 lg:pb-0">
        <HeroSection />
        <MithilaBorder variant="top" />
        <WhyMithilaJodi />
        <MithilaBorder variant="bottom" />
        <BiodataSection />
        <MithilaBorder variant="top" />
        <FamilyRoots />
        <CulturalStatement />
      </main>
      <MithilaFooter />
      <MobileBottomNav />
    </div>
  )
}
