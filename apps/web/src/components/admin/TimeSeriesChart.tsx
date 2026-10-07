'use client'

import { useMemo, useState } from 'react'

/*
 * Daily time series for the admin console.
 *  - columns (one series, or two stacked with a 2px surface gap) or a 2px line
 *  - one y axis with clean ticks; recessive hairline grid
 *  - hover/touch a day to read every series for that day (crosshair column)
 *  - "View as table" for keyboard and screen-reader users — the tooltip never
 *    gates a value
 * Colours: the validated pair #B3424F / #A87D24 (light surface). Text never
 * wears a series colour.
 */

export type Series = { key: string; label: string; points: Array<{ day: string; n: number }> }

const COLORS = ['#B3424F', '#A87D24']
const H = 180

function niceMax(v: number): number {
  if (v <= 4) return 4
  const p = 10 ** Math.floor(Math.log10(v))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p
  return 10 * p
}

const dayLabel = (d: string, long = false) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-IN', long ? { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' })

export function TimeSeriesChart({ series, kind = 'columns', title, unit = '' }: {
  series: Series[]
  kind?: 'columns' | 'line'
  title: string
  unit?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  const days = useMemo(() => series[0]?.points.map(p => p.day) ?? [], [series])
  const stacked = kind === 'columns' && series.length > 1

  const max = useMemo(() => {
    let m = 0
    days.forEach((_, i) => {
      const vals = series.map(s => s.points[i]?.n ?? 0)
      m = Math.max(m, stacked ? vals.reduce((a, b) => a + b, 0) : Math.max(...vals))
    })
    return niceMax(m)
  }, [series, days, stacked])

  const total = series.reduce((a, s) => a + s.points.reduce((b, p) => b + p.n, 0), 0)
  if (days.length === 0) return null

  const n = days.length
  const slot = 100 / n
  const barW = Math.min(slot * 0.7, 2.6) // % of width; capped so bars stay thin
  const ticks = [0, max / 2, max]
  const y = (v: number) => H - (v / max) * H

  return (
    <figure className="m-0">
      <figcaption className="sr-only">{title}</figcaption>
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-soft" aria-label="Legend">
          {series.map((s, i) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i] }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      {!table ? (
        <div className="relative pl-9">
          {/* y axis labels */}
          {ticks.map(t => (
            <span key={t} className="absolute left-0 -translate-y-1/2 text-[11px] tabular-nums text-ink-soft" style={{ top: y(t) }}>
              {t.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
            </span>
          ))}
          <div className="relative" style={{ height: H }} onMouseLeave={() => setHover(null)}>
            <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
              {ticks.map(t => <line key={t} x1="0" x2="100" y1={y(t)} y2={y(t)} stroke="#EFE9DF" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
              {hover !== null && <rect x={hover * slot} y="0" width={slot} height={H} fill="#F5F0E7" />}
              {kind === 'columns' && days.map((_, i) => {
                let base = H
                return series.map((s, si) => {
                  const v = s.points[i]?.n ?? 0
                  if (v <= 0) return null
                  const h = (v / max) * H
                  const top = base - h
                  const rect = (
                    <rect key={`${s.key}-${i}`} x={i * slot + (slot - barW) / 2} y={top} width={barW} height={Math.max(h, 0.5)} fill={COLORS[si]} />
                  )
                  base = top - (stacked ? 2 : 0) // 2px surface gap between stacked segments
                  return rect
                })
              })}
              {kind === 'line' && series.map((s, si) => (
                <polyline key={s.key} fill="none" stroke={COLORS[si]} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"
                  points={s.points.map((p, i) => `${i * slot + slot / 2},${y(p.n)}`).join(' ')} />
              ))}
            </svg>
            {/* hit targets: one per day, wider than the mark */}
            <div className="absolute inset-0 flex">
              {days.map((d, i) => (
                <div key={d} className="h-full flex-1" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
              ))}
            </div>
            {hover !== null && (
              <div
                className="pointer-events-none absolute top-1 z-10 min-w-[140px] rounded-lg border border-[#E8E1D5] bg-white px-3 py-2 text-[12px] shadow-[0_8px_24px_-12px_rgba(43,33,28,0.35)]"
                style={hover / n > 0.6 ? { right: `${100 - hover * slot}%` } : { left: `${(hover + 1) * slot}%` }}
              >
                <p className="mb-1 text-ink-soft">{dayLabel(days[hover], true)}</p>
                {series.map((s, si) => (
                  <p key={s.key} className="flex items-center gap-2">
                    <span className="inline-block h-0.5 w-3 rounded" style={{ background: COLORS[si] }} aria-hidden="true" />
                    <span className="font-semibold tabular-nums text-ink">{(s.points[hover]?.n ?? 0).toLocaleString('en-IN')}{unit}</span>
                    <span className="text-ink-soft">{s.label}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-ink-soft">
            <span>{dayLabel(days[0])}</span>
            {n > 6 && <span>{dayLabel(days[Math.floor(n / 2)])}</span>}
            <span>{dayLabel(days[n - 1])}</span>
          </div>
        </div>
      ) : (
        <div className="max-h-72 overflow-auto rounded-lg border border-[#EFE9DF]">
          <table className="w-full text-[12.5px]">
            <thead className="sticky top-0 bg-[#FAF7F2]">
              <tr><th className="px-3 py-1.5 text-left font-semibold">Day</th>{series.map(s => <th key={s.key} className="px-3 py-1.5 text-right font-semibold">{s.label}</th>)}</tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d, ri) => {
                const i = n - 1 - ri
                return <tr key={d} className="border-t border-[#F3EEE6]"><td className="px-3 py-1.5">{dayLabel(d, true)}</td>{series.map(s => <td key={s.key} className="px-3 py-1.5 text-right tabular-nums">{(s.points[i]?.n ?? 0).toLocaleString('en-IN')}</td>)}</tr>
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-[11.5px] text-ink-soft">
        <span>{total === 0 ? 'No activity in this period yet.' : `Total ${total.toLocaleString('en-IN')}${unit} over ${n} days`}</span>
        <button type="button" onClick={() => setTable(t => !t)} className="font-medium text-ink underline-offset-2 hover:underline">
          {table ? 'View as chart' : 'View as table'}
        </button>
      </div>
    </figure>
  )
}
