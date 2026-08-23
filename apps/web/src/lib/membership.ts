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
  interests_sent: number
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
  can_send_interest: boolean
  can_message: boolean
  interest_limit: number | null  // null = unlimited
}

export async function getActiveMembership(accountId: string): Promise<ActiveMembership | null> {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('memberships')
    .select('id, plan, status, started_at, expires_at, grace_until, interests_sent')
    .eq('account_id', accountId)
    .in('status', ['active', 'expiring_soon', 'grace', 'pending', 'payment_failed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any
  return {
    id: row.id,
    plan: row.plan,
    status: row.status,
    started_at: row.started_at,
    expires_at: row.expires_at,
    grace_until: row.grace_until,
    interests_sent: row.interests_sent ?? 0,
  }
}

/** Returns the cheapest active purchasable plan. Used by the orders API fallback. */
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

/** Returns all active purchasable plans ordered cheapest-first. */
export async function getAllPlans(): Promise<PlanConfig[]> {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('plan_config')
    .select('*')
    .eq('active', true)
    .order('price_paise', { ascending: true })

  return (data ?? []) as PlanConfig[]
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
 * Returns true if the account may use paid features (messaging, search, etc.)
 * right now — either because free-access mode is on, or they hold a live
 * membership on a plan that allows messaging.
 */
export async function hasFeatureAccess(accountId: string): Promise<boolean> {
  if (isFreeAccessMode()) return true
  const membership = await getActiveMembership(accountId)
  if (!membership || !isMembershipCurrentlyLive(membership)) return false

  // Check the plan explicitly allows messaging
  const admin = await createAdminClient()
  const { data: planRow } = await admin
    .from('plan_config')
    .select('can_message')
    .eq('plan', membership.plan)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (planRow as any)?.can_message === true
}

// ── Interest allowance ───────────────────────────────────────────────────────

export type InterestAllowance = {
  allowed: boolean
  remaining: number | null  // null = unlimited
  limit: number | null
  membershipId: string | null
  plan: string | null
  reason?: 'no_membership' | 'plan_restriction' | 'limit_reached'
}

/**
 * Returns whether this account may send an interest right now, along with
 * how many remain in the current membership period.
 * All enforcement is server-side — never call this from client code.
 */
export async function getInterestAllowance(accountId: string): Promise<InterestAllowance> {
  if (isFreeAccessMode()) {
    return { allowed: true, remaining: null, limit: null, membershipId: null, plan: null }
  }

  const membership = await getActiveMembership(accountId)
  if (!membership || !isMembershipCurrentlyLive(membership)) {
    return { allowed: false, remaining: null, limit: null, membershipId: null, plan: null, reason: 'no_membership' }
  }

  const admin = await createAdminClient()
  const { data: planRow } = await admin
    .from('plan_config')
    .select('can_send_interest, interest_limit')
    .eq('plan', membership.plan)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = planRow as { can_send_interest: boolean; interest_limit: number | null } | null

  if (!p?.can_send_interest) {
    return { allowed: false, remaining: 0, limit: 0, membershipId: membership.id, plan: membership.plan, reason: 'plan_restriction' }
  }

  const limit = p.interest_limit  // null = unlimited
  if (limit === null) {
    return { allowed: true, remaining: null, limit: null, membershipId: membership.id, plan: membership.plan }
  }

  const remaining = Math.max(0, limit - membership.interests_sent)
  return {
    allowed: remaining > 0,
    remaining,
    limit,
    membershipId: membership.id,
    plan: membership.plan,
    reason: remaining === 0 ? 'limit_reached' : undefined,
  }
}
