import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { createAdminClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const SITE = SITE_URL

export const metadata: Metadata = {
  title: 'Pricing — Mithila Jodi Matrimonial Plans',
  description:
    'Simple, transparent pricing for Mithila Jodi. Free at ₹0/year. Mithila Member at ₹151/year (151 interests). Mithila Premium at ₹499/year (unlimited interests + messaging).',
  alternates: { canonical: `${SITE}/pricing` },
  openGraph: {
    type: 'website',
    url: `${SITE}/pricing`,
    siteName: 'Mithila Jodi',
    title: 'Pricing — Mithila Jodi Matrimonial Plans',
    description:
      'Three simple plans for Mithila matrimony. Free ₹0, Member ₹151/year (151 interests), Premium ₹499/year (unlimited interests & messaging).',
    images: ['/hero-couple.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Mithila Jodi',
    description: 'Free ₹0/year. Member ₹151/year. Premium ₹499/year. Transparent pricing for Mithila matrimonial membership.',
    images: ['/hero-couple.jpg'],
  },
}

// ── Feature comparison ──────────────────────────────────────────────────────

type CellValue = 'tick' | 'cross' | string

const COMPARISON: { feature: string; free: CellValue; member: CellValue; premium: CellValue }[] = [
  { feature: 'Create matrimonial profile', free: 'tick',    member: 'tick',               premium: 'tick' },
  { feature: 'Create marriage biodata',   free: 'tick',    member: 'tick',               premium: 'tick' },
  { feature: 'Profile search',            free: 'Limited', member: 'Full',               premium: 'Full' },
  { feature: 'Advanced search filters',   free: 'cross',   member: 'tick',               premium: 'tick' },
  { feature: 'Send Interest',             free: 'cross',   member: '151 / year',         premium: 'Unlimited' },
  { feature: 'Receive Interest',          free: 'tick',    member: 'tick',               premium: 'tick' },
  { feature: 'Accept Interest',           free: 'tick',    member: 'tick',               premium: 'tick' },
  { feature: 'Messaging',                 free: 'cross',   member: 'tick',               premium: 'tick' },
  { feature: 'Shortlist profiles',        free: 'tick',    member: 'tick',               premium: 'tick' },
  { feature: 'Privacy controls',          free: 'tick',    member: 'tick',               premium: 'tick' },
]

const FREE_FEATURES = [
  'Create matrimonial profile',
  'Create marriage biodata',
  'Limited profile search',
  'Receive & accept interests',
  'Shortlist profiles',
  'Privacy controls',
]

const MEMBER_FEATURES = [
  'Everything in Free',
  'Full & advanced search',
  '151 interests per year',
  'Messaging after interest accepted',
]

const PREMIUM_FEATURES = [
  'Everything in Member',
  'Unlimited interests',
  'Full matrimonial experience',
]

const FAQS = [
  {
    q: 'Is Free membership really ₹0?',
    a: 'Yes. You can create a matrimonial profile, build a biodata PDF, receive interests, and use all listed Free features without paying anything.',
  },
  {
    q: 'What is the difference between Mithila Member and Mithila Premium?',
    a: 'Mithila Member (₹151/year) lets you send up to 151 interests per year and message accepted matches. Mithila Premium (₹499/year) gives you unlimited interests per year along with all Member features.',
  },
  {
    q: 'Can Free members send interests?',
    a: 'No. Sending interests requires a paid membership — either Mithila Member (151/year) or Mithila Premium (unlimited). Free members can receive and accept interests from others.',
  },
  {
    q: 'Can Free members send messages?',
    a: 'No. Messaging is available to Mithila Member and Mithila Premium members only, after an interest is accepted by both sides.',
  },
  {
    q: 'What happens when someone accepts my interest?',
    a: 'If you hold a Mithila Member or Premium membership, you can start messaging that person directly. Free members can see the accepted interest but need to upgrade to begin messaging.',
  },
  {
    q: 'Do interests reset every year?',
    a: 'Yes. The interest counter resets with each new membership period. Mithila Member gets 151 fresh interests when they renew; Mithila Premium has no limit.',
  },
  {
    q: 'Are there monthly plans?',
    a: 'No. Both paid plans are annual (365 days). There are no monthly options.',
  },
]

// ── JSON-LD ─────────────────────────────────────────────────────────────────

function buildJsonLd(memberRupees: number, premiumRupees: number) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE}/pricing#webpage`,
        url: `${SITE}/pricing`,
        name: 'Pricing — Mithila Jodi Matrimonial Plans',
        breadcrumb: { '@id': `${SITE}/pricing#breadcrumb` },
        inLanguage: 'en',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE}/pricing#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${SITE}/pricing` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'Offer',
        name: 'Mithila Jodi — Mithila Member',
        description: '151 interests per year plus messaging for the Mithila community.',
        price: memberRupees.toString(),
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'Mithila Jodi', url: SITE },
      },
      {
        '@type': 'Offer',
        name: 'Mithila Jodi — Mithila Premium',
        description: 'Unlimited interests and messaging — the full matrimonial experience.',
        price: premiumRupees.toString(),
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'Mithila Jodi', url: SITE },
      },
    ],
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function Tick() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-maroon/8">
      <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
        <path d="M2.5 7 L5.5 10 L11.5 4" stroke="#7A1220" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </span>
  )
}

