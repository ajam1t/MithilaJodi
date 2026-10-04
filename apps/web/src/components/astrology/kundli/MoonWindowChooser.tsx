'use client'

import { useState } from 'react'
import type { MoonSegmentChoice, Role } from '@/lib/astrology/types'
import { formatDateLong, formatTime12, nakshatraOf, rashiOf } from './format'

type Choice = number | 'all'

type Props = {
  choices: Partial<Record<Role, MoonSegmentChoice[]>>
  names: Record<Role, string>
  dates: Record<Role, string>
  busy: boolean
  onSubmit: (picked: Partial<Record<Role, Choice>>) => void
  onBack: () => void
}

/**
 * Shown when a birth time is unknown and the Moon changed rashi or nakshatra
 * during that day. Asks instead of assuming a time.
 */
export function MoonWindowChooser({ choices, names, dates, busy, onSubmit, onBack }: Props) {
  const roles = (['bride', 'groom'] as const).filter(r => choices[r])
  const [picked, setPicked] = useState<Partial<Record<Role, Choice>>>({})
  const ready = roles.every(r => picked[r] !== undefined)

  return (
    <div className="card p-5 sm:p-7 max-w-3xl mx-auto">
      <p className="eyebrow mb-2">One more detail</p>
      <h2 className="font-serif text-maroon text-[26px] leading-tight" tabIndex={-1} id="kd-choose-heading">
        When in the day was the birth?
      </h2>
      <p className="mt-3 text-[15px] text-ink-soft leading-relaxed">
        The Moon moves about 13° a day. On the date below it changed rashi or nakshatra, and the Guna score depends on
        which side of that change the birth fell. Please choose the closest option — or see every possibility.
      </p>

      <div className="mt-6 space-y-7">
        {roles.map(role => {
          const list = choices[role]!
          return (
            <fieldset key={role}>
              <legend className="font-serif text-[19px] text-maroon mb-1">{names[role]}</legend>
              <p className="text-[13px] text-ink-soft mb-3">Born on {formatDateLong(dates[role])}</p>
              <div className="space-y-2">
                {list.map(c => (
                  <label key={c.index} className={`flex items-start gap-3 rounded-mj-sm border px-3.5 py-3 cursor-pointer transition-colors ${picked[role] === c.index ? 'border-maroon bg-paper-2' : 'border-gold/30 hover:border-gold'}`}>
                    <input type="radio" className="mt-1 accent-maroon h-[18px] w-[18px]" name={`moon-${role}`} checked={picked[role] === c.index} onChange={() => setPicked(p => ({ ...p, [role]: c.index }))} />
                    <span>
                      <span className="block text-[15px] text-ink">
                        {c.index === 0 ? `Before about ${formatTime12(c.toLocal)}` : c.index === list.length - 1 ? `After about ${formatTime12(c.fromLocal)}` : `Between about ${formatTime12(c.fromLocal)} and ${formatTime12(c.toLocal)}`}
                      </span>
                      <span className="block text-[13px] text-ink-soft">
                        Moon in {rashiOf(c.rashi).name}, {nakshatraOf(c.nakshatra).name} nakshatra
                      </span>
                    </span>
                  </label>
                ))}
                <label className={`flex items-start gap-3 rounded-mj-sm border px-3.5 py-3 cursor-pointer transition-colors ${picked[role] === 'all' ? 'border-maroon bg-paper-2' : 'border-gold/30 hover:border-gold'}`}>
                  <input type="radio" className="mt-1 accent-maroon h-[18px] w-[18px]" name={`moon-${role}`} checked={picked[role] === 'all'} onChange={() => setPicked(p => ({ ...p, [role]: 'all' }))} />
                  <span>
                    <span className="block text-[15px] text-ink">I don’t know — show every possibility</span>
                    <span className="block text-[13px] text-ink-soft">You will see a separate result for each part of the day.</span>
                  </span>
                </label>
              </div>
            </fieldset>
          )
        })}
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" className="kd-cta" disabled={!ready || busy} onClick={() => onSubmit(picked)}>
          {busy ? 'Calculating…' : 'Continue to the match'}
        </button>
        <button type="button" className="btn-ghost" onClick={onBack}>Edit details</button>
      </div>
    </div>
  )
}
