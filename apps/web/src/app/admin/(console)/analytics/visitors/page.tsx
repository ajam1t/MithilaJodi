import { TimeSeriesChart } from '@/components/admin/TimeSeriesChart'
import { DataNote, PageHeader, PeriodTable, RangeTabs, RankBars, Section, StatGrid, StatTile, Unavailable, fmt, ist, parseDays } from '@/components/admin/ui'
import { asPeriods, getDaily, getTraffic, getVisitorPeriods } from '@/lib/adminData'
import { requireAdminPage } from '@/lib/adminAuth'

export const metadata = { title: 'Visitors' }
export const dynamic = 'force-dynamic'

export default async function VisitorsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdminPage('view')
  const days = parseDays((await searchParams).days)
  const [vis, daily, traffic] = await Promise.all([getVisitorPeriods(), getDaily(days), getTraffic(days)])
  const returning = daily?.visitors?.map((p, i) => ({ day: p.day, n: Math.max(0, p.n - (daily.new_visitors?.[i]?.n ?? 0)) })) ?? []

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Visitors"
        description="Unique visitors are distinct browsers (a random id the browser keeps), not page views. No IP addresses or browser fingerprints are stored; visitors who send Do Not Track are not counted."
        actions={<RangeTabs base="/admin/analytics/visitors" days={days} />}
      />
      <StatGrid>
        <StatTile label="Unique visitors today" value={fmt(vis?.today?.visitors)} sub={`${fmt(vis?.yesterday?.visitors)} yesterday`} />
        <StatTile label="7 days" value={fmt(vis?.d7?.visitors)} sub={`${fmt(vis?.d7?.page_views)} page views`} />
        <StatTile label="30 days" value={fmt(vis?.d30?.visitors)} sub={`${fmt(vis?.d30?.page_views)} page views`} />
        <StatTile label="New visitors (30 d)" value={fmt(vis?.d30?.new_visitors)} sub="first visit from this browser" />
        <StatTile label="Returning (30 d)" value={fmt(vis?.d30?.returning_visitors)} sub="had visited before" />
      </StatGrid>

      <Section title="Visitors per day" description={`New and returning unique visitors, last ${days} days`} className="mt-4">
        {daily ? (
          <TimeSeriesChart title="Unique visitors per day, new and returning" series={[
            { key: 'new', label: 'New visitors', points: daily.new_visitors ?? [] },
            { key: 'ret', label: 'Returning visitors', points: returning },
          ]} />
        ) : <Unavailable />}
      </Section>

      <Section title="By period" className="mt-4">
        <PeriodTable rows={[
          { label: 'Unique visitors', values: asPeriods(vis, 'visitors') },
          { label: 'New visitors', values: asPeriods(vis, 'new_visitors') },
          { label: 'Returning visitors', values: asPeriods(vis, 'returning_visitors') },
          { label: 'Page views', values: asPeriods(vis, 'page_views') },
        ]} />
      </Section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="Top pages" description={`Page views, last ${days} days. Member, profile-link and invitation addresses are anonymised.`}>
          <RankBars rows={(traffic?.top_pages ?? []).slice(0, 12).map(p => ({ label: p.path, value: Number(p.views), sub: `${fmt(Number(p.visitors))} visitors` }))} empty="No page views recorded yet." />
        </Section>
        <Section title="Top landing pages" description="The first page of a visit">
          <RankBars rows={(traffic?.landing_pages ?? []).slice(0, 12).map(p => ({ label: p.path, value: Number(p.entries) }))} empty="No visits recorded yet." />
        </Section>
        <Section title="Devices" description="Unique visitors by screen size">
          <RankBars rows={(traffic?.devices ?? []).map(d => ({ label: d.device[0].toUpperCase() + d.device.slice(1), value: Number(d.visitors) }))} empty="No visits recorded yet." />
        </Section>
        <Section title="Where visits come from" description="Referring website on arrival (hostname only)">
          <RankBars rows={(traffic?.referrers ?? []).map(r => ({ label: r.source, value: Number(r.entries) }))} empty="No visits recorded yet." />
        </Section>
      </div>
      <DataNote>{traffic?.first_event ? `Collected since ${ist(traffic.first_event, false)}.` : 'Collection starts with the first visit after this release.'}</DataNote>
    </>
  )
}
