import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { InvitationMaker } from './InvitationMaker'
import { TEMPLATES } from '@/lib/invitation'
import { SITE_URL } from '@/lib/constants'

const CANONICAL = `${SITE_URL}/marriage-invitation`

export const metadata: Metadata = {
  title: 'Free Wedding Invitation Card Maker — Mithila & Madhubani Designs',
  description:
    'Create a beautiful wedding invitation card free, in your browser. Choose a Mithila or Madhubani-inspired design, add your details, and download or share the invitation instantly. No login needed.',
  keywords: [
    'wedding invitation card maker', 'free wedding invitation card',
    'Mithila wedding invitation', 'Madhubani wedding invitation',
    'Maithili wedding invitation card', 'shaadi card maker online',
    'wedding invitation design India', 'marriage invitation card',
    'wedding card maker online free', 'Bihar wedding invitation',
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'website',
    images: ['/og-card.png'],
    url: CANONICAL,
    siteName: 'Mithila Jodi',
    title: 'Free Wedding Invitation Card Maker — Mithila & Madhubani Designs',
    description:
      'Choose a Mithila-inspired design, add your wedding details, and download or share your invitation card instantly. Free, no login.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Wedding Invitation Card Maker — Mithila Jodi',
    description: 'Create and share a beautiful Mithila-inspired wedding invitation card, free.',
  },
}

const STEPS = [
  { n: '1', title: 'Choose a design', body: 'Five designs — Madhubani kohbar, fish, sun, a traditional peacock arch, and a minimal ivory card.' },
  { n: '2', title: 'Add your details', body: 'Names, date, time, venue, city and an optional family message. The preview updates as you type.' },
  { n: '3', title: 'Download or share', body: 'Save a high-resolution image, or share it straight to WhatsApp from your phone.' },
]

const FAQS = [
  {
    q: 'Is the wedding invitation card maker free?',
    a: 'Yes. Creating, downloading and sharing an invitation card is completely free, and you do not need to create an account or log in.',
  },
  {
    q: 'Can I change the design after entering my details?',
    a: 'Yes. Your details are kept when you switch designs, so you can try every template without typing anything again.',
  },
  {
    q: 'Are my wedding details stored anywhere?',
    a: 'No. Everything stays in your browser — the card is generated on your device and nothing is uploaded to or saved on our servers.',
  },
  {
    q: 'What do the Mithila designs mean?',
    a: 'They draw on Madhubani art: the kohbar lotus panel painted for a Maithil wedding, paired fish for good fortune, the sun as witness, and the peacock for beauty and celebration.',
  },
  {
    q: 'In what format is the invitation downloaded?',
    a: 'As a high-resolution PNG image (2000 × 2800 pixels), which is suitable for sharing on WhatsApp and for most print sizes.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${CANONICAL}#app`,
      name: 'Mithila Jodi Wedding Invitation Card Maker',
      url: CANONICAL,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Any (web browser)',
      inLanguage: 'en',
      description:
        'A free browser-based tool for creating Mithila and Madhubani-inspired wedding invitation cards.',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      publisher: { '@type': 'Organization', name: 'Mithila Jodi', url: SITE_URL },
    },
    {
      '@type': 'HowTo',
      '@id': `${CANONICAL}#howto`,
      name: 'How to create a wedding invitation card',
      totalTime: 'PT3M',
      step: STEPS.map((s, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: s.title,
        text: s.body,
      })),
    },
    {
      '@type': 'FAQPage',
      '@id': `${CANONICAL}#faq`,
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${CANONICAL}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Wedding Invitation Card Maker', item: CANONICAL },
      ],
    },
  ],
}

