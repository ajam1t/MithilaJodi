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
    'Simple, transparent pricing for Mithila Jodi — a matrimonial platform for the Mithila community. Free plan at ₹0/year. Premium at ₹151/year with messaging, advanced search, and unlimited interests.',
  alternates: { canonical: `${SITE}/pricing` },
  openGraph: {
    type: 'website',
    url: `${SITE}/pricing`,
    siteName: 'Mithila Jodi',
    title: 'Pricing — Mithila Jodi Matrimonial Plans',
    description:
      'Free and Premium plans for Mithila matrimony. Start free at ₹0/year, upgrade to Premium at ₹151/year for messaging, advanced search, and the full experience.',
    images: ['/hero-couple.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Mithila Jodi',
    description: 'Free plan at ₹0/year. Premium at ₹151/year. Transparent pricing for Mithila matrimonial membership.',
    images: ['/hero-couple.jpg'],
  },
}

// ── Feature comparison data ─────────────────────────────────────────────────

type CellValue = 'tick' | 'cross' | string

const COMPARISON: { feature: string; free: CellValue; premium: CellValue }[] = [
  { feature: 'Create matrimonial profile', free: 'tick',      premium: 'tick' },
  { feature: 'Create marriage biodata',   free: 'tick',      premium: 'tick' },
  { feature: 'Profile search',            free: 'Limited',   premium: 'Full' },
  { feature: 'Advanced search',           free: 'cross',     premium: 'tick' },
  { feature: 'Send Interest',             free: '1 per day', premium: 'Unlimited' },
  { feature: 'Receive Interest',          free: 'tick',      premium: 'tick' },
  { feature: 'Accept Interest',           free: 'tick',      premium: 'tick' },
  { feature: 'Messaging',                 free: 'cross',     premium: 'tick' },
  { feature: 'Enhanced visibility',       free: 'cross',     premium: 'tick' },
  { feature: 'Shortlist profiles',        free: 'tick',      premium: 'tick' },
  { feature: 'Privacy controls',          free: 'tick',      premium: 'tick' },
]

const FREE_FEATURES = [
  'Create matrimonial profile',
  'Create marriage biodata',
  'Limited profile search',
  'Receive & accept interests',
  'Shortlist profiles',
  'Privacy controls',
]

const PREMIUM_FEATURES = [
  'Everything in Free',
  'Full & advanced search',
  'Unlimited interests',
  'Messaging after interest accepted',
  'Enhanced profile visibility',
  'Better profile discovery',
  'Full matrimonial experience',
]

const FAQS = [
  {
    q: 'Is Free membership really ₹0?',
    a: 'Yes. You can create a matrimonial profile and use all listed Free features without paying anything.',
  },
  {
    q: 'How much is Premium?',
    a: 'Premium is ₹151 per year. There are no monthly plans.',
  },
  {
    q: 'Can Free members send Interest?',
    a: 'Yes, but Free members are limited to sending 1 Interest per day. Premium members can send unlimited interests.',
  },
  {
    q: 'Can Free members send messages?',
    a: 'No. Messaging is a Premium feature. Free members can receive and accept interests, but messaging is not available until you upgrade.',
  },
  {
    q: 'What happens when someone accepts my Interest?',
    a: 'Free members can see the accepted Interest in their activity. To begin messaging that person, you will need to upgrade to Premium.',
  },
  {
    q: 'Can I search profiles for free?',
    a: 'Yes, but Free members have limited search and discovery access. Premium unlocks full search filters and advanced search.',
  },
]

// ── JSON-LD ─────────────────────────────────────────────────────────────────

