import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { findOwnProfileId } from '@/lib/ownProfile'
import { loadSharedProfile, loadSharePreviewName } from '@/lib/profileShare'
import { DigitalProfileView, type ProfileAudience } from '@/components/digital-profile/DigitalProfileView'
import { ProfileConnect, type ConnectState } from '@/components/digital-profile/ProfileConnect'
import { canBeMatched } from '@/lib/matchEligibility'
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

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The signed-in member's standing with this profile, from the interests table:
 * nothing yet, sent, received, or mutual. Members who cannot be matched (same
 * gender) get only the link to the full profile.
 */
async function connectionFor(admin: any, viewerProfileId: string | null, targetId: string, displayName: string) {
  const firstName = displayName.split(' ')[0] || 'them'
  if (!viewerProfileId) {
    return (
      <section className="rounded-mj border border-maroon/25 bg-cream px-4 py-4 text-center">
        <p className="text-[13.5px] text-ink">Complete your own profile to send an interest.</p>
        <Link href="/profile/edit" className="btn-primary mt-2.5 inline-flex px-5 py-2 text-[14px]">Complete Profile</Link>
      </section>
    )
  }
  const [{ data: pair }, { data: rows }] = await Promise.all([
    admin.from('profiles').select('id, gender').in('id', [viewerProfileId, targetId]),
    admin.from('interests')
      .select('from_profile, to_profile, status')
      .or(`and(from_profile.eq.${viewerProfileId},to_profile.eq.${targetId}),and(from_profile.eq.${targetId},to_profile.eq.${viewerProfileId})`),
  ])
  const gender = (id: string) => (pair ?? []).find((r: any) => r.id === id)?.gender
  let state: ConnectState = canBeMatched(gender(viewerProfileId), gender(targetId)) ? 'none' : 'unavailable'
  for (const r of rows ?? []) {
    if (r.status === 'accepted') { state = 'match'; break }
    if (r.status === 'sent') state = r.from_profile === viewerProfileId ? 'sent' : 'received'
  }

  let conversationId: string | null = null
  if (state === 'match') {
    const [a, b] = viewerProfileId < targetId ? [viewerProfileId, targetId] : [targetId, viewerProfileId]
    const { data: conv } = await admin.from('conversations').select('id').eq('profile_a', a).eq('profile_b', b).maybeSingle()
    conversationId = conv?.id ?? null
  }
  // Keyed so moving between two shared links never carries one person's state to the next.
  return <ProfileConnect key={`${targetId}:${state}`} profileId={targetId} firstName={firstName} initial={state} conversationId={conversationId} />
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

  // Who is looking. The projection itself is identical for everyone; this only
  // picks the call to action — join (visitor), connect (member) — and keeps
  // the owner's own visits out of the open count. A failure here degrades to
  // the visitor view.
  let audience: ProfileAudience = 'visitor'
  let connection: React.ReactNode = null
  try {
    const session = await getSessionAccount()
    if (session) {
      const viewerProfileId = await findOwnProfileId(admin, session.id)
      if (viewerProfileId === result.profileId) {
        audience = 'owner'
      } else {
        audience = 'member'
        connection = await connectionFor(admin, viewerProfileId, result.profileId, result.profile.displayName)
      }
    }
  } catch (err) {
    console.error('[p/token] session probe failed:', err)
  }
  const viewerIsOwner = audience === 'owner'

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
        audience={audience}
        connection={connection}
      />
      {!viewerIsOwner && <OpenBeacon token={token} />}
    </main>
  )
}
