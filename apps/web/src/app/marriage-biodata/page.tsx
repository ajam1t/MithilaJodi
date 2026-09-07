import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { BiodataBuilder } from './BiodataBuilder'
import { SITE_URL } from '@/lib/constants'
import { breadcrumbJsonLd } from '@/lib/seo'

const CANONICAL = `${SITE_URL}/marriage-biodata`

export const metadata: Metadata = {
  title: 'Free Marriage Biodata Maker — 4 Languages',
  description:
    'Build a marriage biodata free in your browser — gotra, mool and gram included, in Maithili, Hindi, English or Sanskrit. Download a PDF, no login needed.',
  keywords: [
    'marriage biodata maker', 'free biodata for marriage', 'biodata format for marriage',
    'shadi biodata maker', 'marriage biodata pdf download', 'Maithili biodata',
    'Mithila marriage biodata', 'biodata maker in Hindi', 'gotra mool biodata',
    'bio data for marriage Bihar', 'vivah biodata', 'marriage biodata template free',
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'website',
    images: ['/og-card.png'],
    url: CANONICAL,
    siteName: 'Mithila Jodi',
    title: 'Free Marriage Biodata Maker — Maithili, Hindi, English & Sanskrit',
    description:
      'Fill a simple form and download a printable marriage biodata as PDF. Gotra, mool and gram included. Free, no login.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Marriage Biodata Maker — Mithila Jodi',
    description: 'Create and download a printable marriage biodata in Maithili, Hindi, English or Sanskrit. Free, no login.',
  },
}

const STEPS = [
  { n: '1', title: 'Fill what you want to share', body: 'Every field is optional. Sections you leave blank are left out of the document entirely — no empty rows, no placeholders.' },
  { n: '2', title: 'Pick your language', body: 'Maithili, Hindi, English or Sanskrit. This sets the headings; names and places stay exactly as you type them, Devanagari included.' },
  { n: '3', title: 'Download the PDF', body: 'One click opens your browser’s print dialog — choose "Save as PDF" for a clean A4 page you can print or send on WhatsApp.' },
]

const FAQ = [
  {
    q: 'Is the marriage biodata maker really free?',
    a: 'Yes. There is no charge, no login, and no limit on how many times you use it. Mithila Jodi itself is free to join as well.',
  },
  {
    q: 'Do I need an account to make a biodata?',
    a: 'No. The whole tool runs in your browser and you can download the PDF without registering. An account is only useful if you want the biodata saved so you can update it later, and to be matched with other families on Mithila Jodi.',
  },
  {
    q: 'Is my information stored anywhere?',
    a: 'No. Nothing you type on this page is sent to us — not the details, not the photo. It stays in your browser and is gone when you close the tab. That also means we cannot recover it for you, so download the PDF before you leave.',
  },
  {
    q: 'Does it include gotra, mool and gram?',
    a: 'Yes, and they are near the top rather than buried at the bottom. Most general biodata makers have no field for them at all, which is why Maithil families end up writing them in by hand.',
  },
  {
    q: 'Can I make a biodata in Maithili?',
    a: 'Yes. Choose मैथिली and every heading on the document is in Maithili. Hindi and Sanskrit are available too, and you can type your own entries in Devanagari in any of the four.',
  },
  {
    q: 'How do I get a PDF?',
    a: 'Press "Download PDF / Print" and choose "Save as PDF" as the destination in the dialog that opens. On a phone, the share sheet usually offers the same option.',
  },
]