function buildJsonLd(premiumRupees: number) {
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
        name: 'Mithila Jodi Premium',
        description: 'Full matrimonial membership with messaging, advanced search, and unlimited interests.',
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
  // Fetch live price from DB; fall back to ₹151 if DB unavailable.
  let premiumPaiseFallback = 15100
  try {
    const admin = await createAdminClient()
    const { data } = await admin
      .from('plan_config')
      .select('price_paise')
      .eq('active', true)
      .order('price_paise', { ascending: true })
      .limit(1)
      .maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((data as any)?.price_paise) premiumPaiseFallback = (data as any).price_paise
  } catch { /* use fallback */ }

  const premiumRupees = Math.round(premiumPaiseFallback / 100)
  const jsonLd = buildJsonLd(premiumRupees)

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
          <div className="wrap max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">

              {/* FREE card */}
              <div className="rounded-mj border border-gold/30 bg-cream shadow-mj-xs p-7 flex flex-col gap-5">
                <div>
                  <p className="eyebrow mb-2">Free</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-serif text-maroon text-[42px] leading-none font-semibold">₹0</span>
                  </div>
                  <p className="text-ink-soft text-[13px]">per year</p>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {FREE_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-ink">
                      <Tick />
                      <span>{f}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5 text-[14px] text-ink-soft pt-1 border-t border-gold/20">
                    <span className="text-gold shrink-0 mt-0.5">·</span>
                    <span>1 Interest per day</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[14px] text-ink-soft">
                    <span className="text-ink-soft/50 shrink-0 mt-0.5">·</span>
                    <span>No messaging</span>
                  </li>
                </ul>

                <Link
                  href="/register"
                  className="btn-ghost w-full text-center text-[15px] py-3 rounded-mj-sm"
                >
                  Create Free Profile
                </Link>
              </div>

              {/* PREMIUM card */}
              <div className="relative rounded-mj border-2 border-gold bg-cream shadow-mj overflow-hidden flex flex-col">
                {/* Gold top accent */}
                <div className="h-[4px] bg-gradient-to-r from-maroon-deep/30 via-gold to-maroon-deep/30" />

                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className="bg-maroon text-gold-lt text-[9px] uppercase tracking-[0.2em] font-semibold px-3 py-1 rounded-full">
                    Recommended
                  </span>
                </div>

                <div className="p-7 flex flex-col gap-5 flex-1">
                  <div>
                    <p className="eyebrow mb-2 text-maroon">Premium</p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-serif text-maroon text-[42px] leading-none font-semibold">₹{premiumRupees}</span>
                    </div>
                    <p className="text-ink-soft text-[13px]">per year</p>
                  </div>

                  <ul className="space-y-2.5 flex-1">
                    {PREMIUM_FEATURES.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-[14px] text-ink">
                        <Tick />
                        <span>{f === 'Everything in Free' ? <strong className="font-semibold">{f}</strong> : f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/membership"
                    className="btn-primary w-full text-center text-[15px] py-3 rounded-mj-sm"
                  >
                    Upgrade to Premium
                  </Link>
                </div>
              </div>

            </div>

            {/* Messaging notice */}
            <div className="mt-6 flex gap-3 items-start bg-cream border border-gold/40 rounded-mj-sm px-5 py-4 shadow-mj-xs">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none" className="shrink-0 mt-0.5 text-gold" aria-hidden="true">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 6v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="10" cy="13.5" r="0.9" fill="currentColor"/>
              </svg>
              <p className="text-[14px] text-ink-soft leading-relaxed">
                <strong className="text-ink">Important:</strong> Free members can receive and accept interests,
                but <strong className="text-maroon">messaging is only available to Premium members.</strong>{' '}
                If someone accepts your interest, you will need to upgrade to Premium to begin messaging.
              </p>
            </div>
          </div>
        </section>

        {/* ── Feature comparison ────────────────────────────────── */}
        <section className="bg-cream py-12 sm:py-16" aria-label="Feature comparison">
          <div className="wrap max-w-3xl">
            <div className="text-center mb-8">
              <p className="eyebrow mb-2">What is included</p>
              <h2 className="section-heading text-2xl">Plan Comparison</h2>
              <div className="ornament-line w-16 mx-auto mt-3" />
            </div>

            <div className="rounded-mj border border-gold/30 overflow-hidden shadow-mj-xs">
              <table className="w-full table-fixed text-[13px] sm:text-[14px]">
                <colgroup>
                  <col className="w-[55%]" />
                  <col className="w-[22.5%]" />
                  <col className="w-[22.5%]" />
                </colgroup>
                <thead>
                  <tr className="bg-maroon">
                    <th className="px-4 py-3 text-left font-serif font-normal text-gold-lt text-[13px]">Feature</th>
                    <th className="px-3 py-3 text-center font-serif font-normal text-gold-lt text-[13px]">Free</th>
                    <th className="px-3 py-3 text-center font-serif font-normal text-gold-lt text-[13px]">
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
                      <td className="px-3 py-3 text-center align-middle">
                        <span className="flex justify-center"><Cell value={row.free} /></span>
                      </td>
                      <td className="px-3 py-3 text-center align-middle bg-gold/[0.04]">
                        <span className="flex justify-center"><Cell value={row.premium} /></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-center mt-5 text-[13px] text-ink-soft">
              Prices are annual and billed once per year.{' '}
              <Link href="/membership" className="text-maroon hover:underline underline-offset-2">
                Upgrade to Premium →
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
                { label: 'Plans are annual', body: 'Both Free and Premium are billed on a yearly basis. There are no monthly plans.' },
                { label: 'Free is ₹0/year', body: 'Free membership costs nothing. You will never be charged for Free features.' },
                { label: `Premium is ₹${premiumRupees}/year`, body: 'The full Premium plan is billed at ₹' + premiumRupees + ' per year, payable in one transaction.' },
                { label: 'No surprises at checkout', body: 'You will see the applicable charges clearly before completing any payment.' },
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
              <Link href="/membership" className="btn-primary">Upgrade to Premium</Link>
            </div>
          </div>
        </section>

      </main>

      <MithilaFooter />
    </div>
  )
}
