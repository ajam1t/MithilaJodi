import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { findOwnProfileId } from '@/lib/ownProfile'
import { loadSharedProfile, loadSharePreviewName } from '@/lib/profileShare'
import { DigitalProfileView } from '@/components/digital-profile/DigitalProfileView'
import { OpenBeacon } from '@/components/digital-profile/OpenBeacon'
import { DIGITAL_PROFILE_PATH } from '@/lib/digitalProfile'
import { SITE_URL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ token: string }> }

/**
 * A Digital Profile, opened from its shared link.
 *
 * `noindex, nofollow` and /p/ is disallowed in robots.txt. Both are needed:
 * robots.txt only asks a crawler not to fetch, and a URL discovered elsewhere
 * (pasted into a public group, a forum) can still be indexed without the tag.
 *
 * The link card carries the member's name only when the owner allowed it on
 * this link, and never a photo or any other detail: WhatsApp and Meta keep
 * previews on their own CDN, out of reach once a link is revoked.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  let name: string | null = null
  try {
    name = await loadSharePreviewName(await createAdminClient(), token)
  } catch { name = null }

  const title = name ? `${name} — Mithila Jodi Digital Profile` : 'A Digital Profile shared with you — Mithila Jodi'
  const description = name
    ? 'Mithila Jodi Digital Profile · Where tradition meets love.'
    : 'A Mithila Jodi member has shared their Digital Profile with you.'
  const image = `${SITE_URL}/api/p/${encodeURIComponent(token)}/og`
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false, nocache: true },
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630, alt: 'Mithila Jodi Digital Profile' }], siteName: 'Mithila Jodi', type: 'profile' },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

function Unavailable({ title, body }: { title: string; body: string }) {
  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="ornament-line mx-auto mb-5 w-14" />
        <h1 className="font-serif text-[24px] leading-tight text-maroon">{title}</h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-ink-soft">{body}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary px-5 py-2.5 text-[14px]">Visit Mithila Jodi</Link>
          <Link href={DIGITAL_PROFILE_PATH} className="btn-ghost px-5 py-2.5 text-[14px]">Create a Digital Profile</Link>
        </div>
      </div>
    </main>
  )
}

export default async function SharedProfilePage({ params }: Props) {
  const { token } = await params
  const admin = await createAdminClient()
  const result = await loadSharedProfile(admin, token)

  // Told apart on purpose: "turned off" and "expired" tell a real recipient to
  // ask for a new link, and reveal nothing that matters against a 128-bit token.
  if (result.status === 'revoked') {
    return <Unavailable title="This link has been turned off" body="The member who shared it has withdrawn access. If they meant to send it to you, ask them for a new link." />
  }
  if (result.status === 'expired') {
    return <Unavailable title="This link has expired" body="This Digital Profile link has reached the date its owner set. Ask them for a fresh one." />
  }
  if (result.status === 'missing') {
    return <Unavailable title="Profile not available" body="This link is not valid, or the profile is no longer active." />
  }

  // Signed in? Only used to offer the full member profile, and to recognise the
  // owner — whose own visits are previews, not opens. The projection itself is
  // identical for everyone, so a failure here degrades to the visitor view.
  let viewerIsMember = false
  let viewerIsOwner = false
  try {
    const session = await getSessionAccount()
    if (session) {
      viewerIsMember = true
      viewerIsOwner = (await findOwnProfileId(admin, session.id)) === result.profileId
    }
  } catch (err) {
    console.error('[p/token] session probe failed:', err)
  }

  return (
    <main id="main-content" className="min-h-screen bg-paper">
      {viewerIsOwner && (
        <div className="bg-maroon px-4 py-2.5 text-center text-[13px] text-cream">
          This is your Digital Profile, exactly as visitors see it. Your own visits are not counted.{' '}
          <Link href={DIGITAL_PROFILE_PATH} className="font-semibold text-gold-lt underline underline-offset-2">Manage sharing</Link>
        </div>
      )}
      <DigitalProfileView
        profile={result.profile}
        profileId={result.profileId}
        mode="public"
        viewerIsMember={viewerIsMember && !viewerIsOwner}
      />
      {!viewerIsOwner && <OpenBeacon token={token} />}
    </main>
  )
}
