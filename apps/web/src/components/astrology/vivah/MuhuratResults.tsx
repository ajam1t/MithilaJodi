'use client'

import { useMemo, useState } from 'react'
import type { MuhuratBal, MuhuratDay, VivahMuhuratResult } from '@/lib/astrology/types'
import { RASHIS } from '@/lib/astrology/vedic/zodiac'
import { formatTime12 } from '../kundli/format'

const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const SHORT_MONTH = MONTH.map(m => m.slice(0, 3))
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function formatDay(iso: string) {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${SHORT_MONTH[m - 1]}`
}
const monthTitle = (ym: string) => `${MONTH[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`

const BAL_STYLE: Record<MuhuratBal, string> = {
  shubh: 'bg-success-soft text-success-fg border-success/30',
  pujya: 'bg-warning-soft text-warning-fg border-warning/30',
  ashubh: 'bg-error-soft text-error-fg border-error/30',
}
const BAL_WORD: Record<MuhuratBal, string> = { shubh: 'shubh', pujya: 'pujya — puja advised', ashubh: 'ashubh' }

function BalChip({ label, bal }: { label: string; bal: MuhuratBal }) {
  return <span className={`inline-flex rounded-pill border px-2 py-0.5 text-[11px] font-medium ${BAL_STYLE[bal]}`}>{label}: {BAL_WORD[bal]}</span>
}

const worstBal = (d: MuhuratDay): MuhuratBal | null => {
  const all = [d.guruBal, d.suryaBal, ...d.windows.flatMap(w => [w.chandraBal?.bride, w.chandraBal?.groom])].filter(Boolean) as MuhuratBal[]
  if (!all.length) return null
  return all.includes('ashubh') ? 'ashubh' : all.includes('pujya') ? 'pujya' : 'shubh'
}

export function MuhuratResults({ result }: { result: VivahMuhuratResult }) {
  const [showRikta, setShowRikta] = useState(false)
  const [hideAshubh, setHideAshubh] = useState(false)
  const couple = result.couple.brideRashi != null || result.couple.groomRashi != null

  const days = useMemo(() => result.days
    .map(d => ({ ...d, windows: showRikta ? d.windows : d.windows.filter(w => !w.rikta) }))
    .filter(d => d.windows.length && !(hideAshubh && worstBal(d) === 'ashubh')), [result, showRikta, hideAshubh])
  const riktaOnly = result.days.filter(d => d.windows.every(w => w.rikta)).length

  const byMonth = useMemo(() => {
    const map = new Map<string, typeof days>()
    for (const d of days) map.set(d.date.slice(0, 7), [...(map.get(d.date.slice(0, 7)) ?? []), d])
    return map
  }, [days])

  const months: string[] = []
  const [y0, m0] = result.range.from.split('-').map(Number)
  for (let i = 0; ; i++) {
    const d = new Date(Date.UTC(y0, m0 - 1 + i, 1))
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    if (ym > result.range.to.slice(0, 7)) break
    months.push(ym)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-terra">Shubh vivah dates · {result.place.label}</p>
          <h2 id="kd-result-title" tabIndex={-1} className="mt-1 font-serif text-maroon text-[28px] sm:text-[34px] leading-tight outline-none">
            {days.length} {days.length === 1 ? 'date' : 'dates'}, {formatDay(result.range.from)} {result.range.from.slice(0, 4)} – {formatDay(result.range.to)} {result.range.to.slice(0, 4)}
          </h2>
          {couple && (
            <p className="mt-1 text-[14px] text-ink-soft">
              {result.couple.brideRashi != null && <>Bride’s Moon sign {RASHIS[result.couple.brideRashi].name}</>}
              {result.couple.brideRashi != null && result.couple.groomRashi != null && ' · '}
              {result.couple.groomRashi != null && <>Groom’s Moon sign {RASHIS[result.couple.groomRashi].name}</>}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 text-[14px] text-ink">
          <label className="flex items-center gap-2 cursor-pointer min-h-[32px]">
            <input type="checkbox" className="h-[18px] w-[18px] accent-maroon" checked={showRikta} onChange={e => setShowRikta(e.target.checked)} />
            Also show Rikta tithi windows{riktaOnly ? ` (${riktaOnly} more ${riktaOnly === 1 ? 'date' : 'dates'})` : ''}
          </label>
          {couple && (
            <label className="flex items-center gap-2 cursor-pointer min-h-[32px]">
              <input type="checkbox" className="h-[18px] w-[18px] accent-maroon" checked={hideAshubh} onChange={e => setHideAshubh(e.target.checked)} />
              Hide dates with any ashubh bal
            </label>
          )}
        </div>
      </div>

      {result.closed.length > 0 && (
        <section aria-labelledby="vm-closed" className="rounded-mj border border-gold/30 bg-cream px-4 py-4 sm:px-5">
          <h3 id="vm-closed" className="text-[12px] uppercase tracking-[0.16em] text-terra font-semibold">When there are no muhurats, and why</h3>
          <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2 text-[14px] text-ink">
            {result.closed.map(c => (
              <li key={`${c.key}-${c.from}`} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-terra" aria-hidden="true" />
                <span><strong className="font-semibold">{formatDay(c.from)}{c.to !== c.from ? ` – ${formatDay(c.to)}` : ''}</strong> · {c.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {months.map(ym => {
        const list = byMonth.get(ym) ?? []
        return (
          <section key={ym} aria-labelledby={`vm-${ym}`}>
            <div className="flex items-baseline justify-between gap-3 border-b border-gold/30 pb-2 mb-3">
              <h3 id={`vm-${ym}`} className="font-serif text-maroon text-[22px]">{monthTitle(ym)}</h3>
              <span className="text-[13px] text-ink-soft">{list.length ? `${list.length} ${list.length === 1 ? 'date' : 'dates'}` : 'No muhurat'}</span>
            </div>
            {list.length > 0 && (
              <ol className="grid gap-3 md:grid-cols-2">
                {list.map(d => (
                  <li key={d.date} className="card p-4 flex gap-4 kd-avoid-break">
                    <div className="w-[64px] shrink-0 self-start text-center rounded-mj-sm bg-maroon text-cream py-2">
                      <p className="font-serif text-[28px] leading-none">{Number(d.date.slice(8))}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-gold-lt">{SHORT_MONTH[Number(d.date.slice(5, 7)) - 1]}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-ink">
                        {WEEKDAY[d.weekday]}
                        {d.preferredVara && <span className="ml-1.5 text-gold" title="A weekday panchangs prefer for marriage">✦</span>}
                        <span className="font-normal text-ink-soft"> · {d.lunarMonth}</span>
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {d.windows.map(w => (
                          <li key={w.start} className="text-[14px] text-ink leading-snug">
                            <span className="font-medium tabular-nums">
                              {formatTime12(w.startLocal)}{w.startDate !== d.date ? ` (${formatDay(w.startDate)})` : ''} – {formatTime12(w.endLocal)}
                              {w.endDate !== d.date ? ` (${formatDay(w.endDate)})` : ''}
                            </span>
                            <span className="block text-[13px] text-ink-soft">
                              {w.nakshatras.join(' → ')} · {w.tithis.join(' → ')}
                              {w.rikta && <span className="ml-1 text-warning-fg font-medium">· Rikta tithi</span>}
                            </span>
                            {w.chandraBal && (
                              <span className="mt-1 flex flex-wrap gap-1">
                                {w.chandraBal.bride && <BalChip label="Bride’s Chandra" bal={w.chandraBal.bride} />}
                                {w.chandraBal.groom && <BalChip label="Groom’s Chandra" bal={w.chandraBal.groom} />}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {(d.guruBal || d.suryaBal) && (
                        <p className="mt-2 flex flex-wrap gap-1">
                          {d.guruBal && <BalChip label="Bride’s Guru" bal={d.guruBal} />}
                          {d.suryaBal && <BalChip label="Groom’s Surya" bal={d.suryaBal} />}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )
      })}

      <p className="text-[13px] text-ink-soft leading-relaxed max-w-3xl">
        Times are local to {result.place.label} ({result.place.timezone === 'Asia/Kolkata' ? 'IST' : result.place.timezone}). A Vedic day runs
        from sunrise to sunrise, so a window after midnight is listed under the previous date. ✦ marks Monday,
        Wednesday, Thursday and Friday, which panchangs prefer. Month names are amanta (new moon to new moon); in the
        purnimanta reckoning, Krishna-paksha dates belong to the following month. Methodology v{result.methodologyVersion}.
      </p>
    </div>
  )
}
