'use client'

import dynamic from 'next/dynamic'
import type { ManglikReading } from '@/lib/astrology/types'
import { SingleChartExperience, type SingleReportProps } from '../single/SingleChartExperience'

const ManglikReport = dynamic(() => import('./ManglikReport').then(m => m.ManglikReport), {
  ssr: false,
  loading: () => <p className="text-center text-ink-soft py-10">Checking Mars…</p>,
}) as React.ComponentType<SingleReportProps<ManglikReading>>

export function ManglikExperience() {
  return (
    <SingleChartExperience<ManglikReading>
      endpoint="/api/astrology/manglik"
      ctaLabel="Check Manglik"
      Report={ManglikReport}
      announceResult={r => `Manglik check: ${r.manglik.label}.`}
    />
  )
}
