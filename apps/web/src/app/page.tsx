import type { Metadata } from 'next'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { AnnouncementTicker } from '@/components/home/AnnouncementTicker'
import { ContextualPromoStrip } from '@/components/home/ContextualPromoStrip'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedProfiles } from '@/components/home/FeaturedProfiles'
import { WhyMithilaJodi } from '@/components/home/FeatureStrip'
import { CommunityStories } from '@/components/home/CommunityStories'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { InstallBanner } from '@/components/pwa/InstallBanner'
import { SITE_URL } from '@/lib/constants'
import { organizationJsonLd } from '@/lib/seo'

const SITE = SITE_URL

// FeaturedProfiles is server-rendered and its photo URLs are signed with a
// 1 hour TTL. Without this the homepage would be statically generated once and
// serve expired image URLs an hour later; 15 minutes keeps them comfortably
// fresh while still serving cached HTML to almost every visitor.
export const revalidate = 900

export const metadata: Metadata = {
  title: 'Mithila Jodi — Maithili & Mithila Matrimonial',
  description:
    'A matrimonial platform for the Maithil community. Browse Mithila bride and groom profiles and build a marriage biodata in Maithili, Hindi, English or Sanskrit.',
  keywords: [
    'Mithila matrimonial', 'Maithili matrimonial', 'Maithil matrimonial',
    'Mithila marriage', 'Maithili marriage', 'Maithil marriage',
    'Mithila matrimony', 'Maithili matrimony',
    'Mithila bride', 'Mithila groom', 'Maithili bride', 'Maithili groom',
    'Maithil bride', 'Maithil groom',
    'Mithila wedding', 'Maithili wedding',
    'Mithila marriage biodata', 'Maithili marriage biodata',
    'Mithila matrimonial profiles', 'Bihar matrimonial',
  ],
  alternates: { canonical: SITE },
  openGraph: {
    type: 'website',
    images: ['/og-card.png'],
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
    organizationJsonLd(),
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
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Above the ticker and the sticky header, in normal flow: it is the
          first thing seen on arrival and then scrolls away, so it costs no
          standing viewport and cannot overlap the sticky header or the fixed
          bottom navigation. Renders nothing at all unless the browser has
          confirmed the site is installable. */}
      <InstallBanner />
      <AnnouncementTicker />
      <MithilaHeader />
      <ContextualPromoStrip set="home" />
      <main id="main-content" className="flex-1">
        <HeroSection />
        <FeaturedProfiles />
        <WhyMithilaJodi />
        <CommunityStories />
      </main>
      {/* Bottom-nav clearance lives on the footer, not on <main> — see MithilaFooter. */}
      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
