import 'server-only'

/* eslint-disable @typescript-eslint/no-explicit-any */

/*
 * Admin announcements. A campaign is stored once in notification_campaigns
 * and fanned out into one notifications row per member in its audience, so
 * it appears in the same Notifications centre as everything else. The unique
 * index on (campaign_id, account_id) means a member can never get it twice.
 *
 * The audience is resolved when the campaign is created. Deactivating one
 * expires its delivered rows (they disappear from every member's list);
 * reactivating restores them.
 */

export const AUDIENCES = ['all', 'male', 'female', 'incomplete', 'condition', 'specific'] as const
export type Audience = typeof AUDIENCES[number]

/** "Members matching a selected condition" — every field optional, all ANDed. */
export type AudienceCondition = {
  gender?: 'male' | 'female'
  caste?: string
  marital_status?: string
  /** Joined within this many days. */
  joined_within_days?: number
  /** profile_complete below this (1–100). */
  complete_below?: number
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAGE = 1000

/** Account ids in the audience: live profiles on active accounts only. */
export async function resolveAudience(
  admin: any, audience: Audience, condition: AudienceCondition, profileIds: string[],
): Promise<string[]> {
  const accounts = new Set<string>()
  for (let from = 0; ; from += PAGE) {
    let q = admin
      .from('profiles')
      .select('account_id')
      .is('deleted_at', null)
      .not('profile_status', 'in', '(deleted,deactivated)')
      .order('id')
      .range(from, from + PAGE - 1)

    if (audience === 'male' || audience === 'female') q = q.eq('gender', audience)
    if (audience === 'incomplete') q = q.lt('profile_complete', 100)
    if (audience === 'specific') {
      const ids = profileIds.filter(id => UUID.test(id))
      if (ids.length === 0) return []
      q = q.in('id', ids)
    }
    if (audience === 'condition') {
      const c = condition
      if (c.gender) q = q.eq('gender', c.gender)
      if (c.caste) q = q.eq('caste', c.caste)
      if (c.marital_status) q = q.eq('marital_status', c.marital_status)
      if (c.joined_within_days) q = q.gte('created_at', new Date(Date.now() - c.joined_within_days * 86_400_000).toISOString())
      if (c.complete_below) q = q.lt('profile_complete', c.complete_below)
    }

    const { data, error } = await q
    if (error) throw new Error(error.message)
    for (const r of data ?? []) if (r.account_id) accounts.add(r.account_id)
    if (!data || data.length < PAGE) break
  }

  // Drop banned / deleted accounts.
  const ids = [...accounts]
  const live: string[] = []
  for (let i = 0; i < ids.length; i += 500) {
    const { data } = await admin
      .from('accounts')
      .select('id, account_status, deleted_at')
      .in('id', ids.slice(i, i + 500))
    for (const a of data ?? []) {
      if (a.deleted_at === null && a.account_status !== 'banned' && a.account_status !== 'deleted') live.push(a.id)
    }
  }
  return live
}

/** Insert the campaign's notification for each account. Returns how many. */
export async function deliverCampaign(admin: any, campaign: any, accountIds: string[]): Promise<number> {
  let delivered = 0
  for (let i = 0; i < accountIds.length; i += 500) {
    const rows = accountIds.slice(i, i + 500).map(accountId => ({
      account_id: accountId,
      type: campaign.type,
      title: campaign.title,
      message: campaign.message,
      icon: 'megaphone',
      cta_label: campaign.cta_label,
      cta_url: campaign.cta_url,
      source: 'admin',
      campaign_id: campaign.id,
      expires_at: campaign.expires_at,
      payload: { campaign_id: campaign.id },
    }))
    const { error } = await admin.from('notifications').insert(rows)
    if (error) throw new Error(error.message)
    delivered += rows.length
  }
  return delivered
}
