'use client'

import dynamic from 'next/dynamic'
import type { BabyNamesReading } from '@/lib/astrology/types'
import { SingleChartExperience, type SingleReportProps } from '../single/SingleChartExperience'

const BabyNamesReport = dynamic(() => import('./BabyNamesReport').then(m => m.BabyNamesReport), {
  ssr: false,
  loading: () => <p className="text-center text-ink-soft py-10">Finding the syllable…</p>,
}) as React.ComponentType<SingleReportProps<BabyNamesReading>>

export function BabyNamesExperience() {
  return (
    <SingleChartExperience<BabyNamesReading>
      endpoint="/api/astrology/baby-names"
      ctaLabel="Find the name syllable"
      Report={BabyNamesReport}
      nameField={{ label: 'Child’s name (or “Baby”)', placeholder: 'Baby', initial: 'Baby' }}
      announceResult={r =>
        r.candidates.length === 1
          ? `Name syllable: ${r.candidates[0].en}, from pada ${r.candidates[0].pada}.`
          : `Possible name syllables: ${r.candidates.map(c => c.en).join(', ')}.`
      }
    />
  )
}
