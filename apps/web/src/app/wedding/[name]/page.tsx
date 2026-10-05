import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import '@/styles/wedding.css'
import { WeddingSite } from '@/components/wedding/site/WeddingSite'
import { decodeInvite } from '@/lib/wedding/codec.server'
import { weddingTheme } from '@/lib/wedding/themes'
import { dateL, isLang, wt, type Lang } from '@/lib/wedding/i18n'
import { SITE_URL } from '@/lib/constants'

/**
 * /wedding/<names>?d=<invitation>[&lang=hi|en|mai|sa] — the whole invitation
 * is in the link. Nothing is looked up or stored: the page decodes, validates
 * and renders. `lang` is a guest's choice; without it the couple's language is used.
 */
type Props = { params: Promise<{ name: string }>; searchParams: Promise<{ d?: string; lang?: string }> }

/** Short stable key for "already opened in this session" — djb2 over the payload. */
function openingKey(d: string): string {
  let h = 5381
  for (let i = 0; i < d.length; i++) h = ((h << 5) + h + d.charCodeAt(i)) | 0
  return `wd-open:${(h >>> 0).toString(36)}`
}

export async function generateViewport({ searchParams }: Props): Promise<Viewport> {
  const invite = decodeInvite((await searchParams).d)
  return { themeColor: invite ? weddingTheme(invite.t).accent : '#7A1220' }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { name } = await params
  const { d, lang: requested } = await searchParams
  const invite = decodeInvite(d)
  if (!invite) return { title: 'Wedding invitation', robots: { index: false, follow: false } }
  const lang: Lang = isLang(requested) ? requested : invite.l
  const c = invite.c
  const couple = `${c.couple.brideName} & ${c.couple.groomName}`
  const description = [wt(lang, 'metaInvite', { couple }), dateL(lang, c.wedding.date), c.wedding.venueName].filter(Boolean).join(' · ')
  const url = `${SITE_URL}/wedding/${encodeURIComponent(name)}?d=${d}`
  const image = `${SITE_URL}/api/wedding/og?d=${d}`
  const title = `${couple} — ${wt(lang, 'invitation')}`
  return {
    title: { absolute: `${title} | Mithila Jodi` },
    description,
    // A family's wedding is shared by link, never indexed.
    robots: { index: false, follow: false },
    openGraph: { type: 'website', url, siteName: 'Mithila Jodi', title, description, images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function WeddingPage({ params, searchParams }: Props) {
  const { name } = await params
  const { d, lang: requested } = await searchParams
  const invite = decodeInvite(d)
  if (!invite || !d) {
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
  const key = openingKey(d)
  return (
    <>
      {/* Opened earlier in this session? Hide the envelope before the first paint. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem(${JSON.stringify(key)})){var s=document.createElement('style');s.id='wd-env-hide';s.textContent='#wd-envelope{display:none!important}';document.head.appendChild(s)}}catch(e){}`,
        }}
      />
      {/* Without JavaScript the envelope cannot open — show the invitation directly. */}
      <noscript><style>{'#wd-envelope{display:none!important}'}</style></noscript>
      <WeddingSite
        invite={invite}
        lang={isLang(requested) ? requested : undefined}
        shareUrl={`${SITE_URL}/wedding/${encodeURIComponent(name)}?d=${d}`}
        mode="public"
        opening="session"
        openingKey={key}
      />
    </>
  )
}
