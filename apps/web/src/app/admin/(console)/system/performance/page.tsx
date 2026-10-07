import { Badge, DataNote, PageHeader, RangeTabs, Section, Unavailable, fmt, parseDays } from '@/components/admin/ui'
import { requireAdminPage } from '@/lib/adminAuth'
import { getSlowQueries, getWebVitals } from '@/lib/adminData'

export const metadata = { title: 'Performance' }
export const dynamic = 'force-dynamic'

// Google's published "good" / "needs improvement" thresholds (p75).
const VITALS: Record<string, { label: string; unit: string; good: number; poor: number; scale?: number; about: string }> = {
  LCP: { label: 'Largest Contentful Paint', unit: 's', good: 2500, poor: 4000, scale: 1000, about: 'How fast the main content appears' },
  INP: { label: 'Interaction to Next Paint', unit: 'ms', good: 200, poor: 500, about: 'How quickly the page responds to taps' },
  CLS: { label: 'Cumulative Layout Shift', unit: '', good: 100, poor: 250, scale: 1000, about: 'How much the layout jumps while loading' },
  FCP: { label: 'First Contentful Paint', unit: 's', good: 1800, poor: 3000, scale: 1000, about: 'When anything first appears' },
  TTFB: { label: 'Time to First Byte', unit: 'ms', good: 800, poor: 1800, about: 'Server and network response time' },
}

export default async function PerformancePage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdminPage('view')
  const days = parseDays((await searchParams).days, 30)
  const [vitals, slow] = await Promise.all([getWebVitals(days), getSlowQueries()])

  return (
    <>
      <PageHeader eyebrow="System" title="Performance"
        description="Core Web Vitals from real visitors’ browsers (75th percentile, as Google measures them), and the slowest database statements."
        actions={<RangeTabs base="/admin/system/performance" days={days} options={[7, 30, 90]} />} />

      <Section title="Core Web Vitals (real users)">
        {!vitals || vitals.length === 0 ? (
          <Unavailable title="No measurements yet">Visitors’ browsers report these after this release. Values appear once pages have been visited.</Unavailable>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Object.entries(VITALS).map(([k, d]) => {
              const row = vitals.find(v => v.metric === k)
              if (!row) return <div key={k} className="rounded-lg border border-[#EFE9DF] px-4 py-3"><p className="text-[12.5px] text-ink-soft">{d.label}</p><p className="mt-1 text-[13px] text-ink-soft">No samples</p></div>
              const v = Number(row.p75)
              const tone = v <= d.good ? 'good' : v <= d.poor ? 'warn' : 'bad'
              const shown = k === 'CLS' ? fmt(v / 1000, 3) : d.scale ? fmt(v / d.scale, 2) : fmt(v)
              return (
                <div key={k} className="rounded-lg border border-[#EFE9DF] px-4 py-3">
                  <p className="text-[12.5px] text-ink-soft">{d.label} ({k})</p>
                  <p className="mt-1 text-[22px] font-semibold tabular-nums">{shown}<span className="ml-0.5 text-[13px] font-normal text-ink-soft">{d.unit}</span></p>
                  <p className="mt-1"><Badge tone={tone}>{tone === 'good' ? '● Good' : tone === 'warn' ? '▲ Needs improvement' : '■ Poor'}</Badge></p>
                  <p className="mt-1.5 text-[11.5px] text-ink-soft">{d.about} · {fmt(Number(row.samples))} samples</p>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Slowest database statements" description="Average execution time, from Postgres statistics (statements run at least 5 times). Text is normalised — no values are shown." className="mt-4">
        {!slow || slow.length === 0 ? <Unavailable /> : (
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full min-w-[720px] text-[12.5px]">
              <thead><tr className="border-b border-[#EFE9DF] text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-2 font-semibold">Statement</th><th className="px-3 py-2 text-right font-semibold">Calls</th><th className="px-3 py-2 text-right font-semibold">Mean</th><th className="px-5 py-2 text-right font-semibold">Total</th>
              </tr></thead>
              <tbody>
                {slow.map((q, i) => (
                  <tr key={i} className="border-b border-[#F3EEE6] last:border-0">
                    <td className="max-w-[640px] px-5 py-2 font-mono text-[11.5px] text-ink">{q.query}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(Number(q.calls))}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(Number(q.mean_ms), 1)} ms</td>
                    <td className="px-5 py-2 text-right tabular-nums">{fmt(Number(q.total_ms) / 1000, 1)} s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <DataNote>Statistics accumulate since the database last reset them and include Supabase’s own internal queries.</DataNote>
      </Section>

      <Section title="Errors" id="errors" className="mt-4">
        <Unavailable title="No error-monitoring service is connected">
          Server errors are written to the Vercel function logs (Vercel dashboard → this project → Logs). Connecting an error tracker such as Sentry would let this page show error rates and the slowest API routes; that needs an account and a key, so it has not been added without your decision.
        </Unavailable>
      </Section>
    </>
  )
}
