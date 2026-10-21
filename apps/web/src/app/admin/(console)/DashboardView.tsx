import Link from 'next/link'
import { IndiaTileMap } from '@/components/admin/IndiaTileMap'
import { TrendDeck, type Trend } from '@/components/admin/dashboard/TrendDeck'
import { DataNote, Section, StatTile, Unavailable, ago, bytes, fmt } from '@/components/admin/ui'
import { actionLabel, actorLabel } from '@/components/admin/format'
import { Icon } from '@/components/admin/icons'
import type {
  DailyPoint, DbUsage, DpPeriod, EventPeriods, Funnel, GeoState, MemberSnapshot, VisitorPeriod,
  getRecentAudit, getSectionPeriods,
} from '@/lib/adminData'
import type { AdminPerm } from '@/lib/adminAuth'
import type { PeriodValues } from '@/components/admin/ui'

/*
 * The console home — a bridge, not a report. Top to bottom: who is on duty
 * and what today looks like; the queue that needs a person; the vital signs
 * with their last fortnight drawn in; one switchable trend; the member
 * journey from first visit to first message; where members are; what admins
 * did last; what the platform holds. Every figure is passed in from live
 * queries — a missing source renders as "—" or "Data unavailable", never as
 * a made-up zero.
 */

export type DashboardData = {
  role: string
  perms: AdminPerm[]
  denied: boolean
  m: Record<string, PeriodValues> | null
  dp: Record<string, DpPeriod> | null
  vis: Record<string, VisitorPeriod> | null
  ev: EventPeriods | null
  snap: MemberSnapshot | null
  att: { photos: number; profiles: number; reports: number; flags: number }
  daily: Record<string, DailyPoint[]> | null
  geo: { states: GeoState[]; no_location: number; total: number } | null
  sections: Awaited<ReturnType<typeof getSectionPeriods>>
  audit: Awaited<ReturnType<typeof getRecentAudit>>
  usage: DbUsage | null
  since: string | null
  counts: { total: number; active: number } | null
  funnel: Funnel | null
}

function greeting(): string {
  const h = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()))
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}
const todayLine = () => new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const sub = (a: number | null | undefined, label: string) => (a == null ? undefined : `${fmt(a)} ${label}`)
const last = (pts: DailyPoint[] | undefined, n = 14) => (pts && pts.length > 1 ? pts.slice(-n).map(p => p.n) : undefined)
const pct = (a: number | null | undefined, b: number | null | undefined) => (a == null || !b ? null : Math.max(0, Math.min(1, a / b)))

