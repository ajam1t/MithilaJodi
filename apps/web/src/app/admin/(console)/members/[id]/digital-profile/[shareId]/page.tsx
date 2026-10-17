import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/admin/ui'
import { CopyButton } from '@/components/admin/CopyButton'
import { DigitalProfileView } from '@/components/digital-profile/DigitalProfileView'
import { requireAdminPage } from '@/lib/adminAuth'
import { createAdminClient } from '@/lib/supabase/server'
import { loadSharedProfile } from '@/lib/profileShare'
import { isNoExpiry } from '@/lib/digitalProfile'
import { SITE_URL } from '@/lib/constants'

export const metadata = { title: 'Digital Profile', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f-]{36}$/i

/**
 * A member's Digital Profile link, as the people it was sent to see it —
 * opened inside the Admin Console, so it is not counted as a view of the
 * member's link (only /p/[token] counts opens). Shows revoked and expired
 * links too, so admins can see what was shared.
 */
export default async function AdminDigitalProfilePage({ params }: { params: Promise<{ id: string; shareId: string }> }) {
  await requireAdminPage('view')
  const { id, shareId } = await params
  if (!UUID.test(id) || !UUID.test(shareId)) notFound()
  const admin = await createAdminClient()

  const { data: profile } = await admin.from('profiles').select('id').eq('account_id', id).is('deleted_at', null).maybeSingle()
  if (!profile) notFound()
  const { data: share } = await admin
    .from('profile_shares')
    .select('id, token, label, created_at, expires_at, revoked_at, view_count')
    .eq('id', shareId)
    .eq('profile_id', profile.id)
    .maybeSingle()
  if (!share) notFound()

  const result = await loadSharedProfile(admin, share.token, { ownerPreview: true })
  const live = !share.revoked_at && (isNoExpiry(share.expires_at) || new Date(share.expires_at).getTime() > Date.now())
  const url = `${SITE_URL}/p/${share.token}`

  return (
    <>
      <p className="mb-3 text-[13px]"><Link href={`/admin/members/${id}`} className="text-ink-soft hover:text-ink">← Back to member</Link></p>
      <div className="mb-4 rounded-xl border border-[#E8E1D5] bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-ink">{share.label || 'Digital Profile link'}</p>
          {live ? <Badge tone="good">live</Badge> : <Badge>{share.revoked_at ? 'revoked' : 'expired'}</Badge>}
          <span className="text-[12.5px] text-ink-soft">· {share.view_count ?? 0} opens</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md bg-[#FAF7F2] px-2 py-1 text-[12.5px] text-ink">{url}</code>
          <CopyButton text={url} label="Copy link" />
        </div>
        <p className="mt-1.5 text-[12px] text-ink-soft">
          Shown below exactly as recipients see it. Viewing it here is not counted; opening the link itself is.
        </p>
      </div>
      {'profile' in result && result.profile ? (
        <div className="rounded-xl border border-[#E8E1D5] bg-paper">
          <DigitalProfileView profile={result.profile} profileId={result.profileId} mode="preview" audience="owner" />
        </div>
      ) : (
        <p className="rounded-xl border border-[#E8E1D5] bg-white p-4 text-[13.5px] text-ink-soft">This link no longer has a profile to show.</p>
      )}
    </>
  )
}
