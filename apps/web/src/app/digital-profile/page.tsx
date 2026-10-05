import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { DigitalProfileLanding } from '@/components/digital-profile/DigitalProfileLanding'
import { DualPromoStrip } from '@/components/home/DualPromoStrip'
import { DigitalProfileDashboard } from '@/components/digital-profile/DigitalProfileDashboard'
import { DigitalProfileView } from '@/components/digital-profile/DigitalProfileView'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { loadOwnerDashboard } from '@/lib/digitalProfileOwner'
import { DIGITAL_PROFILE_PATH } from '@/lib/digitalProfile'
import { SITE_URL } from '@/lib/constants'
import {
  breadcrumbJsonLd, canonicalUrl, jsonLdScript, organizationJsonLd, organizationRef, pageMetadata,
} from '@/lib/seo'

export const dynamic = 'force-dynamic'

/**
 * /digital-profile — one address, two audiences.
 *
 * Visitors (and every crawler) get the landing page: what a Digital Profile
 * is, the fictional demo, FAQ. A signed-in member gets their own dashboard
 * instead, with the landing still a link away (?view=about). The canonical
 * is always the bare path, so the member view never competes in search.
 */

const TITLE = 'Digital Profile — Shareable Maithili Matrimonial Profile'
const DESCRIPTION =
  'Create a beautiful, private Digital Profile for Mithila and Maithili families. Share it on WhatsApp with one link, choose what it shows, and turn it off any time.'

export const metadata: Metadata = pageMetadata({
  path: DIGITAL_PROFILE_PATH,
  title: TITLE,
  socialTitle: 'Mithila Jodi Digital Profile — a shareable matrimonial profile rooted in Mithila',
  description: DESCRIPTION,
  image: `${SITE_URL}/api/og/digital-profile`,
  keywords: [
    'Mithila digital profile', 'Maithili matrimonial profile', 'Maithili digital profile', 'Mithila marriage profile',
    'Maithili marriage profile online', 'create Maithili matrimonial profile', 'shareable matrimonial profile', 'digital marriage profile',
  ],
})

function Shell({ children, promo = false }: { children: React.ReactNode; promo?: boolean }) {
  return (
    <>
      <MithilaHeader />
      {promo && <DualPromoStrip />}
      <main id="main-content" className="bg-paper">{children}</main>
      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </>
  )
}

export default async function DigitalProfilePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const session = await getSessionAccount().catch(() => null)

  if (session && view !== 'about') {
    const admin = await createAdminClient()
    const data = await loadOwnerDashboard(admin, session.id)

    if (data.status === 'no-profile') {
      return (
        <Shell>
          <section className="mx-auto max-w-xl px-4 py-14 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-terra">Digital Profile</p>
            <h1 className="mt-2 font-serif text-[28px] text-maroon">First, your profile</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              Your Digital Profile is made from your Mithila Jodi profile. Add your details, and your shareable link will be ready here.
            </p>
            <Link href="/profile/edit" className="btn-primary mt-5 inline-flex px-6 py-3 text-[15px]">Create my profile</Link>
            <p className="mt-4 text-[13px]"><Link href={`${DIGITAL_PROFILE_PATH}?view=about`} className="text-maroon underline underline-offset-2">See how Digital Profiles look</Link></p>
          </section>
        </Shell>
      )
    }

    const preview = data.preview?.status === 'ok'
      ? <DigitalProfileView profile={data.preview.profile} profileId={data.preview.profileId} mode="preview" nested />
      : <p className="px-4 py-10 text-center text-[14px] text-ink-soft">Your preview will appear here once your profile is active.</p>

    return (
      <Shell>
        <DigitalProfileDashboard
          firstName={data.firstName}
          shares={data.shares}
          primary={data.primary}
          activity={data.activity}
          siteUrl={SITE_URL}
          preview={preview}
        />
        <p className="pb-10 text-center text-[13px] text-ink-soft">
          <Link href={`${DIGITAL_PROFILE_PATH}?view=about`} className="text-maroon underline underline-offset-2">How Digital Profiles work</Link>
          {' · '}
          <Link href="/profile/edit" className="text-maroon underline underline-offset-2">Edit my profile details</Link>
        </p>
      </Shell>
    )
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      organizationJsonLd(),
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl(DIGITAL_PROFILE_PATH)}#webpage`,
        url: canonicalUrl(DIGITAL_PROFILE_PATH),
        name: 'Mithila Jodi Digital Profile',
        description: DESCRIPTION,
        inLanguage: 'en-IN',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        publisher: organizationRef(),
        about: {
          '@type': 'Service',
          name: 'Mithila Jodi Digital Profile',
          serviceType: 'Shareable online matrimonial profile',
          description: 'A shareable online matrimonial profile for Mithila and Maithili families, sent by link and controlled by its owner.',
          provider: organizationRef(),
          areaServed: { '@type': 'Country', name: 'India' },
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
        },
      },
      { ...breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Digital Profile', path: DIGITAL_PROFILE_PATH }]), '@context': undefined },
    ],
  }

  return (
    <Shell promo>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <DigitalProfileLanding ctaHref={session ? DIGITAL_PROFILE_PATH : '/register'} member={!!session} />
    </Shell>
  )
}
