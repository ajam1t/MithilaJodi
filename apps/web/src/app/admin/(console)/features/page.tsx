import { TimeSeriesChart } from '@/components/admin/TimeSeriesChart'
import { DataNote, PageHeader, PeriodTable, RankBars, Section, Unavailable, fmt, ist, type PeriodValues } from '@/components/admin/ui'
import {
  ZERO, asPeriods, getDaily, getDpPeriods, getEventPeriods, getMetricPeriods, getSectionPeriods, getTrackingSince, getTraffic,
} from '@/lib/adminData'
import { requireAdminPage } from '@/lib/adminAuth'
import { ASTROLOGY_TOOLS } from '@/lib/journal'
import { FESTIVALS } from '@/lib/festivals'

export const metadata = { title: 'Features' }
export const dynamic = 'force-dynamic'

export default async function FeaturesPage() {
  await requireAdminPage('view')
  const [m, dp, ev, sec, daily, traffic, since] = await Promise.all([
    getMetricPeriods(), getDpPeriods(), getEventPeriods(), getSectionPeriods(), getDaily(30), getTraffic(30), getTrackingSince(),
  ])
  const evt = (n: string): PeriodValues => ev?.totals[n] ?? ZERO
  const views = (s: string): PeriodValues => sec?.views[s] ?? ZERO

  const tools = ASTROLOGY_TOOLS.map(t => ({ ...t, v: ev?.byKey['astrology_tool_used']?.[t.slug] ?? ZERO }))
  const ranked = [...tools].sort((a, b) => (b.v.d30 ?? 0) - (a.v.d30 ?? 0))
  const songsByFestival = FESTIVALS.map(f => ({ label: f.name, value: ev?.byKey['song_played']?.[f.slug]?.d30 ?? 0 })).filter(r => r.value > 0).sort((a, b) => b.value - a.value)
  const pages = traffic?.top_pages ?? []
  const journal = pages.filter(p => /^\/blogs\/[^/]+\/[^/]+$/.test(p.path)).slice(0, 10)
  const festivalPages = pages.filter(p => /^\/festivals\/[^/]+$/.test(p.path)).slice(0, 8)
  const trackingNote = since ? `site analytics since ${ist(since, false)}` : 'site analytics start with this release'

  return (
    <>
      <PageHeader eyebrow="Features" title="Feature usage"
        description={`What people actually use. Database-backed features (interests, messages, Digital Profile opens, member biodata, Premium invitations) cover all history; page views and tool uses count from first-party analytics (${trackingNote}).`} />

      <Section title="All features" id="matrimony">
        <PeriodTable firstCol="Feature" rows={[
          { label: 'Matrimony · member searches', values: m?.member_searchs ?? ZERO, hint: 'Search requests by signed-in members' },
          { label: 'Matrimony · public profile browsing', values: views('explore'), hint: 'Page views of Explore' },
          { label: 'Interests', values: m?.interests ?? ZERO },
          { label: 'Messaging', values: m?.messages ?? ZERO, hint: 'Messages between members' },
          { label: 'Shortlist', values: m?.shortlists ?? ZERO },
          { label: 'Digital Profile · views', values: asPeriods(dp, 'views'), href: '/admin/analytics/digital-profiles' },
          { label: 'Digital Profile · share actions', values: evt('dp_shared') },
          { label: 'Biodata · member biodata generated', values: m?.member_biodata ?? ZERO },
          { label: 'Biodata · public maker downloads', values: evt('biodata_downloaded'), hint: 'No-login maker, PDF/print' },
          { label: 'Premium Biodata', values: null, hint: 'Not a product on the site' },
          { label: 'Invitation · cards made', values: evt('invitation_card_made'), hint: 'Basic card downloaded or shared' },
          { label: 'Invitation · Premium links created', values: m?.premium_invites ?? ZERO },
          { label: 'Astrology · tool uses', values: evt('astrology_tool_used'), hint: 'Completed calculations, all 8 tools' },
          { label: 'Festivals · page views', values: views('festivals') },
          { label: 'Festival songs · plays', values: evt('song_played') },
          { label: 'Festival songs · page views', values: views('festival_songs') },
          { label: 'Journal · page views', values: views('journal') },
        ]} />
      </Section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="Digital Profile" id="digital-profile">
          <PeriodTable rows={[
            { label: 'Views', values: asPeriods(dp, 'views') },
            { label: 'Unique visitors', values: asPeriods(dp, 'unique_visitors') },
            { label: 'Dashboard page views', values: views('digital_profile') },
          ]} />
        </Section>
        <Section title="Biodata" id="biodata">
          <PeriodTable rows={[
            { label: 'Maker page views', values: views('biodata') },
            { label: 'Maker downloads', values: evt('biodata_downloaded') },
            { label: 'Member biodata generated', values: m?.member_biodata ?? ZERO },
          ]} />
        </Section>
        <Section title="Invitation" id="invitation">
          <PeriodTable rows={[
            { label: 'Invitation page views', values: views('invitation') },
            { label: 'Cards made', values: evt('invitation_card_made') },
            { label: 'Premium links created', values: m?.premium_invites ?? ZERO },
          ]} />
        </Section>
        <Section title="Journal" id="journal" description="Most-read articles, last 30 days">
          <RankBars rows={journal.map(p => ({ label: p.path.split('/').pop()!.replace(/-/g, ' '), value: Number(p.views), sub: `${fmt(Number(p.visitors))} readers` }))} empty="No article views recorded yet." />
        </Section>
      </div>

      <Section title="Astrology tools" id="astrology" className="mt-4"
        description={ranked[0] && (ranked[0].v.d30 ?? 0) > 0
          ? `Most used in 30 days: ${ranked[0].title}. Least used: ${ranked[ranked.length - 1].title}.`
          : 'All eight tools, counted when a calculation completes.'}>
        <PeriodTable firstCol="Tool" rows={ranked.map(t => ({ label: t.title, values: t.v, hint: t.subtitle }))} />
        <div className="mt-5">
          <p className="mb-2 text-[13px] font-semibold text-ink">Tool uses per day (all tools, 30 days)</p>
          {daily ? <TimeSeriesChart title="Astrology tool uses per day" series={[{ key: 'a', label: 'Tool uses', points: daily['ev:astrology_tool_used'] ?? daily.members?.map(p => ({ day: p.day, n: 0 })) ?? [] }]} /> : <Unavailable />}
        </div>
      </Section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="Festivals" id="festivals" description="Most-viewed festival guides, last 30 days">
          <RankBars rows={festivalPages.map(p => ({ label: FESTIVALS.find(f => p.path.endsWith('/' + f.slug))?.name ?? p.path, value: Number(p.views) }))} empty="No festival page views recorded yet." />
        </Section>
        <Section title="Festival songs" id="songs" description="Songs played, by festival, last 30 days">
          <RankBars rows={songsByFestival} empty="No songs played yet." />
        </Section>
      </div>
      <DataNote>Premium Biodata does not exist on the site, so it shows “Not tracked” rather than a number. Feature use on public pages is anonymous — it is never linked to a member.</DataNote>
    </>
  )
}
