import 'server-only'

/**
 * Photo visibility — a different axis from `profiles.visibility`.
 *
 * `profiles.visibility` decides whether the profile is seen at all
 * (public / members / private). This decides, among the people who CAN see a
 * profile, who additionally gets to see the photographs. Families routinely want
 * the profile discoverable while photographs stay with accepted connections
 * only, and the three-level profile setting cannot express that.
 *
 * Four levels (labels: Public / Members / Matches / On request):
 *
 *   'all'         any member who can see the profile, and the public pages
 *                 (showcase, Explore) when the profile is featured (default)
 *   'members'     signed-in members only — never on a public page
 *   'connected'   only members with an accepted interest in either direction
 *   'on_request'  as 'connected', plus members whose photo request the owner
 *                 approved (photo_requests, migration 20261022000001) — never
 *                 on a public page
 *
 * Until that migration runs, 'on_request' reads exactly as 'connected'. Any
 * unknown value is 'connected'.
 *
 * Revoking an approval (or a block, which revokes it) takes effect on the next
 * page load: nothing new is signed for the viewer. A signed URL already handed
 * out stays valid until it expires (an hour; photoWeb reuses one for up to 15
 * minutes), which is the same window as any other change of this setting.
 */

import { normalisePhotoVisibility } from '@/lib/photoVisibility'
import { signPhotos } from '@/lib/photoWeb'

export { normalisePhotoVisibility, type PhotoVisibility } from '@/lib/photoVisibility'

/**
 * Which of `ownerProfileIds` may show their photo to `viewerProfileId`.
 *
 * One query for the settings and, only if needed, one for the connections and
 * (for 'on_request' owners) one each for approvals and blocks — this is called
 * from list endpoints, so it must not be per-row.
 *
 * `viewerProfileId` may be null — a signed-in member without a profile yet, who
 * sees 'all' and 'members' owners. Public pages pass `publicPage`, which admits
 * 'all' owners only: the open web is neither a member nor a connection.
 */
export async function filterPhotoViewable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  viewerProfileId: string | null,
  ownerProfileIds: string[],
  opts: { publicPage?: boolean } = {},
): Promise<Set<string>> {
  const allowed = new Set<string>()
  if (ownerProfileIds.length === 0) return allowed

  const { data: rows, error: settingsError } = await admin
    .from('profile_private')
    .select('profile_id, photo_visibility')
    .in('profile_id', ownerProfileIds)

  // Fail closed: if the settings cannot be read, show no photographs rather
  // than treating every owner as "visible to all".
  if (settingsError) {
    console.error('[photoAccess] settings read failed:', settingsError.message)
    return allowed
  }

  // profile_private rows are optional; a missing row means no restriction set.
  const restricted = new Set<string>()
  const onRequest = new Set<string>()
  for (const id of ownerProfileIds) allowed.add(id)
  for (const r of (rows ?? []) as { profile_id: string; photo_visibility: string | null }[]) {
    const level = normalisePhotoVisibility(r.photo_visibility)
    if (level === 'connected' || level === 'on_request') {
      restricted.add(r.profile_id)
      allowed.delete(r.profile_id)
      if (level === 'on_request') onRequest.add(r.profile_id)
    } else if (level === 'members' && opts.publicPage) {
      allowed.delete(r.profile_id)
    }
  }

  if (restricted.size === 0 || !viewerProfileId || opts.publicPage) return allowed

  // Re-admit the restricted owners the viewer is actually connected to.
  const ids = [...restricted]
  const { data: accepted } = await admin
    .from('interests')
    // The columns are from_profile / to_profile. The old *_id names made this
    // query error every time, so accepted connections never saw a
    // connections-only member's photos.
    .select('from_profile, to_profile')
    .eq('status', 'accepted')
    .or(
      `and(from_profile.eq.${viewerProfileId},to_profile.in.(${ids.join(',')})),` +
      `and(to_profile.eq.${viewerProfileId},from_profile.in.(${ids.join(',')}))`,
    )

  for (const row of (accepted ?? []) as { from_profile: string; to_profile: string }[]) {
    const other = row.from_profile === viewerProfileId ? row.to_profile : row.from_profile
    if (restricted.has(other)) allowed.add(other)
  }

  // 'on_request' owners also admit the members they approved. One query for
  // all of them, and only for the ones not already admitted as a match.
  const pendingApproval = [...onRequest].filter(id => !allowed.has(id))
  if (pendingApproval.length === 0) return allowed

  const { data: approved, error: approvedError } = await admin
    .from('photo_requests')
    .select('owner_profile')
    .eq('requester_profile', viewerProfileId)
    .eq('status', 'approved')
    .in('owner_profile', pendingApproval)

  if (approvedError) {
    // No table yet (the migration has not run): there are no approvals.
    // Anything else fails closed — no approval is assumed.
    if (approvedError.code !== '42P01' && approvedError.code !== 'PGRST205') {
      console.error('[photoAccess] photo_requests read failed:', approvedError.message)
    }
    return allowed
  }
  const approvedOwners = ((approved ?? []) as { owner_profile: string }[])
    .map(r => r.owner_profile)
    .filter(id => onRequest.has(id))
  if (approvedOwners.length === 0) return allowed

  // A block revokes the approval (api/blocks); this is the second lock, so a
  // revoke that did not land still shows nothing. Fails closed.
  const { data: blocks, error: blockError } = await admin
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(
      `and(blocker_id.eq.${viewerProfileId},blocked_id.in.(${approvedOwners.join(',')})),` +
      `and(blocked_id.eq.${viewerProfileId},blocker_id.in.(${approvedOwners.join(',')}))`,
    )
  if (blockError) {
    console.error('[photoAccess] blocks read failed:', blockError.message)
    return allowed
  }
  const blocked = new Set<string>()
  for (const b of (blocks ?? []) as { blocker_id: string; blocked_id: string }[]) {
    blocked.add(b.blocker_id === viewerProfileId ? b.blocked_id : b.blocker_id)
  }
  for (const id of approvedOwners) if (!blocked.has(id)) allowed.add(id)

  return allowed
}

/** Single-profile convenience wrapper. */
export async function canViewPhotos(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  viewerProfileId: string | null,
  ownerProfileId: string,
): Promise<boolean> {
  const allowed = await filterPhotoViewable(admin, viewerProfileId, [ownerProfileId])
  return allowed.has(ownerProfileId)
}

/**
 * Signed URLs for a profile's approved photographs, primary first, then in the
 * owner's display order. The one loader for every gallery that shows a member's
 * photos (shared Digital Profile, member profile page).
 *
 * This only fetches — it does not decide who may see them. Callers gate it:
 * the member page with canViewPhotos, a shared link with its 'photos' section.
 * Pending and rejected photos never appear; URLs expire after an hour.
 */
export async function approvedPhotoUrls(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  profileId: string,
  limit = 5,
): Promise<string[]> {
  const { data: rows } = await admin
    .from('profile_photos')
    .select('storage_path, is_primary, display_order')
    .eq('profile_id', profileId)
    .eq('status', 'approved')
    .order('is_primary', { ascending: false })
    .order('display_order', { ascending: true })
    .limit(limit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paths = (rows ?? []).map((r: any) => r.storage_path as string).filter(Boolean)
  if (paths.length === 0) return []
  const { data: signed } = await signPhotos(admin, paths)
  const urls: string[] = []
  for (const s of signed ?? []) if (s?.signedUrl) urls.push(s.signedUrl)
  return urls
}
