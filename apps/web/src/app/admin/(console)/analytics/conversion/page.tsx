import { DataNote, PageHeader, Section, Unavailable, fmt, ist } from '@/components/admin/ui'
import Link from 'next/link'
import { getFunnel, getRegistrationFunnel } from '@/lib/adminData'
import { requireAdminPage } from '@/lib/adminAuth'

export const metadata = { title: 'Conversion' }
export const dynamic = 'force-dynamic'

type Stage = { key: string; label: string; n: number; note?: string }

/** Stages as bars, each with its share of the first stage and the step-to-step drop. */
function FunnelBars({ stages, unit }: { stages: Stage[]; unit: string }) {
  const top = stages[0]?.n || 1
  return (
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
                <span className="ml-2 text-[12px] text-ink-soft">{fmt(overall, 1)}% of {unit}</span>
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
  )
}

/** The step where the most people stop, by absolute count lost. */
function biggestDrop(stages: Stage[]): string | null {
  let best: { label: string; lost: number } | null = null
  for (let i = 1; i < stages.length; i++) {
    const lost = stages[i - 1].n - stages[i].n
    if (lost > 0 && (!best || lost > best.lost)) best = { label: `${stages[i - 1].label} → ${stages[i].label}`, lost }
  }
  return best ? `${best.label} (${fmt(best.lost)} stopped here)` : null
}

const DAY_CHOICES = [7, 30, 90] as const

export default async function ConversionPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdminPage('view')
  const daysParam = Number((await searchParams).days)
  const days = (DAY_CHOICES as readonly number[]).includes(daysParam) ? daysParam : 30
  const [f, r] = await Promise.all([getFunnel(), getRegistrationFunnel(days)])

  const st = r?.steps ?? {}
  const browserStages: Stage[] = r ? [
    { key: 'started', label: 'Opened Create account', n: st.started ?? 0 },
    { key: 'mobile_entered', label: 'Entered mobile', n: st.mobile_entered ?? 0 },
    { key: 'otp_sent', label: 'Code sent', n: st.otp_sent ?? 0 },
    { key: 'otp_verified', label: 'Code verified', n: st.otp_verified ?? 0, note: 'account exists from here' },
    { key: 'password_set', label: 'Password set', n: st.password_set ?? 0 },
    { key: 'about_done', label: 'About you', n: st.about_done ?? 0 },
    { key: 'mithila_done', label: 'Mithila details', n: st.mithila_done ?? 0 },
    { key: 'photo_done', label: 'Photo added', n: st.photo_done ?? 0, note: 'profile can now be found' },
    { key: 'profile_completion_started', label: 'Chose “Complete my profile”', n: st.profile_completion_started ?? 0 },
  ] : []
  const accountStages: Stage[] = r ? [
    { key: 'accounts', label: 'Accounts created', n: r.accounts },
    { key: 'about', label: 'About you complete', n: r.about_done },
    { key: 'mithila', label: 'Mithila details complete', n: r.mithila_done },
    { key: 'photo', label: 'Photo added — visible to members', n: r.photo_done },
    { key: 'strong', label: 'Profile strength 75% or more', n: r.strength_75 },
  ] : []

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

      <Section title="Registration funnel" className="mt-4"
        description={`Where people stop while joining, last ${days} days.`}
        actions={
          <div className="flex gap-1 text-[12.5px]">
            {DAY_CHOICES.map(d => (
              <Link key={d} href={`?days=${d}`} aria-current={d === days ? 'page' : undefined}
                className={`rounded-md border px-2.5 py-1 ${d === days ? 'border-[#B3424F] bg-[#B3424F] text-white' : 'border-[#E8E1D5] text-ink hover:border-[#B3424F]'}`}>{d} days</Link>
            ))}
          </div>
        }>
        {!r ? <Unavailable /> : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-[13px] font-semibold text-ink">Accounts (database)</h3>
              <FunnelBars stages={accountStages} unit="accounts" />
              {biggestDrop(accountStages) && <p className="mt-3 text-[12.5px] text-ink">Biggest drop-off: <strong>{biggestDrop(accountStages)}</strong></p>}
            </div>
            <div>
              <h3 className="mb-2 text-[13px] font-semibold text-ink">Browsers (join steps)</h3>
              {r.steps_since ? (
                <>
                  <FunnelBars stages={browserStages} unit="starts" />
                  {biggestDrop(browserStages) && <p className="mt-3 text-[12.5px] text-ink">Biggest drop-off: <strong>{biggestDrop(browserStages)}</strong></p>}
                </>
              ) : <p className="text-[13px] text-ink-soft">Step tracking begins with this release — nothing recorded yet.</p>}
            </div>
          </div>
        )}
        <DataNote>
          Accounts are counted from the database (accounts created in the period and how far each profile has got) — the reliable figure.
          Browser steps are anonymous unique visitors per step{r?.steps_since ? `, recorded since ${ist(r.steps_since, false)}` : ''}; they also cover the steps before an account exists,
          and miss browsers with Do Not Track on. No number, name or other entry is ever recorded.
        </DataNote>
      </Section>

      <Section title="Member funnel" className="mt-4">
        {!f ? <Unavailable /> : (
          <FunnelBars stages={stages} unit="signups" />
        )}
        <DataNote>
          Steps are not strictly nested: “Searched” and “Viewed a profile” only count from {f?.activity_since ? ist(f.activity_since, false) : 'this release'}, so they can read lower than the steps after them for older members.
        </DataNote>
      </Section>
    </>
  )
}
