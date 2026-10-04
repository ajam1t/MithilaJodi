'use client'

import dynamic from 'next/dynamic'
import type { RashiReading } from '@/lib/astrology/types'
import { SingleChartExperience, type SingleReportProps } from '../single/SingleChartExperience'
import { rashiOf } from '../kundli/format'

const RashiReport = dynamic(() => import('./RashiReport').then(m => m.RashiReport), {
  ssr: false,
  loading: () => <p className="text-center text-ink-soft py-10">Finding the rashi…</p>,
}) as React.ComponentType<SingleReportProps<RashiReading>>

export function RashiExperience() {
  return (
    <SingleChartExperience<RashiReading>
      endpoint="/api/astrology/rashi"
      ctaLabel="Find my rashi"
      Report={RashiReport}
      announceResult={r => `Janma rashi: ${rashiOf(r.chart.moon.rashi).name} (${rashiOf(r.chart.moon.rashi).western}).`}
    />
  )
}
