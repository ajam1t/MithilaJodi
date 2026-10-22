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
import { latestDob, minAgeError, yearsAgo, MIN_AGE } from '@/lib/ageRules'
import { track } from '@/lib/track'
import type { RegStep } from '@/lib/analytics'
import type { OnboardingState } from '@/lib/onboarding'
import { recallJoinNext, rememberJoinNext, withNext } from '@/lib/safeNext'

/**
 * The profile questions after the account exists (/register is "Account"),
 * asked one per screen:
 *
 *   who it is for → first name → surname → gender → photo → date of birth →
 *   marital status → current city → community → gotra → more Mithila details
 *
 * then the Ready screen. Saving is unchanged: PATCH /api/onboarding writes
 * the "about" columns once marital status is answered, and the "mithila"
 * columns on the last screen, each touching only its own columns.
 *
 * The photo is asked for early, while interest is high, but an upload has to
 * attach to the profile row, and that row is only created by the "about"
 * save. So the photo chosen on its screen is held in the browser and sent
 * through the same upload endpoint straight after that save. A member whose
 * profile already exists (resuming) has it uploaded at once.
 *
 * "Looking for" is not asked: matching is bride ↔ groom only, so the API sets
 * it to the opposite of the chosen gender. The profile stays hidden from every
 * discovery surface until the onboarding minimum, photo included, is met.
 */

export type WelcomeOptions = {
  caste: Option[]
  gotra: Option[]
  mool: Option[]
  sub_caste: Option[]
  marital_status: Option[]
  moolGotra: Record<string, string[]>
}

const SCREENS = ['for', 'first', 'last', 'gender', 'photo', 'dob', 'marital', 'location', 'caste', 'gotra', 'more'] as const
type Question = (typeof SCREENS)[number]
type Screen = Question | 'ready'

const STAGE: Record<Question, string> = {
  for: 'About', first: 'About', last: 'About', gender: 'About', photo: 'Photo', dob: 'About', marital: 'About',
  location: 'Mithila roots', caste: 'Mithila roots', gotra: 'Mithila roots', more: 'Mithila roots',
}

const DRAFT_KEY = 'mj-welcome-draft'
/** Long enough to see the card light up before the next question slides in. */
const AUTO_ADVANCE_MS = 260

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

type Draft = Record<string, string | number | null>

function readDraft(): Draft {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}') as Draft } catch { return {} }
}

/** How the questions refer to the person the profile is for. */
function person(profileFor: string, firstName: string) {
  const n = firstName.trim()
  if (profileFor === 'self') return { self: true, name: 'you', poss: 'your' }
  const relation: Record<string, string> = { son: 'your son', daughter: 'your daughter', sibling: 'your sibling' }
  const fallback = relation[profileFor] ?? 'them'
  return {
    self: false,
    name: n || fallback,
    poss: n ? `${n}’s` : relation[profileFor] ? `${relation[profileFor]}’s` : 'their',
  }
}

/* ── Building blocks ───────────────────────────────────────────────────── */

type Choice = { value: string; label: string; sub?: string; icon?: string }

