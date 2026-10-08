'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LocationPicker } from '@/components/LocationPicker'
import { JoinCommunityButton } from '@/components/whatsapp/JoinCommunity'
import { JoinProgress } from '@/components/auth/JoinProgress'
import { MasterCombo, type Option } from '@/components/profile/MasterCombo'
import { GramField } from '@/components/profile/GramField'
import { PhotoPicker } from '@/components/profile/PhotoPicker'
import { COMPLETION_CHECKS, POINTS_PER_CHECK, type CompletionField } from '@/lib/profileCompletion'
import { track } from '@/lib/track'
import type { RegStep } from '@/lib/analytics'
import type { OnboardingState, OnboardingStep } from '@/lib/onboarding'

/**
 * Join steps 2–5, after the account exists (/register is step 1):
 *
 *   2 About you — who it is for, name, bride/groom, date of birth, marital
 *                 status, looking for
 *   3 Mithila   — current city, community, gotra; mool, sub-caste, maternal
 *                 gotra and gram optional, offered only where they apply
 *   4 Photo     — one photo, adjusted before upload
 *   5 Ready     — profile strength and the "+X%" next steps
 *
 * Each step saves through PATCH /api/onboarding, which writes only that
 * step's columns — so a member sent back here to fill something new keeps
 * everything else they already entered. The profile stays hidden from every
 * discovery surface until the photo step is done (lib/discoverability.ts).
 */

export type WelcomeOptions = {
  caste: Option[]
  gotra: Option[]
  mool: Option[]
  sub_caste: Option[]
  marital_status: Option[]
  moolGotra: Record<string, string[]>
}

type Step = OnboardingStep | 'ready'
const STEP_NO: Record<Step, 2 | 3 | 4 | 5> = { about: 2, mithila: 3, photo: 4, ready: 5 }
const DRAFT_KEY = 'mj-welcome-draft'

const reg = (k: RegStep) => track('reg_step', { k })

const PROFILE_FOR: Array<[string, string]> = [['self', 'Myself'], ['son', 'My son'], ['daughter', 'My daughter'], ['sibling', 'My sibling'], ['other', 'Relative / friend']]
const MARITAL_FALLBACK: Option[] = [
  { value: 'never_married', label: 'Never married' }, { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' }, { value: 'awaiting_divorce', label: 'Awaiting divorce' },
]

/** Mool and sub-caste come from the Panji tradition — offered where they apply. */
const PANJI_CASTES = new Set(['brahmin', 'maithil_brahmin', 'other_brahmin', 'kayastha'])
const SUBCASTE_CASTES = new Set(['brahmin', 'maithil_brahmin', 'other_brahmin'])
const isPanji = (c: string) => PANJI_CASTES.has(c) || /maithil|brahm|karn|kayast/i.test(c)
const hasSubCaste = (c: string) => SUBCASTE_CASTES.has(c) || /maithil|brahm/i.test(c)

function dobBounds() {
  const d = new Date()
  const iso = (y: number) => new Date(Date.UTC(d.getFullYear() - y, d.getMonth(), d.getDate())).toISOString().slice(0, 10)
  return { max: iso(18), min: iso(80) }
}

type Draft = Record<string, string | number | null>

function readDraft(): Draft {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}') as Draft } catch { return {} }
}

/* ── Small building blocks ─────────────────────────────────────────────── */

function Chips({ name, label, value, onChange, options, error, hint, cols = 'grid-cols-2', required }: {
  name: string; label: string; value: string; onChange: (v: string) => void
  options: Array<[string, string]>; error?: string; hint?: string; cols?: string; required?: boolean
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-err` : hint ? `${name}-hint` : undefined} aria-invalid={error ? true : undefined}>
      <legend className="mb-1.5 block text-sm font-medium text-ink">
        {label}{required && <span className="text-terra" aria-hidden="true"> *</span>}
      </legend>
      <div className={`grid ${cols} gap-2`}>
        {options.map(([v, l]) => (
          <label key={v}
            className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-mj-sm border px-2 py-2 text-center text-[13.5px] font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${
              value === v ? 'border-maroon bg-maroon text-cream' : error ? 'border-terra/60 bg-white text-ink' : 'border-ink/20 bg-white text-ink hover:border-maroon'}`}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} className="sr-only" />
            {l}
          </label>
        ))}
      </div>
      {error && <p id={`${name}-err`} role="alert" className="mt-1 text-xs text-terra">{error}</p>}
      {hint && <p id={`${name}-hint`} className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </fieldset>
  )
}

