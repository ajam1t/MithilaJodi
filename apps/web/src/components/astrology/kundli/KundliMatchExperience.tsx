'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import '@/styles/kundli.css'
import { fieldErrors, kundliMatchRequestSchema, type FieldErrors } from '@/lib/astrology/schema'
import type { KundliMatchRequest, KundliMatchResponse, MoonSegmentChoice, PersonInput, Role } from '@/lib/astrology/types'
import { BirthDetailsCard, EMPTY_DRAFT, type PersonDraft } from './BirthDetailsCard'
import { MoonWindowChooser } from './MoonWindowChooser'
import { points } from './format'

// The report (charts, reveal, print view) loads only once there is a result.
const ResultReport = dynamic(() => import('./ResultReport').then(m => m.ResultReport), {
  ssr: false,
  loading: () => <p className="text-center text-ink-soft py-10">Preparing the report…</p>,
})

type Phase = 'form' | 'loading' | 'choose' | 'done'
type Segments = Partial<Record<Role, number | 'all'>>
type Scenarios = Extract<KundliMatchResponse, { kind: 'scenarios' }>['scenarios']

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toInput(d: PersonDraft, moonSegment?: number | 'all'): PersonInput {
  return {
    name: d.name.trim(),
    dateOfBirth: d.dateOfBirth,
    timeOfBirth: d.timeUnknown ? null : d.timeOfBirth,
    place: d.place as PersonInput['place'],
    ...(d.timeUnknown && moonSegment !== undefined ? { moonSegment } : {}),
  }
}

