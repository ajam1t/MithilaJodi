import 'server-only'
import { notify } from '@/lib/notifications'
import { sendOfficialMessage } from '@/lib/officialMessage'
import { enroll, stopJourney } from '@/lib/engagement/journey'
import { syncDiscoverability } from '@/lib/discoverability'
import { refreshPublicShowcase } from '@/lib/showcaseCache'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Admin approval of member accounts (migration 20261112000001).
 *
 * accounts.approval_status is 'pending' for every account created after the
 * migration, 'approved' for every account that existed before it. Until it is
 * 'approved' the member can sign in, complete their profile and photos, and
 * see /pending — nothing else (lib/auth gates the APIs, the member layout gates
 * the pages). Their profile is kept at profile_status 'pending_review', which
 * every listing (search, showcase, interests, messaging) already treats as not
 * live, so nobody else can find them either.
 *
 * Independent of photo moderation: approving a photo never touches this.
 */

export type Approval = 'pending' | 'approved' | 'rejected'

/** Status a newly created profile should start in, given its account's approval. */
export function initialProfileStatus(approval: Approval | undefined, freeMode: boolean): 'active' | 'draft' | 'pending_review' {
  if (approval && approval !== 'approved') return 'pending_review'
  return freeMode ? 'active' : 'draft'
}

async function record(admin: any, accountId: string, from: string | null, to: Approval, actorId: string | null, reason: string | null) {
  await admin.from('accounts').update({ approval_status: to, approval_updated_at: new Date().toISOString() }).eq('id', accountId)
  await admin.from('account_approvals').insert({ account_id: accountId, from_status: from, to_status: to, actor_id: actorId, reason })
}

export async function approveAccount(admin: any, accountId: string, actorId: string, reason: string | null = null) {
  const { data: acct, error } = await admin.from('accounts').select('id, approval_status, account_status').eq('id', accountId).maybeSingle()
  if (error || !acct) return { ok: false as const, status: 404, message: 'Account not found' }
  if (acct.approval_status === 'approved') return { ok: false as const, status: 409, message: 'Already approved' }
  await record(admin, accountId, acct.approval_status, 'approved', actorId, reason)

  const { data: profile } = await admin.from('profiles').select('id, profile_status, first_name').eq('account_id', accountId).is('deleted_at', null).limit(1).maybeSingle()
  if (profile && profile.profile_status === 'pending_review') {
    await admin.from('profiles').update({ profile_status: 'active', search_needs_rebuild: true }).eq('id', profile.id)
  }
  await syncDiscoverability(admin, accountId).catch(() => {})
  refreshPublicShowcase()

  await notify(admin, {
    accountId, type: 'profile_approved', icon: 'check',
    title: 'आपका Mithila Jodi खाता स्वीकृत हो गया है ❤️',
    message: 'अब आप सभी सुविधाओं का उपयोग कर सकते हैं।',
    ctaLabel: 'शुरू करें', ctaUrl: '/home',
    dedupeKey: `account_approved:${accountId}`,
  }).catch(() => {})

  // The welcome (journey message one) is the approval message in the Inbox.
  const journey = profile && acct.account_status === 'active' ? await enroll(admin, accountId, profile.id).catch(e => ({ ok: false, message: String(e) })) : { ok: false, message: 'no active profile' }
  return { ok: true as const, journey }
}

export async function rejectAccount(admin: any, accountId: string, actorId: string, reason: string) {
  const { data: acct, error } = await admin.from('accounts').select('id, approval_status').eq('id', accountId).maybeSingle()
  if (error || !acct) return { ok: false as const, status: 404, message: 'Account not found' }
  if (acct.approval_status === 'rejected') return { ok: false as const, status: 409, message: 'Already rejected' }
  await record(admin, accountId, acct.approval_status, 'rejected', actorId, reason)

  const { data: profile } = await admin.from('profiles').select('id, profile_status').eq('account_id', accountId).is('deleted_at', null).limit(1).maybeSingle()
  if (profile && ['active', 'draft'].includes(profile.profile_status)) {
    await admin.from('profiles').update({ profile_status: 'pending_review', discoverable: false, search_needs_rebuild: true }).eq('id', profile.id)
  }
  await stopJourney(admin, accountId, 'rejected')
  refreshPublicShowcase()

  await notify(admin, {
    accountId, type: 'profile_rejected', icon: 'bell',
    title: 'आपका Mithila Jodi खाता स्वीकृत नहीं हुआ',
    message: reason, ctaLabel: 'विवरण देखें', ctaUrl: '/pending',
    dedupeKey: `account_rejected:${accountId}`,
  }).catch(() => {})
  if (profile) {
    await sendOfficialMessage(admin, profile.id,
      `नमस्कार,\n\nखेद है, आपका Mithila Jodi खाता अभी स्वीकृत नहीं किया जा सका।\n\nकारण: ${reason}\n\nजानकारी सुधारकर दोबारा समीक्षा चाहते हैं, तो कृपया contact पेज से हमसे संपर्क करें: https://mithilajodi.com/contact\n\nMithila Jodi`,
    ).catch(() => null)
  }
  return { ok: true as const }
}

/** The latest rejection reason, for the member's /pending page. */
export async function latestDecision(admin: any, accountId: string): Promise<{ to_status: string; reason: string | null; created_at: string } | null> {
  const { data } = await admin.from('account_approvals').select('to_status, reason, created_at').eq('account_id', accountId).order('created_at', { ascending: false }).limit(1).maybeSingle()
  return data ?? null
}
