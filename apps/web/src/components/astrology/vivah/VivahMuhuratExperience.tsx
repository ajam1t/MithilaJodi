'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import '@/styles/kundli.css'
import { fieldErrors, vivahMuhuratRequestSchema, type FieldErrors } from '@/lib/astrology/schema'
import type { BirthPlace, VivahMuhuratRequest, VivahMuhuratResult } from '@/lib/astrology/types'
import { RASHIS } from '@/lib/astrology/vedic/zodiac'
import { BirthPlaceSelector } from '../kundli/BirthPlaceSelector'
import { MuhuratResults } from './MuhuratResults'

const PERIODS = [
  { months: 1, label: '1 month' },
  { months: 3, label: '3 months' },
  { months: 6, label: '6 months' },
  { months: 12, label: '12 months' },
]

/**
 * Place, period and (optionally) the couple's Moon signs → every Vivah
 * Muhurat in that period. Opens on a server-computed list so dates show at once.
 */
export function VivahMuhuratExperience({ initial }: { initial: VivahMuhuratResult }) {
  const [place, setPlace] = useState<BirthPlace | null>({
    label: initial.place.label, latitude: initial.place.latitude, longitude: initial.place.longitude,
    timezone: initial.place.timezone, source: 'mithila-jodi',
  })
  const [from, setFrom] = useState(initial.range.from.slice(0, 7))
  const [months, setMonths] = useState(12)
  const [brideRashi, setBrideRashi] = useState<number | null>(null)
  const [groomRashi, setGroomRashi] = useState<number | null>(null)
  const [result, setResult] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')
  const resultsRef = useRef<HTMLDivElement>(null)

  async function run(e: React.FormEvent) {
    e.preventDefault()
    const body: VivahMuhuratRequest = { place: place as BirthPlace, from, months, brideRashi, groomRashi }
    const parsed = vivahMuhuratRequestSchema.safeParse(body)
    const errs = parsed.success ? {} : fieldErrors(parsed.error)
    if (!place) errs.place = 'Please choose the place of the wedding.'
    if (Object.keys(errs).length) {
      setErrors(errs)
      setBanner('Please check the highlighted details.')
      document.getElementById(errs.place ? 'vm-place' : 'vm-from')?.focus()
      return
    }
    setErrors({})
    setBanner(null)
    setBusy(true)
    setAnnounce('Finding muhurats…')
    try {
      const res = await fetch('/api/astrology/vivah-muhurat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json().catch(() => ({ ok: false, message: 'The server sent an unexpected reply.' }))
      if (!res.ok || !json.ok) {
        setBanner(json.message ?? 'We could not find the muhurats just now. Please try again.')
        if (json.fields) setErrors(json.fields)
        setAnnounce('')
        return
      }
      const r = json.result as VivahMuhuratResult
      setResult(r)
      setAnnounce(`Found ${r.days.length} dates with a muhurat.`)
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' })
        document.getElementById('kd-result-title')?.focus({ preventScroll: true })
      }, 0)
    } catch {
      setBanner('You seem to be offline, or the connection dropped. Please try again.')
      setAnnounce('')
    } finally {
      setBusy(false)
    }
  }

  const rashiSelect = (id: string, label: string, value: number | null, set: (v: number | null) => void) => (
    <div>
      <label className="field-label" htmlFor={id}>{label} <span className="font-normal text-ink-soft">(optional)</span></label>
      <select id={id} className="select kd-input" value={value ?? ''} onChange={e => set(e.target.value === '' ? null : Number(e.target.value))}>
        <option value="">Not given</option>
        {RASHIS.map((r, i) => <option key={r.slug} value={i}>{r.name} ({r.hi})</option>)}
      </select>
    </div>
  )

  return (
    <div>
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
      <form onSubmit={run} noValidate className="max-w-3xl mx-auto">
        {banner && (
          <div role="alert" className="mb-5 rounded-mj border border-error/30 bg-error-soft px-4 py-3 text-[14px] text-error-fg">{banner}</div>
        )}
        <fieldset className="kd-person kd-person-bride p-5 sm:p-6">
          <legend className="sr-only">Where and when</legend>
          <div className="space-y-4">
            <div>
              <label className="field-label" htmlFor="vm-place">Place of the wedding</label>
              <BirthPlaceSelector id="vm-place" value={place} onChange={setPlace} error={errors.place ?? errors['place.label']} />
            </div>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="vm-from">From</label>
                <input id="vm-from" type="month" className={`input kd-input ${errors.from ? 'input-error' : ''}`} value={from} min="2000-01" max="2099-12"
                  aria-invalid={!!errors.from} onChange={e => setFrom(e.target.value)} />
                {errors.from && <p className="field-error" role="alert">{errors.from}</p>}
              </div>
              <div>
                <label className="field-label" htmlFor="vm-months">For</label>
                <select id="vm-months" className="select kd-input" value={months} onChange={e => setMonths(Number(e.target.value))}>
                  {PERIODS.map(p => <option key={p.months} value={p.months}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <details className="rounded-mj-sm border border-gold/30 bg-paper px-4 py-3" open={brideRashi != null || groomRashi != null}>
              <summary className="cursor-pointer text-[14px] font-semibold text-maroon min-h-[32px] flex items-center">
                Personalise for the couple — Guru, Surya and Chandra bal
              </summary>
              <p className="mt-2 text-[13px] text-ink-soft leading-relaxed">
                With the bride’s and groom’s Moon signs (Janma rashi), each date shows whether Jupiter, the Sun and the Moon
                are traditionally favourable for them. Don’t know the Moon sign? <Link href="/astrology/rashi" className="text-maroon underline underline-offset-2">Find it with the Rashi tool</Link>.
              </p>
              <div className="mt-3 grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
                {rashiSelect('vm-bride', 'Bride’s Moon sign', brideRashi, setBrideRashi)}
                {rashiSelect('vm-groom', 'Groom’s Moon sign', groomRashi, setGroomRashi)}
              </div>
            </details>
          </div>
        </fieldset>
        <div className="mt-6 flex flex-col items-center gap-3">
          <button type="submit" className="kd-cta" disabled={busy}>{busy ? 'Reading the panchang…' : 'Find muhurats'}</button>
          <p className="text-[12px] text-paper-3/70">Free · No login · Nothing stored</p>
        </div>
      </form>

      <div ref={resultsRef} className="mt-10 rounded-mj-lg bg-paper text-ink p-4 sm:p-6 lg:p-8 scroll-mt-24" aria-busy={busy}>
        <MuhuratResults result={result} />
      </div>
    </div>
  )
}
