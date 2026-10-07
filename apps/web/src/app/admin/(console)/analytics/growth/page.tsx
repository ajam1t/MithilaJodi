import { TimeSeriesChart } from '@/components/admin/TimeSeriesChart'
import { DataNote, PageHeader, PeriodTable, RangeTabs, Section, StatGrid, StatTile, Unavailable, fmt, parseDays } from '@/components/admin/ui'
import { ZERO, getDaily, getMemberSnapshot, getMetricPeriods, ratio } from '@/lib/adminData'
import { requireAdminPage } from '@/lib/adminAuth'

export const metadata = { title: 'Member growth' }
export const dynamic = 'force-dynamic'

export default async function GrowthPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdminPage('view')
  const days = parseDays((await searchParams).days)
  const [m, snap, daily] = await Promise.all([getMetricPeriods(), getMemberSnapshot(), getDaily(days)])
  const completionRate = snap ? ratio(snap.completed * 100, snap.profiles) : null

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Member growth"
        description="Members are registered accounts (demo and the official system account excluded). Active means signed in during the period."
        actions={<RangeTabs base="/admin/analytics/growth" days={days} />} />
      <StatGrid>
        <StatTile label="Members" value={fmt(snap?.members)} sub={`${fmt(m?.members?.d30)} joined in 30 days`} />
        <StatTile label="Active today" value={fmt(snap?.active_today)} sub={`${fmt(snap?.active_7d)} in 7 days`} />
        <StatTile label="Active in 30 days" value={fmt(snap?.active_30d)} sub={snap ? `${fmt(ratio(snap.active_30d * 100, snap.members))}% of members` : undefined} />
        <StatTile label="Completed profiles" value={fmt(snap?.completed)} sub={snap ? `of ${fmt(snap.profiles)} profiles` : undefined} note="All twelve completion checks done" />
        <StatTile label="Profile completion rate" value={completionRate != null ? `${fmt(completionRate, 1)}%` : '—'} sub={snap?.avg_completion != null ? `average ${fmt(snap.avg_completion, 1)}% complete` : undefined} />
      </StatGrid>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="New registrations" description={`Per day, last ${days} days`}>
          {daily ? <TimeSeriesChart title="New registrations per day" series={[{ key: 'm', label: 'New members', points: daily.members ?? [] }]} /> : <Unavailable />}
        </Section>
        <Section title="Profiles created" description={`Per day, last ${days} days`}>
          {daily ? <TimeSeriesChart title="Profiles created per day" series={[{ key: 'p', label: 'Profiles created', points: daily.profiles_created ?? [] }]} /> : <Unavailable />}
        </Section>
      </div>

      <Section title="By period" className="mt-4">
        <PeriodTable rows={[
          { label: 'New members', values: m?.members ?? ZERO },
          { label: 'Profiles created', values: m?.profiles_created ?? ZERO },
        ]} />
        <DataNote>Active-member counts are a current snapshot (sessions seen), not a history, so they appear above rather than by period.</DataNote>
      </Section>
    </>
  )
}
