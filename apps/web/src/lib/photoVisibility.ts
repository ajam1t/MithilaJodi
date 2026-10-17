/**
 * Who may see a member's photographs (profile_private.photo_visibility) — the
 * values and labels, client-safe. Enforcement is in lib/photoAccess.ts.
 *
 *   'all'        Public  — members, and public pages if the profile is featured
 *   'members'    Members — signed-in members only, never on a public page
 *   'connected'  Matches — only accepted matches
 */

export type PhotoVisibility = 'all' | 'members' | 'connected'

export const PHOTO_VISIBILITY_OPTIONS: Array<{ value: PhotoVisibility; label: string; hint: string }> = [
  { value: 'all', label: 'Public', hint: 'Members, and public pages if the profile is featured' },
  { value: 'members', label: 'Members', hint: 'Signed-in members only, never on public pages' },
  { value: 'connected', label: 'Matches', hint: 'Only accepted matches' },
]

/** Empty means the default, Public. The old 'on_request' and anything unknown mean Matches. */
export function normalisePhotoVisibility(raw: string | null | undefined): PhotoVisibility {
  if (!raw || raw === 'all' || raw === 'public') return 'all'
  if (raw === 'members') return 'members'
  return 'connected'
}
