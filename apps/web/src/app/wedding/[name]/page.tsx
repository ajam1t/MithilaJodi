import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import '@/styles/wedding.css'
import { WeddingSite } from '@/components/wedding/site/WeddingSite'
import { decodeInvite } from '@/lib/wedding/codec.server'
import { weddingTheme } from '@/lib/wedding/themes'
import { longDate } from '@/lib/wedding/format'
import { SITE_URL } from '@/lib/constants'

/**
 * /wedding/<names>?d=<invitation> — the whole invitation is in the link.
 * Nothing is looked up or stored: the page decodes, validates and renders.
 */
type Props = { params: Promise<{ name: string }>; searchParams: Promise<{ d?: string }> }

export async function generateViewport({ searchParams }: Props): Promise<Viewport> {
  const invite = decodeInvite((await searchParams).d)
  return { themeColor: invite ? weddingTheme(invite.t).accent : '#7A1220' }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { name } = await params
  const { d } = await searchParams
  const invite = decodeInvite(d)
  if (!invite) return { title: 'Wedding invitation', robots: { index: false, follow: false } }
  const c = invite.c
  const couple = `${c.couple.brideName} & ${c.couple.groomName}`
  const when = longDate(c.wedding.date)
  const description = [`${couple} warmly invite you to their wedding`, when && `on ${when}`, c.wedding.venueName && `at ${c.wedding.venueName}`]
    .filter(Boolean).join(' ') + '.'
  const url = `${SITE_URL}/wedding/${encodeURIComponent(name)}?d=${d}`
  const image = `${SITE_URL}/api/wedding/og?d=${d}`
  return {
    title: { absolute: `${couple} Wedding Invitation | Mithila Jodi` },
    description,
    // A family's wedding is shared by link, never indexed.
    robots: { index: false, follow: false },
    openGraph: {
      type: 'website', url, siteName: 'Mithila Jodi', title: `${couple} — शुभ विवाह`, description,
      images: [{ url: image, width: 1200, height: 630, alt: `${couple} wedding invitation` }],
    },
    twitter: { card: 'summary_large_image', title: `${couple} — Wedding Invitation`, description, images: [image] },
  }
}

export default async function WeddingPage({ params, searchParams }: Props) {
  const { name } = await params
  const { d } = await searchParams
  const invite = decodeInvite(d)
  if (!invite) {
    return (
      <main className="min-h-screen grid place-items-center bg-paper px-6 text-center">
        <div className="max-w-md">
          <p className="font-deva text-[32px] text-maroon">शुभ विवाह</p>
          <h1 className="mt-3 font-serif text-[24px] text-ink">This invitation link looks incomplete</h1>
          <p className="mt-2 text-[15px] text-ink-soft leading-relaxed">
            The whole invitation travels inside its link, so a link that was cut short cannot open. Please ask the
            family to send it again.
          </p>
          <Link href="/marriage-invitation/premium" className="btn-primary mt-6 inline-block">Create your own invitation</Link>
        </div>
      </main>
    )
  }
  return <WeddingSite invite={invite} shareUrl={`${SITE_URL}/wedding/${encodeURIComponent(name)}?d=${d}`} mode="public" />
}
