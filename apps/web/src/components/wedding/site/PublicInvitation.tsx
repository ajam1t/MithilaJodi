import type { Metadata } from 'next'
import Link from 'next/link'
import '@/styles/wedding.css'
import { WeddingSite } from '@/components/wedding/site/WeddingSite'
import { dateL, wt, type Lang } from '@/lib/wedding/i18n'
import type { Invite } from '@/lib/wedding/schema'

/**
 * The public invitation page, shared by /Invitation/[slug] (short link) and
 * /wedding/[name]?d= (the original self-contained link), so both render the
 * same invitation in exactly the same way.
 */

/** Short stable key for "already opened in this session" — djb2 over the payload. */
function openingKey(d: string): string {
  let h = 5381
  for (let i = 0; i < d.length; i++) h = ((h << 5) + h + d.charCodeAt(i)) | 0
  return `wd-open:${(h >>> 0).toString(36)}`
}

export function invitationMetadata(invite: Invite, lang: Lang, url: string, image: string): Metadata {
  const c = invite.c
  const couple = `${c.couple.brideName} & ${c.couple.groomName}`
  const description = [wt(lang, 'metaInvite', { couple }), dateL(lang, c.wedding.date), c.wedding.venueName].filter(Boolean).join(' · ')
  const title = `${couple} — ${wt(lang, 'invitation')}`
  return {
    title: { absolute: `${title} | Mithila Jodi` },
    description,
    alternates: { canonical: url },
    // A family's wedding is shared by link, never indexed.
    robots: { index: false, follow: false },
    openGraph: { type: 'website', url, siteName: 'Mithila Jodi', title, description, images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export function PublicInvitation({ invite, payload, shareUrl, lang }: { invite: Invite; payload: string; shareUrl: string; lang?: Lang }) {
  const key = openingKey(payload)
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
      <WeddingSite invite={invite} lang={lang} shareUrl={shareUrl} mode="public" opening="session" openingKey={key} />
    </>
  )
}

export function InvitationUnavailable({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen grid place-items-center bg-paper px-6 text-center">
      <div className="max-w-md">
        <p className="font-deva text-[32px] text-maroon">शुभ विवाह</p>
        <h1 className="mt-3 font-serif text-[24px] text-ink">{title}</h1>
        <p className="mt-2 text-[15px] text-ink-soft leading-relaxed">{body}</p>
        <Link href="/marriage-invitation/premium" className="btn-primary mt-6 inline-block">Create your own invitation</Link>
      </div>
    </main>
  )
}
