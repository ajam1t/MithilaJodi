'use client'

import { useState } from 'react'
import { TimeSeriesChart } from '@/components/admin/TimeSeriesChart'
import { fmt } from '@/components/admin/ui'

/**
 * One chart, several daily series — switch with the tabs. Above the chart:
 * the 30-day total, the busiest day and the daily average, all from the
 * same series the chart draws.
 */
export type Trend = { key: string; label: string; points: Array<{ day: string; n: number }> }

const dayLabel = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export function TrendDeck({ trends }: { trends: Trend[] }) {
  const [k, setK] = useState(trends[0]?.key)
  const t = trends.find(x => x.key === k) ?? trends[0]
  if (!t) return null
  const total = t.points.reduce((a, p) => a + p.n, 0)
  const peak = t.points.reduce<{ day: string; n: number } | null>((a, p) => (!a || p.n > a.n ? p : a), null)
  const avg = t.points.length ? total / t.points.length : null

  return (
    <>
      <div className="acx-tabs mb-4" role="tablist" aria-label="Series">
        {trends.map(x => (
          <button key={x.key} type="button" role="tab" aria-selected={x.key === t.key} onClick={() => setK(x.key)}>{x.label}</button>
        ))}
      </div>
      <dl className="acx-readout">
        <div><dt>30-day total</dt><dd>{fmt(total)}</dd></div>
        <div><dt>Busiest day</dt><dd>{peak && peak.n > 0 ? <>{fmt(peak.n)} <span className="text-[12px] font-normal text-ink-soft">{dayLabel(peak.day)}</span></> : '—'}</dd></div>
        <div><dt>Per day</dt><dd>{fmt(avg, 1)}</dd></div>
      </dl>
      <TimeSeriesChart key={t.key} title={`${t.label} per day`} series={[{ key: t.key, label: t.label, points: t.points }]} />
    </>
  )
}
