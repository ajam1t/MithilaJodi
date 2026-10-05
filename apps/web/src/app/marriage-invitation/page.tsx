import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { InvitationChooser } from '@/components/wedding/InvitationChooser'
import { SITE_URL } from '@/lib/constants'
import { organizationJsonLd, organizationRef } from '@/lib/seo'

/**
 * /marriage-invitation — the entry to Wedding Invitations. The visitor's
 * first decision is which invitation to make; each choice opens its own
 * builder (/marriage-invitation/basic, /marriage-invitation/premium), so
 * neither experience is shown inside the other.
 */

const CANONICAL = `${SITE_URL}/marriage-invitation`

export const metadata: Metadata = {
  title: 'Wedding Invitations — Free Card Maker & Mithila Premium',
  description:
    'Create a free wedding invitation your way: a Mithila-inspired invitation card to download, or a Mithila Premium wedding webpage with countdown, ceremonies and WhatsApp replies. No login.',
  keywords: [
    'wedding invitation maker', 'wedding invitation card maker', 'free wedding invitation card', 'Mithila wedding invitation',
    'Madhubani wedding invitation', 'Maithili wedding invitation', 'digital wedding invitation', 'wedding website maker',
    'shaadi card maker online', 'marriage invitation card',
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'website',
    images: ['/og-card.png'],
    url: CANONICAL,
    siteName: 'Mithila Jodi',
    title: 'Wedding Invitations — Basic card or Mithila Premium | Mithila Jodi',
    description: 'A Mithila-inspired invitation card to download, or a complete digital wedding experience in one link. Free, no login.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wedding Invitations — Mithila Jodi',
    description: 'Create a beautiful Mithila wedding invitation your way — a card, or a complete wedding webpage. Free.',
  },
}

const FAQS = [
  {
    q: 'What is the difference between Basic and Mithila Premium?',
    a: 'The Basic Invitation is a designed card — you download it as a high-resolution image and send it like any picture. Mithila Premium is a wedding webpage guests open from one link: an envelope opening, a countdown, every ceremony, the venue map and WhatsApp replies.',
  },
  {
    q: 'Are both free?',
    a: 'Yes. Both invitations are free and neither needs an account or login.',
  },
  {
    q: 'Can I make both?',
    a: 'Yes. Many families send the card in family groups and the Premium link to guests who will want the ceremony times and directions.',
  },
  {
    q: 'Which languages are supported?',
    a: 'The Basic card takes your details in any language you type. Mithila Premium shows every heading, date and button in हिन्दी, English, मैथिली or संस्कृत.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    organizationJsonLd(),
    {
      '@type': 'CollectionPage',
      '@id': `${CANONICAL}#page`,
      url: CANONICAL,
      name: 'Wedding Invitations',
      description: 'Choose a free Mithila wedding invitation: a downloadable invitation card, or a Mithila Premium wedding webpage.',
      publisher: organizationRef(),
      hasPart: [
        { '@type': 'WebApplication', name: 'Basic Invitation Card Maker', url: `${SITE_URL}/marriage-invitation/basic`, applicationCategory: 'DesignApplication', isAccessibleForFree: true },
        { '@type': 'WebApplication', name: 'Mithila Premium Invitation', url: `${SITE_URL}/marriage-invitation/premium`, applicationCategory: 'DesignApplication', isAccessibleForFree: true },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${CANONICAL}#faq`,
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${CANONICAL}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Wedding Invitations', item: CANONICAL },
      ],
    },
  ],
}

export default function WeddingInvitationsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main id="main-content" className="flex-1">
        {/* ── Hero: short, so the choice is on screen early ── */}
        <section className="relative overflow-hidden bg-maroon-deep">
          <div className="gold-strip absolute top-0 inset-x-0" aria-hidden="true" />
          <div className="wrap relative py-5 sm:py-11 text-center">
            <nav aria-label="Breadcrumb" className="mb-2 sm:mb-3">
              <ol className="flex items-center justify-center gap-2 text-[12.5px] text-paper-3/70">
                <li><Link href="/" className="hover:text-gold-lt transition-colors">Home</Link></li>
                <li aria-hidden="true" className="text-gold/60">›</li>
                <li className="text-gold-lt" aria-current="page">Wedding Invitations</li>
              </ol>
            </nav>
            <h1 className="font-serif text-[30px] sm:text-[44px] leading-[1.08] text-paper">Wedding Invitations</h1>
            <p className="font-deva text-[17px] sm:text-[21px] text-gold-lt mt-2" lang="hi">शुभ विवाह — निमंत्रण पत्र</p>
            <p className="text-paper-2/85 text-[15px] sm:text-[17px] mt-3">Create a beautiful wedding invitation your way.</p>
          </div>
        </section>
        <MithilaBorder variant="bottom" className="h-6 sm:h-9 overflow-hidden" />

        {/* ── The choice ── */}
        <section
          className="relative py-4 sm:py-12"
          aria-labelledby="choose-heading"
          style={{
            background:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%23B98A2E' stroke-opacity='.12' stroke-width='1'%3E%3Cpath d='M60 44c5 6 5 14 0 20-5-6-5-14 0-20Z'/%3E%3Cpath d='M60 64c-8-2-12-8-13-14 7 1 11 6 13 14Zm0 0c8-2 12-8 13-14-7 1-11 6-13 14Z'/%3E%3C/g%3E%3C/svg%3E\") center / 120px 120px",
          }}
        >
          <div className="wrap max-w-5xl">
            <div className="mb-4 text-center sm:mb-8">
              <h2 id="choose-heading" className="font-serif text-[22px] text-maroon sm:text-[30px]">Choose your invitation experience</h2>
              <p className="mt-1 text-[14px] text-ink-soft sm:text-[15px]">Both are free, and neither needs a login.</p>
            </div>
            <InvitationChooser />
          </div>
        </section>

        {/* ── Questions (visible, matches the FAQPage schema) ── */}
        <section className="bg-cream border-t border-paper-3 py-10 sm:py-14" aria-labelledby="faq-heading">
          <div className="wrap max-w-3xl">
            <div className="text-center mb-7">
              <h2 id="faq-heading" className="section-heading text-[22px] sm:text-[28px]">Choosing your invitation</h2>
              <div className="ornament-line w-16 mx-auto mt-3" />
            </div>
            <div className="space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="card p-5 group">
                  <summary className="font-serif text-maroon text-[16px] sm:text-[17px] cursor-pointer list-none flex items-start justify-between gap-3">
                    <span>{q}</span>
                    <span className="text-gold text-xl leading-none shrink-0 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="text-ink-soft text-[14.5px] leading-relaxed mt-3">{a}</p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-center text-[14px] text-ink-soft">
              Planning a Maithil wedding?{' '}
              <Link href="/blogs/mithila-marriage-traditions" className="text-maroon underline underline-offset-2">Maithil marriage rituals</Link>{' · '}
              <Link href="/marriage-biodata" className="text-maroon underline underline-offset-2">Marriage biodata</Link>{' · '}
              <Link href="/astrology/vivah-muhurat" className="text-maroon underline underline-offset-2">Vivah muhurat</Link>
            </p>
          </div>
        </section>
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
