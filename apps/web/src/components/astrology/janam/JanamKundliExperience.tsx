'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import '@/styles/kundli.css'
import { fieldErrors, janamKundliRequestSchema, type FieldErrors } from '@/lib/astrology/schema'
import type { JanamKundliResponse, MoonSegmentChoice, PersonInput } from '@/lib/astrology/types'
import { BirthDetailsCard, EMPTY_DRAFT, type PersonDraft } from '../kundli/BirthDetailsCard'
import { MoonWindowChooser } from '../kundli/MoonWindowChooser'
import { nakshatraOf, rashiOf } from '../kundli/format'

const JanamReport = dynamic(() => import('./JanamReport').then(m => m.JanamReport), {
  ssr: false,
  loading: () => <p className="text-center text-ink-soft py-10">Preparing the Kundli…</p>,
})

type Phase = 'form' | 'loading' | 'choose' | 'done'

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function JanamKundliExperience() {
  const [draft, setDraft] = useState<PersonDraft>(EMPTY_DRAFT)
  const [segment, setSegment] = useState<number | 'all' | undefined>(undefined)
  const [phase, setPhase] = useState<Phase>('form')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [choices, setChoices] = useState<MoonSegmentChoice[]>([])
  const [response, setResponse] = useState<JanamKundliResponse | null>(null)
  const [person, setPerson] = useState<PersonInput | null>(null)
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [announce, setAnnounce] = useState('')
  const [maxDate, setMaxDate] = useState('2100-12-31')
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMaxDate(todayIso()), [])

  useEffect(() => {
    if (phase !== 'choose' && phase !== 'done') return
    const id = phase === 'choose' ? 'kd-choose-heading' : 'kd-result-title'
    let tries = 0
    const timer = setInterval(() => {
      const el = document.getElementById(id)
      if (el || ++tries > 40) {
        clearInterval(timer)
        topRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' })
        el?.focus({ preventScroll: true })
      }
    }, 50)
    return () => clearInterval(timer)
  }, [phase, response])

  const update = (patch: Partial<PersonDraft>) => {
    setDraft(d => ({ ...d, ...patch }))
    if ('dateOfBirth' in patch || 'timeUnknown' in patch || 'place' in patch) setSegment(undefined)
    setErrors({})
  }

  const focusFirstError = (errs: FieldErrors) => {
    const first = Object.keys(errs)[0]
    if (!first) return
    const map: Record<string, string> = { name: 'name', dateOfBirth: 'dob', timeOfBirth: 'tob', place: 'place' }
    const el = document.getElementById(`person-${map[first.split('.')[1]] ?? 'name'}`)
    el?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center' })
    el?.focus({ preventScroll: true })
  }

  async function run(seg: number | 'all' | undefined) {
    const input: PersonInput = {
      name: draft.name.trim(),
      dateOfBirth: draft.dateOfBirth,
      timeOfBirth: draft.timeUnknown ? null : draft.timeOfBirth,
      place: draft.place as PersonInput['place'],
      ...(draft.timeUnknown && seg !== undefined ? { moonSegment: seg } : {}),
    }
    const parsed = janamKundliRequestSchema.safeParse({ person: input })
    const errs: FieldErrors = parsed.success ? {} : fieldErrors(parsed.error)
    if (!draft.timeUnknown && !draft.timeOfBirth) errs['person.timeOfBirth'] = 'Please enter the birth time, or tick “Birth time unknown”.'
    if (!draft.place) errs['person.place'] = 'Please choose the place of birth.'
    if (input.dateOfBirth > maxDate) errs['person.dateOfBirth'] = 'The date of birth cannot be in the future.'
    if (Object.keys(errs).length) {
      setErrors(errs)
      setPhase('form')
      setBanner('Please check the highlighted details.')
      setTimeout(() => focusFirstError(errs), 0)
      return
    }

    setBanner(null)
    setPhase('loading')
    setAnnounce('Calculating the birth chart…')
    try {
      const res = await fetch('/api/astrology/janam-kundli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person: input }),
      })
      const json = await res.json().catch(() => ({ ok: false, message: 'The server sent an unexpected reply.' }))
      if (!res.ok || !json.ok) {
        setPhase('form')
        setBanner(json.message ?? 'We could not complete the calculation. Please try again.')
        if (json.fields) { setErrors(json.fields); setTimeout(() => focusFirstError(json.fields), 0) }
        setAnnounce('')
        return
      }
      const body = json as JanamKundliResponse & { ok: true }
      if (body.kind === 'needs_moon_choice') {
        setChoices(body.choices)
        setPhase('choose')
        setAnnounce('One more question: when in the day was the birth?')
        return
      }
      setPerson(input)
      setResponse(body)
      setScenarioIndex(0)
      setPhase('done')
      const r = body.kind === 'result' ? body.result : body.scenarios[0].result
      setAnnounce(
        body.kind === 'result'
          ? `Janam Kundli ready: ${r.chart.lagna ? `Lagna ${rashiOf(r.chart.lagna.rashi).name}, ` : ''}Moon in ${rashiOf(r.chart.moon.rashi).name}, ${nakshatraOf(r.chart.moon.nakshatra).name} nakshatra.`
          : `Janam Kundli ready with ${body.scenarios.length} possibilities, because the birth time is unknown.`,
      )
    } catch {
      setPhase('form')
      setBanner('You seem to be offline, or the connection dropped. Your details are still here — please try again.')
      setAnnounce('')
    }
  }

  const reset = () => {
    setDraft(EMPTY_DRAFT)
    setSegment(undefined)
    setResponse(null)
    setErrors({})
    setBanner(null)
    setPhase('form')
    setTimeout(() => { topRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior }); document.getElementById('person-name')?.focus() }, 0)
  }
  const backToForm = () => { setPhase('form'); setResponse(null) }

  const active = useMemo(() => {
    if (!response) return null
    if (response.kind === 'result') return { result: response.result, key: 'single' }
    if (response.kind === 'scenarios') {
      const s = response.scenarios[Math.min(scenarioIndex, response.scenarios.length - 1)]
      return { result: s.result, key: `seg-${s.segment}` }
    }
    return null
  }, [response, scenarioIndex])

  return (
    <div ref={topRef} className="scroll-mt-24">
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>

      {(phase === 'form' || phase === 'loading') && (
        <form onSubmit={e => { e.preventDefault(); void run(segment) }} noValidate className="max-w-2xl mx-auto">
          {banner && (
            <div role="alert" className="mb-5 rounded-mj border border-error/30 bg-error-soft px-4 py-3 text-[14px] text-error-fg flex flex-wrap items-center justify-between gap-3">
              <span>{banner}</span>
              {!Object.keys(errors).length && <button type="submit" className="btn-ghost btn-sm">Try again</button>}
            </div>
          )}
          <BirthDetailsCard role="native" draft={draft} onChange={update} errors={errors} maxDate={maxDate} />
          <p className="mt-4 text-[13px] text-paper-3/80 text-center">Details are used for this calculation only and are not stored.</p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <button type="submit" className="kd-cta" disabled={phase === 'loading'}>
              {phase === 'loading' ? 'Calculating planetary positions…' : 'Make my Janam Kundli'}
            </button>
            <p className="text-[12px] text-paper-3/70">Free · No login · Calculated on our server in under a second</p>
          </div>
        </form>
      )}

      {phase === 'choose' && (
        <MoonWindowChooser
          entries={[{ key: 'person', name: draft.name.trim() || 'Birth details', date: draft.dateOfBirth, choices }]}
          busy={false}
          onSubmit={picked => { setSegment(picked.person); void run(picked.person) }}
          onBack={backToForm}
        />
      )}

      {phase === 'done' && active && person && (
        <div className="rounded-mj-lg bg-paper text-ink p-3 sm:p-6 lg:p-8">
          {response?.kind === 'scenarios' && (
            <div className="mb-6 rounded-mj border border-gold/40 bg-cream p-4 sm:p-5">
              <p className="text-[12px] uppercase tracking-[0.16em] text-terra font-semibold">This chart depends on the birth time</p>
              <p className="mt-1 text-[14px] text-ink-soft">Choose the part of the day to see its chart.</p>
              <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Possible charts">
                {response.scenarios.map((s, i) => {
                  const w = s.result.chart.moonWindow
                  return (
                    <button key={i} type="button" role="tab" aria-selected={i === scenarioIndex} onClick={() => setScenarioIndex(i)}
                      className={`rounded-mj-sm border px-3 py-2 text-left min-h-[44px] ${i === scenarioIndex ? 'border-maroon bg-maroon text-cream' : 'border-gold/40 bg-white text-ink hover:border-gold'}`}>
                      <span className="block font-serif text-[16px] leading-tight">{rashiOf(s.result.chart.moon.rashi).name} · {nakshatraOf(s.result.chart.moon.nakshatra).name}</span>
                      {w && <span className="block text-[12px] opacity-80">{w.fromLocal}–{w.toLocal}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <JanamReport result={active.result} person={person} scenarioKey={active.key} onEdit={backToForm} onNew={reset} />
        </div>
      )}
    </div>
  )
}
