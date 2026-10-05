import type { Metadata } from 'next'
import Link from 'next/link'
import '@/styles/kundli.css'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { Builder } from '@/components/wedding/builder/Builder'
import { FreeVsPremium, PhonePreview } from '@/components/wedding/PremiumShowcase'
import { decodeInvite } from '@/lib/wedding/codec.server'
import { loadForEdit } from '@/lib/wedding/invites.server'
import { createAdminClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants'
import { organizationJsonLd, organizationRef } from '@/lib/seo'

const CANONICAL = `${SITE_URL}/marriage-invitation/premium`

export const metadata: Metadata = {
  title: 'Premium Mithila Wedding Invitation — Free Wedding Website',
  description:
    'Create a free interactive Mithila wedding invitation: opening animation, countdown, ceremony timeline from Tilak to Vidai, हमर मिथिला, venue map and WhatsApp replies. One short link, no login.',
  keywords: [
    'wedding website maker', 'digital wedding invitation', 'Mithila wedding invitation', 'Maithili wedding invitation',
    'online shaadi invitation link', 'wedding invitation with countdown', 'Madhubani wedding invitation', 'free wedding website India',
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'website', url: CANONICAL, siteName: 'Mithila Jodi', images: ['/og-card.png'],
    title: 'Premium Mithila Wedding Experience — free',
    description: 'Your complete digital wedding story in one link: countdown, ceremonies, हमर मिथिला, venue and WhatsApp replies.',
  },
}

const FAQS = [
  {
    q: 'Is the premium invitation really free?',
    a: 'Yes. Both the invitation card maker and the premium wedding website are free, and neither needs an account.',
  },
  {
    q: 'Where are our wedding details stored?',
    a: 'Only for 180 days. Your short link (mithilajodi.com/Invitation/…) keeps a compact copy of the invitation and is deleted automatically 180 days after you create it. Nothing else is kept — no account, no photos. Anyone with the link can see the invitation; it is never listed on Google.',
  },
  {
    q: 'How do I change the invitation later?',
    a: 'Keep the private edit link shown after you create the invitation — it reopens the builder with everything filled in. Your draft is also kept in this browser. Save your changes and the same short link shows the new version, so there is nothing new to send.',
  },
  {
    q: 'How do guests reply?',
    a: 'If you add a WhatsApp number, guests tap “हँ, अवश्य”, “प्रयास करब” or “नहि आबि सकब” and WhatsApp opens with a ready message to you. Mithila Jodi never sees the replies.',
  },
  {
    q: 'Why are there no photos?',
    a: 'Photos would have to be uploaded and stored. To keep invitations small and private, each theme uses Madhubani art instead — the Kohbar, the Paag, the peacock, the fish and the lotus.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    organizationJsonLd(),
    {
      '@type': 'WebApplication', '@id': `${CANONICAL}#app`, name: 'Premium Mithila Wedding Experience', url: CANONICAL,
      applicationCategory: 'DesignApplication', operatingSystem: 'Any (web browser)', isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }, publisher: organizationRef(),
    },
    {
      '@type': 'FAQPage', '@id': `${CANONICAL}#faq`,
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
}

type Props = { searchParams: Promise<{ d?: string; i?: string; k?: string }> }

export default async function PremiumInvitationPage({ searchParams }: Props) {
  const { d, i, k } = await searchParams
  // A short link's private edit link (?i=<slug>&k=<edit key>) reopens the stored
  // invitation so saving updates the same link; an old long edit link (?d=) still works.
  const stored = i && k ? await loadForEdit(await createAdminClient(), i, k).catch(() => null) : null
  const initial = stored ? decodeInvite(stored.payload) : decodeInvite(d)
  const published = stored && initial ? { slug: stored.displaySlug, key: k! } : null
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden bg-maroon-deep">
          <div className="gold-strip absolute top-0 inset-x-0" aria-hidden="true" />
          <div className="wrap relative grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="text-center lg:text-left">
              <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="flex items-center justify-center lg:justify-start gap-2 text-[12.5px] text-paper-3/70">
                  <li><Link href="/" className="hover:text-gold-lt transition-colors">Home</Link></li>
                  <li aria-hidden="true" className="text-gold/60">›</li>
                  <li><Link href="/marriage-invitation" className="hover:text-gold-lt transition-colors">Wedding Invitation</Link></li>
                  <li aria-hidden="true" className="text-gold/60">›</li>
                  <li className="text-gold-lt" aria-current="page">Premium</li>
                </ol>
              </nav>
              <p className="eyebrow !text-marigold mb-3">Free · No login · Short link</p>
              <h1 className="font-serif text-[30px] sm:text-[44px] leading-[1.08] text-cream">Premium Mithila Wedding Experience</h1>
              <p className="font-deva text-[18px] sm:text-[22px] text-gold-lt mt-3" lang="mai">अपन विवाह निमंत्रणके एकटा यादगार अनुभव बनाउ</p>
              <p className="text-paper-2/85 text-[15px] sm:text-[17px] leading-relaxed max-w-xl mx-auto lg:mx-0 mt-4">
                More than an invitation — your complete digital wedding story. Fill in what you like, watch it come alive,
                and share one link on WhatsApp.
              </p>
              <a href="#builder" className="kd-cta mt-7">{initial ? 'Continue editing' : 'Start creating'}</a>
            </div>
            <PhonePreview className="hidden lg:block" />
          </div>
        </section>
        <MithilaBorder variant="bottom" className="h-6 sm:h-9 overflow-hidden" />

        <section id="builder" className="wrap py-8 sm:py-12 scroll-mt-20" aria-label="Wedding invitation builder">
          {initial && (
            <p className="mb-5 rounded-mj-sm bg-info-soft px-4 py-3 text-[14px] text-info-fg">
              Your invitation is open for editing.
            </p>
          )}
          <Builder initial={initial} published={published} />
        </section>

        <section className="bg-cream border-y border-paper-3 py-11 sm:py-14" aria-labelledby="compare-heading">
          <div className="wrap max-w-3xl">
            <div className="text-center mb-7">
              <p className="eyebrow mb-2">Two free tools</p>
              <h2 id="compare-heading" className="section-heading text-[24px] sm:text-[30px]">A card, or a wedding website</h2>
              <div className="ornament-line w-16 mx-auto mt-4" />
            </div>
            <FreeVsPremium />
            <p className="mt-5 text-center text-[14px] text-ink-soft">
              Prefer a printable card? <Link href="/marriage-invitation" className="text-maroon underline underline-offset-2">Make a free invitation card</Link> — download it as an image in a minute.
            </p>
          </div>
        </section>

        <section className="py-11 sm:py-14" aria-labelledby="faq-heading">
          <div className="wrap max-w-3xl">
            <div className="text-center mb-8">
              <p className="eyebrow mb-2">Questions</p>
              <h2 id="faq-heading" className="section-heading text-[24px] sm:text-[30px]">Common questions</h2>
              <div className="ornament-line w-16 mx-auto mt-4" />
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
          </div>
        </section>
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