export function KundliMatchExperience() {
  const [drafts, setDrafts] = useState<Record<Role, PersonDraft>>({ bride: EMPTY_DRAFT, groom: EMPTY_DRAFT })
  const [phase, setPhase] = useState<Phase>('form')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [choices, setChoices] = useState<Partial<Record<Role, MoonSegmentChoice[]>>>({})
  const [segments, setSegments] = useState<Segments>({})
  const [response, setResponse] = useState<KundliMatchResponse | null>(null)
  const [lastRequest, setLastRequest] = useState<KundliMatchRequest | null>(null)
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [announce, setAnnounce] = useState('')
  const [maxDate, setMaxDate] = useState('2100-12-31')
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMaxDate(todayIso()), [])

  // Move focus to the new content once React has rendered it. The report is
  // code-split, so its heading can arrive a moment after the phase changes.
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

  const update = (role: Role) => (patch: Partial<PersonDraft>) => {
    setDrafts(d => ({ ...d, [role]: { ...d[role], ...patch } }))
    // A changed date or time invalidates any earlier "which part of the day" answer.
    if ('dateOfBirth' in patch || 'timeUnknown' in patch || 'place' in patch) setSegments(s => ({ ...s, [role]: undefined }))
    setErrors(e => {
      const next = { ...e }
      for (const k of Object.keys(next)) if (k.startsWith(`${role}.`)) delete next[k]
      return next
    })
  }

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' })

  const focusFirstError = (errs: FieldErrors) => {
    const first = Object.keys(errs)[0]
    if (!first) return
    const [role, field] = first.split('.')
    const map: Record<string, string> = { name: 'name', dateOfBirth: 'dob', timeOfBirth: 'tob', place: 'place' }
    const el = document.getElementById(`${role}-${map[field] ?? 'name'}`)
    el?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center' })
    el?.focus({ preventScroll: true })
  }

  const run = useCallback(async (segs: Segments) => {
    const missingTime: FieldErrors = {}
    for (const role of ['bride', 'groom'] as const) {
      const d = drafts[role]
      if (!d.timeUnknown && !d.timeOfBirth) missingTime[`${role}.timeOfBirth`] = 'Please enter the birth time, or tick “Birth time unknown”.'
      if (!d.place) missingTime[`${role}.place`] = 'Please choose the place of birth.'
    }
    const req: KundliMatchRequest = { bride: toInput(drafts.bride, segs.bride), groom: toInput(drafts.groom, segs.groom) }
    const parsed = kundliMatchRequestSchema.safeParse(req)
    const errs = { ...(parsed.success ? {} : fieldErrors(parsed.error)), ...missingTime }
    if (req.bride.dateOfBirth > maxDate) errs['bride.dateOfBirth'] = 'The date of birth cannot be in the future.'
    if (req.groom.dateOfBirth > maxDate) errs['groom.dateOfBirth'] = 'The date of birth cannot be in the future.'
    if (Object.keys(errs).length) {
      setErrors(errs)
      setPhase('form')
      setBanner('Please check the highlighted details.')
      setTimeout(() => focusFirstError(errs), 0)
      return
    }

    setBanner(null)
    setErrors({})
    setPhase('loading')
    setAnnounce('Calculating both birth charts…')
    try {
      const res = await fetch('/api/astrology/kundli-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      const json = await res.json().catch(() => ({ ok: false, message: 'The server sent an unexpected reply.' }))
      if (!res.ok || !json.ok) {
        setPhase('form')
        setBanner(json.message ?? 'We could not complete the calculation. Please try again.')
        if (json.fields) { setErrors(json.fields); setTimeout(() => focusFirstError(json.fields), 0) }
        else setTimeout(scrollTop, 0)
        setAnnounce('')
        return
      }
      const body = json as KundliMatchResponse & { ok: true }
      if (body.kind === 'needs_moon_choice') {
        setChoices(body.choices)
        setPhase('choose')
        setAnnounce('One more question: when in the day was the birth?')
        return
      }
      setLastRequest(req)
      setResponse(body)
      setScenarioIndex(0)
      setPhase('done')
      const r = body.kind === 'result' ? body.result : body.scenarios[0].result
      setAnnounce(
        body.kind === 'result'
          ? `Kundli Match complete: ${points(r.total)} of 36 Guna — ${r.band.label}.`
          : `Kundli Match complete with ${body.scenarios.length} possible results, because a birth time is unknown.`,
      )
    } catch {
      setPhase('form')
      setBanner('You seem to be offline, or the connection dropped. Your details are still here — please try again.')
      setAnnounce('')
    }
  }, [drafts, maxDate])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void run(segments)
  }

  const onChoose = (picked: Partial<Record<Role, number | 'all'>>) => {
    const next = { ...segments, ...picked }
    setSegments(next)
    void run(next)
  }

  const backToForm = () => {
    setPhase('form')
    setResponse(null)
    setTimeout(scrollTop, 0)
  }

  const reset = () => {
    setDrafts({ bride: EMPTY_DRAFT, groom: EMPTY_DRAFT })
    setSegments({})
    setResponse(null)
    setErrors({})
    setBanner(null)
    setPhase('form')
    setTimeout(() => { scrollTop(); document.getElementById('bride-name')?.focus() }, 0)
  }

  const scenarios: Scenarios | null = response?.kind === 'scenarios' ? response.scenarios : null
  const active = useMemo(() => {
    if (!response) return null
    if (response.kind === 'result') return { result: response.result, scenario: undefined }
    if (response.kind === 'scenarios') {
      const s = response.scenarios[Math.min(scenarioIndex, response.scenarios.length - 1)]
      return { result: s.result, scenario: { brideSegment: s.brideSegment, groomSegment: s.groomSegment } }
    }
    return null
  }, [response, scenarioIndex])

  const names = { bride: drafts.bride.name.trim() || 'Bride', groom: drafts.groom.name.trim() || 'Groom' }

  return (
    <div ref={topRef} className="scroll-mt-24">
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>

      {(phase === 'form' || phase === 'loading') && (
        <form onSubmit={onSubmit} noValidate aria-describedby="kd-form-intro">
          <p id="kd-form-intro" className="sr-only">Enter the bride’s and the groom’s birth details. Fields are required unless marked otherwise.</p>
          {banner && (
            <div role="alert" className="mb-5 rounded-mj border border-error/30 bg-error-soft px-4 py-3 text-[14px] text-error-fg flex flex-wrap items-center justify-between gap-3">
              <span>{banner}</span>
              {!Object.keys(errors).length && <button type="submit" className="btn-ghost btn-sm">Try again</button>}
            </div>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            <BirthDetailsCard role="bride" draft={drafts.bride} onChange={update('bride')} errors={errors} maxDate={maxDate} />
            <BirthDetailsCard role="groom" draft={drafts.groom} onChange={update('groom')} errors={errors} maxDate={maxDate} />
          </div>
          <p className="mt-4 text-[13px] text-paper-3/80 text-center max-w-2xl mx-auto">
            The Ashtakoota compares the bride’s chart with the groom’s, and several kootas are not symmetric, so the
            roles matter. Details are used for this calculation only and are not stored.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <button type="submit" className="kd-cta" disabled={phase === 'loading'} aria-describedby="kd-cta-note">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="8" cy="12" r="6" /><circle cx="16" cy="12" r="6" />
              </svg>
              {phase === 'loading' ? 'Calculating planetary positions…' : 'Match Kundli'}
            </button>
            <p id="kd-cta-note" className="text-[12px] text-paper-3/70">Free · No login · Calculated on our server in under a second</p>
          </div>
        </form>
      )}

      {phase === 'choose' && (
        <MoonWindowChooser
          choices={choices}
          names={names}
          dates={{ bride: drafts.bride.dateOfBirth, groom: drafts.groom.dateOfBirth }}
          busy={false}
          onSubmit={onChoose}
          onBack={backToForm}
        />
      )}

      {phase === 'done' && active && lastRequest && (
        <div className="rounded-mj-lg bg-paper p-3 sm:p-6 lg:p-8">
          {scenarios && (
            <div className="mb-6 rounded-mj border border-gold/40 bg-cream p-4 sm:p-5">
              <p className="text-[12px] uppercase tracking-[0.16em] text-terra font-semibold">This result depends on the birth time</p>
              <p className="mt-1 text-[14px] text-ink-soft">Choose a possibility to see its full report.</p>
              <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Possible results">
                {scenarios.map((s, i) => {
                  const r = s.result
                  const parts: string[] = []
                  if (s.brideSegment != null && r.bride.moonWindow) parts.push(`${names.bride} ${r.bride.moonWindow.fromLocal}–${r.bride.moonWindow.toLocal}`)
                  if (s.groomSegment != null && r.groom.moonWindow) parts.push(`${names.groom} ${r.groom.moonWindow.fromLocal}–${r.groom.moonWindow.toLocal}`)
                  return (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === scenarioIndex}
                      className={`rounded-mj-sm border px-3 py-2 text-left min-h-[44px] ${i === scenarioIndex ? 'border-maroon bg-maroon text-cream' : 'border-gold/40 bg-white text-ink hover:border-gold'}`}
                      onClick={() => setScenarioIndex(i)}
                    >
                      <span className="block font-serif text-[18px] leading-tight">{points(r.total)} / 36</span>
                      <span className="block text-[12px] opacity-80">{parts.join(' · ')}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <ResultReport result={active.result} request={lastRequest} scenario={active.scenario} onEdit={backToForm} onNew={reset} />
        </div>
      )}
    </div>
  )
}