export default function MarriageBiodataPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Marriage Biodata Maker',
    url: CANONICAL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    inLanguage: ['en', 'hi', 'mai', 'sa'],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    publisher: { '@type': 'Organization', name: 'Mithila Jodi', url: SITE_URL },
  }

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Mithila Jodi', path: '/' },
    { name: 'Marriage Biodata Maker', path: '/marriage-biodata' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([appJsonLd, faqJsonLd, breadcrumb]) }}
      />

      <MithilaHeader />

      <main id="main-content" className="min-h-screen bg-paper">
        {/* Intro */}
        <section className="no-print bg-paper-2 py-8 sm:py-10">
          <div className="wrap text-center max-w-3xl mx-auto">
            <p className="eyebrow mb-1.5">Free · No login</p>
            <h1 className="font-serif text-maroon leading-tight text-[24px] sm:text-[30px] lg:text-[34px]">
              Marriage Biodata Maker
            </h1>
            <div className="ornament-line w-16 mx-auto mt-2.5" />
            <p className="text-ink-soft text-[14.5px] leading-relaxed mt-3.5">
              Fill in a simple form and download a printable marriage biodata as a PDF —
              with <span className="text-maroon font-medium">gotra, mool and gram</span> where a Maithil
              family expects to find them, in{' '}
              <span className="font-deva text-maroon">मैथिली</span>, हिन्दी, English or संस्कृत.
            </p>
            <p className="text-ink-soft text-[13px] leading-relaxed mt-2">
              Everything happens in your browser. Nothing you type here is uploaded, stored or seen by us.
            </p>
          </div>
        </section>

        <BiodataBuilder />

        {/* How it works */}
        <section className="no-print bg-paper-2 py-9 sm:py-11">
          <div className="wrap">
            <h2 className="font-serif text-maroon text-center text-[20px] sm:text-[25px] leading-tight">
              How it works
            </h2>
            <div className="ornament-line w-14 mx-auto mt-2 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {STEPS.map(s => (
                <div key={s.n} className="card p-5">
                  <span className="inline-grid place-items-center h-8 w-8 rounded-full bg-maroon text-cream font-serif text-[15px] mb-2.5">
                    {s.n}
                  </span>
                  <h3 className="font-serif text-maroon text-[16px] leading-tight">{s.title}</h3>
                  <p className="text-ink-soft text-[13px] leading-relaxed mt-1.5">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="no-print bg-paper py-9 sm:py-11">
          <div className="wrap max-w-3xl mx-auto">
            <h2 className="font-serif text-maroon text-center text-[20px] sm:text-[25px] leading-tight">
              Questions families ask
            </h2>
            <div className="ornament-line w-14 mx-auto mt-2 mb-6" />
            <div className="space-y-3">
              {FAQ.map(item => (
                <details key={item.q} className="card p-4 group">
                  <summary className="font-semibold text-ink text-[14.5px] cursor-pointer list-none flex items-start gap-2">
                    <span className="text-gold mt-0.5 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true">›</span>
                    {item.q}
                  </summary>
                  <p className="text-ink-soft text-[13.5px] leading-relaxed mt-2 pl-4">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Conversion */}
        <section className="no-print bg-maroon-gradient py-9 sm:py-11">
          <div className="wrap text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-cream text-[20px] sm:text-[25px] leading-tight">
              Looking for a match, not just a document?
            </h2>
            <p className="text-paper-3 text-[14px] leading-relaxed mt-2.5">
              Mithila Jodi is free to join. Your biodata is saved, kept up to date, and shown to
              Mithila families searching by gotra, mool and native place — with a match score that
              explains itself.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              <Link href="/register" className="btn-primary bg-cream text-maroon border-cream hover:bg-paper">
                Create a free account
              </Link>
              <Link href="/explore" className="btn-ghost text-cream border-cream/40 hover:border-cream">
                Browse Mithila profiles
              </Link>
            </div>
            <p className="text-paper-3 text-[13px] leading-relaxed mt-4">
              Also free, no login:{' '}
              <Link href="/marriage-invitation" className="text-cream underline underline-offset-2 hover:text-gold-lt">
                the Mithila wedding invitation card maker
              </Link>
              . Or read{' '}
              <Link href="/about" className="text-cream underline underline-offset-2 hover:text-gold-lt">
                how Mithila Jodi works
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <MithilaFooter className="no-print pb-16 lg:pb-0" />
      <MobileBottomNav />
    </>
  )
}
