import Link from 'next/link'
import { DataNote, PageHeader, Section, StatGrid, StatTile, Unavailable, bytes, fmt } from '@/components/admin/ui'
import { requireAdminPage } from '@/lib/adminAuth'
import { getDbUsage } from '@/lib/adminData'
import { getSetting } from '@/lib/siteSettings'

export const metadata = { title: 'Supabase usage' }
export const dynamic = 'force-dynamic'

const BUCKET_LABEL: Record<string, string> = {
  'profile-photos': 'Profile photos (also used by Digital Profiles)',
}

function Meter({ used, limitGb, label }: { used: number | null; limitGb: number | null; label: string }) {
  if (used == null) return <Unavailable />
  if (!limitGb) return <p className="text-[13px] text-ink-soft">{bytes(used)} used. <Link href="/admin/settings" className="font-medium text-maroon hover:underline">Enter your plan’s {label} limit</Link> to see what remains.</p>
  const limit = limitGb * 1024 ** 3
  const p = Math.min(100, (used / limit) * 100)
  const color = p < 75 ? '#B3424F' : p < 90 ? '#A87D24' : '#8A1C1C'
  return (
    <div>
      <div className="flex justify-between text-[13px]"><span className="font-medium">{bytes(used)} of {fmt(limitGb)} GB</span><span className="tabular-nums">{fmt(p, 1)}% used</span></div>
      <div className="mt-1.5 h-2.5 rounded-full bg-[#F1ECE3]" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)} aria-label={`${label} used`}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(p, 1)}%`, background: color }} />
      </div>
      <p className="mt-1 text-[12.5px] text-ink-soft">{bytes(Math.max(0, limit - used))} remaining{p >= 75 ? ' — time to plan for more space' : ''}</p>
    </div>
  )
}

export default async function SupabasePage() {
  await requireAdminPage('view')
  const [usage, limits] = await Promise.all([getDbUsage(), getSetting('platform_limits')])
  const storageBytes = usage?.buckets.reduce((a, b) => a + Number(b.bytes), 0) ?? null
  const files = usage?.buckets.reduce((a, b) => a + Number(b.files), 0) ?? null

  return (
    <>
      <PageHeader eyebrow="System" title="Supabase usage"
        description={`Measured live from the database. Plan: ${limits.value.plan ?? 'not entered'}. Limits come from Settings — never assumed.`} />
      <StatGrid>
        <StatTile label="Database size" value={bytes(usage?.db_bytes)} />
        <StatTile label="File storage" value={bytes(storageBytes)} sub={`${fmt(files)} files`} />
        <StatTile label="Buckets" value={fmt(usage?.buckets.length)} />
        <StatTile label="Orphaned photo files" value={fmt(usage?.orphans.length)} href="/admin/system/storage" note="Files no photo record points to" />
      </StatGrid>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="Database capacity"><Meter used={usage?.db_bytes ?? null} limitGb={limits.value.db_gb} label="database" /></Section>
        <Section title="Storage capacity"><Meter used={storageBytes} limitGb={limits.value.storage_gb} label="storage" /></Section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="Storage by bucket" description="Journal and festival images are served from the website itself, not Supabase, so they do not appear here.">
          {!usage ? <Unavailable /> : (
            <ul className="divide-y divide-[#F3EEE6] text-[13.5px]">
              {usage.buckets.map(b => (
                <li key={b.bucket} className="flex justify-between gap-3 py-2">
                  <span>{BUCKET_LABEL[b.bucket] ?? b.bucket} <span className="text-[12px] text-ink-soft">· {b.public ? 'public' : 'private'}</span></span>
                  <span className="tabular-nums">{bytes(Number(b.bytes))} · {fmt(Number(b.files))} files</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Largest tables" description="Including indexes">
          {!usage ? <Unavailable /> : (
            <ul className="divide-y divide-[#F3EEE6] text-[13.5px]">
              {usage.tables.map(t => (
                <li key={t.name} className="flex justify-between gap-3 py-1.5">
                  <span className="font-mono text-[12.5px]">{t.name}</span>
                  <span className="tabular-nums text-ink-soft">{bytes(Number(t.bytes))}{Number(t.approx_rows) > 0 ? ` · ~${fmt(Number(t.approx_rows))} rows` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
      <DataNote>Bandwidth, monthly active users and compute are only visible in the Supabase dashboard; reading them needs a management token, which the app does not hold by design.</DataNote>
    </>
  )
}
