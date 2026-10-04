'use client'

import { useState } from 'react'
import type { MoonSegmentChoice } from '@/lib/astrology/types'
import { formatDateLong, formatTime12, nakshatraOf, rashiOf } from './format'

type Choice = number | 'all'

export type ChooserEntry = { key: string; name: string; date: string; choices: MoonSegmentChoice[] }

type Props = {
  entries: ChooserEntry[]
  busy: boolean
  onSubmit: (picked: Record<string, Choice>) => void
  onBack: () => void
}

/**
 * Shown when a birth time is unknown and the Moon changed rashi or nakshatra
 * during that day. Asks instead of assuming a time.
 */
export function MoonWindowChooser({ entries, busy, onSubmit, onBack }: Props) {
  const [picked, setPicked] = useState<Record<string, Choice>>({})
  const ready = entries.every(e => picked[e.key] !== undefined)

  return (
    <div className="card p-5 sm:p-7 max-w-3xl mx-auto">
      <p className="eyebrow mb-2">One more detail</p>
      <h2 className="font-serif text-maroon text-[26px] leading-tight outline-none" tabIndex={-1} id="kd-choose-heading">
        When in the day was the birth?
      </h2>
      <p className="mt-3 text-[15px] text-ink-soft leading-relaxed">
        The Moon moves about 13° a day. On the date below it changed rashi or nakshatra, and the result depends on
        which side of that change the birth fell. Please choose the closest option — or see every possibility.
      </p>

      <div className="mt-6 space-y-7">
        {entries.map(({ key, name, date, choices: list }) => (
          <fieldset key={key}>
            <legend className="font-serif text-[19px] text-maroon mb-1">{name}</legend>
            <p className="text-[13px] text-ink-soft mb-3">Born on {formatDateLong(date)}</p>
            <div className="space-y-2">
              {list.map((c, i) => (
                <label key={c.index} className={`flex items-start gap-3 rounded-mj-sm border px-3.5 py-3 cursor-pointer transition-colors ${picked[key] === c.index ? 'border-maroon bg-paper-2' : 'border-gold/30 hover:border-gold'}`}>
                  <input type="radio" className="mt-1 accent-maroon h-[18px] w-[18px]" name={`moon-${key}`} checked={picked[key] === c.index} onChange={() => setPicked(p => ({ ...p, [key]: c.index }))} />
                  <span>
                    <span className="block text-[15px] text-ink">
                      {i === 0 ? `Before about ${formatTime12(c.toLocal)}` : i === list.length - 1 ? `After about ${formatTime12(c.fromLocal)}` : `Between about ${formatTime12(c.fromLocal)} and ${formatTime12(c.toLocal)}`}
                    </span>
                    <span className="block text-[13px] text-ink-soft">
                      Moon in {rashiOf(c.rashi).name}{c.nakshatraVaries ? '' : `, ${nakshatraOf(c.nakshatra).name} nakshatra`}
                    </span>
                  </span>
                </label>
              ))}
              <label className={`flex items-start gap-3 rounded-mj-sm border px-3.5 py-3 cursor-pointer transition-colors ${picked[key] === 'all' ? 'border-maroon bg-paper-2' : 'border-gold/30 hover:border-gold'}`}>
                <input type="radio" className="mt-1 accent-maroon h-[18px] w-[18px]" name={`moon-${key}`} checked={picked[key] === 'all'} onChange={() => setPicked(p => ({ ...p, [key]: 'all' }))} />
                <span>
                  <span className="block text-[15px] text-ink">I don’t know — show every possibility</span>
                  <span className="block text-[13px] text-ink-soft">You will see a separate result for each part of the day.</span>
                </span>
              </label>
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" className="kd-cta" disabled={!ready || busy} onClick={() => onSubmit(picked)}>
          {busy ? 'Calculating…' : 'Continue'}
        </button>
        <button type="button" className="btn-ghost" onClick={onBack}>Edit details</button>
      </div>
    </div>
  )
}
