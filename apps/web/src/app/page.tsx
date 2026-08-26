import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedProfiles } from '@/components/home/FeaturedProfiles'
import { WhyMithilaJodi } from '@/components/home/FeatureStrip'
import { FamilyRoots } from '@/components/home/SuccessStories'
import { BiodataSection } from '@/components/home/BiodataSection'
import { FinalCTA } from '@/components/home/FinalCTA'
import { CulturalStatement } from '@/components/home/CulturalStatement'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { IntroAnimation } from '@/components/IntroAnimation'
import { SITE_URL } from '@/lib/constants'

const SITE = SITE_URL

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
    images: ['/hero-couple.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mithila Jodi — Maithili Matrimonial & Marriage Biodata',
    description: 'A matrimonial platform rooted in Mithila culture, for the Maithili community of India.',
    images: ['/hero-couple.jpg'],
  },
}

// Genuine, commonly-asked questions with concise, accurate answers. Rendered
// visibly below and mirrored into FAQPage structured data (Google requires the
// answer text to be visible on the page).
const FAQ_ITEMS: { q: string; a: React.ReactNode; text: string }[] = [
  {
    q: 'What is Mithila Jodi?',
    a: (
      <>
        Mithila Jodi is a matrimonial platform for the Mithila (Maithili) community of India. It
        helps families create a marriage biodata, browse profiles, and connect with matches rooted
        in Mithila culture and values.
      </>
    ),
    text: 'Mithila Jodi is a matrimonial platform for the Mithila (Maithili) community of India. It helps families create a marriage biodata, browse profiles, and connect with matches rooted in Mithila culture and values.',
  },
  {
    q: 'What is gotra, and why does it matter in marriage?',
    a: (
      <>
        Gotra is a patrilineal lineage traced to a common Vedic ancestor. Many Hindu and Mithila
        families avoid same-gotra marriage. Read{' '}
        <Link href="/blogs/gotra-family-lineage/what-is-gotra" className="text-maroon underline underline-offset-2">
          What Is Gotra?
        </Link>{' '}
        to understand how it is determined and why it is asked in matrimonial matching.
      </>
    ),
    text: 'Gotra is a patrilineal lineage traced to a common Vedic ancestor, and many Hindu and Mithila families traditionally avoid same-gotra marriage. It is commonly asked during matrimonial matching.',
  },
  {
    q: 'What are maternal gotra and mool in Mithila?',
    a: (
      <>
        Maternal gotra is the gotra of the mother&apos;s side, and mool refers to a family&apos;s
        ancestral origin or native place. Learn more about{' '}
        <Link href="/blogs/gotra-family-lineage/what-is-maternal-gotra" className="text-maroon underline underline-offset-2">
          maternal gotra
        </Link>{' '}
        and{' '}
        <Link href="/blogs/gotra-family-lineage/what-is-mool-in-mithila" className="text-maroon underline underline-offset-2">
          mool in Mithila
        </Link>
        .
      </>
    ),
    text: "Maternal gotra is the gotra of the mother's side, and mool refers to a family's ancestral origin or native place in Mithila tradition. Both are often considered during matrimonial matching.",
  },
  {
    q: 'Can I create a marriage biodata in Maithili?',
    a: (
      <>
        Yes. Mithila Jodi lets you create a marriage biodata in English, Hindi, Maithili and
        Sanskrit, using your latest profile details.
      </>
    ),
    text: 'Yes. Mithila Jodi lets you create a marriage biodata in English, Hindi, Maithili and Sanskrit, using your latest profile details.',
  },
  {
    q: 'Is Mithila Jodi only for the Mithila and Maithil community?',
    a: (
      <>
        Mithila Jodi is designed specifically for Mithila and Maithili families, with gotra, mool
        and native-place details that matter to the community&apos;s marriage traditions.
      </>
    ),
    text: "Mithila Jodi is designed specifically for Mithila and Maithili families, capturing gotra, mool and native-place details that matter to the community's marriage traditions.",
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Mithila Jodi',
      url: SITE,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE}/logo.png`,
      },
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
    {
      '@type': 'FAQPage',
      '@id': `${SITE}/#faq`,
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.text },
      })),
    },
  ],
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <IntroAnimation />
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MithilaHeader />
      <main className="flex-1 pb-16 lg:pb-0">
        <HeroSection />
        <FeaturedProfiles />
        <MithilaBorder variant="top" />
        <WhyMithilaJodi />
        <FamilyRoots />
        <MithilaBorder variant="bottom" />
        <BiodataSection />

        {/* ── Frequently asked questions (SEO + genuine help) ── */}
        <section id="faq" className="bg-cream py-12 sm:py-16" aria-label="Frequently asked questions">
          <div className="wrap max-w-3xl">
            <div className="text-center mb-8">
              <p className="eyebrow mb-1.5">Common Questions</p>
              <h2 className="section-heading">Mithila Marriage &amp; Gotra — FAQ</h2>
              <div className="ornament-line w-16 mx-auto mt-2" />
            </div>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item) => (
                <details key={item.q} className="card p-5 group">
                  <summary className="font-serif text-maroon text-[17px] sm:text-[18px] cursor-pointer list-none flex items-start justify-between gap-3">
                    <span>{item.q}</span>
                    <span className="text-gold text-xl leading-none shrink-0 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="text-ink-soft text-[15px] leading-relaxed mt-3">{item.a}</p>
                </details>
              ))}
            </div>
            <p className="text-center text-sm text-ink-soft mt-8">
              Explore more in the{' '}
              <Link href="/blogs/gotra-family-lineage" className="text-maroon underline underline-offset-2">
                Gotra &amp; Family Lineage
              </Link>{' '}
              guides, or{' '}
              <Link href="/explore" className="text-maroon underline underline-offset-2">
                browse Mithila profiles
              </Link>
              .
            </p>
          </div>
        </section>

        <CulturalStatement />
        <FinalCTA />
      </main>
      <MithilaFooter />
      <MobileBottomNav />
    </div>
  )
}
