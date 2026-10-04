'use client'

import type { BirthPlace, Role } from '@/lib/astrology/types'
import type { FieldErrors } from '@/lib/astrology/schema'
import { BirthPlaceSelector } from './BirthPlaceSelector'
import { ROLE_HI, ROLE_LABEL } from './format'

export type PersonDraft = {
  name: string
  dateOfBirth: string
  timeOfBirth: string
  timeUnknown: boolean
  place: BirthPlace | null
}

export const EMPTY_DRAFT: PersonDraft = { name: '', dateOfBirth: '', timeOfBirth: '', timeUnknown: false, place: null }

type Props = {
  role: Role
  draft: PersonDraft
  onChange: (patch: Partial<PersonDraft>) => void
  errors: FieldErrors
  maxDate: string
}

function errorFor(errors: FieldErrors, key: string): string | undefined {
  if (errors[key]) return errors[key]
  const nested = Object.keys(errors).find(k => k.startsWith(`${key}.`))
  return nested ? errors[nested] : undefined
}

export function BirthDetailsCard({ role, draft, onChange, errors, maxDate }: Props) {
  const e = {
    name: errorFor(errors, `${role}.name`),
    dob: errorFor(errors, `${role}.dateOfBirth`),
    tob: errorFor(errors, `${role}.timeOfBirth`),
    place: errorFor(errors, `${role}.place`),
  }
  const id = (f: string) => `${role}-${f}`
  const accent = role === 'bride' ? 'text-maroon' : 'text-gold'

  return (
    <fieldset className={`kd-person kd-person-${role} p-5 sm:p-6`}>
      <legend className="sr-only">{ROLE_LABEL[role]}’s birth details</legend>
      <div className="flex items-center justify-between gap-3 mb-5" aria-hidden="true">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-ink-soft">{role === 'bride' ? 'Person A' : 'Person B'}</p>
          <p className="font-serif text-[24px] text-maroon leading-tight">{ROLE_LABEL[role]}’s details</p>
        </div>
        <span className={`font-deva text-[30px] leading-none ${accent}`}>{ROLE_HI[role]}</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="field-label" htmlFor={id('name')}>Name</label>
          <input
            id={id('name')}
            className={`input kd-input ${e.name ? 'input-error' : ''}`}
            value={draft.name}
            maxLength={60}
            autoComplete="off"
            aria-invalid={!!e.name}
            aria-describedby={e.name ? id('name-error') : undefined}
            onChange={ev => onChange({ name: ev.target.value })}
            placeholder={role === 'bride' ? 'e.g. Priya' : 'e.g. Aditya'}
          />
          {e.name && <p id={id('name-error')} className="field-error" role="alert">{e.name}</p>}
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor={id('dob')}>Date of birth</label>
            <input
              id={id('dob')}
              type="date"
              className={`input kd-input ${e.dob ? 'input-error' : ''}`}
              value={draft.dateOfBirth}
              min="1900-01-01"
              max={maxDate}
              aria-invalid={!!e.dob}
              aria-describedby={e.dob ? id('dob-error') : undefined}
              onChange={ev => onChange({ dateOfBirth: ev.target.value })}
            />
            {e.dob && <p id={id('dob-error')} className="field-error" role="alert">{e.dob}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor={id('tob')}>Exact birth time</label>
            <input
              id={id('tob')}
              type="time"
              step={60}
              className={`input kd-input ${e.tob ? 'input-error' : ''} disabled:bg-paper-2 disabled:text-ink-soft`}
              value={draft.timeUnknown ? '' : draft.timeOfBirth}
              disabled={draft.timeUnknown}
              aria-invalid={!!e.tob}
              aria-describedby={[id('tob-hint'), e.tob ? id('tob-error') : null].filter(Boolean).join(' ')}
              onChange={ev => onChange({ timeOfBirth: ev.target.value })}
            />
            <p id={id('tob-hint')} className="field-hint">Local time at the birthplace.</p>
            {e.tob && <p id={id('tob-error')} className="field-error" role="alert">{e.tob}</p>}
          </div>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer select-none min-h-[32px]">
          <input
            type="checkbox"
            className="mt-1 h-[18px] w-[18px] accent-maroon"
            checked={draft.timeUnknown}
            onChange={ev => onChange({ timeUnknown: ev.target.checked, ...(ev.target.checked ? { timeOfBirth: '' } : {}) })}
          />
          <span className="text-[14px] text-ink">Birth time unknown</span>
        </label>
        {draft.timeUnknown && (
          <p className="rounded-mj-sm bg-info-soft text-info-fg text-[13px] leading-relaxed px-3 py-2.5">
            We can still find the Moon’s rashi and nakshatra — which is what the 36-Guna Ashtakoota uses — but not
            the Lagna, the houses or the Lagna-based Manglik check. If the Moon changed rashi or nakshatra on that
            date, we will ask roughly when the birth was rather than guess.
          </p>
        )}

        <div>
          <label className="field-label" htmlFor={id('place')}>Place of birth</label>
          <BirthPlaceSelector id={id('place')} value={draft.place} onChange={place => onChange({ place })} error={e.place} />
        </div>
      </div>
    </fieldset>
  )
}
