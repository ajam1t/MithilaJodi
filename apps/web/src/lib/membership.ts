import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'

export type MembershipStatus =
  | 'none' | 'pending' | 'active' | 'expiring_soon'
  | 'grace' | 'expired' | 'cancelled' | 'refunded' | 'payment_failed'

export type ActiveMembership = {
  id: string
  plan: string
  status: MembershipStatus
  started_at: string | null
  expires_at: string | null
  grace_until: string | null
}

export type PlanConfig = {
  plan: string
  price_paise: number
  duration_days: number
  grace_days: number
  expiring_soon_days: number
  label_en: string
  label_hi: string | null
  label_mai: string | null
  active: boolean
}

export async function getActiveMembership(accountId: string): Promise<ActiveMembership | null> {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('memberships')
    .select('id, plan, status, started_at, expires_at, grace_until')
    .eq('account_id', accountId)
    .in('status', ['active', 'expiring_soon', 'grace', 'pending', 'payment_failed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null
  return data as ActiveMembership
}

export async function getActivePlan(): Promise<PlanConfig | null> {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('plan_config')
    .select('*')
    .eq('active', true)
    .order('price_paise', { ascending: true })
    .limit(1)
    .maybeSingle()

  return data as PlanConfig | null
}

export function isMembershipLive(status: MembershipStatus): boolean {
  return ['active', 'expiring_soon', 'grace'].includes(status)
}

/**
 * Runtime liveness check that also honours the calendar, not just the stored
 * status string. The scheduled `refresh_membership_statuses()` job may not have
 * run yet (or at all), so a membership row can still say 'active' after its
 * expiry has passed. This treats such a membership as not-live: access is denied
 * once we are past `grace_until` (if a grace window exists) or `expires_at`.
 * No data is mutated here — this is a read-time safeguard only.
 */
export function isMembershipCurrentlyLive(m: ActiveMembership): boolean {
  if (!isMembershipLive(m.status)) return false
  const now = Date.now()
  // Prefer the grace deadline when present; otherwise fall back to expiry.
  const deadline = m.grace_until ?? m.expires_at
  if (deadline && new Date(deadline).getTime() < now) return false
  return true
}

/**
 * Free-access testing mode. When FREE_ACCESS_MODE=true, membership/payment gates
 * are bypassed so every feature is free (registration, interests, messaging,
 * biodata, etc.). Set FREE_ACCESS_MODE=false (or remove it) to re-enable the
 * Razorpay membership gates without any code changes.
 */
export function isFreeAccessMode(): boolean {
  return process.env.FREE_ACCESS_MODE === 'true'
}

/**
 * Returns true if the account may use paid features right now — either because
 * free-access mode is on, or they hold a live membership.
 */
export async function hasFeatureAccess(accountId: string): Promise<boolean> {
  if (isFreeAccessMode()) return true
  const membership = await getActiveMembership(accountId)
  return !!membership && isMembershipCurrentlyLive(membership)
}
