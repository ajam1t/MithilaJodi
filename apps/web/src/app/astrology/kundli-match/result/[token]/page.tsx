import Link from 'next/link'
import type { Metadata } from 'next'
import '@/styles/kundli.css'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { ScoreRing } from '@/components/astrology/kundli/ScoreRing'
import { Disclaimer, KootaBreakdown, ManglikCards, MoonProfiles, RelationshipMap, SectionTitle } from '@/components/astrology/kundli/ReportSections'
import { SharePrintButton } from '@/components/astrology/kundli/SharePrintButton'
import { points } from '@/components/astrology/kundli/format'
import { METHODOLOGY } from '@/lib/astrology/methodology'
import type { SharedMatchSummary } from '@/lib/astrology/types'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Unlisted, not private: never indexed, never followed.
export const metadata: Metadata = {
  title: 'Shared Kundli Match result',
  robots: { index: false, follow: false },
}

type Loaded =
  | { state: 'ok'; summary: SharedMatchSummary; expiresAt: string }
  | { state: 'gone' }
  | { state: 'missing' }

async function load(token: string): Promise<Loaded> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return { state: 'missing' }
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('kundli_match_shares')
    .select('summary, expires_at, revoked_at')
    .eq('token', token)
    .maybeSingle()
  if (error || !data) return { state: 'missing' }
  if (data.revoked_at || new Date(data.expires_at).getTime() < Date.now()) return { state: 'gone' }
  await admin.rpc('record_kundli_share_view', { p_token: token })
  return { state: 'ok', summary: data.summary as SharedMatchSummary, expiresAt: data.expires_at }
}

export default async function SharedKundliResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const loaded = await load(token)

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />
      <main id="main-content" className="flex-1">
        {loaded.state !== 'ok' ? (
          <section className="kd-cosmic py-20">
            <div className="kd-stars" aria-hidden="true" />
            <div className="wrap max-w-xl text-center">
              <h1 className="font-serif text-cream text-[32px]">
                {loaded.state === 'gone' ? 'This shared result is no longer available' : 'Shared result not found'}
              </h1>
              <p className="mt-4 text-paper-3/85 text-[16px] leading-relaxed">
                {loaded.state === 'gone'
                  ? 'The person who shared it has switched the link off, or it has expired. Shared Kundli Match links last 90 days.'
                  : 'Please check that the whole link was copied.'}
              </p>
              <Link href="/astrology/kundli-match" className="kd-cta mt-8">Calculate a Kundli Match</Link>
            </div>
          </section>
        ) : (
          <SharedView summary={loaded.summary} expiresAt={loaded.expiresAt} />
        )}
      </main>
      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}

function SharedView({ summary, expiresAt }: { summary: SharedMatchSummary; expiresAt: string }) {
  const names = { bride: summary.names.bride ?? 'Bride', groom: summary.names.groom ?? 'Groom' }
  const computed = new Date(summary.computedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  return (
    <div className="wrap py-8 sm:py-12 space-y-12">
      <section className="kd-cosmic rounded-mj-lg overflow-hidden border border-gold/25 px-4 py-8 sm:px-8">
        <div className="kd-stars" aria-hidden="true" />
        <p className="text-center text-[11px] uppercase tracking-[0.3em] text-marigold">Shared Kundli Match · Ashtakoota</p>
        <h1 className="mt-2 text-center font-serif text-[28px] sm:text-[34px] text-cream">
          {names.bride} <span className="text-gold-lt">&amp;</span> {names.groom}
        </h1>
        <p className="mt-2 text-center text-[13px] text-paper-3/75">Calculated {computed} · Methodology v{summary.methodologyVersion}</p>
        <div className="mt-4">
          <ScoreRing kootas={summary.kootas} displayTotal={summary.total} litCount={8} bandLabel={summary.band.label} />
        </div>
      </section>

      <section aria-labelledby="sh-summary">
        <SectionTitle id="sh-summary" eyebrow="Summary" title={`${points(summary.total)} of 36 Guna — ${summary.band.label}`} />
        <ul className="space-y-2 max-w-3xl">
          {summary.insights.map(i => <li key={i} className="flex gap-3 text-[15px] text-ink leading-relaxed"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />{i}</li>)}
        </ul>
        {(!summary.timeKnown.bride || !summary.timeKnown.groom) && (
          <p className="mt-4 rounded-mj-sm bg-info-soft text-info-fg px-4 py-3 text-[14px] max-w-3xl">
            At least one birth time was not known, so this result is based on the Moon’s position for the part of the day chosen by the person who shared it.
          </p>
        )}
      </section>

      <section aria-labelledby="sh-kootas">
        <SectionTitle id="sh-kootas" eyebrow="Koota breakdown" title="The eight kootas" />
        <RelationshipMap kootas={summary.kootas} names={names} />
        <div className="mt-6"><KootaBreakdown kootas={summary.kootas} /></div>
      </section>

      <section aria-labelledby="sh-manglik">
        <SectionTitle id="sh-manglik" eyebrow="Manglik" title="Manglik (Kuja) dosha" />
        <ManglikCards people={summary.manglik} names={names} pair={summary.manglik.pair} />
      </section>

      <section aria-labelledby="sh-moon">
        <SectionTitle id="sh-moon" eyebrow="Rashi & nakshatra" title="Moon signs and birth stars" />
        <MoonProfiles moons={summary.moon} names={names} showDegrees={false} />
      </section>

      <Disclaimer text={METHODOLOGY.disclaimer} />

      <div className="kd-no-print card p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-serif text-maroon text-[20px]">Shared privately</p>
          <p className="text-[14px] text-ink-soft">
            This page shows no birth dates, times or places. The link expires on{' '}
            {new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <SharePrintButton title={`Kundli-Match-${names.bride}-${names.groom}`} />
          <Link href="/astrology/kundli-match" className="btn-primary">Calculate your own</Link>
        </div>
      </div>
    </div>
  )
}
