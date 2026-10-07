import type { Metadata } from 'next'
import Link from 'next/link'
import { DigitalProfileView } from '@/components/digital-profile/DigitalProfileView'
import { DEMO_PROFILE } from '@/lib/digitalProfileDemo'
import { DIGITAL_PROFILE_PATH } from '@/lib/digitalProfile'

/**
 * /digital-profile/sample — the full sample Digital Profile, exactly as a
 * shared link renders, for the fictional Muskan Jha. Static: no database, no
 * member, nothing to contact.
 */
export const metadata: Metadata = {
  title: 'Sample Digital Profile',
  description: 'See exactly how a Mithila Jodi Digital Profile looks when a family opens it — a fictional sample.',
  robots: { index: false, follow: true },
  // Shared on WhatsApp as a demo, so the preview card should say what it is
  // rather than fall back to the site-wide default.
  openGraph: {
    type: 'website',
    siteName: 'Mithila Jodi',
    title: 'Sample Digital Profile — Mithila Jodi',
    description: 'See how a Mithila Jodi Digital Profile looks when a family opens it — a fictional sample.',
    images: ['/og-card.png'],
  },
}

export default function SampleDigitalProfilePage() {
  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <div className="sticky top-0 z-30 border-b border-gold/30 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href={DIGITAL_PROFILE_PATH} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-maroon hover:text-terra">
            <span aria-hidden="true">←</span> Digital Profile
          </Link>
          <Link href="/register" className="btn-primary whitespace-nowrap px-4 py-2 text-[13px]">
            Create My Digital Profile
          </Link>
        </div>
      </div>

      <DigitalProfileView profile={DEMO_PROFILE} profileId={null} mode="demo" />

      <section className="mx-auto max-w-2xl px-4 pb-24 lg:pb-12">
        <div className="rounded-mj-lg bg-maroon-gradient px-5 py-6 text-center text-cream shadow-mj">
          <p className="font-display text-[22px] leading-tight sm:text-[26px]">Your story deserves more than a PDF.</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-cream/90">Create your own Digital Profile and share it privately with family and potential matches.</p>
          <Link href="/register" className="btn mt-4 bg-gold-lt px-6 py-3 text-[15px] font-semibold text-maroon-deep hover:-translate-y-px">
            Create My Digital Profile →
          </Link>
        </div>
      </section>
    </main>
  )
}
