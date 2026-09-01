import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolve THE canonical profile for an account.
 *
 * Why this exists: `profiles.account_id` has no UNIQUE constraint, and several
 * routes used `.maybeSingle()` without `.limit(1)`. When an account ended up
 * with more than one profile row, PostgREST returned PGRST116 and those routes
 * saw `null` — which made the profile PUT fall through to INSERT (creating yet
 * another row) and made saved edits appear to vanish.
 *
 * Every caller must resolve the profile the same way, otherwise reads and
 * writes can land on different rows. Ordering by `updated_at desc` means the
 * row the member most recently edited is the canonical one, so their latest
 * saved data is what they see.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function findOwnProfileId(
  admin: SupabaseClient<any>,
  accountId: string
): Promise<string | null> {
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as any)?.id ?? null
}

/** Same resolution, but returning the columns the caller asks for. */
export async function findOwnProfile(
  admin: SupabaseClient<any>,
  accountId: string,
  columns = '*'
): Promise<any | null> {
  const { data } = await admin
    .from('profiles')
    .select(columns)
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}
