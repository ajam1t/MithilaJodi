'use client'

import dynamic from 'next/dynamic'
import type { NakshatraReading } from '@/lib/astrology/types'
import { SingleChartExperience, type SingleReportProps } from '../single/SingleChartExperience'
import { nakshatraOf, rashiOf } from '../kundli/format'

const NakshatraReport = dynamic(() => import('./NakshatraReport').then(m => m.NakshatraReport), {
  ssr: false,
  loading: () => <p className="text-center text-ink-soft py-10">Finding the nakshatra…</p>,
}) as React.ComponentType<SingleReportProps<NakshatraReading>>

export function NakshatraExperience() {
  return (
    <SingleChartExperience<NakshatraReading>
      endpoint="/api/astrology/nakshatra"
      ctaLabel="Find my nakshatra"
      Report={NakshatraReport}
      announceResult={r =>
        `Janma nakshatra: ${nakshatraOf(r.chart.moon.nakshatra).name}${r.chart.moon.pada ? `, pada ${r.chart.moon.pada}` : ''}, Moon in ${rashiOf(r.chart.moon.rashi).name}.`
      }
    />
  )
}
