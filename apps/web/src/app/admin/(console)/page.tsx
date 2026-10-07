import Link from 'next/link'
import { TimeSeriesChart } from '@/components/admin/TimeSeriesChart'
import {
  DataNote, PageHeader, RankBars, Section, StatGrid, StatTile, Unavailable, ago, bytes, fmt, ist,
} from '@/components/admin/ui'
import { actionLabel, actorLabel } from '@/components/admin/format'
import {
  getAttention, getDaily, getDbUsage, getDpPeriods, getEventPeriods, getGeo, getMemberSnapshot, getMetricPeriods,
  getRecentAudit, getSectionPeriods, getTrackingSince, getVisitorPeriods, ratio,
} from '@/lib/adminData'
import { requireAdminPage } from '@/lib/adminAuth'

export const metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

function greeting(): string {
  const h = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()))
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const sub = (a: number | null | undefined, label: string) => (a == null ? undefined : `${fmt(a)} ${label}`)

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const session = await requireAdminPage('view')
  const { denied } = await searchParams
  const [m, dp, vis, ev, snap, att, daily, geo, sections, audit, usage, since] = await Promise.all([
    getMetricPeriods(), getDpPeriods(), getVisitorPeriods(), getEventPeriods(), getMemberSnapshot(), getAttention(),
    getDaily(30), getGeo(), getSectionPeriods(), getRecentAudit(8), getDbUsage(), getTrackingSince(),
  ])

  const tracking = since ? `Site analytics since ${ist(since, false)}.` : 'Site analytics start with the first visit after this release.'
  const astro = ev?.totals['astrology_tool_used']
  const avgReach = ratio(dp?.d30?.views, dp?.d30?.links_opened)
  const storageBytes = usage?.buckets.reduce((a, b) => a + Number(b.bytes), 0) ?? null
  const attentionTotal = att.photos + att.profiles + att.reports + att.flags

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${session.role === 'admin' ? 'Admin' : 'Moderator'}`}
        description="Here’s what’s happening on Mithila Jodi. Every figure below is counted from live data; days are IST."
      />
      {denied && (
        <p role="alert" className="mb-5 rounded-lg border border-[#EBD7A8] bg-[#FBF1DC] px-4 py-2.5 text-[13.5px] text-[#7A5410]">
          Your role does not include that page. Ask an admin if you need access.
        </p>
      )}

      {/* ── Needs attention ─────────────────────────────────────────── */}
      <div id="attention" className="mb-6 scroll-mt-24 rounded-xl border border-[#E8E1D5] bg-white px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px]">
          <span className="font-semibold text-ink">{attentionTotal === 0 ? 'Nothing waiting on you' : `${attentionTotal} waiting on you`}</span>
          {[
            ['Photos to review', att.photos, '/admin/photos'],
            ['Profiles to approve', att.profiles, '/admin/members?status=pending_review'],
            ['Open reports', att.reports, '/admin/reports'],
            ['Unresolved flags', att.flags, '/admin/flags'],
          ].map(([label, n, href]) => (
            <Link key={label as string} href={href as string} className={`inline-flex items-center gap-1.5 ${Number(n) > 0 ? 'font-medium text-maroon' : 'text-ink-soft'} hover:underline`}>
              {label} <span className="tabular-nums">{fmt(n as number)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Primary KPIs ────────────────────────────────────────────── */}
      <StatGrid>
        <StatTile label="Total members" value={fmt(snap?.members)} sub={sub(m?.members?.d7, 'joined in 7 days')} href="/admin/members" />
        <StatTile label="New members today" value={fmt(m?.members?.today)} sub={sub(m?.members?.yesterday, 'yesterday')} href="/admin/analytics/growth" />
        <StatTile label="Active members" value={fmt(snap?.active_30d)} sub={snap ? `${fmt(snap.active_7d)} in 7 days · ${fmt(snap.active_today)} today` : undefined} note="Signed in during the last 30 days" />
        <StatTile label="Unique visitors today" value={fmt(vis?.today?.visitors)} sub={sub(vis?.yesterday?.visitors, 'yesterday')} href="/admin/analytics/visitors" />
        <StatTile label="Digital Profile views today" value={fmt(dp?.today?.views)} sub={dp ? `${fmt(dp.today?.unique_visitors)} unique · ${fmt(dp.d7?.views)} in 7 days` : undefined} href="/admin/analytics/digital-profiles" />
        <StatTile label="Profiles shared" value={fmt(dp?.d30?.links_opened)} sub="links opened in 30 days" note={avgReach != null ? `${fmt(avgReach, 1)} views per shared profile` : undefined} href="/admin/analytics/digital-profiles" />
        <StatTile label="Interests sent" value={fmt(m?.interests?.today)} sub={sub(m?.interests?.d30, 'in 30 days')} href="/admin/analytics/engagement" />
        <StatTile label="Mutual matches" value={fmt(m?.matches?.today)} sub={sub(m?.matches?.d30, 'in 30 days')} href="/admin/analytics/engagement" />
        <StatTile label="Messages" value={fmt(m?.messages?.today)} sub={sub(m?.messages?.d30, 'in 30 days')} href="/admin/analytics/engagement" />
        <StatTile label="Profile completion" value={snap?.avg_completion != null ? `${fmt(snap.avg_completion, 1)}%` : '—'} sub={snap ? `${fmt(snap.completed)} of ${fmt(snap.profiles)} profiles complete` : undefined} href="/admin/analytics/growth" />
      </StatGrid>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Biodata (members)" value={fmt(m?.member_biodata?.d30)} sub="generated in 30 days" href="/admin/features#biodata" />
        <StatTile label="Biodata maker downloads" value={fmt(ev?.totals['biodata_downloaded']?.d30 ?? 0)} sub="public, no-login · 30 days" href="/admin/features#biodata" />
        <StatTile label="Invitations" value={fmt((m?.premium_invites?.d30 ?? 0) + (ev?.totals['invitation_card_made']?.d30 ?? 0))} sub="cards + Premium links · 30 days" href="/admin/features#invitation" />
        <StatTile label="Astrology tool uses" value={fmt(astro?.d30 ?? 0)} sub={sub(astro?.today ?? 0, 'today')} href="/admin/features#astrology" />
        <StatTile label="Journal views" value={fmt(sections?.views.journal?.d30 ?? 0)} sub="page views · 30 days" href="/admin/features#journal" />
      </div>
      <DataNote>{tracking} Premium Biodata is not a product on the site, so it has no figure.</DataNote>

      {/* ── Trends ─────────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Section title="New members" description="Registrations per day, last 30 days">
          {daily ? <TimeSeriesChart title="New members per day" series={[{ key: 'members', label: 'New members', points: daily.members ?? [] }]} /> : <Unavailable />}
        </Section>
        <Section title="Unique visitors" description="Distinct browsers per day, last 30 days">
          {daily ? <TimeSeriesChart title="Unique visitors per day" series={[{ key: 'visitors', label: 'Unique visitors', points: daily.visitors ?? [] }]} /> : <Unavailable />}
        </Section>
        <Section title="Digital Profile views" description="Opens of shared profile links per day, last 30 days">
          {daily ? <TimeSeriesChart title="Digital Profile views per day" series={[{ key: 'dp', label: 'Views', points: daily.dp_views ?? [] }]} /> : <Unavailable />}
        </Section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Section title="Where members are" description="Members by state (current location)" actions={<Link href="/admin/members/map" className="text-[12.5px] font-medium text-maroon hover:underline">Map →</Link>}>
          {geo ? (
            <>
              <RankBars rows={geo.states.slice(0, 6).map(s => ({ label: s.state, value: Number(s.total), href: '/admin/members/map' }))} empty="No member locations yet." />
              <DataNote>{fmt(geo.no_location)} of {fmt(geo.total)} profiles have no location set.</DataNote>
            </>
          ) : <Unavailable />}
        </Section>

        <Section title="Most used astrology tools" description="Calculations completed, last 30 days" actions={<Link href="/admin/features#astrology" className="text-[12.5px] font-medium text-maroon hover:underline">All tools →</Link>}>
          <RankBars
            rows={Object.entries(ev?.byKey['astrology_tool_used'] ?? {}).map(([k, v]) => ({ label: k.replace(/-/g, ' '), value: v.d30 ?? 0 })).filter(r => r.value > 0).sort((a, b) => b.value - a.value).slice(0, 6)}
            empty="No tool calculations recorded yet."
          />
        </Section>

        <Section title="Recent admin activity" actions={<Link href="/admin/security/audit" className="text-[12.5px] font-medium text-maroon hover:underline">Audit log →</Link>}>
          {audit.length === 0 ? <Unavailable title="No admin activity yet." /> : (
            <ul className="divide-y divide-[#F3EEE6]">
              {audit.map(a => (
                <li key={a.id} className="py-2 text-[13px]">
                  <p className="text-ink">{actionLabel(a.action)}</p>
                  <p className="text-[11.5px] text-ink-soft">{actorLabel(a)} · {ago(a.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Section title="Platform" description="Database and file storage in use" actions={<Link href="/admin/system/supabase" className="text-[12.5px] font-medium text-maroon hover:underline">Supabase →</Link>}>
          {usage ? (
            <dl className="grid grid-cols-2 gap-3 text-[13.5px]">
              <div><dt className="text-ink-soft">Database</dt><dd className="text-[18px] font-semibold">{bytes(usage.db_bytes)}</dd></div>
              <div><dt className="text-ink-soft">File storage</dt><dd className="text-[18px] font-semibold">{bytes(storageBytes)}</dd></div>
            </dl>
          ) : <Unavailable />}
          <DataNote>Remaining capacity is shown on the Supabase page once your plan limits are entered in Settings.</DataNote>
        </Section>
        <Section title="Shortcuts">
          <div className="flex flex-wrap gap-2 text-[13px]">
            {[
              ['Find a member', '/admin/members'], ['Change WhatsApp link', '/admin/community'], ['New Journal article', '/admin/blog/new'],
              ['Conversion funnel', '/admin/analytics/conversion'], ['System health', '/admin/system'], ['Audit log', '/admin/security/audit'],
            ].map(([l, h]) => <Link key={h} href={h} className="rounded-lg border border-[#E8E1D5] px-3 py-1.5 hover:border-[#CDBFA6]">{l}</Link>)}
          </div>
        </Section>
      </div>
    </>
  )
}
