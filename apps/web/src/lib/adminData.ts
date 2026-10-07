import 'server-only'
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/server'
import type { PeriodKey, PeriodValues } from '@/components/admin/ui'

/*
 * Read side of the admin console. Every number is aggregated inside Postgres
 * (functions in migration 20261008000001) — the browser never receives rows to
 * add up. Each page asks only for what it shows. Wrapped in React cache() so a
 * page and its sections share one round trip per query.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T | null> {
  const admin = await createAdminClient()
  const { data, error } = await admin.rpc(fn, args ?? {})
  if (error) {
    console.error(`[admin] ${fn} failed:`, error.message)
    return null
  }
  return data as T
}

type PeriodRow = { metric: string } & Record<Exclude<PeriodKey, never>, number>

/** Database-backed metrics: members, interests, matches, messages, … */
export const getMetricPeriods = cache(async (): Promise<Record<string, PeriodValues> | null> => {
  const rows = await rpc<PeriodRow[]>('admin_metric_periods')
  if (!rows) return null
  const out: Record<string, PeriodValues> = {}
  for (const r of rows) out[r.metric] = { ...r }
  return out
})

export type DpPeriod = { views: number; unique_visitors: number; profiles_viewed: number; links_opened: number }

/** Digital Profile opens — views, unique visitors, profiles and links reached. */
export const getDpPeriods = cache(async (): Promise<Record<string, DpPeriod> | null> => {
  const rows = await rpc<Array<DpPeriod & { w: string }>>('admin_dp_periods')
  if (!rows) return null
  return Object.fromEntries(rows.map(r => [r.w === 'all' ? 'all_time' : r.w, r]))
})

export type VisitorPeriod = { page_views: number; visitors: number; new_visitors: number; returning_visitors: number }

export const getVisitorPeriods = cache(async (): Promise<Record<string, VisitorPeriod> | null> => {
  const rows = await rpc<Array<VisitorPeriod & { w: string }>>('admin_visitor_periods')
  if (!rows) return null
  return Object.fromEntries(rows.map(r => [r.w === 'all' ? 'all_time' : r.w, r]))
})

export type EventPeriods = {
  /** name → period → count */
  totals: Record<string, PeriodValues>
  /** name → dimension → period → count */
  byKey: Record<string, Record<string, PeriodValues>>
}

export const getEventPeriods = cache(async (): Promise<EventPeriods | null> => {
  const rows = await rpc<Array<{ name: string; k: string | null; is_total: boolean; w: string; n: number }>>('admin_event_periods')
  if (!rows) return null
  const totals: EventPeriods['totals'] = {}
  const byKey: EventPeriods['byKey'] = {}
  for (const r of rows) {
    const w = (r.w === 'all' ? 'all_time' : r.w) as PeriodKey
    if (r.is_total) {
      ;(totals[r.name] ??= {})[w] = r.n
    } else if (r.k) {
      ;((byKey[r.name] ??= {})[r.k] ??= {})[w] = r.n
    }
  }
  return { totals, byKey }
})

export type DailyPoint = { day: string; n: number }

/** Daily series for charts: metric → [{day, n}] (zero-filled, IST days). */
export const getDaily = cache(async (days: number): Promise<Record<string, DailyPoint[]> | null> => {
  const rows = await rpc<Array<{ day: string; metric: string; n: number }>>('admin_daily', { p_days: days })
  if (!rows) return null
  const out: Record<string, DailyPoint[]> = {}
  for (const r of rows) (out[r.metric] ??= []).push({ day: r.day, n: Number(r.n) })
  return out
})

export type Traffic = {
  top_pages: Array<{ path: string; views: number; visitors: number }>
  landing_pages: Array<{ path: string; entries: number }>
  devices: Array<{ device: string; visitors: number }>
  referrers: Array<{ source: string; entries: number }>
  first_event: string | null
}

export const getTraffic = cache(async (days: number) => rpc<Traffic>('admin_traffic', { p_days: days }))

export const getWebVitals = cache(async (days: number) =>
  rpc<Array<{ metric: string; p75: number; samples: number }>>('admin_web_vitals', { p_days: days }))

export type GeoState = {
  state: string; code: string | null; total: number; male: number; female: number
  new_30d: number; active_30d: number; cities: Array<{ city: string; n: number }> | null
}
export const getGeo = cache(async () => rpc<{ states: GeoState[]; no_location: number; total: number }>('admin_member_geo'))

export type Funnel = {
  visitors: number; visitors_since: string | null; signups: number; profile_created: number; profile_completed: number
  searched: number; viewed_profile: number; activity_since: string | null
  interest_sent: number; interest_accepted: number; matched: number; messaged: number
}
export const getFunnel = cache(async () => rpc<Funnel>('admin_funnel'))

