import Link from 'next/link'
import { DataNote, PageHeader, Section, Status, ago, bytes, fmt, ist } from '@/components/admin/ui'
import { requireAdminPage } from '@/lib/adminAuth'
import { getDbUsage } from '@/lib/adminData'
import { getSetting } from '@/lib/siteSettings'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata = { title: 'System health' }
export const dynamic = 'force-dynamic'

type State = 'healthy' | 'warning' | 'critical' | 'unknown'
type Check = { name: string; state: State; detail: string; ms?: number }

async function timed<T>(fn: () => PromiseLike<T>): Promise<{ ok: boolean; ms: number; value?: T; err?: string }> {
  const t = performance.now()
  try {
    const value = await fn()
    return { ok: true, ms: Math.round(performance.now() - t), value }
  } catch (e) {
    return { ok: false, ms: Math.round(performance.now() - t), err: e instanceof Error ? e.message : 'failed' }
  }
}

const byLatency = (ms: number): State => (ms < 600 ? 'healthy' : ms < 2000 ? 'warning' : 'critical')

/**
 * Live checks run when this page loads — nothing here is cached or assumed.
 * Services the app has no way to observe are marked "Not monitored".
 */
export default async function HealthPage() {
  await requireAdminPage('view')
  const admin = await createAdminClient()

  const [db, storage, auth, collector, usage, limits] = await Promise.all([
    timed(async () => { const r = await admin.from('plan_config').select('plan').limit(1); if (r.error) throw new Error(r.error.message); return r }),
    timed(async () => { const r = await admin.storage.from('profile-photos').list('', { limit: 1 }); if (r.error) throw new Error(r.error.message); return r }),
    timed(async () => {
      const r = await admin.from('account_sessions').select('id', { count: 'exact', head: true }).is('revoked_at', null).gt('expires_at', new Date().toISOString())
      if (r.error) throw new Error(r.error.message)
      return r.count ?? 0
    }),
    timed(async () => { const r = await admin.from('site_events').select('at').order('at', { ascending: false }).limit(1).maybeSingle(); if (r.error) throw new Error(r.error.message); return r.data?.at as string | undefined }),
    getDbUsage(),
    getSetting('platform_limits'),
  ])

  const storageBytes = usage?.buckets.reduce((a, b) => a + Number(b.bytes), 0) ?? null
  const pct = (used: number | null, limitGb: number | null) => (used == null || !limitGb ? null : (used / (limitGb * 1024 ** 3)) * 100)
  const dbPct = pct(usage?.db_bytes ?? null, limits.value.db_gb)
  const stPct = pct(storageBytes, limits.value.storage_gb)
  const capacityState = (p: number | null): State => (p == null ? 'unknown' : p < 75 ? 'healthy' : p < 90 ? 'warning' : 'critical')
  const lastEventAge = collector.value ? (Date.now() - new Date(collector.value).getTime()) / 3_600_000 : null

  const checks: Check[] = [
    { name: 'Database (Postgres)', state: db.ok ? byLatency(db.ms) : 'critical', ms: db.ms, detail: db.ok ? `Query answered in ${db.ms} ms` : 'Query failed — the site cannot read or save data' },
    { name: 'File storage', state: storage.ok ? byLatency(storage.ms) : 'critical', ms: storage.ms, detail: storage.ok ? `Photo bucket listed in ${storage.ms} ms` : 'Storage request failed — photos may not load' },
    { name: 'Authentication (sessions)', state: auth.ok ? byLatency(auth.ms) : 'critical', ms: auth.ms, detail: auth.ok ? `${fmt(auth.value as number)} signed-in sessions; lookup ${auth.ms} ms` : 'Session table unreachable — sign-in would fail' },
    { name: 'Website & API', state: 'healthy', detail: 'This page was rendered by the production server, so the app and its API are answering.' },
    {
      name: 'Analytics collector', state: !collector.ok ? 'warning' : lastEventAge == null ? 'unknown' : lastEventAge < 24 ? 'healthy' : 'warning',
      detail: !collector.ok ? 'Could not read the event log' : collector.value ? `Last event ${ago(collector.value)}` : 'No events yet — they start with the first visit after this release',
    },
    { name: 'Database capacity', state: capacityState(dbPct), detail: dbPct == null ? `${bytes(usage?.db_bytes)} used — enter your plan limit in Settings to see headroom` : `${fmt(dbPct, 1)}% of ${limits.value.db_gb} GB` },
    { name: 'Storage capacity', state: capacityState(stPct), detail: stPct == null ? `${bytes(storageBytes)} used — enter your plan limit in Settings to see headroom` : `${fmt(stPct, 1)}% of ${limits.value.storage_gb} GB` },
    { name: 'Edge Functions', state: 'unknown', detail: 'Not used — the app runs on Next.js server routes.' },
    {
      name: 'Deployment (Vercel)', state: process.env.VERCEL ? 'healthy' : 'unknown',
      detail: process.env.VERCEL
        ? `${process.env.VERCEL_ENV ?? 'unknown'} · ${process.env.VERCEL_REGION ?? 'region n/a'} · commit ${(process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || 'n/a'}`
        : 'Not running on Vercel (local or preview build).',
    },
    { name: 'Error monitoring', state: 'unknown', detail: 'No error-monitoring service is connected. Server errors go to the Vercel function logs.' },
  ]

  const worst: State = checks.some(c => c.state === 'critical') ? 'critical' : checks.some(c => c.state === 'warning') ? 'warning' : 'healthy'

  return (
    <>
      <PageHeader eyebrow="System" title="Health"
        description={<>Checked live at {ist(new Date().toISOString())}. Overall: <Status state={worst} /></>}
        actions={<Link href="/admin/system" className="rounded-lg border border-[#DDD3C2] bg-white px-3.5 py-2 text-[13.5px] font-medium">Re-check</Link>} />
      <Section title="Services">
        <ul className="divide-y divide-[#F3EEE6]">
          {checks.map(c => (
            <li key={c.name} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-ink">{c.name}</p>
                <p className="text-[12.5px] text-ink-soft">{c.detail}</p>
              </div>
              <Status state={c.state} />
            </li>
          ))}
        </ul>
        <DataNote>Thresholds: under 600 ms healthy, under 2 s warning, slower or failing is critical. Capacity warns at 75% and is critical at 90%.</DataNote>
      </Section>
      <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
        {[['Supabase usage', '/admin/system/supabase'], ['Storage review', '/admin/system/storage'], ['Performance', '/admin/system/performance']].map(([l, h]) => (
          <Link key={h} href={h} className="rounded-lg border border-[#E8E1D5] bg-white px-3 py-1.5 hover:border-[#CDBFA6]">{l} →</Link>
        ))}
      </div>
    </>
  )
}
