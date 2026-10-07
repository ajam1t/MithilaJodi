import 'server-only'
import { getLocationIndex, idsWithin } from '@/lib/locationIndex'
import { scoreMatch } from '@/lib/matchScore'
import { SCORE_COLUMNS, SCORE_PREF_COLUMNS, toScoreProfile, toScorePrefs } from '@/lib/matchInputs'
import { oppositeGender } from '@/lib/matchEligibility'

/* eslint-disable @typescript-eslint/no-explicit-any */

/*
 * The member notification centre, server side.
 *
 * Everything that creates a notification goes through notify(), which owns
 * deduplication, so no caller can spam a member by being called twice. The
 * automatic kinds that are not tied to a single action (a profile left
 * incomplete, a message unanswered for a day, a new member who fits) are
 * computed by syncAutomaticNotifications(), at most once every SYNC_EVERY_MIN
 * per member, when that member is using the site. There is no cron.
 *
 * The table is the pre-existing `notifications` (account_id, type, payload,
 * read), extended by migration 20261007000002. Rows written before that have
 * no title/message; describeNotification() supplies copy for them.
 */

export type NotificationType =
  | 'interest_received' | 'interest_accepted' | 'interest_declined' | 'mutual_match'
  | 'new_message' | 'unread_message_reminder' | 'profile_viewed'
  | 'new_member_match' | 'new_member_city' | 'profile_incomplete'
  | 'announcement' | 'system'
  | 'membership_expiring' | 'membership_expired' | 'photo_approved' | 'photo_rejected'
  | 'profile_approved' | 'profile_rejected'

/** Small set of icon names the UI knows how to draw. */
export type NotificationIcon = 'eye' | 'heart' | 'spark' | 'pin' | 'chat' | 'clock' | 'user' | 'megaphone' | 'check' | 'bell'

type NotifyInput = {
  accountId: string
  type: NotificationType
  title: string
  message: string
  icon?: NotificationIcon
  ctaLabel?: string | null
  ctaUrl?: string | null
  payload?: Record<string, unknown>
  source?: 'system' | 'admin'
  /**
   * Identifies "the same notification". With a key, a second call is skipped
   * if one already exists — forever, or only within `cooldownHours`.
   */
  dedupeKey?: string
  cooldownHours?: number
  /**
   * 'refresh': if the existing one is still unread, update it in place (new
   * text, bumped time) instead of skipping. Used for messages, so a chat
   * produces one live notification rather than one per message.
   */
  mode?: 'skip' | 'refresh'
}

/**
 * Create a notification, honouring its dedupe rule. Never throws: a
 * notification failing must not fail the action that caused it.
 */
export async function notify(admin: any, n: NotifyInput): Promise<void> {
  try {
    if (n.dedupeKey) {
      const { data: existing } = await admin
        .from('notifications')
        .select('id, read, created_at')
        .eq('account_id', n.accountId)
        .eq('dedupe_key', n.dedupeKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing) {
        if (n.mode === 'refresh' && !existing.read) {
          await admin.from('notifications').update({
            title: n.title, message: n.message, payload: n.payload ?? {},
            cta_label: n.ctaLabel ?? null, cta_url: n.ctaUrl ?? null,
            created_at: new Date().toISOString(),
          }).eq('id', existing.id)
          return
        }
        if (n.cooldownHours === undefined) {
          if (n.mode !== 'refresh') return
        } else if (Date.now() - Date.parse(existing.created_at) < n.cooldownHours * 3_600_000) {
          return
        }
      }
    }

    const { error } = await admin.from('notifications').insert({
      account_id: n.accountId,
      type: n.type,
      title: n.title,
      message: n.message,
      icon: n.icon ?? null,
      cta_label: n.ctaLabel ?? null,
      cta_url: n.ctaUrl ?? null,
      payload: n.payload ?? {},
      source: n.source ?? 'system',
      dedupe_key: n.dedupeKey ?? null,
    })
    if (error) console.error('[notify] insert error:', n.type, error.message)
  } catch (err) {
    console.error('[notify] failed:', n.type, err)
  }
}

// ─── Display ─────────────────────────────────────────────────────────────────

export type NotificationView = {
  id: string
  type: NotificationType
  title: string
  message: string
  icon: NotificationIcon
  cta_label: string | null
  cta_url: string | null
  read: boolean
  created_at: string
  /** Admin announcements are marked as such in the UI. */
  announcement: boolean
}

