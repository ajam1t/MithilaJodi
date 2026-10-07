import { DataNote, PageHeader, Section, Unavailable, fmt, ist } from '@/components/admin/ui'
import { getFunnel } from '@/lib/adminData'
import { requireAdminPage } from '@/lib/adminAuth'

export const metadata = { title: 'Conversion' }
export const dynamic = 'force-dynamic'

export default async function ConversionPage() {
  await requireAdminPage('view')
  const f = await getFunnel()

  const stages = f ? [
    { key: 'signups', label: 'Signed up', n: f.signups, note: 'Registered an account (mobile verified)' },
    { key: 'profile_created', label: 'Profile created', n: f.profile_created },
    { key: 'profile_completed', label: 'Profile completed', n: f.profile_completed, note: 'All twelve completion checks' },
    { key: 'searched', label: 'Searched', n: f.searched, note: 'Since member activity tracking began' },
    { key: 'viewed_profile', label: 'Viewed a profile', n: f.viewed_profile, note: 'Since member activity tracking began' },
    { key: 'interest_sent', label: 'Sent an interest', n: f.interest_sent },
    { key: 'interest_accepted', label: 'Interest accepted', n: f.interest_accepted, note: 'At least one of their interests was accepted' },
    { key: 'matched', label: 'Mutual match', n: f.matched, note: 'In at least one member conversation' },
    { key: 'messaged', label: 'Sent a message', n: f.messaged },
  ] : []
  const top = stages[0]?.n || 1

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Conversion"
        description="How many members reach each step, all time. Each step counts distinct members; a member counts once however often they did it." />

      <Section title="Visitor">
        {f ? (
          <p className="text-[14px] text-ink">
            <span className="text-[22px] font-semibold tabular-nums">{fmt(f.visitors)}</span> unique visitors
            {f.visitors_since ? <span className="text-ink-soft"> since {ist(f.visitors_since, false)}</span> : <span className="text-ink-soft"> — counting begins with this release</span>}
            {f.visitors > 0 && <span className="text-ink-soft"> · {fmt(Math.round((f.signups / f.visitors) * 1000) / 10, 1)}% of that many signed up overall</span>}
          </p>
        ) : <Unavailable />}
        <DataNote>Visitors are anonymous browsers and members are accounts — different units, and visitor counting started later than registrations — so the visitor-to-signup figure is indicative only.</DataNote>
      </Section>

      <Section title="Member funnel" className="mt-4">
        {!f ? <Unavailable /> : (
          <ol className="space-y-3">
            {stages.map((s, i) => {
              const prev = i > 0 ? stages[i - 1].n : null
              const step = prev ? Math.round((s.n / prev) * 1000) / 10 : null
              const overall = Math.round((s.n / top) * 1000) / 10
              return (
                <li key={s.key}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-[13.5px]">
                    <span className="font-medium text-ink">{i + 1}. {s.label}{s.note && <span className="ml-1.5 text-[11.5px] font-normal text-ink-soft">{s.note}</span>}</span>
                    <span className="tabular-nums text-ink">
                      <strong className="font-semibold">{fmt(s.n)}</strong>
                      <span className="ml-2 text-[12px] text-ink-soft">{fmt(overall, 1)}% of signups</span>
                      {step !== null && (
                        <span className="ml-2 text-[12px] text-ink-soft">· {fmt(step, 1)}% from previous{prev && prev > s.n ? ` (−${fmt(Math.round((100 - step) * 10) / 10, 1)}% drop-off)` : ''}</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-[#F1ECE3]" aria-hidden="true">
                    <div className="h-full rounded-full bg-[#B3424F]" style={{ width: `${Math.max((s.n / top) * 100, s.n > 0 ? 1.5 : 0)}%` }} />
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        <DataNote>
          Steps are not strictly nested: “Searched” and “Viewed a profile” only count from {f?.activity_since ? ist(f.activity_since, false) : 'this release'}, so they can read lower than the steps after them for older members.
        </DataNote>
      </Section>
    </>
  )
}