export type MemberRow = {
  account_id: string; profile_id: string | null; name: string; gender: string | null; dob: string | null
  caste: string | null; self_gotra: string | null; mool: string | null; gram: string | null; location: string | null
  profile_status: string | null; discoverable: boolean | null; account_status: string; profile_complete: number
  registered_at: string; last_active: string | null; mobile_last4: string
}

export async function getMembers(p: { q?: string; gender?: string; status?: string; sort?: string; page: number; pageSize: number }) {
  return rpc<{ total: number; rows: MemberRow[] }>('admin_members', {
    p_q: p.q ?? '', p_gender: p.gender ?? '', p_status: p.status ?? '', p_sort: p.sort ?? 'newest',
    p_limit: p.pageSize, p_offset: (p.page - 1) * p.pageSize,
  })
}

export type DbUsage = {
  db_bytes: number
  tables: Array<{ name: string; bytes: number; approx_rows: number }>
  buckets: Array<{ bucket: string; public: boolean; files: number; bytes: number }>
  largest: Array<{ bucket: string; name: string; bytes: number; created_at: string }>
  orphans: Array<{ name: string; bytes: number; created_at: string }>
}
export const getDbUsage = cache(async () => rpc<DbUsage>('admin_db_usage'))

export const getSlowQueries = cache(async () =>
  rpc<Array<{ query: string; calls: number; mean_ms: number; total_ms: number }>>('admin_slow_queries'))

/** Items waiting on a person. */
export const getAttention = cache(async () => {
  const admin = await createAdminClient()
  const [photos, profiles, reports, flags] = await Promise.all([
    admin.from('profile_photos').select('id', { count: 'exact', head: true }).eq('status', 'pending_moderation'),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('profile_status', 'pending_review'),
    admin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('moderation_flags').select('id', { count: 'exact', head: true }).eq('resolved', false),
  ])
  return { photos: photos.count ?? 0, profiles: profiles.count ?? 0, reports: reports.count ?? 0, flags: flags.count ?? 0 }
})

export type MemberSnapshot = {
  members: number; suspended: number; active_today: number; active_7d: number; active_30d: number
  profiles: number; completed: number; avg_completion: number | null; discoverable: number
}
/** Member base: totals, active (a signed-in session seen) and completion. */
export const getMemberSnapshot = cache(async () => rpc<MemberSnapshot>('admin_member_snapshot'))

/** Period helpers for client code that needs only the numbers. */
export function pick(values: PeriodValues | undefined | null, key: PeriodKey): number | null {
  return values?.[key] ?? null
}
export function ratio(a: number | null | undefined, b: number | null | undefined, digits = 1): number | null {
  if (a == null || b == null || b === 0) return null
  return Math.round((a / b) * 10 ** digits) / 10 ** digits
}
export function asPeriods<T>(byW: Record<string, T> | null, field: keyof T): PeriodValues | null {
  if (!byW) return null
  const out: PeriodValues = {}
  for (const [w, row] of Object.entries(byW)) out[w as PeriodKey] = Number(row[field])
  return out
}

/** Page views / unique visitors by site section (journal, festivals, …). */
export const getSectionPeriods = cache(async () => {
  const rows = await rpc<Array<{ section: string; w: string; views: number; visitors: number }>>('admin_section_periods')
  if (!rows) return null
  const views: Record<string, PeriodValues> = {}
  const visitors: Record<string, PeriodValues> = {}
  for (const r of rows) {
    const w = (r.w === 'all' ? 'all_time' : r.w) as PeriodKey
    ;(views[r.section] ??= {})[w] = Number(r.views)
    ;(visitors[r.section] ??= {})[w] = Number(r.visitors)
  }
  return { views, visitors }
})

/** Recent audit entries with a readable actor. */
export const getRecentAudit = cache(async (limit: number) => {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('admin_audit_logs')
    .select('id, action, target_type, target_id, payload, created_at, actor_id, accounts!actor_id(role, mobile, email)')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as any[]
})

/** When first-party tracking started (null until the first event arrives). */
export const getTrackingSince = cache(async () => {
  const admin = await createAdminClient()
  const { data } = await admin.from('site_events').select('at').order('at', { ascending: true }).limit(1).maybeSingle()
  return (data?.at as string | undefined) ?? null
})

export const getTopDp = cache(async (days: number) =>
  rpc<Array<{ account_id: string; display: string; views: number; visitors: number; links: number }>>('admin_top_dp', { p_days: days }))

/** All-zero period values, for a tracked metric that simply has no events yet. */
export const ZERO: PeriodValues = { today: 0, yesterday: 0, d7: 0, mtd: 0, d30: 0, d90: 0, d365: 0, all_time: 0 }
