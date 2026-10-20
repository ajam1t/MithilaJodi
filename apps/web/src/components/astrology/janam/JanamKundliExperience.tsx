'use client'

import dynamic from 'next/dynamic'
import type { JanamKundliResult } from '@/lib/astrology/types'
import { janamScene } from '../ceremony/scenes'
import { SingleChartExperience, type SingleReportProps } from '../single/SingleChartExperience'
import { nakshatraOf, rashiOf } from '../kundli/format'

const JanamReport = dynamic(() => import('./JanamReport').then(m => m.JanamReport), {
  ssr: false,
  loading: () => <p className="text-center text-ink-soft py-10">Preparing the Kundli…</p>,
}) as React.ComponentType<SingleReportProps<JanamKundliResult>>

export function JanamKundliExperience() {
  return (
    <SingleChartExperience<JanamKundliResult>
      ceremony={{ scene: janamScene, waiting: { hi: 'जन्म के समय का आकाश…', en: 'Turning the sky back to the moment of birth…' } }}
      endpoint="/api/astrology/janam-kundli"
      ctaLabel="Make my Janam Kundli"
      Report={JanamReport}
      announceResult={r =>
        `Janam Kundli ready: ${r.chart.lagna ? `Lagna ${rashiOf(r.chart.lagna.rashi).name}, ` : ''}Moon in ${rashiOf(r.chart.moon.rashi).name}, ${nakshatraOf(r.chart.moon.nakshatra).name} nakshatra.`
      }
    />
  )
}
