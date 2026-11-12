import 'server-only'
import { SITE_URL } from '@/lib/constants'
import { getSetting } from '@/lib/siteSettings'
import { sendOfficialMessage } from '@/lib/officialMessage'
import { nextSendAt, renderMessage } from '@/lib/engagement/format'
export { nextSendAt, renderMessage, instagramHandle, AUTOMATED_FOOTER } from '@/lib/engagement/format'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The 30-day engagement journey (migration 20261112000001).
 *
 * A member is enrolled when an admin approves the account; message one goes at
 * once, and each later message at the configured time (default 09:00 India
 * time) on the following days. The messages themselves are rows in
 * onboarding_messages, edited in Admin → Engagement; they are sent in
 * sort_order, skipping disabled ones, from the official Mithila Jodi profile
 * into the member's ordinary Inbox.
 *
 * Exactly-once: onboarding_message_log has UNIQUE (account_id, message_day).
 * A send first inserts that row as 'sending' — the claim — so two runs racing
 * for the same member cannot both send. A failed send is marked 'failed' and
 * retried later by flipping the row back to 'sending' with a conditional
 * update, which again only one run can win.
 */

export type Automation = { paused: boolean; send_hour: number; send_minute: number }
export const AUTOMATION_DEFAULT: Automation = { paused: false, send_hour: 9, send_minute: 0 }
const MAX_ATTEMPTS = 4

export async function getAutomation(admin: any): Promise<Automation> {
  const { data } = await admin.from('site_settings').select('value').eq('key', 'onboarding_automation').maybeSingle()
  const v = (data?.value ?? {}) as Partial<Automation>
  return {
    paused: v.paused === true,
    send_hour: Number.isInteger(v.send_hour) && v.send_hour! >= 0 && v.send_hour! <= 23 ? v.send_hour! : AUTOMATION_DEFAULT.send_hour,
    send_minute: Number.isInteger(v.send_minute) && v.send_minute! >= 0 && v.send_minute! <= 59 ? v.send_minute! : AUTOMATION_DEFAULT.send_minute,
  }
}

export function absoluteUrl(u: string | null | undefined): string {
  if (!u) return SITE_URL
  return /^https?:\/\//i.test(u) ? u : SITE_URL.replace(/\/$/, '') + (u.startsWith('/') ? u : '/' + u)
}

/** Enrol a newly approved member and send the first message now. Safe to call twice. */
export async function enroll(admin: any, accountId: string, profileId: string | null): Promise<{ ok: boolean; message?: string }> {
  const now = new Date()
  const { error } = await admin.from('member_onboarding').upsert(
    { account_id: accountId, profile_id: profileId, sequence_started_at: now.toISOString(), current_day: 0, next_scheduled_at: now.toISOString(), status: 'active' },
    { onConflict: 'account_id', ignoreDuplicates: true },
  )
  if (error) return { ok: false, message: error.message }
  const r = await sendNext(admin, accountId, { force: true })
  return { ok: r.status === 'sent' || r.status === 'nothing', message: r.detail }
}

type Outcome = { status: 'sent' | 'failed' | 'stopped' | 'completed' | 'nothing' | 'busy'; detail?: string; day?: number }

/** Is this member still someone the journey should write to? */
async function eligibility(admin: any, accountId: string): Promise<{ ok: true; profile: any } | { ok: false; reason: string }> {
  const { data: acct } = await admin.from('accounts').select('id, account_status, deleted_at, approval_status').eq('id', accountId).maybeSingle()
  if (!acct || acct.deleted_at) return { ok: false, reason: 'account removed' }
  if (acct.approval_status && acct.approval_status !== 'approved') return { ok: false, reason: `approval ${acct.approval_status}` }
  if (acct.account_status !== 'active') return { ok: false, reason: `account ${acct.account_status}` }
  const { data: profile } = await admin.from('profiles').select('id, first_name, profile_status').eq('account_id', accountId).is('deleted_at', null).limit(1).maybeSingle()
  if (!profile || profile.profile_status === 'deleted' || profile.profile_status === 'deactivated') return { ok: false, reason: 'profile not available' }
  return { ok: true, profile }
}

/**
 * Send this member their next message if one is due. `force` sends regardless
 * of next_scheduled_at (used for message one on approval, and admin retries).
 */