export default function MarriageInvitationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main id="main-content" className="flex-1">
        {/* ── Hero (server-rendered, indexable) ── */}
        <section className="relative overflow-hidden bg-maroon-deep">
          <div className="gold-strip absolute top-0 inset-x-0" aria-hidden="true" />
          <div className="absolute inset-0 opacity-[0.14]" aria-hidden="true">
            <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="xMidYMid slice" fill="none">
              {[[70, 54, 30], [200, 36, 24], [330, 58, 28], [130, 156, 26], [280, 160, 30]].map(
                ([cx, cy, r], gi) => (
                  <g key={gi}>
                    {[0, 45, 90, 135].map((a) => (
                      <ellipse
                        key={a} cx={cx} cy={cy} rx={r * 0.32} ry={r}
                        stroke="#E4C572" strokeWidth="1" transform={`rotate(${a} ${cx} ${cy})`}
                      />
                    ))}
                  </g>
                )
              )}
            </svg>
          </div>

          <div className="wrap relative py-11 sm:py-14 text-center">
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex items-center justify-center gap-2 text-[12.5px] text-paper-3/70">
                <li><Link href="/" className="hover:text-gold-lt transition-colors">Home</Link></li>
                <li aria-hidden="true" className="text-gold/60">›</li>
                <li className="text-gold-lt" aria-current="page">Wedding Invitation</li>
              </ol>
            </nav>

            <p className="eyebrow !text-marigold mb-3">Free · No login</p>
            <h1 className="font-serif text-[28px] sm:text-[42px] leading-[1.1] text-paper max-w-2xl mx-auto">
              Wedding Invitation Card Maker
            </h1>
            <p className="font-deva text-[16px] sm:text-[19px] text-gold-lt mt-2.5" lang="hi">
              शुभ विवाह — निमंत्रण पत्र
            </p>
            <p className="text-paper-2/85 text-[15px] sm:text-[16.5px] leading-relaxed max-w-xl mx-auto mt-4">
              Pick a Mithila-inspired design, type your details, and download a beautiful
              invitation in under a minute. Everything happens on your device.
            </p>
          </div>
        </section>

        <MithilaBorder variant="bottom" className="h-6 sm:h-9 overflow-hidden" />

        {/* ── The maker (client) ── */}
        <InvitationMaker />

        {/* ── How it works (server-rendered) ── */}
        <section className="bg-cream border-y border-paper-3 py-11 sm:py-14" aria-labelledby="how-heading">
          <div className="wrap max-w-4xl">
            <div className="text-center mb-8">
              <p className="eyebrow mb-2">How it works</p>
              <h2 id="how-heading" className="section-heading text-[24px] sm:text-[30px]">
                Three steps, about a minute
              </h2>
              <div className="ornament-line w-16 mx-auto mt-4" />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="card p-5">
                  <span className="inline-flex w-9 h-9 rounded-full bg-maroon-gradient text-cream font-semibold items-center justify-center text-[14px] shadow-mj-xs">
                    {s.n}
                  </span>
                  <h3 className="font-serif text-[18px] text-maroon mt-3">{s.title}</h3>
                  <p className="text-[14px] text-ink-soft leading-relaxed mt-1.5">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Designs (server-rendered, indexable text) ── */}
        <section className="wrap py-11 sm:py-14 max-w-4xl" aria-labelledby="designs-heading">
          <div className="text-center mb-8">
            <p className="eyebrow mb-2">The designs</p>
            <h2 id="designs-heading" className="section-heading text-[24px] sm:text-[30px]">
              Rooted in Mithila art
            </h2>
            <div className="ornament-line w-16 mx-auto mt-4" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <div key={t.id} className="card p-4 flex items-start gap-4">
                <span
                  className="shrink-0 w-11 h-14 rounded-[4px] border border-paper-3"
                  style={{
                    background: `linear-gradient(160deg, ${t.palette.bg} 0%, ${t.palette.bg} 20%, ${t.palette.panel} 20%, ${t.palette.panel} 80%, ${t.palette.bg} 80%)`,
                  }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <h3 className="font-serif text-[17px] text-maroon leading-snug">
                    {t.name} <span className="text-[12px] text-terra font-sans">· {t.tag}</span>
                  </h3>
                  <p className="text-[13.5px] text-ink-soft leading-relaxed mt-1">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ (visible + matches FAQPage schema) ── */}
        <section className="bg-cream border-t border-paper-3 py-11 sm:py-14" aria-labelledby="faq-heading">
          <div className="wrap max-w-3xl">
            <div className="text-center mb-8">
              <p className="eyebrow mb-2">Questions</p>
              <h2 id="faq-heading" className="section-heading text-[24px] sm:text-[30px]">
                Common questions
              </h2>
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

            <div className="mt-10 text-center">
              <p className="text-ink-soft text-[14.5px] leading-relaxed max-w-md mx-auto">
                Planning a Maithil wedding? Explore the rituals behind the ceremony, or create
                a marriage biodata in your own language.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-5">
                <Link href="/festivals" className="btn-ghost btn-sm">Mithila festivals</Link>
                <Link href="/blogs/mithila-marriage-traditions" className="btn-ghost btn-sm">
                  Maithil marriage rituals
                </Link>
                <Link href="/biodata" className="btn-primary btn-sm">Create your biodata</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
