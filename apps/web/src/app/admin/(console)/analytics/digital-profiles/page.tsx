import Link from 'next/link'
import { TimeSeriesChart } from '@/components/admin/TimeSeriesChart'
import { DataNote, PERIODS, PageHeader, PeriodTable, RangeTabs, Section, StatGrid, StatTile, Unavailable, fmt, parseDays, type PeriodValues } from '@/components/admin/ui'
import { ZERO, asPeriods, getDaily, getDpPeriods, getEventPeriods, getMetricPeriods, getTopDp, ratio } from '@/lib/adminData'
import { requireAdminPage } from '@/lib/adminAuth'

export const metadata = { title: 'Digital Profile views' }
export const dynamic = 'force-dynamic'

export default async function DigitalProfileAnalytics({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdminPage('view')
  const days = parseDays((await searchParams).days)
  const [dp, m, ev, daily, top] = await Promise.all([getDpPeriods(), getMetricPeriods(), getEventPeriods(), getDaily(days), getTopDp(days)])

  // Average views per shared profile = views ÷ links that were opened at least once.
  const avg: PeriodValues = {}
  for (const p of PERIODS) avg[p.key] = ratio(dp?.[p.key]?.views, dp?.[p.key]?.links_opened)

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Digital Profile views"
        description="A view is one opening of a shared Digital Profile link, counted by the page itself (link previews and the owner’s own visits are not counted). Unique visitors are distinct browsers; nothing about the visitor is stored beyond a random id."
        actions={<RangeTabs base="/admin/analytics/digital-profiles" days={days} />}
      />
      <StatGrid>
        <StatTile label="Views today" value={fmt(dp?.today?.views)} sub={`${fmt(dp?.yesterday?.views)} yesterday`} />
        <StatTile label="Unique visitors today" value={fmt(dp?.today?.unique_visitors)} sub={`${fmt(dp?.d30?.unique_visitors)} in 30 days`} />
        <StatTile label="Profiles shared (30 d)" value={fmt(dp?.d30?.links_opened)} note="Links opened at least once — shared and reached someone" />
        <StatTile label="Avg views per shared profile" value={avg.d30 != null ? fmt(avg.d30, 1) : '—'} sub="30 days" />
        <StatTile label="Share actions (30 d)" value={fmt(ev?.totals['dp_shared']?.d30 ?? 0)} note="WhatsApp, copy or share-sheet taps on the dashboard" />
      </StatGrid>

      <Section title="Views and unique visitors per day" description={`Last ${days} days`} className="mt-4">
        {daily ? <TimeSeriesChart kind="line" title="Digital Profile views and unique visitors per day" series={[
          { key: 'v', label: 'Views', points: daily.dp_views ?? [] },
          { key: 'u', label: 'Unique visitors', points: daily.dp_visitors ?? [] },
        ]} /> : <Unavailable />}
      </Section>

      <Section title="By period" description="Four separate measures — they answer different questions." className="mt-4">
        <PeriodTable rows={[
          { label: 'Digital Profile views', values: asPeriods(dp, 'views'), hint: 'Every opening' },
          { label: 'Unique visitors', values: asPeriods(dp, 'unique_visitors'), hint: 'Distinct browsers that opened any profile' },
          { label: 'Profiles shared', values: asPeriods(dp, 'links_opened'), hint: 'Links opened at least once in the period' },
          { label: 'Average views per shared profile', values: avg, hint: 'Views ÷ profiles shared' },
          { label: 'Profiles viewed', values: asPeriods(dp, 'profiles_viewed'), hint: 'Distinct members whose profile was opened' },
          { label: 'Links created', values: m?.dp_links_created ?? ZERO, hint: 'Includes the link every profile gets automatically' },
          { label: 'Share actions', values: ev?.totals['dp_shared'] ?? ZERO, hint: 'Taps on WhatsApp / Copy / Share (since analytics began)' },
        ]} />
      </Section>

      <Section title="Most viewed profiles" description={`Last ${days} days · names shortened`} className="mt-4">
        {!top || top.length === 0 ? <Unavailable title="No profile was opened in this period." /> : (
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full min-w-[480px] text-[13.5px]">
              <thead><tr className="border-b border-[#EFE9DF] text-left text-[11.5px] uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-2 font-semibold">Member</th><th className="px-3 py-2 text-right font-semibold">Views</th><th className="px-3 py-2 text-right font-semibold">Unique visitors</th><th className="px-5 py-2 text-right font-semibold">Links</th>
              </tr></thead>
              <tbody>
                {top.map(t => (
                  <tr key={t.account_id} className="border-b border-[#F3EEE6] last:border-0">
                    <td className="px-5 py-2"><Link href={`/admin/members/${t.account_id}`} className="font-medium hover:text-maroon">{t.display.replace(/\s+/g, ' ')}</Link></td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(Number(t.views))}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(Number(t.visitors))}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{fmt(Number(t.links))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <DataNote>Who opened a profile is never shown — only how many distinct browsers did.</DataNote>
      </Section>
    </>
  )
}
