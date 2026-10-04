'use client'

import dynamic from 'next/dynamic'
import type { CompatibilityResult } from '@/lib/astrology/types'
import { PairChartExperience, type PairReportProps } from '../pair/PairChartExperience'
import { points } from '../kundli/format'

const CompatibilityReport = dynamic(() => import('./CompatibilityReport').then(m => m.CompatibilityReport), {
  ssr: false,
  loading: () => <p className="text-center text-ink-soft py-10">Preparing the report…</p>,
}) as React.ComponentType<PairReportProps<CompatibilityResult>>

export function CompatibilityExperience() {
  return (
    <PairChartExperience<CompatibilityResult>
      endpoint="/api/astrology/compatibility"
      ctaLabel="Compare charts"
      note="Bride and groom are asked for separately because several kootas are not symmetric. Details are used for this calculation only and are not stored."
      Report={CompatibilityReport}
      charts={r => r.match}
      tabTitle={r => `${points(r.match.total)} / 36`}
      announceResult={r => `Compatibility complete: ${points(r.match.total)} of 36 Guna — ${r.match.band.label}, with ${r.comparison.contacts.length} cross-chart contacts.`}
    />
  )
}
