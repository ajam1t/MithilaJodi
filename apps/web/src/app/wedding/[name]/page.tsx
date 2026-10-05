import type { Metadata, Viewport } from 'next'
import { permanentRedirect } from 'next/navigation'
import { InvitationUnavailable, PublicInvitation, invitationMetadata } from '@/components/wedding/site/PublicInvitation'
import { decodeInvite } from '@/lib/wedding/codec.server'
import { slugForPayload } from '@/lib/wedding/invites.server'
import { invitationPath } from '@/lib/wedding/slug'
import { weddingTheme } from '@/lib/wedding/themes'
import { isLang, type Lang } from '@/lib/wedding/i18n'
import { createAdminClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants'

/**
 * /wedding/<names>?d=<invitation>[&lang=] — the original link, where the whole
 * invitation is in the URL. It keeps working forever, on its own. If this
 * exact invitation has since been given a short link, visitors are sent there
 * (permanently), so everyone ends up on the same address.
 */
type Props = { params: Promise<{ name: string }>; searchParams: Promise<{ d?: string; lang?: string }> }

/** The short link for this exact invitation, if it has one. Never fails the page. */
async function shortLink(d: string | undefined): Promise<string | null> {
  if (!d) return null
  try { return await slugForPayload(await createAdminClient(), d) } catch { return null }
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
  return invitationMetadata(invite, lang, `${SITE_URL}/wedding/${encodeURIComponent(name)}?d=${d}`, `${SITE_URL}/api/wedding/og?d=${d}`)
}

export default async function WeddingPage({ params, searchParams }: Props) {
  const { name } = await params
  const { d, lang: requested } = await searchParams
  const invite = decodeInvite(d)
  if (!invite || !d) {
    return (
      <InvitationUnavailable
        title="This invitation link looks incomplete"
        body="The whole invitation travels inside its link, so a link that was cut short cannot open. Please ask the family to send it again."
      />
    )
  }
  const slug = await shortLink(d)
  if (slug) permanentRedirect(`${invitationPath(slug)}${isLang(requested) ? `?lang=${requested}` : ''}`)

  return (
    <PublicInvitation
      invite={invite}
      payload={d}
      lang={isLang(requested) ? requested : undefined}
      shareUrl={`${SITE_URL}/wedding/${encodeURIComponent(name)}?d=${d}`}
    />
  )
}
