import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { SITE_URL, SUPPORT_EMAIL } from '@/lib/constants'

/**
 * /pricing — restored deliberately.
 *
 * The route was removed when the platform went free, which left a 404 on a URL
 * that is still indexed and still linked from outside. A 404 on "pricing" is a
 * trust problem for a matrimonial site: the visitor cannot tell whether the
 * service costs money, and the obvious inference is that something was hidden.
 *
 * This page exists to answer the question honestly and in one screen. It states
 * no price, because there is none — the platform charges nothing today and no
 * payment can be taken (the payment endpoints were removed). It deliberately
 * does NOT list the dormant plan_config tiers, which are not purchasable.
 */

const SITE = SITE_URL

export const metadata: Metadata = {
  title: 'Pricing — Free for Every Member',
  description:
    'Mithila Jodi is currently free for every member. Registration, profile creation, marriage biodata in four languages, search, interests and messaging are all included at no charge.',
  alternates: { canonical: `${SITE}/pricing` },
  openGraph: {
    type: 'website',
    url: `${SITE}/pricing`,
    siteName: 'Mithila Jodi',
    title: 'Mithila Jodi Pricing — Currently Free for Every Member',
    description:
      'Every feature on Mithila Jodi is free right now: profiles, biodata in Maithili, Hindi, English and Sanskrit, search, interests and messaging.',
    images: ['/hero-couple.jpg'],
  },
}

const INCLUDED = [
  'Create your matrimonial profile, with gotra, maternal gotra, mool and native gram',
  'Marriage biodata in Maithili, Hindi, English and Sanskrit, ready to download and share',
  'Search and browse profiles across the community',
  'Send and receive interests',
  'Message the members you are connected with',
  'Privacy controls, blocking and profile reporting',
  'The wedding invitation card maker — no account needed',
]

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />

      <main id="main-content" className="flex-1">
        <section className="wrap max-w-3xl py-10 sm:py-14">
          <div className="text-center">
            <p className="eyebrow mb-2">Pricing</p>
            <h1 className="font-serif text-maroon text-[26px] sm:text-[34px] leading-tight">
              Mithila Jodi is free for every member
            </h1>
            <div className="ornament-line mj-line w-16 mx-auto my-4" />
            <p className="font-sans text-ink-soft text-[15px] sm:text-[16px] leading-relaxed mx-auto max-w-[52ch]">
              There is no membership fee, no paid tier and no payment step. We do not ask for card or
              bank details at any point, because there is nothing to pay for.
            </p>
          </div>

          <div className="card mt-8 p-6 sm:p-8">
            <h2 className="font-serif text-maroon text-[19px] sm:text-[21px] mb-4">
              What every member gets, at no cost
            </h2>
            <ul className="space-y-2.5">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-ink-soft text-[15px] leading-relaxed">
                  <span className="text-green font-bold leading-none mt-1 shrink-0" aria-hidden="true">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-mj border border-gold/40 bg-cream p-5 sm:p-6">
            <h2 className="font-serif text-maroon text-[17px] sm:text-[19px] mb-2">
              Will it always be free?
            </h2>
            <p className="text-ink-soft text-[14.5px] leading-relaxed">
              We may introduce paid memberships in future. If that happens we will say so clearly on
              this page and tell existing members in advance — we will not put an unexpected paywall
              in front of a conversation you have already started. Any paid plan would be published
              here with its price, what it includes and what stays free, before it goes live.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link href="/register" className="btn-primary text-[15px] px-7 py-3">
              Create Your Profile Free →
            </Link>
            <p className="mt-4 text-[13px] text-ink-soft">
              Questions about pricing? Email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-maroon underline underline-offset-2">
                {SUPPORT_EMAIL}
              </a>{' '}
              or read our{' '}
              <Link href="/legal/terms" className="text-maroon underline underline-offset-2">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
