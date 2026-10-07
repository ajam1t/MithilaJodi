import 'server-only'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { EventName } from '@/lib/analytics'

/**
 * Count a feature use from the server, after the response has been sent, so
 * it never slows the request and a failure here never reaches the user.
 * Server events carry no visitor id and no request metadata — they count uses,
 * not people.
 */
// Local and preview runs share the production database, so only the live
// production deployment records anything.
const COLLECT = process.env.VERCEL_ENV === 'production'

export function recordServerEvent(name: EventName, k?: string): void {
  if (!COLLECT) return
  after(async () => {
    try {
      const admin = await createAdminClient()
      await admin.from('site_events').insert({ name, k: k?.slice(0, 120) ?? null })
    } catch {
      /* analytics must never break a request */
    }
  })
}

/** Per-member daily counters (search, opening a profile) for the funnel. */
export function recordMemberActivity(accountId: string, kind: 'search' | 'profile_view'): void {
  if (!COLLECT) return
  after(async () => {
    try {
      const admin = await createAdminClient()
      await admin.rpc('bump_member_activity', { p_account: accountId, p_kind: kind })
    } catch {
      /* best effort */
    }
  })
}
