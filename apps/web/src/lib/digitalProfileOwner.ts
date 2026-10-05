import 'server-only'
import { findOwnProfileId } from '@/lib/ownProfile'
import { generateShareToken, loadSharedProfile, type ShareLoadResult } from '@/lib/profileShare'
import { DEFAULT_SHARE_FIELDS, isNoExpiry, sanitiseFields } from '@/lib/digitalProfile'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Everything the owner's Digital Profile dashboard shows, read in one place.
 * The preview comes from loadSharedProfile — the same gate and projection a
 * visitor gets — so the owner can never see a different profile from theirs.
 */

export type OwnerShare = {
  id: string
  token: string
  label: string | null
  fields: string[]
  expiresAt: string
  noExpiry: boolean
  revokedAt: string | null
  viewCount: number
  lastViewedAt: string | null
  createdAt: string
  live: boolean
}

export type LinkActivity = {
  totalOpens: number
  lastOpenedAt: string | null
  /** Null until opens are tracked per open (or when none have been yet). */
  uniqueVisitors: number | null
  /** Set when total opens include ones from before per-open tracking began. */
  trackedSince: string | null
  recent: Array<{ day: string; opens: number }>
}

export type OwnerDashboard =
  | { status: 'no-profile' }
  | {
      status: 'ok'
      firstName: string
      shares: OwnerShare[]
      primary: OwnerShare | null
      activity: LinkActivity | null
      preview: ShareLoadResult | null
    }

function toShare(s: any): OwnerShare {
  return {
    id: s.id,
    token: s.token,
    label: s.label,
    fields: sanitiseFields(s.fields),
    expiresAt: s.expires_at,
    noExpiry: isNoExpiry(s.expires_at),
    revokedAt: s.revoked_at,
    viewCount: s.view_count ?? 0,
    lastViewedAt: s.last_viewed_at,
    createdAt: s.created_at,
    live: !s.revoked_at && new Date(s.expires_at).getTime() > Date.now(),
  }
}

const SHARE_COLS = 'id, token, label, fields, expires_at, revoked_at, view_count, last_viewed_at, created_at'

/** Calendar day in India, so "today" means today for the member. */
const istDay = (iso: string) => new Date(new Date(iso).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10)

async function loadActivity(admin: any, share: OwnerShare): Promise<LinkActivity> {
  const base: LinkActivity = {
    totalOpens: share.viewCount, lastOpenedAt: share.lastViewedAt, uniqueVisitors: null, trackedSince: null, recent: [],
  }
  const { data, error } = await admin
    .from('profile_share_opens')
    .select('opened_at, visitor')
    .eq('share_id', share.id)
    .order('opened_at', { ascending: false })
    .limit(2000)
  if (error || !data || data.length === 0) return base

  const visitors = new Set<string>()
  let anonymous = 0
  const days = new Map<string, number>()
  for (const r of data as Array<{ opened_at: string; visitor: string | null }>) {
    if (r.visitor) visitors.add(r.visitor)
    else anonymous++
    const d = istDay(r.opened_at)
    days.set(d, (days.get(d) ?? 0) + 1)
  }
  return {
    ...base,
    // A browser that would not keep an id cannot be told apart — counted once each.
    uniqueVisitors: visitors.size + anonymous,
    trackedSince: share.viewCount > data.length ? data[data.length - 1].opened_at : null,
    recent: [...days.entries()].slice(0, 7).map(([day, opens]) => ({ day, opens })),
  }
}

export async function loadOwnerDashboard(admin: any, accountId: string): Promise<OwnerDashboard> {
  const profileId = await findOwnProfileId(admin, accountId)
  if (!profileId) return { status: 'no-profile' }

  const { data: prof } = await admin.from('profiles').select('first_name').eq('id', profileId).maybeSingle()

  let { data: rows } = await admin
    .from('profile_shares')
    .select(SHARE_COLS)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })

  // A member's first link is simply there, as it always has been. Only when the
  // profile has never had one — a member who turned theirs off keeps it off.
  if (!rows || rows.length === 0) {
    const { data: created } = await admin
      .from('profile_shares')
      .insert({
        profile_id: profileId,
        token: generateShareToken(),
        fields: DEFAULT_SHARE_FIELDS,
        expires_at: new Date(Date.now() + 365 * 864e5).toISOString(),
      })
      .select(SHARE_COLS)
      .single()
    rows = created ? [created] : []
  }

  const shares: OwnerShare[] = (rows ?? []).map(toShare)
  const primary = shares.find(s => s.live) ?? shares[0] ?? null
  const [activity, preview] = primary
    ? await Promise.all([loadActivity(admin, primary), loadSharedProfile(admin, primary.token, { ownerPreview: true })])
    : [null, null]

  return { status: 'ok', firstName: prof?.first_name ?? '', shares, primary, activity, preview }
}
