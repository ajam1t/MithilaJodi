'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { MatchResult, Role } from '@/lib/astrology/types'
import { PairChartExperience, type PairReportProps } from '../pair/PairChartExperience'
import { points } from './format'
import { MemberBirthPrefill } from './MemberBirthPrefill'

// The report (charts, reveal, print view) loads only once there is a result.
const ResultReport = dynamic(() => import('./ResultReport').then(m => m.ResultReport), {
  ssr: false,
  loading: () => <p className="text-center text-ink-soft py-10">Preparing the report…</p>,
}) as React.ComponentType<PairReportProps<MatchResult>>

/**
 * `?partner=` carries only a first name, from a Digital Profile's "Match your
 * kundli" link, and is used for labels — never to look anyone up. Anything
 * that is not a short, plain name is ignored.
 */
function partnerFromUrl(): string | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('partner') ?? ''
    const first = raw.trim().split(/\s+/)[0] ?? ''
    return /^[\p{L}][\p{L}\p{M}'.-]{0,29}$/u.test(first) ? first : null
  } catch {
    return null
  }
}

export function KundliMatchExperience() {
  // Read after mount (not via useSearchParams) so the page stays static.
  const [partner, setPartner] = useState<string | null>(null)
  const [mine, setMine] = useState<Role | null>(null)
  useEffect(() => setPartner(partnerFromUrl()), [])

  const other: Role | null = mine ? (mine === 'bride' ? 'groom' : 'bride') : null
  const titles: Partial<Record<Role, string>> = {}
  if (mine) titles[mine] = mine === 'bride' ? 'Your details (bride)' : 'Your details (groom)'
  if (partner && other) titles[other] = `${partner}’s details`

  return (
    <PairChartExperience<MatchResult>
      beforeCards={fill => (
        <MemberBirthPrefill
          partner={partner}
          onFill={(role, draft) => { fill(role, draft); setMine(role) }}
        />
      )}
      titles={titles}
      endpoint="/api/astrology/kundli-match"
      ctaLabel="Match Kundli"
      note="The Ashtakoota compares the bride’s chart with the groom’s, and several kootas are not symmetric, so the roles matter. Details are used for this calculation only and are not stored."
      Report={ResultReport}
      charts={r => r}
      tabTitle={r => `${points(r.total)} / 36`}
      announceResult={r => `Kundli Match complete: ${points(r.total)} of 36 Guna — ${r.band.label}.`}
    />
  )
}
