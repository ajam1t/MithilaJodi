import 'server-only'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { loadOnboarding, type OnboardingState } from '@/lib/onboarding'

/**
 * `profiles.discoverable` is the one switch every discovery surface reads —
 * search, /profile/[id], the public showcase, shortlists, interests and match
 * notifications all require it to be true. This is the only place that decides
 * it for a member's own profile:
 *
 *   discoverable = onboarding complete (lib/onboarding.ts)
 *                  AND not hidden by an admin
 *                  AND the member has not chosen Private
 *
 * Existing members are never hidden by this rule. Profiles created before the
 * registration redesign (REGISTRATION_V2_AT) predate the new required fields
 * ("looking for", city, gotra …); the product decision (2026-10-09) is to ask
 * them to fill those in at their next login — the /welcome gate does that —
 * not to take them out of search or the showcase meanwhile. For them an
 * incomplete onboarding leaves `discoverable` as it is; Private and an admin
 * hide still apply as before.
 *
 * Call it after anything that can change one of those inputs: a profile save,
 * an onboarding step, a photo upload/removal/moderation decision, or an admin
 * show/hide. It writes only when the value actually changes.
 */
export const REGISTRATION_V2_AT = '2026-10-09T00:00:00Z'

export async function syncDiscoverability(admin: any, accountId: string): Promise<OnboardingState> {
  const { state, row } = await loadOnboarding(admin, accountId)
  if (!row) return state
  const blocked = !!row.admin_hidden || row.visibility === 'private'
  const legacy = !!row.created_at && row.created_at < REGISTRATION_V2_AT
  const target = blocked
    ? false
    : state.complete
      ? true
      : legacy
        ? !!row.discoverable // existing member: unchanged until they finish
        : false
  if (row.discoverable !== target) {
    const { error } = await admin.from('profiles').update({ discoverable: target }).eq('id', row.id)
    if (error) console.error('[discoverability] update failed:', error.message)
  }
  return state
}

/** Same, starting from a profile id (admin and moderation paths). */
export async function syncDiscoverabilityForProfile(admin: any, profileId: string): Promise<void> {
  const { data } = await admin.from('profiles').select('account_id').eq('id', profileId).maybeSingle()
  if (data?.account_id) await syncDiscoverability(admin, data.account_id)
}
