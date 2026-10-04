'use client'

import dynamic from 'next/dynamic'
import type { MatchResult } from '@/lib/astrology/types'
import { PairChartExperience, type PairReportProps } from '../pair/PairChartExperience'
import { points } from './format'

// The report (charts, reveal, print view) loads only once there is a result.
const ResultReport = dynamic(() => import('./ResultReport').then(m => m.ResultReport), {
  ssr: false,
  loading: () => <p className="text-center text-ink-soft py-10">Preparing the report…</p>,
}) as React.ComponentType<PairReportProps<MatchResult>>

export function KundliMatchExperience() {
  return (
    <PairChartExperience<MatchResult>
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