function ChoiceCards({ label, options, value, onPick, disabled, tall = false }: {
  label: string; options: Choice[]; value: string; onPick: (v: string) => void; disabled?: boolean; tall?: boolean
}) {
  return (
    <div role="group" aria-label={label} className={`grid gap-3 ${tall ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {options.map(o => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onPick(o.value)}
            className={`relative flex rounded-mj border-2 text-left transition-all duration-200 active:scale-[0.985] disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
              tall ? 'min-h-[150px] flex-col items-center justify-center gap-2 px-3 py-5 text-center' : 'min-h-[60px] items-center gap-3 px-4 py-3.5'
            } ${on ? 'border-maroon bg-maroon/[0.06] shadow-mj-xs' : 'border-paper-3 bg-white hover:border-gold hover:bg-cream'}`}
          >
            {o.icon && <span aria-hidden="true" className={tall ? 'text-[44px] leading-none' : 'text-[24px] leading-none'}>{o.icon}</span>}
            <span className={tall ? '' : 'min-w-0 flex-1'}>
              <span className={`block font-semibold text-ink ${tall ? 'text-[16px]' : 'text-[15.5px]'}`}>{o.label}</span>
              {o.sub && <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-soft">{o.sub}</span>}
            </span>
            <span
              aria-hidden="true"
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${tall ? 'absolute right-2.5 top-2.5' : ''} ${
                on ? 'border-maroon bg-maroon text-cream' : 'border-ink/20 bg-white'}`}
            >
              {on && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function BigInput({ id, label, value, onChange, error, hint, ...rest }: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id'>) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id} value={value} onChange={e => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined}
        className={`w-full rounded-mj border-2 bg-white px-4 py-3.5 text-[18px] text-ink placeholder:text-ink-soft/60 focus:outline-none ${
          error ? 'border-terra' : 'border-paper-3 focus:border-maroon'}`}
        {...rest}
      />
      {error && <p id={`${id}-err`} role="alert" className="mt-2 text-[13px] text-terra">{error}</p>}
      {hint && <p id={`${id}-hint`} className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">{hint}</p>}
    </div>
  )
}

function ActionBar({ children }: { children: React.ReactNode }) {
  // Sticky so the main button stays reachable, above the keyboard on phones
  // that resize the viewport for it.
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-paper-3 bg-paper/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0 sm:backdrop-blur-none">
      {children}
    </div>
  )
}

function ContinueButton({ busy, disabled, label = 'Continue', onClick }: { busy?: boolean; disabled?: boolean; label?: string; onClick?: () => void }) {
  return (
    <button type={onClick ? 'button' : 'submit'} onClick={onClick} disabled={busy || disabled}
      className="btn-primary w-full justify-center py-3.5 text-[15.5px] disabled:opacity-60">
      {busy ? 'Saving…' : label}
    </button>
  )
}

/* ── The flow ──────────────────────────────────────────────────────────── */

/**
 * The Ready screen's way back to `returnTo` — the page the member was on when
 * they chose to join (see lib/safeNext). A shared or member profile gets the
 * warmer wording.
 */
function returnLabel(path: string): string {
  return /^\/(?:p|profile)\/(?!edit\b|preferences\b)[^/?#]+/.test(path)
    ? 'Back to the profile you were viewing'
    : 'Continue where you left off'
}

export function WelcomeFlow({ initial, options, returnTo: returnToProp }: { initial: OnboardingState; options: WelcomeOptions; returnTo: string | null }) {
  const v = initial.values
  const returning = !!initial.profileId && !initial.complete

  // Nothing pre-selected for a new member, so a parent is not nudged to "Myself";
  // a saved profile without the value keeps the old default.
  const [profileFor, setProfileFor] = useState(v.profileFor ?? (initial.profileId ? 'self' : ''))
  const [firstName, setFirstName] = useState(v.firstName ?? '')
  const [lastName, setLastName] = useState(v.lastName ?? '')
  const [gender, setGender] = useState(v.gender ?? '')
  const [dob, setDob] = useState(v.dob ?? '')
  const [marital, setMarital] = useState(v.maritalStatus ?? '')

  const [locId, setLocId] = useState<number | null>(v.currentLocId)
  const [locName, setLocName] = useState(v.currentLocName ?? '')
  const [caste, setCaste] = useState(v.caste ?? '')
  const [gotra, setGotra] = useState(v.gotra ?? '')
  const [subCaste, setSubCaste] = useState(v.subCaste ?? '')
  const [mool, setMool] = useState(v.mool ?? '')
  const [maternalGotra, setMaternalGotra] = useState(v.maternalGotra ?? '')
  const [gram, setGram] = useState(v.gram ?? '')
  const [restored, setRestored] = useState(false)

  // Where to send the member once onboarding is done. The URL carries it (from
  // /register); the tab's copy covers a step that lost it. Only the place they
  // land afterwards changes — every required step still has to be completed.
  const [returnTo, setReturnTo] = useState(returnToProp)
  useEffect(() => {
    if (returnToProp) return
    const kept = recallJoinNext()
    if (kept && !/^\/welcome(?:[/?#]|$)/.test(kept)) setReturnTo(kept)
  }, [returnToProp])

  const [profileExists, setProfileExists] = useState(!!initial.profileId)
  const [photoCount, setPhotoCount] = useState(initial.photoCount)
  const [pendingPhoto, setPendingPhoto] = useState<{ file: File; url: string } | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [strength, setStrength] = useState(initial.strength)
  const [completionMissing, setCompletionMissing] = useState<CompletionField[]>(initial.completionMissing)

  /** First question still unanswered, from `from` on; null when all are. */
  function firstMissing(from = 0): Question | null {
    const missing: Record<Question, boolean> = {
      for: false, first: !firstName.trim(), last: !lastName.trim(), gender: !gender,
      photo: photoCount === 0 && !pendingPhoto, dob: !dob, marital: !marital,
      location: !locId, caste: !caste.trim(), gotra: !gotra.trim(), more: false,
    }
    return SCREENS.slice(from).find(s => missing[s]) ?? null
  }

  // New members start at the first question; returning ones at the first gap.
  const [screen, setScreen] = useState<Screen>(() =>
    initial.complete ? 'ready' : !initial.profileId ? 'for' : firstMissing() ?? 'more')

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

  useEffect(() => {
    if (!restored) return // never overwrite the draft before it has been read
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ profileFor, firstName, lastName, gender, dob, marital, locId, locName, caste, gotra, subCaste, mool, maternalGotra, gram }))
    } catch { /* storage blocked */ }
  }, [restored, profileFor, firstName, lastName, gender, dob, marital, locId, locName, caste, gotra, subCaste, mool, maternalGotra, gram])

  // The held photo's preview URL is per-file and must be released.
  useEffect(() => () => { if (pendingPhoto) URL.revokeObjectURL(pendingPhoto.url) }, [pendingPhoto])

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<Question, string>>>({})
  const [formError, setFormError] = useState('')
  const topRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tracked = useRef(new Set<string>())
  const once = (k: RegStep) => { if (!tracked.current.has(k)) { tracked.current.add(k); reg(k) } }

  useEffect(() => {
    if (screen === 'for') once('about_started')
    if (screen === 'location') once('mithila_started')
    topRef.current?.scrollIntoView({ block: 'start' })
    // Screen readers start at the new question unless an input took focus.
    // A timeout, not requestAnimationFrame, which never fires in a background tab.
    const t = setTimeout(() => {
      if (!sectionRef.current?.contains(document.activeElement)) headingRef.current?.focus({ preventScroll: true })
    }, 0)
    return () => clearTimeout(t)
  }, [screen])

  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current) }, [])

  const idx = screen === 'ready' ? SCREENS.length : SCREENS.indexOf(screen)

  function go(s: Screen, error?: { field: Question; message: string } | { form: string }) {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    setScreen(s)
    setErrors(error && 'field' in error ? { [error.field]: error.message } : {})
    setFormError(error && 'form' in error ? error.form : '')
  }
  const next = () => go(SCREENS[idx + 1])
  const back = () => { if (idx > 0 && !saving) go(SCREENS[idx - 1]) }
  const later = (fn: () => void) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(fn, AUTO_ADVANCE_MS)
  }
  const fail = (field: Question, message: string) => setErrors({ [field]: message })

  async function save(body: Record<string, unknown>): Promise<boolean> {
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch('/api/onboarding', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.status === 401) { window.location.href = withNext('/login', withNext('/welcome', returnTo)); return false }
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

  /** Uploads through the existing endpoint. Returns an error message, or null on success. */
  async function upload(file: File): Promise<string | null> {
    setSaving(true)
    setFormError('')
    try {
      const body = new FormData()
      body.append('photo', file)
      const res = await fetch('/api/profile/photos', { method: 'POST', body })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.ok) return j.message ?? 'Could not upload that photo. Please try again.'
      setUploadedUrl(URL.createObjectURL(file))
      setPhotoCount(c => c + 1)
      setPendingPhoto(null)
      reg('photo_done')
      return null
    } catch {
      return 'Upload failed — check your connection and try again.'
    } finally {
      setSaving(false)
    }
  }

  function finish() {
    reg('completed')
    try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    // A refresh keeps the Ready screen (and the way back) instead of jumping
    // to /home. The URL now holds the return path, so the tab's copy can go.
    window.history.replaceState(null, '', withNext('/welcome?done=1', returnTo))
    rememberJoinNext(null)
    go('ready')
  }

  /** The "about" answers, checked together — an earlier answer may have changed since. */
  function aboutProblem(maritalValue: string): { field: Question; message: string } | null {
    if (!firstName.trim()) return { field: 'first', message: 'Please enter a first name.' }
    if (!lastName.trim()) return { field: 'last', message: 'Please enter a surname.' }
    if (!gender) return { field: 'gender', message: 'Please choose bride or groom.' }
    if (!dob) return { field: 'dob', message: 'Please enter the date of birth.' }
    const age = dob < yearsAgo(80) ? 'Please check the year of birth.' : minAgeError(dob, gender)
    if (age) return { field: 'dob', message: age }
    if (!maritalValue) return { field: 'marital', message: 'Please choose a marital status.' }
    return null
  }

  async function saveAbout(maritalValue: string) {
    if (saving) return
    const problem = aboutProblem(maritalValue)
    if (problem) { go(problem.field, problem); return }
    const ok = await save({
      step: 'about', profile_for: profileFor || 'self', first_name: firstName.trim(), last_name: lastName.trim(),
      gender, dob, marital_status: maritalValue,
    })
    if (!ok) return
    setProfileExists(true)
    reg('about_done')
    // The profile row exists now, so the photo chosen earlier can be attached.
    if (pendingPhoto && photoCount === 0) {
      const err = await upload(pendingPhoto.file)
      // Show the picker again, so a different photo is one tap away.
      if (err) { setPendingPhoto(null); go('photo', { form: `Your details are saved, but the photo did not upload: ${err}` }); return }
    }
    go(firstMissing(SCREENS.indexOf('location')) ?? 'location')
  }

  async function saveMithila() {
    if (saving) return
    if (!locId) { go('location', { field: 'location', message: 'Please choose your current city from the list.' }); return }
    if (!caste.trim()) { go('caste', { field: 'caste', message: 'Please choose your community.' }); return }
    if (!gotra.trim()) { go('gotra', { field: 'gotra', message: 'Please choose your gotra — “Not listed / Other” is fine if you are unsure.' }); return }
    const ok = await save({
      step: 'mithila', current_loc_id: locId, caste, self_gotra: gotra,
      sub_caste: hasSubCaste(caste) ? subCaste || null : null,
      mool: isPanji(caste) ? mool || null : null,
      maternal_gotra: maternalGotra || null,
      gram: gram.trim() || null,
    })
    if (!ok) return
    reg('mithila_done')
    if (photoCount === 0) {
      if (!pendingPhoto) { go('photo', { form: 'One photo is all that is left — add it to finish your profile.' }); return }
      const err = await upload(pendingPhoto.file)
      if (err) { setPendingPhoto(null); go('photo', { form: err }); return }
    }
    finish()
  }

  async function onPhoto(file: File) {
    if (profileExists) {
      // Resuming: the row exists, so upload now and carry on to what is still missing.
      const err = await upload(file)
      if (err) { setFormError(err); return }
      go(firstMissing(SCREENS.indexOf('dob')) ?? 'more')
      return
    }
    setPendingPhoto({ file, url: URL.createObjectURL(file) })
    later(() => go('dob'))
  }

  // Son → groom, daughter → bride, as before; the gender screen shows it chosen.
  function chooseProfileFor(p: string) {
    setProfileFor(p)
    if (p === 'son') setGender('male')
    if (p === 'daughter') setGender('female')
    later(() => go('first'))
  }

  // Mool → gotra, as in the profile editor: narrow the list to the gotras the
  // chosen mool belongs to, and fill it when there is exactly one.
  const linkedGotras = mool ? options.moolGotra[mool] ?? [] : []
  const gotraOpts = linkedGotras.length > 0 ? options.gotra.filter(o => linkedGotras.includes(o.value) || o.value === 'other') : options.gotra
  const maritalOpts: Choice[] = (options.marital_status.length ? options.marital_status : MARITAL_FALLBACK).map(o => ({ value: o.value, label: o.label }))
  const nextSteps = COMPLETION_CHECKS.filter(c => completionMissing.includes(c.field) && c.why)
  const firstSection = nextSteps[0]?.section
  const who = person(profileFor, firstName)
  const anyMore = !!(mool || subCaste || maternalGotra || gram.trim())

  const questions: Record<Question, [string, string]> = {
    for: ['Who is this profile for?', 'Families often create a profile for a son, daughter or sibling — choose whoever it is for.'],
    first: [`What is ${who.poss} first name?`, 'As it should appear on the profile.'],
    last: [who.self ? 'And your surname?' : `And ${who.poss} surname?`, 'Families search by surname — Jha, Mishra, Thakur, Karn, Das…'],
    gender: [`What is ${who.poss} gender?`, who.self ? 'This is about you — the person this profile is for.' : `This is about ${who.name}, the person this profile is for — not you.`],
    photo: [who.self ? 'Add a photo of yourself' : `Add a photo of ${who.name}`, 'Profiles with a clear photo get far more interest from families. You can adjust it before it is saved.'],
    dob: [
      who.self ? 'When were you born?' : `When was ${who.name} born?`,
      `Only the age is shown — never the date of birth.${gender === 'male' ? ` A groom must be ${MIN_AGE.male} or older.` : gender === 'female' ? ` A bride must be ${MIN_AGE.female} or older.` : ''}`,
    ],
    marital: [`What is ${who.poss} marital status?`, ''],
    location: [who.self ? 'Where do you live now?' : `Where does ${who.name} live now?`, 'Type the city or town and choose it from the list — used for nearby matches.'],
    caste: [who.self ? 'Which community do you belong to?' : `Which community does ${who.name} belong to?`, 'Community and gotra make matching meaningful — and keep it gotra-safe.'],
    gotra: [`What is ${who.poss} gotra?`, 'Used to flag same-gotra matches. Not sure? Choose “Not listed / Other” — you can change it later.'],
    more: ['A few more Mithila details', 'Optional — families who keep the Panji often look for these. You can add them later too.'],
  }

  return (
    <div ref={topRef} className="mx-auto max-w-md scroll-mt-4 px-4 pb-10 pt-4 sm:pt-8">
      {screen === 'ready' ? (
        <JoinProgress current={3} className="mb-5" />
      ) : (
        <div className="mb-6">
          <div className="flex min-h-[32px] items-center justify-between">
            {idx > 0 ? (
              <button type="button" onClick={back} disabled={saving}
                className="-ml-2 inline-flex items-center gap-1 rounded-pill px-2 py-1 text-[14px] font-medium text-maroon hover:bg-maroon/5 disabled:opacity-50">
                <span aria-hidden="true">←</span> Back
              </button>
            ) : <span />}
            <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-terra">
              {STAGE[screen]} · {idx + 1} of {SCREENS.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-3" role="progressbar"
            aria-label="Profile questions" aria-valuemin={1} aria-valuemax={SCREENS.length} aria-valuenow={idx + 1}>
            <div className="h-full rounded-full bg-gradient-to-r from-maroon to-gold transition-[width] duration-500 ease-out"
              style={{ width: `${((idx + 1) / SCREENS.length) * 100}%` }} />
          </div>
        </div>
      )}

      {returning && screen !== 'ready' && idx === SCREENS.indexOf(firstMissing() ?? 'more') && (
        <p className="mb-5 rounded-mj-sm border border-gold/40 bg-cream px-3.5 py-2.5 text-[13.5px] text-ink" role="status">
          <span className="font-semibold text-maroon">Welcome back.</span> Let&apos;s finish your profile — what you saved before is kept.
        </p>
      )}

      {screen === 'ready' ? (
        <header className="mb-5">
          <h1 ref={headingRef} tabIndex={-1} className="font-serif text-[24px] leading-tight text-maroon outline-none sm:text-[28px]">Your Mithila Jodi profile is ready</h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">Members can now find you. A fuller profile gets noticed — and trusted — sooner.</p>
        </header>
      ) : null}

      {formError && (
        <p role="alert" className="mb-4 rounded-mj-sm border border-error/30 bg-error-soft px-3.5 py-2.5 text-[13.5px] text-error-fg">{formError}</p>
      )}

      {screen !== 'ready' && (
        <section key={screen} ref={sectionRef} className="motion-safe:animate-fade-in" aria-labelledby="w-question">
          <h1 id="w-question" ref={headingRef} tabIndex={-1} className="font-serif text-[26px] leading-tight text-maroon outline-none sm:text-[30px]">
            {questions[screen][0]}
          </h1>
          {questions[screen][1] && <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{questions[screen][1]}</p>}

          <div className="mt-6">
            {screen === 'for' && (
              <ChoiceCards label="Who this profile is for" value={profileFor} onPick={chooseProfileFor}
                options={PROFILE_FOR.map(([value, label]) => ({ value, label }))} />
            )}

            {screen === 'first' && (
              <form noValidate onSubmit={e => { e.preventDefault(); if (!firstName.trim()) fail('first', 'Please enter a first name.'); else next() }}>
                <BigInput id="w-first" label="First name" value={firstName} maxLength={100} autoComplete={who.self ? 'given-name' : 'off'}
                  autoFocus enterKeyHint="next" placeholder="e.g. Priya" error={errors.first}
                  onChange={x => { setFirstName(x); setErrors({}) }} />
                <ActionBar><ContinueButton /></ActionBar>
              </form>
            )}

            {screen === 'last' && (
              <form noValidate onSubmit={e => { e.preventDefault(); if (!lastName.trim()) fail('last', 'Please enter a surname.'); else next() }}>
                <BigInput id="w-last" label="Surname" value={lastName} maxLength={100} autoComplete={who.self ? 'family-name' : 'off'}
                  autoFocus enterKeyHint="next" placeholder="e.g. Jha" error={errors.last}
                  onChange={x => { setLastName(x); setErrors({}) }} />
                <ActionBar><ContinueButton /></ActionBar>
              </form>
            )}

            {screen === 'gender' && (
              <>
                <ChoiceCards label="Gender" tall value={gender}
                  onPick={g => { setGender(g); setErrors({}); later(() => go('photo')) }}
                  options={[
                    { value: 'male', label: 'Male / Groom', icon: '👨' },
                    { value: 'female', label: 'Female / Bride', icon: '👩' },
                  ]} />
                {errors.gender && <p role="alert" className="mt-3 text-[13px] text-terra">{errors.gender}</p>}
                <p className="mt-4 text-[12.5px] leading-relaxed text-ink-soft">
                  Profiles are matched bride ↔ groom, so {who.self ? 'you will' : `${who.name} will`} be shown {gender === 'female' ? 'grooms' : gender === 'male' ? 'brides' : 'the opposite gender'}.
                </p>
                {gender && <ActionBar><ContinueButton onClick={() => go('photo')} /></ActionBar>}
              </>
            )}

            {screen === 'photo' && (
              <>
                {photoCount > 0 ? (
                  <div className="flex items-center gap-4 rounded-mj border-2 border-gold/50 bg-cream px-4 py-4">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-mj-sm border-2 border-gold/60 bg-paper-2">
                      {uploadedUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={uploadedUrl} alt="" className="h-full w-full object-cover" />
                        : <span className="grid h-full w-full place-items-center font-serif text-2xl text-maroon/70" aria-hidden="true">✓</span>}
                    </div>
                    <p className="text-[14px] leading-relaxed text-ink">Photo added. You can change it, or add more, from your profile later.</p>
                  </div>
                ) : pendingPhoto ? (
                  <div className="flex flex-col items-center text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pendingPhoto.url} alt="The chosen photo" className="h-56 w-44 rounded-mj border-[3px] border-gold/70 object-cover shadow-mj" />
                    <p className="mt-3 text-[13.5px] text-ink-soft">Looks good. It is saved with the profile in a moment.</p>
                    <button type="button" onClick={() => setPendingPhoto(null)} className="mt-2 text-[13.5px] font-medium text-maroon hover:underline">
                      Choose a different photo
                    </button>
                  </div>
                ) : (
                  <PhotoPicker busy={saving} onConfirm={onPhoto} onPicked={() => once('photo_started')} />
                )}
                <ul className="mt-5 space-y-1.5 border-t border-paper-3 pt-4 text-[12.5px] leading-relaxed text-ink-soft">
                  <li>· Our team reviews every photo before other members see it.</li>
                  <li>· Photos are stored privately and only ever shared through short-lived links.</li>
                  <li>· Later you can choose who sees it — public, members only, or only accepted matches — and replace it any time.</li>
                </ul>
                {(pendingPhoto || photoCount > 0) && (
                  <ActionBar><ContinueButton busy={saving} onClick={() => go(profileExists ? firstMissing(SCREENS.indexOf('dob')) ?? 'dob' : 'dob')} /></ActionBar>
                )}
              </>
            )}

            {screen === 'dob' && (
              <form noValidate onSubmit={e => {
                e.preventDefault()
                if (!dob) return fail('dob', 'Please enter the date of birth.')
                const problem = dob < yearsAgo(80) ? 'Please check the year of birth.' : minAgeError(dob, gender)
                if (problem) return fail('dob', problem)
                next()
              }}>
                <BigInput id="w-dob" type="date" label="Date of birth" value={dob} max={latestDob(gender)} min={yearsAgo(80)}
                  autoFocus error={errors.dob} onChange={x => { setDob(x); setErrors({}) }} />
                <ActionBar><ContinueButton /></ActionBar>
              </form>
            )}

            {screen === 'marital' && (
              <>
                <ChoiceCards label="Marital status" value={marital} options={maritalOpts} disabled={saving}
                  onPick={m => { setMarital(m); setErrors({}); later(() => void saveAbout(m)) }} />
                {errors.marital && <p role="alert" className="mt-3 text-[13px] text-terra">{errors.marital}</p>}
                {saving && <p className="mt-4 text-center text-[13.5px] text-ink-soft" role="status">Saving{pendingPhoto ? ' and uploading the photo' : ''}…</p>}
                {marital && !saving && <ActionBar><ContinueButton onClick={() => void saveAbout(marital)} /></ActionBar>}
              </>
            )}

            {screen === 'location' && (
              <>
                <LocationPicker label="Current city" value={locId} initialName={locName}
                  onChange={(id, name) => { setLocId(id); setLocName(name); setErrors({}) }} />
                {errors.location && <p role="alert" className="mt-2 text-[13px] text-terra">{errors.location}</p>}
                <ActionBar>
                  <ContinueButton onClick={() => (locId ? next() : fail('location', 'Please choose your current city from the list.'))} />
                </ActionBar>
              </>
            )}

            {screen === 'caste' && (
              <>
                <MasterCombo label="Community / caste" required value={caste} opts={options.caste} allowCustom
                  placeholder="Search, e.g. Maithil Brahmin" error={errors.caste}
                  hint={errors.caste ? undefined : 'Not in the list? Type it and choose “Use …”.'}
                  onChange={x => { setCaste(x); setErrors({}) }} />
                <ActionBar>
                  <ContinueButton onClick={() => (caste.trim() ? next() : fail('caste', 'Please choose your community.'))} />
                </ActionBar>
              </>
            )}

            {screen === 'gotra' && (
              <>
                <MasterCombo label="Gotra" required value={gotra} opts={gotraOpts} error={errors.gotra}
                  placeholder="Search, e.g. Kashyap"
                  onChange={x => { setGotra(x); setErrors({}) }} />
                <ActionBar>
                  <ContinueButton onClick={() => (gotra.trim() ? next() : fail('gotra', 'Please choose your gotra — “Not listed / Other” is fine if you are unsure.'))} />
                </ActionBar>
              </>
            )}

            {screen === 'more' && (
              <>
                <div className="space-y-4 rounded-mj border border-paper-3 bg-white p-4">
                  {isPanji(caste) && (
                    <MasterCombo label="Mool" value={mool} opts={options.mool} allowCustom placeholder="Search, or type your mool…"
                      hint="Families who keep the Panji use it to check for close relation."
                      onChange={x => {
                        setMool(x)
                        const linked = options.moolGotra[x] ?? []
                        if (linked.length === 1 && !gotra) setGotra(linked[0])
                      }} />
                  )}
                  {hasSubCaste(caste) && (
                    <MasterCombo label="Sub-caste" value={subCaste} opts={options.sub_caste} onChange={setSubCaste} />
                  )}
                  <MasterCombo label="Maternal gotra" value={maternalGotra} opts={options.gotra} onChange={setMaternalGotra}
                    hint="Many families check the mother's gotra too." />
                  <GramField label="Gram (ancestral village)" value={gram} onChange={setGram} />
                </div>
                <ActionBar>
                  <ContinueButton busy={saving} label={anyMore ? 'Finish' : 'Skip and finish'} onClick={() => void saveMithila()} />
                </ActionBar>
              </>
            )}
          </div>
        </section>
      )}

      {screen === 'ready' && (
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

          {returnTo ? (
            <>
              <Link href={returnTo} onClick={() => rememberJoinNext(null)}
                className="btn-primary mt-5 w-full justify-center py-3 text-[15px]">
                {returnLabel(returnTo)} →
              </Link>
              <Link href={`/profile/edit${firstSection ? `#${firstSection}` : ''}`} onClick={() => reg('profile_completion_started')}
                className="btn-ghost mt-2.5 w-full justify-center py-2.5 text-sm">
                Complete my profile
              </Link>
            </>
          ) : (
            <Link href={`/profile/edit${firstSection ? `#${firstSection}` : ''}`} onClick={() => reg('profile_completion_started')}
              className="btn-primary mt-5 w-full justify-center py-3 text-[15px]">
              Complete my profile
            </Link>
          )}
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
      {screen !== 'ready' && (
        <p className="mt-8 text-center text-[12px] text-ink-soft">
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
