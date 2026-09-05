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
 * Two levels, because two are all we can actually enforce:
 *
 *   'all'        any signed-in member who can see the profile (default)
 *   'connected'  only members with an accepted interest in either direction
 *
 * The older 'on_request' value is treated as 'connected'. There is no
 * photo-request flow, and quietly downgrading to the stricter of the two is the
 * safe reading of what the member asked for.
 *
 * A profile set to 'connected' also has its photograph withheld from the public
 * showcase — the open web is not a connection.
 */

export type PhotoVisibility = 'all' | 'connected'

/** Anything that is not explicitly 'all' is treated as connections-only. */
export function normalisePhotoVisibility(raw: string | null | undefined): PhotoVisibility {
  return !raw || raw === 'all' ? 'all' : 'connected'
}

/**
 * Which of `ownerProfileIds` may show their photo to `viewerProfileId`.
 *
 * One query for the settings and, only if needed, one for the connections —
 * this is called from list endpoints, so it must not be per-row.
 *
 * `viewerProfileId` may be null (a signed-in member without a profile yet, or a
 * public page). In that case only 'all' owners qualify.
 */
export async function filterPhotoViewable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  viewerProfileId: string | null,
  ownerProfileIds: string[],
): Promise<Set<string>> {
  const allowed = new Set<string>()
  if (ownerProfileIds.length === 0) return allowed

  const { data: rows } = await admin
    .from('profile_private')
    .select('profile_id, photo_visibility')
    .in('profile_id', ownerProfileIds)

  // profile_private rows are optional; a missing row means no restriction set.
  const restricted = new Set<string>()
  for (const id of ownerProfileIds) allowed.add(id)
  for (const r of (rows ?? []) as { profile_id: string; photo_visibility: string | null }[]) {
    if (normalisePhotoVisibility(r.photo_visibility) === 'connected') {
      restricted.add(r.profile_id)
      allowed.delete(r.profile_id)
    }
  }

  if (restricted.size === 0 || !viewerProfileId) return allowed

  // Re-admit the restricted owners the viewer is actually connected to.
  const ids = [...restricted]
  const { data: accepted } = await admin
    .from('interests')
    .select('from_profile_id, to_profile_id')
    .eq('status', 'accepted')
    .or(
      `and(from_profile_id.eq.${viewerProfileId},to_profile_id.in.(${ids.join(',')})),` +
      `and(to_profile_id.eq.${viewerProfileId},from_profile_id.in.(${ids.join(',')}))`,
    )

  for (const row of (accepted ?? []) as { from_profile_id: string; to_profile_id: string }[]) {
    const other = row.from_profile_id === viewerProfileId ? row.to_profile_id : row.from_profile_id
    if (restricted.has(other)) allowed.add(other)
  }

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