/* ── Pulse: three live ratios as concentric rings ─────────────────────── */
function Pulse({ rings }: { rings: Array<{ label: string; value: number | null; text: string; color: string }> }) {
  const R = [78, 62, 46]
  return (
    <div className="acx-pulse">
      <svg viewBox="0 0 190 190" role="img" aria-label={rings.map(r => `${r.label}: ${r.text}`).join('; ')}>
        <g transform="rotate(-90 95 95)">
          {rings.map((r, i) => (
            <g key={r.label}>
              <circle cx="95" cy="95" r={R[i]} fill="none" stroke="rgba(185,138,46,.16)" strokeWidth="11" />
              <circle cx="95" cy="95" r={R[i]} fill="none" stroke={r.color} strokeWidth="11" strokeLinecap="round" pathLength={100}
                strokeDasharray={`${Math.round((r.value ?? 0) * 100)} 100`} className="acx-ring" style={{ animationDelay: `${i * 140}ms` }} />
            </g>
          ))}
        </g>
        <image href="/logo-mark.png" x="77" y="78" width="36" height="33" />
      </svg>
      <div className="acx-pulse-leg">
        {rings.map(r => (
          <div key={r.label}>
            <i style={{ background: r.color }} aria-hidden="true" />
            <b>{r.text}</b>
            <span>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Journey: visit → message, each step as a share of the first ─────── */
function Journey({ f }: { f: Funnel }) {
  // Visitors are counted per browser and dwarf every later step, so they
  // lead as one figure; the bars start at sign-up and share one scale.
  const steps = [
    ['Signed up', f.signups], ['Created a profile', f.profile_created], ['Completed it', f.profile_completed],
    ['Sent an interest', f.interest_sent], ['Interest accepted', f.interest_accepted], ['Matched', f.matched], ['Messaged', f.messaged],
  ] as const
  const top = Math.max(1, ...steps.map(s => Number(s[1]) || 0))
  const visitors = Number(f.visitors) || 0
  return (
    <>
      <p className="acx-entry">
        <b>{fmt(visitors)}</b> visitors <span aria-hidden="true">→</span> <b>{fmt(f.signups)}</b> signed up
        {visitors > 0 && <span className="acx-mono text-[11.5px] font-semibold text-[#8A6516]">{fmt((Number(f.signups) / visitors) * 100, 1)}% of visitors</span>}
      </p>
      <ol className="acx-funnel" aria-label="Member journey">
        {steps.map(([label, n], i) => {
          const v = Number(n) || 0
          const w = (v / top) * 100
          const prev = i > 0 ? Number(steps[i - 1][1]) || 0 : null
          return (
            <li key={label} className="acx-step">
              <span className="truncate text-ink">{label}</span>
              <span className="acx-step-bar" data-low={w < 30 || undefined}>
                <i style={{ width: `${Math.max(w, v > 0 ? 2 : 0)}%`, '--i': i } as React.CSSProperties} />
                <span>{fmt(v)}</span>
              </span>
              <span className="acx-step-pct" title={prev != null ? 'Share of the step before' : undefined}>
                {prev == null ? '—' : prev > 0 ? `${fmt((v / prev) * 100, 0)}%` : '—'}
              </span>
            </li>
          )
        })}
      </ol>
    </>
  )
}

function Aripan() {
  return (
    <svg viewBox="0 0 200 200" className="acx-bridge-aripan" aria-hidden="true">
      <g fill="none" stroke="#B98A2E" strokeOpacity=".5">
        <circle cx="100" cy="100" r="96" strokeDasharray="2 5" />
        <circle cx="100" cy="100" r="70" />
        {Array.from({ length: 12 }, (_, k) => (
          <ellipse key={k} cx="100" cy="58" rx="13" ry="34" transform={`rotate(${k * 30} 100 100)`} />
        ))}
        <circle cx="100" cy="100" r="18" />
      </g>
    </svg>
  )
}

export function DashboardView(d: DashboardData) {
  const { m, dp, vis, ev, snap, att, daily, geo, sections, audit, usage, since, counts, funnel } = d
  const attentionTotal = att.photos + att.profiles + att.reports + att.flags
  const storageBytes = usage?.buckets.reduce((a, b) => a + Number(b.bytes), 0) ?? null
  const astro = ev?.totals['astrology_tool_used']
  const tracking = since ? `Site analytics since ${new Date(since).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })}.` : 'Site analytics start with the first visit after this release.'

  const queue = [
    { label: 'Photos to review', n: att.photos, href: '/admin/photos', icon: 'photo' },
    { label: 'Profiles to approve', n: att.profiles, href: '/admin/members?status=pending_review', icon: 'approve' },
    { label: 'Open reports', n: att.reports, href: '/admin/reports', icon: 'report' },
    { label: 'Unresolved flags', n: att.flags, href: '/admin/flags', icon: 'flag' },
  ]

  const trends: Trend[] = daily ? ([
    ['members', 'New members'], ['visitors', 'Visitors'], ['dp_views', 'Digital Profile views'], ['interests', 'Interests'], ['messages', 'Messages'],
  ] as const).filter(([k]) => daily[k]).map(([k, label]) => ({ key: k, label, points: daily[k] })) : []

  const features = [
    { label: 'Digital Profile views', value: dp?.d30?.views ?? 0, href: '/admin/analytics/digital-profiles' },
    { label: 'Astrology calculations', value: astro?.d30 ?? 0, href: '/admin/features#astrology' },
    { label: 'Journal page views', value: sections?.views.journal?.d30 ?? 0, href: '/admin/features#journal' },
    { label: 'Biodata (members)', value: m?.member_biodata?.d30 ?? 0, href: '/admin/features#biodata' },
    { label: 'Biodata maker downloads', value: ev?.totals['biodata_downloaded']?.d30 ?? 0, href: '/admin/features#biodata' },
    { label: 'Invitations', value: (m?.premium_invites?.d30 ?? 0) + (ev?.totals['invitation_card_made']?.d30 ?? 0), href: '/admin/features#invitation' },
  ].sort((a, b) => b.value - a.value)
  const fmax = Math.max(1, ...features.map(f => f.value))

  return (
    <>
      {d.denied && (
        <p role="alert" className="mb-5 rounded-2xl border border-[#EBD7A8] bg-[#FBF1DC] px-4 py-2.5 text-[13.5px] text-[#7A5410]">
          Your role does not include that page. Ask an admin if you need access.
        </p>
      )}

      {/* ── Bridge ── */}
      <section className="acx-bridge acx-in" aria-labelledby="acx-greet">
        <Aripan />
        <div className="relative min-w-0">
          <p className="acx-eyebrow">{todayLine()} · IST</p>
          <h1 id="acx-greet" className="acx-greet mt-2">{greeting()}, {d.role === 'admin' ? 'Admin' : 'Moderator'}</h1>
          <p className="acx-summary">
            Today so far: <b>{fmt(m?.members?.today)}</b> new {m?.members?.today === 1 ? 'member' : 'members'},{' '}
            <b>{fmt(vis?.today?.visitors)}</b> unique visitors and <b>{fmt(dp?.today?.views)}</b> Digital Profile views.{' '}
            {attentionTotal === 0 ? 'Nothing is waiting on you.' : <><b className="text-[#7A1220]">{fmt(attentionTotal)}</b> {attentionTotal === 1 ? 'item is' : 'items are'} waiting on you.</>}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {attentionTotal > 0 && <a href="#attention" className="acx-chip is-main"><Icon name="bell" size={15} />Clear the queue</a>}
            <Link href="/admin/members" className="acx-chip"><Icon name="search" size={15} />Find a member</Link>
            <Link href="/admin/analytics" className="acx-chip"><Icon name="analytics" size={15} />Analytics</Link>
            <Link href="/admin/system" className="acx-chip"><Icon name="system" size={15} />System health</Link>
          </div>
        </div>
        <div className="relative">
          <Pulse rings={[
            { label: `Active members — of ${fmt(counts?.total)} in all`, value: pct(counts?.active, counts?.total), text: fmt(counts?.active), color: '#7A1220' },
            { label: 'Signed in within 30 days', value: pct(snap?.active_30d, snap?.members), text: fmt(snap?.active_30d), color: '#C0733A' },
            { label: 'Average profile completion', value: snap?.avg_completion != null ? snap.avg_completion / 100 : null, text: snap?.avg_completion != null ? `${fmt(snap.avg_completion, 0)}%` : '—', color: '#D9A84C' },
          ]} />
        </div>
      </section>

      {/* ── Queue ── */}
      <section id="attention" className="acx-in mt-5 scroll-mt-24" style={{ '--d': 1 } as React.CSSProperties} aria-labelledby="acx-q">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <h2 id="acx-q" className="acx-card-t">{attentionTotal === 0 ? 'Queue clear' : `${fmt(attentionTotal)} waiting on a person`}</h2>
          <span className="acx-eyebrow">Moderation</span>
        </div>
        <div className="acx-queue">
          {queue.map(q => (
            <Link key={q.label} href={q.href} className="acx-pod" data-hot={q.n > 0 || undefined}>
              <span className="acx-pod-ico"><Icon name={q.icon} size={21} /></span>
              <span className="min-w-0">
                <span className="acx-pod-n block">{fmt(q.n)}</span>
                <span className="acx-pod-l block">{q.n > 0 ? q.label : `${q.label} — clear`}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Vital signs ── */}
      <section className="acx-in mt-6" style={{ '--d': 2 } as React.CSSProperties} aria-labelledby="acx-v">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <h2 id="acx-v" className="acx-card-t">Vital signs</h2>
          <span className="acx-eyebrow">Lines: last 14 days</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <StatTile label="Total members" value={fmt(counts?.total)} sub={sub(m?.members?.d7, 'joined in 7 days')} href="/admin/members" spark={last(daily?.members)} />
          <StatTile label="New today" value={fmt(m?.members?.today)} delta={{ now: m?.members?.today, then: m?.members?.yesterday }} sub={sub(m?.members?.yesterday, 'yesterday')} href="/admin/analytics/growth" spark={last(daily?.members)} />
          <StatTile label="Visitors today" value={fmt(vis?.today?.visitors)} delta={{ now: vis?.today?.visitors, then: vis?.yesterday?.visitors }} sub={sub(vis?.yesterday?.visitors, 'yesterday')} href="/admin/analytics/visitors" spark={last(daily?.visitors)} />
          <StatTile label="Digital Profile views" value={fmt(dp?.today?.views)} delta={{ now: dp?.today?.views, then: dp?.yesterday?.views }} sub={dp ? `${fmt(dp.today?.unique_visitors)} unique · ${fmt(dp.d7?.views)} in 7 days` : undefined} href="/admin/analytics/digital-profiles" spark={last(daily?.dp_views)} />
          <StatTile label="Interests sent" value={fmt(m?.interests?.today)} delta={{ now: m?.interests?.today, then: m?.interests?.yesterday }} sub={sub(m?.interests?.d30, 'in 30 days')} href="/admin/analytics/engagement" spark={last(daily?.interests)} />
          <StatTile label="Mutual matches" value={fmt(m?.matches?.today)} sub={sub(m?.matches?.d30, 'in 30 days')} href="/admin/analytics/engagement" spark={last(daily?.matches)} />
          <StatTile label="Messages" value={fmt(m?.messages?.today)} delta={{ now: m?.messages?.today, then: m?.messages?.yesterday }} sub={sub(m?.messages?.d30, 'in 30 days')} href="/admin/analytics/engagement" spark={last(daily?.messages)} />
          <StatTile label="Profiles shared" value={fmt(dp?.d30?.links_opened)} sub="links opened in 30 days" href="/admin/analytics/digital-profiles" />
        </div>
      </section>

      {/* ── Trend + Journey ── */}
      <div className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Section title="Trends" description="Daily, last 30 days · IST" actions={<Link href="/admin/analytics" className="text-[12.5px] font-medium text-maroon hover:underline">Analytics →</Link>}>
          {trends.length ? <TrendDeck trends={trends} /> : <Unavailable />}
        </Section>
        <Section title="Member journey" description="From first visit to first message — each step as a share of the one before" actions={<Link href="/admin/analytics/conversion" className="text-[12.5px] font-medium text-maroon hover:underline">Conversion →</Link>}>
          {funnel ? (
            <>
              <Journey f={funnel} />
              <DataNote>
                Visitors counted since {funnel.visitors_since ? new Date(funnel.visitors_since).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'tracking began'}; members, all time.
              </DataNote>
            </>
          ) : <Unavailable />}
        </Section>
      </div>

      {/* ── Map + activity ── */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Section title="Where members are" description="By state of current location" actions={<Link href="/admin/members/map" className="text-[12.5px] font-medium text-maroon hover:underline">Full map →</Link>}>
          {geo ? (
            <>
              <IndiaTileMap states={geo.states} />
              <DataNote>{fmt(geo.no_location)} of {fmt(geo.total)} profiles have no location set.</DataNote>
            </>
          ) : <Unavailable />}
        </Section>
        <Section title="Admin activity" description="The latest actions in the audit log" actions={d.perms.includes('security') ? <Link href="/admin/security/audit" className="text-[12.5px] font-medium text-maroon hover:underline">Audit log →</Link> : undefined}>
          {audit.length === 0 ? <Unavailable title="No admin activity yet." /> : (
            <ul className="acx-timeline">
              {audit.map(a => (
                <li key={a.id}>
                  <p className="text-[13.5px] text-ink">{actionLabel(a.action)}</p>
                  <p className="acx-mono text-[11px] text-ink-soft">{actorLabel(a)} · {ago(a.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* ── Features + platform + deck ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Section title="Feature pulse" description="Use in the last 30 days, busiest first" actions={<Link href="/admin/features" className="text-[12.5px] font-medium text-maroon hover:underline">Features →</Link>}>
          <ol className="space-y-3">
            {features.map(f => (
              <li key={f.label}>
                <Link href={f.href} className="group block">
                  <span className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="truncate text-ink group-hover:text-maroon">{f.label}</span>
                    <span className="acx-mono shrink-0 text-[12.5px] font-semibold text-ink">{fmt(f.value)}</span>
                  </span>
                  <span className="acx-meter mt-1.5 block" aria-hidden="true"><i style={{ width: `${f.value > 0 ? Math.max((f.value / fmax) * 100, 3) : 0}%` }} /></span>
                </Link>
              </li>
            ))}
          </ol>
          <DataNote>{tracking}</DataNote>
        </Section>

        <Section title="Platform" description="What the database and file storage hold" actions={<Link href="/admin/system/supabase" className="text-[12.5px] font-medium text-maroon hover:underline">Supabase →</Link>}>
          {usage ? (
            <div className="grid gap-3">
              {[
                { k: 'Database', v: bytes(usage.db_bytes), icon: 'db' },
                { k: 'File storage', v: bytes(storageBytes), icon: 'photo' },
                { k: 'Files stored', v: fmt(usage.buckets.reduce((a, b) => a + Number(b.files), 0)), icon: 'content' },
              ].map(x => (
                <div key={x.k} className="flex items-center gap-3 rounded-2xl border border-[#EADFCB] bg-[#FFFDF8] px-3 py-2.5">
                  <span className="acx-k-ico"><Icon name={x.icon} size={16} /></span>
                  <span className="flex-1 text-[13px] text-ink-soft">{x.k}</span>
                  <span className="acx-mono text-[15px] font-semibold text-ink">{x.v}</span>
                </div>
              ))}
            </div>
          ) : <Unavailable />}
          <DataNote>Remaining capacity shows on the Supabase page once plan limits are entered in Settings.</DataNote>
        </Section>

        <Section title="Control deck" description="Jump straight in — or press ⌘K anywhere">
          <div className="acx-deck">
            {([
              ['Find a member', '/admin/members', 'search'], ['Member map', '/admin/members/map', 'map'], ['New article', '/admin/blog/new', 'pen', 'manage_content'],
              ['WhatsApp link', '/admin/community', 'whatsapp'], ['Conversion', '/admin/analytics/conversion', 'funnel'], ['Audit log', '/admin/security/audit', 'audit', 'security'],
              ['Photo review', '/admin/photos', 'photo', 'moderate'], ['Add a profile', '/admin/profiles/new', 'plus', 'manage_members'], ['System health', '/admin/system', 'system'],
            ] as Array<[string, string, string, AdminPerm?]>).filter(([, , , p]) => !p || d.perms.includes(p)).map(([l, h, i]) => (
              <Link key={h} href={h}><span className="text-[#B98A2E]"><Icon name={i} size={17} /></span><span className="min-w-0 truncate">{l}</span></Link>
            ))}
          </div>
        </Section>
      </div>
    </>
  )
}