export async function sendNext(admin: any, accountId: string, { force = false, automation }: { force?: boolean; automation?: Automation } = {}): Promise<Outcome> {
  const now = new Date()
  const auto = automation ?? await getAutomation(admin)
  const { data: row } = await admin.from('member_onboarding').select('*').eq('account_id', accountId).maybeSingle()
  if (!row || row.status !== 'active') return { status: 'nothing', detail: 'not enrolled or not active' }
  if (auto.paused) return { status: 'nothing', detail: 'automation paused' }
  if (!force && row.next_scheduled_at && new Date(row.next_scheduled_at) > now) return { status: 'nothing', detail: 'not due' }

  const el = await eligibility(admin, accountId)
  if (!el.ok) {
    await admin.from('member_onboarding').update({ status: 'stopped', stop_reason: el.reason, next_scheduled_at: null, updated_at: now.toISOString() }).eq('account_id', accountId)
    return { status: 'stopped', detail: el.reason }
  }

  // Next message: the first enabled one, in sequence order, this member has no successful log row for.
  const [{ data: msgs }, { data: logs }] = await Promise.all([
    admin.from('onboarding_messages').select('id, day, sort_order, title, body, feature_url, enabled').eq('enabled', true).order('sort_order', { ascending: true }).order('day', { ascending: true }),
    admin.from('onboarding_message_log').select('id, message_day, delivery_status, attempts').eq('account_id', accountId),
  ])
  const byDay = new Map<number, any>((logs ?? []).map((l: any) => [l.message_day, l]))
  const next = (msgs ?? []).find((m: any) => { const l = byDay.get(m.day); return !l || (l.delivery_status === 'failed' && l.attempts < MAX_ATTEMPTS) })
  if (!next) {
    const anyPending = (msgs ?? []).some((m: any) => byDay.get(m.day)?.delivery_status === 'sending')
    if (anyPending) return { status: 'busy' }
    await admin.from('member_onboarding').update({ status: 'completed', completed_at: now.toISOString(), next_scheduled_at: null, updated_at: now.toISOString() }).eq('account_id', accountId)
    return { status: 'completed' }
  }

  // Claim the day.
  const prior = byDay.get(next.day)
  let logId: string | null = null
  if (!prior) {
    const { data: claimed, error } = await admin.from('onboarding_message_log')
      .insert({ account_id: accountId, message_id: next.id, message_day: next.day, delivery_status: 'sending' }).select('id').single()
    if (error) return { status: 'busy', detail: error.code === '23505' ? 'claimed by another run' : error.message }
    logId = claimed.id
  } else {
    const { data: claimed } = await admin.from('onboarding_message_log')
      .update({ delivery_status: 'sending', attempts: prior.attempts + 1, error_details: null })
      .eq('id', prior.id).eq('delivery_status', 'failed').select('id').maybeSingle()
    if (!claimed) return { status: 'busy', detail: 'claimed by another run' }
    logId = claimed.id
  }

  const social = await getSetting('social_links').catch(() => null)
  const instagramUrl = (social?.value as any)?.instagram || 'https://www.instagram.com/MithilaJodiOfficial/'
  const body = renderMessage(next.body, { name: el.profile.first_name ?? '', link: absoluteUrl(next.feature_url), instagramUrl })
  const sent = await sendOfficialMessage(admin, el.profile.id, body, { automated: true })

  if (!sent.ok) {
    await admin.from('onboarding_message_log').update({ delivery_status: 'failed', error_details: sent.message.slice(0, 500) }).eq('id', logId)
    // Try again in an hour rather than waiting a whole day.
    await admin.from('member_onboarding').update({ next_scheduled_at: new Date(now.getTime() + 3600e3).toISOString(), updated_at: now.toISOString() }).eq('account_id', accountId)
    return { status: 'failed', detail: sent.message, day: next.day }
  }

  await admin.from('onboarding_message_log').update({ delivery_status: 'sent', sent_at: now.toISOString(), chat_message_id: sent.messageId, message_id: next.id }).eq('id', logId)
  await admin.from('member_onboarding').update({
    current_day: (row.current_day ?? 0) + 1,
    next_scheduled_at: nextSendAt(now, auto).toISOString(),
    profile_id: el.profile.id,
    updated_at: now.toISOString(),
  }).eq('account_id', accountId)
  return { status: 'sent', day: next.day }
}

/** Send every message that is due. Called by the daily cron and, throttled, from member traffic. */
export async function runDue(admin: any, limit = 60): Promise<{ checked: number; sent: number; failed: number; stopped: number; completed: number; paused?: boolean }> {
  const auto = await getAutomation(admin)
  const out = { checked: 0, sent: 0, failed: 0, stopped: 0, completed: 0 }
  if (auto.paused) return { ...out, paused: true }
  const { data: due } = await admin.from('member_onboarding').select('account_id')
    .eq('status', 'active').lte('next_scheduled_at', new Date().toISOString())
    .order('next_scheduled_at', { ascending: true }).limit(limit)
  for (const d of due ?? []) {
    out.checked++
    const r = await sendNext(admin, d.account_id, { automation: auto })
    if (r.status === 'sent') out.sent++
    else if (r.status === 'failed') out.failed++
    else if (r.status === 'stopped') out.stopped++
    else if (r.status === 'completed') out.completed++
  }
  return out
}

let lastOpportunistic = 0
/**
 * Delivery does not depend on one daily cron alone: member page loads call this
 * (via `after`, so it never slows a response) and it runs at most every 15
 * minutes per server instance. Overlapping runs are harmless — see the claim.
 */
export async function maybeRunDue(admin: any): Promise<void> {
  const now = Date.now()
  if (now - lastOpportunistic < 15 * 60e3) return
  lastOpportunistic = now
  try { await runDue(admin, 25) } catch (e) { console.error('[engagement] opportunistic run failed:', e) }
}

/** Stop the journey for an account (deactivation, rejection, suspension). */
export async function stopJourney(admin: any, accountId: string, reason: string): Promise<void> {
  await admin.from('member_onboarding').update({ status: 'stopped', stop_reason: reason, next_scheduled_at: null, updated_at: new Date().toISOString() })
    .eq('account_id', accountId).eq('status', 'active')
}
