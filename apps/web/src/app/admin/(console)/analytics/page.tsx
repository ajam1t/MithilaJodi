import Link from 'next/link'
import { DataNote, PageHeader, PeriodTable, Section, ist } from '@/components/admin/ui'
import { ZERO, asPeriods, getDpPeriods, getMetricPeriods, getTrackingSince, getVisitorPeriods } from '@/lib/adminData'
import { requireAdminPage } from '@/lib/adminAuth'

export const metadata = { title: 'Analytics' }
export const dynamic = 'force-dynamic'

const AREAS = [
  ['Visitors', '/admin/analytics/visitors', 'Unique visitors, new vs returning, top pages, devices, where visits come from'],
  ['Member growth', '/admin/analytics/growth', 'Registrations, active members, profile completion'],
  ['Digital Profile views', '/admin/analytics/digital-profiles', 'Views, unique visitors, profiles shared, reach per profile'],
  ['Engagement', '/admin/analytics/engagement', 'Interests, acceptances, matches, messages, shortlists'],
  ['Conversion', '/admin/analytics/conversion', 'From first visit to first message — where people drop off'],
] as const

export default async function AnalyticsOverview() {
  await requireAdminPage('view')
  const [m, dp, vis, since] = await Promise.all([getMetricPeriods(), getDpPeriods(), getVisitorPeriods(), getTrackingSince()])

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Analytics overview" description="The headline numbers by period. Open an area for charts and breakdowns." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {AREAS.map(([t, h, d]) => (
          <Link key={h} href={h} className="rounded-xl border border-[#E8E1D5] bg-white px-4 py-3 hover:border-[#CDBFA6]">
            <span className="block text-[14px] font-semibold text-ink">{t} →</span>
            <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-soft">{d}</span>
          </Link>
        ))}
      </div>
      <Section title="Key numbers by period" description="Today and yesterday are IST calendar days; 7/30/90/365 days include today.">
        <PeriodTable rows={[
          { label: 'Unique visitors', values: asPeriods(vis, 'visitors'), href: '/admin/analytics/visitors' },
          { label: 'Page views', values: asPeriods(vis, 'page_views') },
          { label: 'New members', values: m?.members ?? ZERO, href: '/admin/analytics/growth' },
          { label: 'Digital Profile views', values: asPeriods(dp, 'views'), href: '/admin/analytics/digital-profiles' },
          { label: 'Digital Profile unique visitors', values: asPeriods(dp, 'unique_visitors') },
          { label: 'Interests sent', values: m?.interests ?? ZERO, href: '/admin/analytics/engagement' },
          { label: 'Mutual matches', values: m?.matches ?? ZERO },
          { label: 'Messages', values: m?.messages ?? ZERO },
        ]} />
        <DataNote>{since ? `Visitor counts start ${ist(since, false)}, when first-party analytics began.` : 'Visitor counts begin with the first visit after the analytics release; until then they read zero.'} Member, Digital Profile and engagement figures cover all history.</DataNote>
      </Section>
    </>
  )
}