/** Copy for rows written before notifications carried their own text. */
function legacyCopy(type: string, p: any): Pick<NotificationView, 'title' | 'message' | 'icon' | 'cta_label' | 'cta_url'> {
  switch (type) {
    case 'interest_received':
      return { title: 'New interest received', message: p?.from_name ? `${p.from_name} sent you an interest.` : 'Someone sent you an interest.', icon: 'heart', cta_label: 'View Interest', cta_url: '/inbox?tab=interests' }
    case 'interest_accepted':
      return { title: 'Your interest was accepted ❤️', message: 'You can now message each other.', icon: 'heart', cta_label: 'View Match', cta_url: '/inbox?tab=mutual' }
    case 'interest_declined':
      return { title: 'An update on your interest', message: 'One of the interests you sent was not taken forward. New members join every week.', icon: 'bell', cta_label: 'Explore Profiles', cta_url: '/search' }
    case 'new_message':
      return { title: 'You have a new message', message: p?.preview ? `“${String(p.preview).slice(0, 80)}”` : 'Open your messages to reply.', icon: 'chat', cta_label: 'Open Messages', cta_url: p?.conversation_id ? `/messages/${p.conversation_id}` : '/inbox' }
    case 'photo_approved':
      return { title: 'Your photo is live', message: 'Your photo was approved and now appears on your profile.', icon: 'check', cta_label: 'View Profile', cta_url: '/profile' }
    case 'photo_rejected':
      return { title: 'A photo needs replacing', message: 'One of your photos could not be approved. Please upload a different one.', icon: 'bell', cta_label: 'Update Photos', cta_url: '/profile/edit#photos' }
    case 'profile_approved':
      return { title: 'Your profile is live', message: 'Families can now discover your profile.', icon: 'check', cta_label: 'View Profile', cta_url: '/profile' }
    default:
      return { title: 'Mithila Jodi update', message: 'There is an update on your account.', icon: 'bell', cta_label: null, cta_url: null }
  }
}

const TYPE_ICON: Partial<Record<string, NotificationIcon>> = {
  profile_viewed: 'eye', new_member_match: 'spark', new_member_city: 'pin', interest_received: 'heart',
  interest_accepted: 'heart', mutual_match: 'heart', new_message: 'chat', unread_message_reminder: 'clock',
  profile_incomplete: 'user', announcement: 'megaphone',
}

export function describeNotification(row: any): NotificationView {
  const legacy = row.title ? null : legacyCopy(row.type, row.payload)
  return {
    id: row.id,
    type: row.type,
    title: row.title ?? legacy!.title,
    message: row.message ?? legacy!.message,
    icon: (row.icon as NotificationIcon) ?? TYPE_ICON[row.type] ?? legacy?.icon ?? 'bell',
    cta_label: row.title ? row.cta_label ?? null : legacy!.cta_label,
    cta_url: row.title ? row.cta_url ?? null : legacy!.cta_url,
    read: !!row.read,
    created_at: row.created_at,
    announcement: row.source === 'admin',
  }
}

/** Notifications that have not expired (admin campaigns can be withdrawn). */
export function liveFilter(query: any): any {
  return query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
}

// ─── Event helpers (called from the routes that cause them) ──────────────────

export function displayName(first: string | null | undefined, last: string | null | undefined): string {
  return [first, last].filter(Boolean).join(' ') || 'A member'
}

/**
 * A member opened someone's profile. The viewer is named only when their own
 * profile is active and discoverable — someone anyone can already find in
 * search; otherwise it is "someone". One per viewer per week.
 */
export async function notifyProfileViewed(admin: any, viewer: any, target: { id: string; account_id: string }): Promise<void> {
  if (!viewer?.id || viewer.account_id === target.account_id) return
  const { data: blocked } = await admin
    .from('blocks')
    .select('blocker_id')
    .or(`and(blocker_id.eq.${viewer.id},blocked_id.eq.${target.id}),and(blocker_id.eq.${target.id},blocked_id.eq.${viewer.id})`)
    .limit(1)
    .maybeSingle()
  if (blocked) return

  const named = viewer.profile_status === 'active' && viewer.discoverable === true
  await notify(admin, {
    accountId: target.account_id,
    type: 'profile_viewed',
    icon: 'eye',
    title: 'Someone viewed your profile',
    message: named ? `${displayName(viewer.first_name, viewer.last_name)} viewed your profile.` : 'A member looked at your profile recently.',
    ctaLabel: named ? 'View Profile' : null,
    ctaUrl: named ? `/profile/${viewer.id}` : null,
    payload: named ? { viewer_profile_id: viewer.id } : {},
    dedupeKey: `profile_viewed:${viewer.id}`,
    cooldownHours: 24 * 7,
  })
}

