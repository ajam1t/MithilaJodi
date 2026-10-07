import 'server-only'
import { SCORE_COLUMNS } from '@/lib/matchInputs'
import { NEW_MATCH_SCORE, scoreNewMembers } from '@/lib/notifications'
import { countProfileViews, ensurePrimaryShare, type OwnerShare } from '@/lib/digitalProfileOwner'

/* eslint-disable @typescript-eslint/no-explicit-any */

/*
 * The numbers on the member Home and the Inbox badge. Every value is a live
 * count from the database; nothing here is a placeholder.
 */

/** Messages sent to this profile that it has not opened yet. */
export async function countUnreadMessages(admin: any, profileId: string): Promise<number> {
  const { data: convs } = await admin
    .from('conversations')
    .select('id')
    .or(`profile_a.eq.${profileId},profile_b.eq.${profileId}`)
  const ids = (convs ?? []).map((c: any) => c.id as string)
  if (ids.length === 0) return 0
  const { count } = await admin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', ids)
    .neq('sender_id', profileId)
    .is('read_at', null)
    .is('deleted_at', null)
  return count ?? 0
}

export type HomeSummary = {
  firstName: string
  /** New members this week who score "strong" or better for you. */
  newMatches: number
  /** Interests waiting for your reply. */
  newInterests: number
  /** Members who viewed you in the last 30 days (one per viewer per week). */
  profileViews: number
  unreadMessages: number
  /** Your live Digital Profile link, if you have one. */
  share: OwnerShare | null
}

export async function loadHomeSummary(admin: any, accountId: string): Promise<HomeSummary | null> {
  const { data: me } = await admin
    .from('profiles')
    .select([...SCORE_COLUMNS, 'account_id', 'first_name'].join(', '))
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .neq('profile_status', 'deleted')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!me) return null

  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()
  const [fresh, interests, profileViews, unreadMessages, share] = await Promise.all([
    scoreNewMembers(admin, me, weekAgo),
    admin.from('interests').select('id', { count: 'exact', head: true }).eq('to_profile', me.id).eq('status', 'sent'),
    countProfileViews(admin, accountId),
    countUnreadMessages(admin, me.id),
    ensurePrimaryShare(admin, me.id),
  ])

  return {
    firstName: me.first_name ?? '',
    newMatches: fresh.filter(x => x.score >= NEW_MATCH_SCORE).length,
    newInterests: interests.count ?? 0,
    profileViews,
    unreadMessages,
    share,
  }
}
