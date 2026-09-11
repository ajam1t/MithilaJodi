import 'server-only'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The platform's own profile — the "Mithila Jodi" identity an admin sends from.
 *
 * Seeded by migration 20260912000001 rather than created on demand, so a read
 * path never writes and there is exactly one of it. See that migration for why
 * it is a real profile and how it is kept out of search and matching.
 *
 * Identified by a reserved account mobile rather than a hardcoded uuid, so the
 * same code works against any environment's database without per-environment
 * configuration.
 */

/** Reserved sentinel. Indian mobiles begin 6-9, so this can never be a real one. */
export const SYSTEM_ACCOUNT_MOBILE = '0000000000'

/** Display name, kept here so the sender label and the seed cannot drift apart. */
export const SYSTEM_PROFILE_NAME = 'Mithila Jodi'

// Resolved once per server process. The row is seed data and never changes, so
// re-reading it on every admin message would be two wasted round trips.
let cachedId: string | null = null

/**
 * The system profile's id, or null if the seed has not been applied.
 *
 * Returns null rather than throwing so a caller can fail with a message that
 * says what to do; a 500 from a missing migration is not actionable.
 */
export async function getSystemProfileId(admin: any): Promise<string | null> {
  if (cachedId) return cachedId

  const { data: account, error: accountError } = await admin
    .from('accounts')
    .select('id')
    .eq('mobile', SYSTEM_ACCOUNT_MOBILE)
    .maybeSingle()

  if (accountError) {
    console.error('[systemProfile] account lookup failed:', accountError.message)
    return null
  }
  if (!account) return null

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', account.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (profileError) {
    console.error('[systemProfile] profile lookup failed:', profileError.message)
    return null
  }
  if (!profile) return null

  cachedId = profile.id as string
  return cachedId
}

/**
 * Whether a profile id is the platform's own.
 *
 * Used by the member-facing thread so the official sender is not rendered as a
 * link to a matrimonial profile — there is nothing to see there, and
 * /profile/[id] would try to score a match against it.
 */
export async function isSystemProfile(admin: any, profileId: string): Promise<boolean> {
  const id = await getSystemProfileId(admin)
  return id !== null && id === profileId
}