/** Reading a chat clears that chat's message notifications. */
export async function markConversationNotificationsRead(admin: any, accountId: string, conversationId: string): Promise<void> {
  try {
    await admin
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('account_id', accountId)
      .eq('read', false)
      .in('type', ['new_message', 'unread_message_reminder'])
      .eq('payload->>conversation_id', conversationId)
  } catch (err) {
    console.error('[notifications] mark conversation read failed:', err)
  }
}

// ─── Automatic sync ──────────────────────────────────────────────────────────

const SYNC_EVERY_MIN = 30
/** How far back the first-ever sync looks for new members. */
const FIRST_SYNC_LOOKBACK_DAYS = 3
/** New members older than this are not "new" any more. */
const NEW_MEMBER_WINDOW_DAYS = 7
const CITY_RADIUS_KM = 40
const UNREAD_AFTER_HOURS = 24

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Compute the automatic notifications for one member. Cheap to call often:
 * it returns immediately unless SYNC_EVERY_MIN has passed since the last run.
 */
export async function syncAutomaticNotifications(admin: any, accountId: string): Promise<void> {
  try {
    const { data: state } = await admin
      .from('notification_sync_state')
      .select('last_synced_at')
      .eq('account_id', accountId)
      .maybeSingle()

    const now = Date.now()
    if (state && now - Date.parse(state.last_synced_at) < SYNC_EVERY_MIN * 60_000) return
    const since = state ? Date.parse(state.last_synced_at) : now - FIRST_SYNC_LOOKBACK_DAYS * 86_400_000

    // Claim the slot first, so two tabs loading at once do not both do the work.
    await admin.from('notification_sync_state').upsert({ account_id: accountId, last_synced_at: new Date(now).toISOString() })

    const { data: me } = await admin
      .from('profiles')
      .select([...SCORE_COLUMNS, 'account_id', 'profile_complete', 'profile_status'].join(', '))
      .eq('account_id', accountId)
      .is('deleted_at', null)
      .neq('profile_status', 'deleted')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!me) return

    await Promise.all([
      syncIncompleteProfile(admin, me),
      syncUnreadReminders(admin, me),
      syncNewMembers(admin, me, since),
    ])
  } catch (err) {
    console.error('[notifications sync] failed:', err)
  }
}

/** profile_complete is computeCompletion()'s twelve checks; 100 = complete. */
async function syncIncompleteProfile(admin: any, me: any): Promise<void> {
  if ((me.profile_complete ?? 0) >= 100) return
  await notify(admin, {
    accountId: me.account_id,
    type: 'profile_incomplete',
    icon: 'user',
    title: 'Complete your profile',
    message: 'Your profile is incomplete. Add a few more details to help families discover you.',
    ctaLabel: 'Complete Profile',
    ctaUrl: '/profile/edit',
    dedupeKey: 'profile_incomplete',
    cooldownHours: 24 * 7,
  })
}

/** One reminder per unanswered message, never repeated for the same one. */
async function syncUnreadReminders(admin: any, me: any): Promise<void> {
  const { data: convs } = await admin
    .from('conversations')
    .select('id')
    .or(`profile_a.eq.${me.id},profile_b.eq.${me.id}`)
  const convIds = (convs ?? []).map((c: any) => c.id as string)
  if (convIds.length === 0) return

  const cutoff = new Date(Date.now() - UNREAD_AFTER_HOURS * 3_600_000).toISOString()
  const { data: msgs } = await admin
    .from('messages')
    .select('id, conversation_id, sent_at')
    .in('conversation_id', convIds)
    .neq('sender_id', me.id)
    .is('read_at', null)
    .is('deleted_at', null)
    .lt('sent_at', cutoff)
    .order('sent_at', { ascending: true })
    .limit(50)

  // The oldest unread message in each conversation stands for the whole thread.
  const oldestByConv = new Map<string, string>()
  for (const m of msgs ?? []) if (!oldestByConv.has(m.conversation_id)) oldestByConv.set(m.conversation_id, m.id)

  for (const [convId, msgId] of [...oldestByConv].slice(0, 3)) {
    await notify(admin, {
      accountId: me.account_id,
      type: 'unread_message_reminder',
      icon: 'clock',
      title: 'You have a message waiting for you',
      message: 'You received this message more than a day ago.',
      ctaLabel: 'Open Messages',
      ctaUrl: `/messages/${convId}`,
      payload: { conversation_id: convId },
      dedupeKey: `unread_reminder:${msgId}`,
    })
  }
}

