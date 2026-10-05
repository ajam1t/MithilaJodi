import type { Metadata, Viewport } from 'next'
import { cache } from 'react'
import { notFound, permanentRedirect } from 'next/navigation'
import { InvitationUnavailable, PublicInvitation, invitationMetadata } from '@/components/wedding/site/PublicInvitation'
import { decodeInvite } from '@/lib/wedding/codec.server'
import { loadBySlug } from '@/lib/wedding/invites.server'
import { invitationPath, isSlug } from '@/lib/wedding/slug'
import { weddingTheme } from '@/lib/wedding/themes'
import { isLang, type Lang } from '@/lib/wedding/i18n'
import { createAdminClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

/**
 * /Invitation/Muskan-Jha-Rahul-Kumar-15122026[?lang=] — the short link.
 * The slug finds the stored invitation code, which is decoded and validated
 * exactly like a long link and rendered by the same component. Any letter
 * case resolves; it is redirected to the canonical capitalisation.
 */
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }

/** One lookup per request, shared by metadata and the page. */
const load = cache(async (slug: string) => {
  if (!isSlug(slug)) return null
  const row = await loadBySlug(await createAdminClient(), slug).catch(() => null)
  const invite = row ? decodeInvite(row.payload) : null
  return row && invite ? { ...row, invite } : null
})

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const found = await load((await params).slug)
  return { themeColor: found ? weddingTheme(found.invite.t).accent : '#7A1220' }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const found = await load((await params).slug)
  if (!found) return { title: 'Wedding invitation', robots: { index: false, follow: false } }
  const { lang: requested } = await searchParams
  const lang: Lang = isLang(requested) ? requested : found.invite.l
  return invitationMetadata(
    found.invite, lang,
    `${SITE_URL}${invitationPath(found.displaySlug)}`,
    `${SITE_URL}/api/wedding/og?s=${found.displaySlug}`,
  )
}

export default async function InvitationPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { lang: requested } = await searchParams
  if (!isSlug(slug)) notFound()
  const found = await load(slug)
  if (!found) {
    return (
      <InvitationUnavailable
        title="This invitation is not available"
        body="The link may be mistyped, or it has closed — invitation links stay open for 180 days after they are made. Please ask the family for their link."
      />
    )
  }
  if (slug !== found.displaySlug) {
    permanentRedirect(`${invitationPath(found.displaySlug)}${isLang(requested) ? `?lang=${requested}` : ''}`)
  }
  return (
    <PublicInvitation
      invite={found.invite}
      payload={found.payload}
      lang={isLang(requested) ? requested : undefined}
      shareUrl={`${SITE_URL}${invitationPath(found.displaySlug)}`}
    />
  )
}
