import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import '@/styles/kundli.css'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { Builder } from '@/components/wedding/builder/Builder'
import { PhonePreview } from '@/components/wedding/PhonePreview'
import { decodeInvite } from '@/lib/wedding/codec.server'
import { loadForEdit } from '@/lib/wedding/invites.server'
import { createAdminClient } from '@/lib/supabase/server'
import { SAMPLE_INVITE } from '@/lib/wedding/sample'
import { PRODUCTS, productOf } from '@/lib/wedding/products'
import type { Invite } from '@/lib/wedding/schema'
import { SITE_URL } from '@/lib/constants'
import { organizationJsonLd, organizationRef } from '@/lib/seo'
import { RelatedGuides } from '@/components/journal/RelatedGuides'

const PRODUCT = PRODUCTS.lace
const CANONICAL = `${SITE_URL}${PRODUCT.path}`

const META: Metadata = {
  title: 'Blush Lace Elegance Wedding Invitation',
  description:
    'A free premium wedding invitation in blush, ivory and fine lace with champagne gold. Guests part a pearl-dotted lace veil to open your wedding webpage.',
  keywords: [
    'lace wedding invitation', 'blush pink wedding invitation', 'elegant digital wedding invitation', 'Maithili wedding invitation',
    'premium wedding invitation online', 'wedding website with RSVP', 'wedding invitation with countdown', 'free wedding website India',
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'website', url: CANONICAL, siteName: 'Mithila Jodi', images: ['/og-card.png'],
    title: 'Blush Lace Elegance Invitation — free',
    description: 'Blush, ivory and fine lace: a romantic wedding invitation your guests open by parting a lace veil.',
  },
}

/** Edit links (?d= / ?i=&k=) open one family's invitation — never indexed. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { d, i, k } = await searchParams
  return d || i || k ? { ...META, robots: { index: false, follow: false } } : META
}

const FAQS = [
  {
    q: 'How is Blush Lace Elegance different from the other premium invitations?',
    a: 'All three premium invitations are complete wedding webpages with the same details — ceremonies, venue and directions, countdown, WhatsApp replies and four languages. Blush Lace Elegance has its own romantic look in blush, ivory and fine lace with champagne gold, and guests open it by parting a pearl-dotted lace veil.',
  },
  {
    q: 'Can we add our photos?',
    a: 'Yes, one of the bride and one of the groom — both optional. They appear in lace-edged arch frames on the cover. Each photo is cropped and shrunk on your phone before it is saved, which also removes hidden details such as location. Without photos the cover stays complete with just the lace frame.',
  },
  {
    q: 'Is it free, and where are our details stored?',
    a: 'Yes, it is free and needs no account. Your short link keeps a compact copy of the invitation — and the photos, if you add any — for 180 days, and then it is deleted automatically. Anyone with the link can see the invitation; it is never listed on Google.',
  },
  {
    q: 'How do I change the invitation later?',
    a: 'Keep the private edit link shown after you create the invitation — it reopens this builder with everything filled in. Save your changes and the same short link shows the new version, so there is nothing new to send.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    organizationJsonLd(),
    {
      '@type': 'WebApplication', '@id': `${CANONICAL}#app`, name: PRODUCT.name, url: CANONICAL,
      applicationCategory: 'DesignApplication', operatingSystem: 'Any (web browser)', isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }, publisher: organizationRef(),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Wedding Invitations', item: `${SITE_URL}/marriage-invitation` },
        { '@type': 'ListItem', position: 3, name: 'Blush Lace Elegance', item: CANONICAL },
      ],
    },
    {
      '@type': 'FAQPage', '@id': `${CANONICAL}#faq`,
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
}

const SAMPLE: Invite = { ...SAMPLE_INVITE, t: 'blush-lace', o: 'lace' }

type Props = { searchParams: Promise<{ d?: string; i?: string; k?: string }> }

export default async function BlushLaceInvitationPage({ searchParams }: Props) {
  const { d, i, k } = await searchParams
  const stored = i && k ? await loadForEdit(await createAdminClient(), i, k).catch(() => null) : null
  const initial = stored ? decodeInvite(stored.payload) : decodeInvite(d)
  // Another premium invitation is edited in its own builder.
  if (initial && productOf(initial).id !== PRODUCT.id) {
    redirect(`${productOf(initial).path}?${stored ? `i=${encodeURIComponent(i!)}&k=${encodeURIComponent(k!)}` : `d=${encodeURIComponent(d!)}`}#builder`)
  }
  const published = stored && initial ? { slug: stored.displaySlug, key: k! } : null
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden" style={{ background: 'radial-gradient(ellipse 90% 80% at 30% 20%, #FFF8F6 0%, #F7E3E3 55%, #EBCDD1 100%)' }}>
          <div className="gold-strip absolute top-0 inset-x-0" aria-hidden="true" />
          <div className="wrap relative grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="text-center lg:text-left">
              <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="flex items-center justify-center lg:justify-start gap-2 text-[12.5px] text-ink-soft">
                  <li><Link href="/" className="hover:text-maroon transition-colors">Home</Link></li>
                  <li aria-hidden="true" className="text-gold">›</li>
                  <li><Link href="/marriage-invitation" className="hover:text-maroon transition-colors">Wedding Invitations</Link></li>
                  <li aria-hidden="true" className="text-gold">›</li>
                  <li className="text-maroon" aria-current="page">Blush Lace Elegance</li>
                </ol>
              </nav>
              <p className="eyebrow !text-gold mb-3">✦ Premium · Free · No login</p>
              <h1 className="font-serif text-[30px] sm:text-[44px] leading-[1.08]" style={{ color: '#86525E' }}>Blush Lace Elegance Invitation</h1>
              <p className="font-deva text-[18px] sm:text-[22px] text-gold mt-3" lang="hi">जहाँ परंपरा मिले, प्रेम से</p>
              <p className="text-ink-soft text-[15px] sm:text-[17px] leading-relaxed max-w-xl mx-auto lg:mx-0 mt-4">
                Blush, ivory and fine lace with champagne gold. Your guests part a pearl-dotted lace veil to open a romantic
                wedding invitation with your names, ceremonies, venue and replies on WhatsApp.
              </p>
              <a href="#builder" className="kd-cta mt-7">{initial ? 'Continue editing' : 'Start creating'}</a>
            </div>
            <PhonePreview className="hidden lg:block" invite={SAMPLE} opening="preview" />
          </div>
        </section>
        <MithilaBorder variant="bottom" className="h-6 sm:h-9 overflow-hidden" />

        <section id="builder" className="wrap py-8 sm:py-12 scroll-mt-20 motion-safe:animate-fade-in" aria-label="Wedding invitation builder">
          <Link href="/marriage-invitation" className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-maroon hover:text-terra">
            <span aria-hidden="true">←</span> Change invitation type
          </Link>
          {initial && (
            <p className="mb-5 rounded-mj-sm bg-info-soft px-4 py-3 text-[14px] text-info-fg">
              Your invitation is open for editing.
            </p>
          )}
          <Builder product="lace" initial={initial} published={published} initialPhotos={published ? stored?.photos ?? null : null} />
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
            <RelatedGuides
              className="mt-8"
              guides={['mithila-wedding-rituals', 'mithila-marriage-customs']}
              also={[
                { href: PRODUCTS.mithila.path, label: 'The Mithila Premium invitation instead' },
                { href: PRODUCTS.scratch.path, label: 'The MJ Scratch & Reveal invitation' },
                { href: '/astrology/vivah-muhurat', label: 'Find a vivah muhurat' },
              ]}
            />
          </div>
        </section>
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