/**
 * New opposite-gender members who joined after `fromIso`, scored against `me`
 * with the same scoreMatch search uses, best first. Never includes anyone on
 * either side of a block, or anyone the scoring itself blocks. Shared by the
 * notification sync and the member Home's "New Matches" count.
 */
export async function scoreNewMembers(admin: any, me: any, fromIso: string): Promise<Array<{ p: any; score: number }>> {
  const wanted = oppositeGender(me.gender)
  if (!wanted) return []

  const { data: fresh } = await admin
    .from('profiles')
    .select([...SCORE_COLUMNS, 'account_id'].join(', '))
    .eq('gender', wanted)
    .eq('profile_status', 'active')
    .eq('discoverable', true)
    .is('deleted_at', null)
    .neq('account_id', me.account_id)
    .gt('created_at', fromIso)
    .order('created_at', { ascending: false })
    .limit(40)
  let pool: any[] = fresh ?? []
  if (pool.length === 0) return []

  // Never point anyone at a profile on either side of a block.
  const { data: blocks } = await admin
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${me.id},blocked_id.eq.${me.id}`)
  const blocked = new Set<string>()
  for (const b of blocks ?? []) blocked.add(b.blocker_id === me.id ? b.blocked_id : b.blocker_id)
  pool = pool.filter(p => !blocked.has(p.id))
  if (pool.length === 0) return []

  const [{ data: myPrefs }, { data: theirPrefs }, index] = await Promise.all([
    admin.from('profile_preferences').select(SCORE_PREF_COLUMNS).eq('profile_id', me.id).maybeSingle(),
    admin.from('profile_preferences').select(SCORE_PREF_COLUMNS).in('profile_id', pool.map(p => p.id)),
    getLocationIndex(admin),
  ])
  const prefsBy = new Map<string, any>((theirPrefs ?? []).map((r: any) => [r.profile_id, r]))
  const viewer = toScoreProfile(me)
  const vPrefs = toScorePrefs(myPrefs)

  return pool
    .map(p => ({ p, r: scoreMatch(viewer, vPrefs, toScoreProfile(p), toScorePrefs(prefsBy.get(p.id)), index) }))
    .filter(x => x.r.blockers.length === 0)
    .sort((a, b) => b.r.score - a.r.score)
    .map(x => ({ p: x.p, score: x.r.score }))
}

/** Score at or above which a new member counts as "matching your preferences". */
export const NEW_MATCH_SCORE = 65

/**
 * New members since the last sync: at most one "matching your preferences"
 * and one "from your city" per day, each about a different person.
 */
async function syncNewMembers(admin: any, me: any, since: number): Promise<void> {
  const from = new Date(Math.max(since, Date.now() - NEW_MEMBER_WINDOW_DAYS * 86_400_000)).toISOString()
  const scored = await scoreNewMembers(admin, me, from)
  if (scored.length === 0) return
  const index = await getLocationIndex(admin)

  const best = scored.find(x => x.score >= NEW_MATCH_SCORE)
  if (best) {
    await notify(admin, {
      accountId: me.account_id,
      type: 'new_member_match',
      icon: 'spark',
      title: 'Someone joined matching your preferences',
      message: 'We found a new member who may be a good fit for you.',
      ctaLabel: 'Explore Match',
      ctaUrl: `/profile/${best.p.id}`,
      payload: { profile_id: best.p.id },
      dedupeKey: `new_member_match:${today()}`,
    })
  }

  // "Your city": someone whose current or work location is within ~40 km of
  // yours. The message never names the place.
  if (me.current_loc_id != null) {
    const near = idsWithin(index, me.current_loc_id as number, CITY_RADIUS_KM)
    const local = scored.find(x =>
      x.p.id !== best?.p.id &&
      ((x.p.current_loc_id != null && near.has(x.p.current_loc_id)) || (x.p.job_loc_id != null && near.has(x.p.job_loc_id))))
    if (local) {
      await notify(admin, {
        accountId: me.account_id,
        type: 'new_member_city',
        icon: 'pin',
        title: 'Someone joined from your city',
        message: 'A new member from your area joined Mithila Jodi.',
        ctaLabel: 'Explore Profiles',
        ctaUrl: '/search',
        payload: { profile_id: local.p.id },
        dedupeKey: `new_member_city:${today()}`,
      })
    }
  }
}
