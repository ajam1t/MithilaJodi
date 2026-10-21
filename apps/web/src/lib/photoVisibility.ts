/**
 * Who may see a member's photographs (profile_private.photo_visibility) — the
 * values and labels, client-safe. Enforcement is in lib/photoAccess.ts.
 *
 *   'all'         Public     — members, and public pages if the profile is featured
 *   'members'     Members    — signed-in members only, never on a public page
 *   'connected'   Matches    — only accepted matches
 *   'on_request'  On request — accepted matches, plus members the owner has
 *                              approved through a photo request
 */

export type PhotoVisibility = 'all' | 'members' | 'connected' | 'on_request'

export const PHOTO_VISIBILITY_OPTIONS: Array<{ value: PhotoVisibility; label: string; hint: string }> = [
  { value: 'all', label: 'Public', hint: 'Members, and public pages if the profile is featured' },
  { value: 'members', label: 'Members', hint: 'Signed-in members only, never on public pages' },
  { value: 'connected', label: 'Matches', hint: 'Only accepted matches' },
  { value: 'on_request', label: 'On request', hint: 'Only people I approve, and my matches' },
]

/** Empty means the default, Public. Anything unknown means Matches, the stricter reading. */
export function normalisePhotoVisibility(raw: string | null | undefined): PhotoVisibility {
  if (!raw || raw === 'all' || raw === 'public') return 'all'
  if (raw === 'members') return 'members'
  if (raw === 'on_request') return 'on_request'
  return 'connected'
}