function TextField({ id, label, value, onChange, error, hint, required, ...rest }: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; required?: boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id'>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}{required && <span className="text-terra" aria-hidden="true"> *</span>}
      </label>
      <input id={id} value={value} onChange={e => onChange(e.target.value)}
        aria-invalid={error ? true : undefined} aria-required={required || undefined}
        aria-describedby={[error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined}
        className={`w-full rounded-mj-sm border bg-white px-3 py-2.5 text-base text-ink focus:outline-none sm:py-2 sm:text-sm ${error ? 'border-terra' : 'border-ink/20 focus:border-maroon'}`}
        {...rest} />
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-terra">{error}</p>}
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  )
}

function ActionBar({ children }: { children: React.ReactNode }) {
  // Sticky so the main button stays reachable on a long step, above the
  // keyboard on phones that resize the viewport for it.
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-5 border-t border-paper-3 bg-cream/95 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0 sm:backdrop-blur-none">
      {children}
    </div>
  )
}

/* ── The flow ──────────────────────────────────────────────────────────── */

export function WelcomeFlow({ initial, options }: { initial: OnboardingState; options: WelcomeOptions }) {
  const v = initial.values
  const returning = !!initial.profileId && !initial.complete
  const [step, setStep] = useState<Step>(initial.complete ? 'ready' : initial.resumeStep ?? 'about')

  const [profileFor, setProfileFor] = useState(v.profileFor ?? 'self')
  const [firstName, setFirstName] = useState(v.firstName ?? '')
  const [lastName, setLastName] = useState(v.lastName ?? '')
  const [gender, setGender] = useState(v.gender ?? '')
  const [dob, setDob] = useState(v.dob ?? '')
  const [marital, setMarital] = useState(v.maritalStatus ?? '')
  const [lookingFor, setLookingFor] = useState(v.lookingFor ?? '')
  const lookingTouched = useRef(!!v.lookingFor)

  const [locId, setLocId] = useState<number | null>(v.currentLocId)
  const [locName, setLocName] = useState(v.currentLocName ?? '')
  const [caste, setCaste] = useState(v.caste ?? '')
  const [gotra, setGotra] = useState(v.gotra ?? '')
  const [subCaste, setSubCaste] = useState(v.subCaste ?? '')
  const [mool, setMool] = useState(v.mool ?? '')
  const [maternalGotra, setMaternalGotra] = useState(v.maternalGotra ?? '')
  const [gram, setGram] = useState(v.gram ?? '')
  const [moreOpen, setMoreOpen] = useState(!!(v.mool || v.subCaste || v.maternalGotra || v.gram))
  const [restored, setRestored] = useState(false)

  // Saved values win; an unsaved draft from this tab (refresh, accidental
  // back) fills whatever has not been saved yet, so nothing typed is lost.
  // Read after mount — the server render has no sessionStorage.
  useEffect(() => {
    const dr = readDraft()
    const str = (k: string) => (typeof dr[k] === 'string' ? (dr[k] as string) : '')
    if (!v.firstName && str('firstName')) setFirstName(str('firstName'))
    if (!v.lastName && str('lastName')) setLastName(str('lastName'))
    if (!v.profileFor && str('profileFor')) setProfileFor(str('profileFor'))
    if (!v.gender && str('gender')) setGender(str('gender'))
    if (!v.dob && str('dob')) setDob(str('dob'))
    if (!v.maritalStatus && str('marital')) setMarital(str('marital'))
    if (!v.lookingFor && str('lookingFor')) setLookingFor(str('lookingFor'))
    if (!v.currentLocId && typeof dr.locId === 'number') { setLocId(dr.locId); setLocName(str('locName')) }
    if (!v.caste && str('caste')) setCaste(str('caste'))
    if (!v.gotra && str('gotra')) setGotra(str('gotra'))
    if (!v.subCaste && str('subCaste')) setSubCaste(str('subCaste'))
    if (!v.mool && str('mool')) setMool(str('mool'))
    if (!v.maternalGotra && str('maternalGotra')) setMaternalGotra(str('maternalGotra'))
    if (!v.gram && str('gram')) setGram(str('gram'))
    setRestored(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [photoCount, setPhotoCount] = useState(initial.photoCount)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [strength, setStrength] = useState(initial.strength)
  const [completionMissing, setCompletionMissing] = useState<CompletionField[]>(initial.completionMissing)

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const topRef = useRef<HTMLDivElement>(null)
  const tracked = useRef(new Set<string>())
  const once = (k: RegStep) => { if (!tracked.current.has(k)) { tracked.current.add(k); reg(k) } }

  useEffect(() => {
    if (step === 'about') once('about_started')
    if (step === 'mithila') once('mithila_started')
    topRef.current?.scrollIntoView({ block: 'start' })
  }, [step])

  useEffect(() => {
    if (!restored) return // never overwrite the draft before it has been read
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ profileFor, firstName, lastName, gender, dob, marital, lookingFor, locId, locName, caste, gotra, subCaste, mool, maternalGotra, gram }))
    } catch { /* storage blocked */ }
  }, [restored, profileFor, firstName, lastName, gender, dob, marital, lookingFor, locId, locName, caste, gotra, subCaste, mool, maternalGotra, gram])

  // Son → groom, daughter → bride; "looking for" follows unless changed by hand.
  function chooseProfileFor(p: string) {
    setProfileFor(p)
    if (p === 'son') chooseGender('male')
    if (p === 'daughter') chooseGender('female')
  }
  function chooseGender(g: string) {
    setGender(g)
    clearErr('gender')
    if (!lookingTouched.current) { setLookingFor(g === 'male' ? 'female' : 'male'); clearErr('lookingFor') }
  }
  const clearErr = (k: string) => setErrors(e => { if (!e[k]) return e; const n = { ...e }; delete n[k]; return n })

  function focusFirstError(errs: Record<string, string>) {
    const first = Object.keys(errs)[0]
    if (!first) return
    // A timeout, not requestAnimationFrame (which never fires in a background
    // tab or some in-app webviews); an instant scroll for the same reason.
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-field="${first}"] input:not([type=radio]), [data-field="${first}"] [role="combobox"], [data-field="${first}"] input`)
      el?.closest('[data-field]')?.scrollIntoView({ block: 'center' })
      el?.focus({ preventScroll: true })
    }, 0)
  }

  async function save(body: Record<string, unknown>): Promise<boolean> {
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch('/api/onboarding', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.status === 401) { window.location.href = '/login?next=/welcome'; return false }
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.ok) { setFormError(j.message ?? 'Could not save. Please try again.'); return false }
      if (typeof j.strength === 'number') setStrength(j.strength)
      if (Array.isArray(j.completionMissing)) setCompletionMissing(j.completionMissing)
      return true
    } catch {
      setFormError('No connection — nothing was lost. Please try again.')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function submitAbout(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = 'Please enter a first name.'
    if (!gender) errs.gender = 'Please choose bride or groom.'
    const { max, min } = dobBounds()
    if (!dob) errs.dob = 'Please enter the date of birth.'
    else if (dob > max) errs.dob = 'Members must be at least 18 years old.'
    else if (dob < min) errs.dob = 'Please check the year of birth.'
    if (!marital) errs.marital = 'Please choose a marital status.'
    if (!lookingFor) errs.lookingFor = 'Please choose who you are looking for.'
    setErrors(errs)
    if (Object.keys(errs).length) { focusFirstError(errs); return }
    const ok = await save({
      step: 'about', profile_for: profileFor, first_name: firstName.trim(), last_name: lastName.trim() || null,
      gender, dob, marital_status: marital, looking_for: lookingFor,
    })
    if (ok) { reg('about_done'); setStep(initial.complete ? 'ready' : 'mithila') }
  }

  async function submitMithila(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    const errs: Record<string, string> = {}
    if (!locId) errs.location = 'Please choose your current city from the list.'
    if (!caste.trim()) errs.caste = 'Please choose your community.'
    if (!gotra.trim()) errs.gotra = 'Please choose your gotra — “Not listed / Other” is fine if you are unsure.'
    setErrors(errs)
    if (Object.keys(errs).length) { focusFirstError(errs); return }
    const ok = await save({
      step: 'mithila', current_loc_id: locId, caste, self_gotra: gotra,
      sub_caste: hasSubCaste(caste) ? subCaste || null : null,
      mool: isPanji(caste) ? mool || null : null,
      maternal_gotra: maternalGotra || null,
      gram: gram.trim() || null,
    })
    if (ok) { reg('mithila_done'); setStep(photoCount > 0 ? 'ready' : 'photo') }
  }

  async function upload(file: File) {
    setSaving(true)
    setFormError('')
    try {
      const body = new FormData()
      body.append('photo', file)
      const res = await fetch('/api/profile/photos', { method: 'POST', body })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.ok) { setFormError(j.message ?? 'Could not upload that photo. Please try again.'); return }
      setUploadedUrl(URL.createObjectURL(file))
      setPhotoCount(c => c + 1)
      reg('photo_done')
      reg('completed')
      try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
      // A refresh keeps the Ready screen instead of jumping to /home.
      window.history.replaceState(null, '', '/welcome?done=1')
      setStep('ready')
    } catch {
      setFormError('Upload failed — check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  // Mool → gotra, as in the profile editor: narrow the list to the gotras the
  // chosen mool belongs to, and fill it when there is exactly one.
  const linkedGotras = mool ? options.moolGotra[mool] ?? [] : []
  const gotraOpts = linkedGotras.length > 0 ? options.gotra.filter(o => linkedGotras.includes(o.value) || o.value === 'other') : options.gotra
  const maritalOpts = (options.marital_status.length ? options.marital_status : MARITAL_FALLBACK).map(o => [o.value, o.label] as [string, string])
  const { max: dobMax, min: dobMin } = dobBounds()
  const nextSteps = COMPLETION_CHECKS.filter(c => completionMissing.includes(c.field) && c.why)
  const firstSection = nextSteps[0]?.section

  const heading: Record<Step, [string, string]> = {
    about: ['Tell us about the person', 'The basics families look at first. Only the age is shown — never the date of birth.'],
    mithila: ['Your Mithila roots', 'Community and gotra make matching meaningful — and keep it gotra-safe.'],
    photo: ['Add one clear photo', 'Profiles with a photo are the ones families open. One is all you need to begin.'],
    ready: ['Your Mithila Jodi profile is ready', 'Members can now find you. A fuller profile gets noticed — and trusted — sooner.'],
  }

  return (
    <div ref={topRef} className="mx-auto max-w-lg scroll-mt-4 px-4 pb-10 pt-5 sm:pt-8">
      <JoinProgress current={STEP_NO[step]} className="mb-5" />

      {returning && step !== 'ready' && (
        <p className="mb-4 rounded-mj-sm border border-gold/40 bg-cream px-3.5 py-2.5 text-[13.5px] text-ink" role="status">
          <span className="font-semibold text-maroon">Welcome back.</span> Let&apos;s finish your profile — what you saved before is filled in.
        </p>
      )}

      <header className="mb-5">
        <h1 className="font-serif text-[24px] leading-tight text-maroon sm:text-[28px]">{heading[step][0]}</h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{heading[step][1]}</p>
      </header>

      {formError && (
        <p role="alert" className="mb-4 rounded-mj-sm border border-error/30 bg-error-soft px-3.5 py-2.5 text-[13.5px] text-error-fg">{formError}</p>
      )}

      {step === 'about' && (
        <form onSubmit={submitAbout} noValidate className="card space-y-5 p-5">
          <div data-field="profileFor">
            <Chips name="profile_for" label="This profile is for" value={profileFor} onChange={chooseProfileFor}
              options={PROFILE_FOR} cols="grid-cols-2 sm:grid-cols-3" />
          </div>

          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2" data-field="firstName">
            <TextField id="w-first" label="First name" required value={firstName} maxLength={100} autoComplete="given-name"
              onChange={x => { setFirstName(x); clearErr('firstName') }} error={errors.firstName} placeholder="e.g. Priya" />
            <TextField id="w-last" label="Surname" value={lastName} maxLength={100} autoComplete="family-name"
              onChange={setLastName} placeholder="e.g. Jha" />
          </div>

          <div data-field="gender">
            <Chips name="gender" label="Bride or groom" required value={gender} onChange={chooseGender} error={errors.gender}
              options={[['female', 'Bride'], ['male', 'Groom']]} />
          </div>

          <div data-field="dob">
            <TextField id="w-dob" type="date" label="Date of birth" required value={dob} max={dobMax} min={dobMin}
              onChange={x => { setDob(x); clearErr('dob') }} error={errors.dob}
              hint="Members must be 18 or older. Only the age appears on the profile." />
          </div>

          <div data-field="marital">
            <Chips name="marital" label="Marital status" required value={marital} onChange={x => { setMarital(x); clearErr('marital') }}
              error={errors.marital} options={maritalOpts} />
          </div>

          <div data-field="lookingFor">
            <Chips name="looking_for" label="Looking for" required value={lookingFor}
              onChange={x => { lookingTouched.current = true; setLookingFor(x); clearErr('lookingFor') }}
              error={errors.lookingFor} options={[['female', 'A bride'], ['male', 'A groom']]}
              hint="Decides whose profiles you are shown." />
          </div>

          <ActionBar>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 text-[15px] disabled:opacity-60">
              {saving ? 'Saving…' : 'Continue'}
            </button>
          </ActionBar>
        </form>
      )}

      {step === 'mithila' && (
        <form onSubmit={submitMithila} noValidate className="card space-y-5 p-5">
          <div data-field="location">
            <LocationPicker label="Current city *" value={locId} initialName={locName}
              hint={errors.location ? undefined : 'Where you live now — used for nearby matches.'}
              onChange={(id, name) => { setLocId(id); setLocName(name); clearErr('location') }} />
            {errors.location && <p role="alert" className="mt-1 text-xs text-terra">{errors.location}</p>}
          </div>

          <div data-field="caste">
            <MasterCombo label="Community / caste" required value={caste} opts={options.caste} allowCustom
              placeholder="Search, e.g. Maithil Brahmin" error={errors.caste}
              hint={errors.caste ? undefined : 'Not in the list? Type it and choose “Use …”.'}
              onChange={x => { setCaste(x); clearErr('caste') }} />
          </div>

          <div data-field="gotra">
            <MasterCombo label="Gotra" required value={gotra} opts={gotraOpts} error={errors.gotra}
              placeholder="Search, e.g. Kashyap"
              hint={errors.gotra ? undefined : 'Used to flag same-gotra matches. Not sure? Choose “Not listed / Other” — you can change it later.'}
              onChange={x => { setGotra(x); clearErr('gotra') }} />
          </div>

          <div className="rounded-mj-sm border border-paper-3 bg-paper-2/40">
            <button type="button" aria-expanded={moreOpen} aria-controls="w-more" onClick={() => setMoreOpen(o => !o)}
              className="flex w-full items-center justify-between px-3.5 py-3 text-left">
              <span>
                <span className="block text-sm font-medium text-ink">More Mithila details</span>
                <span className="block text-[12px] text-ink-soft">Optional · {isPanji(caste) ? 'mool, ' : ''}{hasSubCaste(caste) ? 'sub-caste, ' : ''}maternal gotra, gram</span>
              </span>
              <span aria-hidden="true" className={`text-maroon transition-transform ${moreOpen ? 'rotate-180' : ''}`}>⌄</span>
            </button>
            {moreOpen && (
              <div id="w-more" className="space-y-4 border-t border-paper-3 px-3.5 pb-4 pt-3.5">
                {isPanji(caste) && (
                  <MasterCombo label="Mool" value={mool} opts={options.mool} allowCustom placeholder="Search, or type your mool…"
                    hint="Families who keep the Panji use it to check for close relation."
                    onChange={x => {
                      setMool(x)
                      const linked = options.moolGotra[x] ?? []
                      if (linked.length === 1 && !gotra) { setGotra(linked[0]); clearErr('gotra') }
                    }} />
                )}
                {hasSubCaste(caste) && (
                  <MasterCombo label="Sub-caste" value={subCaste} opts={options.sub_caste} onChange={setSubCaste} />
                )}
                <MasterCombo label="Maternal gotra" value={maternalGotra} opts={options.gotra} onChange={setMaternalGotra}
                  hint="Many families check the mother's gotra too." />
                <GramField label="Gram (ancestral village)" value={gram} onChange={setGram} />
              </div>
            )}
          </div>

          <ActionBar>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setStep('about')} disabled={saving} className="btn-ghost justify-center px-4 py-3 text-sm">Back</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-3 text-[15px] disabled:opacity-60">
                {saving ? 'Saving…' : 'Continue'}
              </button>
            </div>
          </ActionBar>
        </form>
      )}

      {step === 'photo' && (
        <div className="card p-5">
          <PhotoPicker busy={saving} onConfirm={upload} onPicked={() => once('photo_started')} />
          <ul className="mt-5 space-y-1.5 border-t border-paper-3 pt-4 text-[12.5px] leading-relaxed text-ink-soft">
            <li>· Our team reviews every photo before other members see it.</li>
            <li>· Photos are stored privately and only ever shared through short-lived links.</li>
            <li>· Later you can choose who sees it — all members, or only accepted matches — and replace it any time.</li>
          </ul>
          <button type="button" onClick={() => setStep('mithila')} disabled={saving} className="btn-ghost mt-4 w-full justify-center py-2 text-[13px]">
            Back
          </button>
        </div>
      )}

      {step === 'ready' && (
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="h-20 w-16 shrink-0 overflow-hidden rounded-mj-sm border-2 border-gold/60 bg-paper-2">
              {uploadedUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={uploadedUrl} alt="Your new profile photo" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center font-serif text-2xl text-maroon/70" aria-hidden="true">✓</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-ink">Profile strength</span>
                <span className="font-semibold tabular-nums text-maroon">{strength}%</span>
              </p>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-3" role="progressbar" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={100} aria-label="Profile strength">
                <div className="h-full rounded-full bg-maroon transition-all duration-700" style={{ width: `${strength}%` }} />
              </div>
              {uploadedUrl && <p className="mt-1.5 text-[12px] text-ink-soft">Photo received — it appears once our team has reviewed it, usually within a day.</p>}
            </div>
          </div>

          {nextSteps.length > 0 && (
            <div className="mt-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-terra">Next steps</p>
              <ul className="mt-2 divide-y divide-paper-3 rounded-mj-sm border border-paper-3 bg-white">
                {nextSteps.slice(0, 4).map(c => (
                  <li key={c.field}>
                    <Link href={`/profile/edit#${c.section}`} onClick={() => reg('profile_completion_started')}
                      className="flex items-center gap-3 px-3.5 py-3 hover:bg-cream">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{c.label}</span>
                        <span className="block text-[12px] leading-snug text-ink-soft">{c.why}</span>
                      </span>
                      <span className="shrink-0 rounded-pill bg-gold/15 px-2 py-0.5 text-[12px] font-semibold text-maroon">+{POINTS_PER_CHECK}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link href={`/profile/edit${firstSection ? `#${firstSection}` : ''}`} onClick={() => reg('profile_completion_started')}
            className="btn-primary mt-5 w-full justify-center py-3 text-[15px]">
            Complete my profile
          </Link>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <Link href="/profile" className="btn-ghost justify-center py-2.5 text-sm">View my profile</Link>
            <Link href="/search" className="btn-ghost justify-center py-2.5 text-sm">Explore profiles</Link>
          </div>

          {/* Optional and deliberately last — onboarding is already complete. */}
          <div className="mt-5 border-t border-paper-3 pt-4">
            <p className="text-[12.5px] leading-relaxed text-ink-soft">
              Join our WhatsApp Community for Mithila Jodi announcements and community activities.
            </p>
            <JoinCommunityButton size="sm" className="mt-3 w-full" />
          </div>
        </div>
      )}

      {/* The gate redirects every member page here, so there must be a way
          out. Logout is POST-only, so this cannot be a link. */}
      {step !== 'ready' && (
        <p className="mt-5 text-center text-[12px] text-ink-soft">
          Need to stop?{' '}
          <button type="button"
            onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {}); window.location.href = '/' }}
            className="text-maroon hover:underline">
            Log out
          </button>{' '}
          — everything you saved is kept, and you&apos;ll continue here next time.
        </p>
      )}
    </div>
  )
}

export default WelcomeFlow
