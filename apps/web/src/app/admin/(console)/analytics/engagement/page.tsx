import { TimeSeriesChart } from '@/components/admin/TimeSeriesChart'
import { PageHeader, PeriodTable, RangeTabs, Section, StatGrid, StatTile, Unavailable, fmt, parseDays } from '@/components/admin/ui'
import { ZERO, getDaily, getMetricPeriods, ratio } from '@/lib/adminData'
import { requireAdminPage } from '@/lib/adminAuth'

export const metadata = { title: 'Engagement' }
export const dynamic = 'force-dynamic'

export default async function EngagementPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdminPage('view')
  const days = parseDays((await searchParams).days)
  const [m, daily] = await Promise.all([getMetricPeriods(), getDaily(days)])
  const acceptRate = ratio((m?.interests_accepted?.d30 ?? 0) * 100, m?.interests?.d30 ?? 0)

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Engagement"
        description="How members connect. A match is a conversation between two members (it opens when an interest is accepted); official messages from Mithila Jodi are excluded."
        actions={<RangeTabs base="/admin/analytics/engagement" days={days} />} />
      <StatGrid>
        <StatTile label="Interests (30 d)" value={fmt(m?.interests?.d30)} sub={`${fmt(m?.interests?.today)} today`} />
        <StatTile label="Accepted (30 d)" value={fmt(m?.interests_accepted?.d30)} sub={acceptRate != null ? `${fmt(acceptRate, 1)}% of interests sent` : undefined} />
        <StatTile label="Matches (30 d)" value={fmt(m?.matches?.d30)} sub={`${fmt(m?.matches?.all_time)} all time`} />
        <StatTile label="Messages (30 d)" value={fmt(m?.messages?.d30)} sub={`${fmt(m?.messages?.today)} today`} />
        <StatTile label="Shortlisted (30 d)" value={fmt(m?.shortlists?.d30)} sub={`${fmt(m?.shortlists?.all_time)} all time`} />
      </StatGrid>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {[['interests', 'Interests sent'], ['matches', 'Matches'], ['messages', 'Messages']].map(([k, label]) => (
          <Section key={k} title={label} description={`Per day, last ${days} days`}>
            {daily ? <TimeSeriesChart title={`${label} per day`} series={[{ key: k, label, points: daily[k] ?? [] }]} /> : <Unavailable />}
          </Section>
        ))}
      </div>

      <Section title="By period" className="mt-4">
        <PeriodTable rows={[
          { label: 'Interests sent', values: m?.interests ?? ZERO },
          { label: 'Interests accepted', values: m?.interests_accepted ?? ZERO, hint: 'By the day they were accepted' },
          { label: 'Mutual matches', values: m?.matches ?? ZERO },
          { label: 'Messages', values: m?.messages ?? ZERO },
          { label: 'Shortlisted', values: m?.shortlists ?? ZERO },
          { label: 'Member searches', values: m?.member_searchs ?? ZERO, hint: 'Search requests by signed-in members (since analytics began)' },
          { label: 'Profiles opened by members', values: m?.member_profile_views ?? ZERO, hint: 'Since analytics began' },
        ]} />
      </Section>
    </>
  )
}