function Cross() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-ink/5">
      <svg viewBox="0 0 14 14" width="10" height="10" aria-hidden="true">
        <path d="M3.5 3.5 L10.5 10.5 M10.5 3.5 L3.5 10.5" stroke="#B0A09A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  )
}

function Cell({ value }: { value: CellValue }) {
  if (value === 'tick') return <Tick />
  if (value === 'cross') return <Cross />
  return <span className="text-[13px] text-ink font-medium">{value}</span>
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function PricingPage() {
  // Fetch live prices from DB; fall back to known values if DB unavailable.
  let memberPaise = 15100
  let premiumPaise = 49900
  try {
    const admin = await createAdminClient()
    const { data: plans } = await admin
      .from('plan_config')
      .select('plan, price_paise')
      .in('plan', ['member', 'premium'])
      .eq('active', true)
    for (const p of (plans ?? [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = p as any
      if (row.plan === 'member')  memberPaise  = row.price_paise
      if (row.plan === 'premium') premiumPaise = row.price_paise
    }
  } catch { /* use fallback prices */ }

  const memberRupees  = Math.round(memberPaise  / 100)
  const premiumRupees = Math.round(premiumPaise / 100)
  const jsonLd = buildJsonLd(memberRupees, premiumRupees)

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MithilaHeader />

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="bg-cream py-14 sm:py-20">
          <div className="wrap max-w-2xl text-center">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center justify-center gap-2 text-[13px] text-ink-soft">
                <li><Link href="/" className="hover:text-maroon transition-colors">Home</Link></li>
                <li aria-hidden="true" className="text-gold">›</li>
                <li className="text-maroon font-medium" aria-current="page">Pricing</li>
              </ol>
            </nav>
            <p className="eyebrow mb-3">Membership Plans</p>
            <h1 className="section-heading text-3xl sm:text-4xl">Simple &amp; Transparent Pricing</h1>
            <div className="ornament-line w-20 mx-auto mt-4 mb-6" />
            <p className="text-ink-soft text-[17px] leading-relaxed max-w-xl mx-auto">
              Choose the experience that works for you. Start free and upgrade when you are ready
              to connect more deeply.
            </p>
          </div>
        </section>

        {/* ── Pricing cards ─────────────────────────────────────── */}
        <section className="bg-paper py-12 sm:py-16" aria-label="Pricing plans">
          <div className="wrap max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">

              {/* FREE card */}
              <div className="rounded-mj border border-gold/30 bg-cream shadow-mj-xs p-6 flex flex-col gap-4">
                <div>
                  <p className="eyebrow mb-1.5 text-[10px]">Free</p>
                  <div className="flex items-baseline gap-1 mb-0.5">
                    <span className="font-serif text-maroon text-[38px] leading-none font-semibold">₹0</span>
                  </div>
                  <p className="text-ink-soft text-[12px]">per year</p>
                </div>

                <ul className="space-y-2 flex-1">
                  {FREE_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-ink">
                      <Tick />
                      <span>{f}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2 text-[13px] text-ink-soft pt-1 border-t border-gold/20">
                    <Cross />
                    <span>No interest sending</span>
                  </li>
                  <li className="flex items-start gap-2 text-[13px] text-ink-soft">
                    <Cross />
                    <span>No messaging</span>
                  </li>
                </ul>

                <Link
                  href="/register"
                  className="btn-ghost w-full text-center text-[14px] py-2.5 rounded-mj-sm"
                >
                  Create Free Profile
                </Link>
              </div>

              {/* MITHILA MEMBER card */}
              <div className="rounded-mj border border-gold/50 bg-cream shadow-mj-xs p-6 flex flex-col gap-4">
                <div>
                  <p className="eyebrow mb-1.5 text-[10px] text-terra">Mithila Member</p>
                  <div className="flex items-baseline gap-1 mb-0.5">
                    <span className="font-serif text-maroon text-[38px] leading-none font-semibold">₹{memberRupees}</span>
                  </div>
                  <p className="text-ink-soft text-[12px]">per year</p>
                </div>

                <ul className="space-y-2 flex-1">
                  {MEMBER_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-ink">
                      <Tick />
                      <span>{f === 'Everything in Free' ? <strong className="font-semibold">{f}</strong> : f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/membership"
                  className="btn-ghost w-full text-center text-[14px] py-2.5 rounded-mj-sm"
                >
                  Get Mithila Member
                </Link>
              </div>

              {/* MITHILA PREMIUM card */}
              <div className="relative rounded-mj border-2 border-gold bg-cream shadow-mj overflow-hidden flex flex-col">
                {/* Gold top accent */}
                <div className="h-[4px] bg-gradient-to-r from-maroon-deep/30 via-gold to-maroon-deep/30" />

                {/* Badge */}
                <div className="absolute top-3 right-3">
                  <span className="bg-maroon text-gold-lt text-[9px] uppercase tracking-[0.2em] font-semibold px-2.5 py-1 rounded-full">
                    Best value
                  </span>
                </div>

                <div className="p-6 flex flex-col gap-4 flex-1">
                  <div>
                    <p className="eyebrow mb-1.5 text-[10px] text-maroon">Mithila Premium</p>
                    <div className="flex items-baseline gap-1 mb-0.5">
                      <span className="font-serif text-maroon text-[38px] leading-none font-semibold">₹{premiumRupees}</span>
                    </div>
                    <p className="text-ink-soft text-[12px]">per year</p>
                  </div>

                  <ul className="space-y-2 flex-1">
                    {PREMIUM_FEATURES.map(f => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-ink">
                        <Tick />
                        <span>{f === 'Everything in Member' ? <strong className="font-semibold">{f}</strong> : f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/membership"
                    className="btn-primary w-full text-center text-[14px] py-2.5 rounded-mj-sm"
                  >
                    Get Mithila Premium
                  </Link>
                </div>
              </div>

            </div>

            {/* Notice */}
            <div className="mt-6 flex gap-3 items-start bg-cream border border-gold/40 rounded-mj-sm px-5 py-4 shadow-mj-xs">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none" className="shrink-0 mt-0.5 text-gold" aria-hidden="true">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 6v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="10" cy="13.5" r="0.9" fill="currentColor"/>
              </svg>
              <p className="text-[14px] text-ink-soft leading-relaxed">
                <strong className="text-ink">Note:</strong> Free members cannot send interests or messages.
                {' '}<strong className="text-maroon">Mithila Member and Mithila Premium</strong>{' '}
                are required to send interests and message matches after acceptance.
                Your profile and biodata are always retained, even after a plan expires.
              </p>
            </div>
          </div>
        </section>

        {/* ── Feature comparison ────────────────────────────────── */}
        <section className="bg-cream py-12 sm:py-16" aria-label="Feature comparison">
          <div className="wrap max-w-4xl">
            <div className="text-center mb-8">
              <p className="eyebrow mb-2">What is included</p>
              <h2 className="section-heading text-2xl">Plan Comparison</h2>
              <div className="ornament-line w-16 mx-auto mt-3" />
            </div>

            <div className="rounded-mj border border-gold/30 overflow-hidden shadow-mj-xs">
              <table className="w-full table-fixed text-[12px] sm:text-[13px]">
                <colgroup>
                  <col className="w-[40%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="bg-maroon">
                    <th className="px-4 py-3 text-left font-serif font-normal text-gold-lt text-[12px]">Feature</th>
                    <th className="px-2 py-3 text-center font-serif font-normal text-gold-lt text-[12px]">Free</th>
                    <th className="px-2 py-3 text-center font-serif font-normal text-gold-lt text-[12px]">
                      <span className="flex flex-col items-center gap-0.5 leading-tight">
                        <span>Member</span>
                        <span className="text-[9px] uppercase tracking-wider text-gold">₹{memberRupees}/yr</span>
                      </span>
                    </th>
                    <th className="px-2 py-3 text-center font-serif font-normal text-gold-lt text-[12px]">
                      <span className="flex flex-col items-center gap-0.5 leading-tight">
                        <span>Premium</span>
                        <span className="text-[9px] uppercase tracking-wider text-gold">₹{premiumRupees}/yr</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={[
                        'border-t border-gold/15 transition-colors',
                        i % 2 === 0 ? 'bg-cream' : 'bg-paper',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 text-ink leading-snug">{row.feature}</td>
                      <td className="px-2 py-3 text-center align-middle">
                        <span className="flex justify-center"><Cell value={row.free} /></span>
                      </td>
                      <td className="px-2 py-3 text-center align-middle bg-gold/[0.03]">
                        <span className="flex justify-center"><Cell value={row.member} /></span>
                      </td>
                      <td className="px-2 py-3 text-center align-middle bg-gold/[0.06]">
                        <span className="flex justify-center"><Cell value={row.premium} /></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-center mt-5 text-[13px] text-ink-soft">
              All plans are annual and billed once per year.{' '}
              <Link href="/membership" className="text-maroon hover:underline underline-offset-2">
                Upgrade now →
              </Link>
            </p>
          </div>
        </section>

        {/* ── Trust / transparency ──────────────────────────────── */}
        <section className="bg-paper py-12 sm:py-14" aria-label="Pricing transparency">
          <div className="wrap max-w-2xl text-center">
            <p className="eyebrow mb-3">No confusion, no hidden pricing</p>
            <h2 className="section-heading text-xl sm:text-2xl mb-6">Transparent Pricing, Always</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {[
                { label: 'Plans are annual', body: 'All paid plans are billed on a yearly basis. There are no monthly options.' },
                { label: 'Free is ₹0/year', body: 'Free membership costs nothing. You will never be charged for Free features.' },
                { label: `Member is ₹${memberRupees}/year`, body: `Mithila Member is billed at ₹${memberRupees} per year for 151 interests and messaging.` },
                { label: `Premium is ₹${premiumRupees}/year`, body: `Mithila Premium is billed at ₹${premiumRupees} per year for unlimited interests and messaging.` },
              ].map(({ label, body }) => (
                <div key={label} className="card p-5">
                  <h3 className="font-serif text-maroon text-[15px] mb-1.5">{label}</h3>
                  <p className="text-ink-soft text-[13px] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section id="faq" className="bg-cream py-12 sm:py-16" aria-label="Pricing FAQ">
          <div className="wrap max-w-2xl">
            <div className="text-center mb-8">
              <p className="eyebrow mb-2">Common questions</p>
              <h2 className="section-heading text-2xl">Pricing FAQ</h2>
              <div className="ornament-line w-16 mx-auto mt-3" />
            </div>
            <div className="space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="card p-5 group">
                  <summary className="font-serif text-maroon text-[16px] sm:text-[17px] cursor-pointer list-none flex items-start justify-between gap-3">
                    <span>{q}</span>
                    <span className="text-gold text-xl leading-none shrink-0 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="text-ink-soft text-[14px] sm:text-[15px] leading-relaxed mt-3">{a}</p>
                </details>
              ))}
            </div>

            <div className="mt-10 text-center flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-ghost">Create Free Profile</Link>
              <Link href="/membership" className="btn-primary">Upgrade Now</Link>
            </div>
          </div>
        </section>

      </main>

      <MithilaFooter />
    </div>
  )
}
