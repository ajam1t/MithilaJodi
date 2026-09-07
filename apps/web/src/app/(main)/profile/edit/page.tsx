'use client'

import { useState, useEffect, useCallback, useRef, useId } from 'react'
import { useRouter } from 'next/navigation'
import { LocationPicker } from '@/components/LocationPicker'


type PhotoRow = {
  id: string
  is_primary: boolean
  status: string
  display_order: number
  signed_url: string | null
  local_preview?: string
}

type UploadState = {
  progress: number   // 0–100
  failed: boolean
  message: string
  file: File | null
}

type FormData = {
  profile_for: string
  first_name: string
  last_name: string
  gender: string
  dob: string
  religion: string
  caste: string
  sub_caste: string
  self_gotra: string
  maternal_gotra: string
  mool: string
  gram: string
  native_place_id: number | null
  current_loc_id: number | null
  job_loc_id: number | null
  height_cm: string
  diet: string
  smoking: string
  drinking: string
  marriage_timeline: string
  education_detail: string
  profession_detail: string
  employer: string
  about_me: string
  family_about: string
  discoverable: boolean
  visibility: 'public' | 'members' | 'private'
  // Private details
  income_min_lpa: string
  income_max_lpa: string
  /** The band the member picks; min/max above are derived from it on save. */
  income_range: string
  /** Whose number contact_mobile is — self, father, brother, … */
  contact_relation: string
  rashi: string
  nakshatra: string
  mangalik: string
  birth_time: string
  birth_place: string
  contact_mobile: string
  contact_email: string
  address: string
  kundli_url: string
  photo_visibility: string
  // Partner preferences
  pref_age_min: string
  pref_age_max: string
  pref_gender: string
  pref_caste: string
  pref_gotra_safe: boolean
  pref_education: string
  pref_location: string
  pref_diet: string
  pref_profession: string
  pref_marital_status: string
  pref_children: string
  pref_living_arrangement: string
  pref_career: string
  pref_marriage_timeline: string
  pref_manglik: string
  pref_notes: string
  // ── V10 additive fields ──
  marital_status: string
  mother_tongue: string
  degree: string
  education_level_id: string
  specialization: string
  institution: string
  passing_year: string
  employment_type: string
  industry: string
  job_title: string
  experience_years: string
  work_type: string
  family_type: string
  managed_by: string
  family_values: string
  parents_info: string
  siblings_info: string
  family_expectations: string
  family_introduction: string
}

const EMPTY_FORM: FormData = {
  profile_for: 'self',
  first_name: '',
  last_name: '',
  gender: '',
  dob: '',
  // Must be the option *key*, not the label. Defaulting to 'Hindu' meant the
  // value matched no option, so MasterSelect prepended it as an extra entry and
  // the religion dropdown listed Hindu twice. Hindu is the default because the
  // platform serves the Maithil community.
  religion: 'hindu',
  caste: '',
  sub_caste: '',
  self_gotra: '',
  maternal_gotra: '',
  mool: '',
  gram: '',
  native_place_id: null,
  current_loc_id: null,
  job_loc_id: null,
  height_cm: '',
  diet: '',
  smoking: '',
  drinking: '',
  marriage_timeline: '',
  education_detail: '',
  profession_detail: '',
  employer: '',
  about_me: '',
  family_about: '',
  discoverable: false,
  visibility: 'members',
  income_min_lpa: '',
  income_max_lpa: '',
  income_range: '',
  contact_relation: '',
  rashi: '',
  nakshatra: '',
  mangalik: '',
  birth_time: '',
  birth_place: '',
  contact_mobile: '',
  contact_email: '',
  address: '',
  kundli_url: '',
  photo_visibility: '',
  pref_age_min: '',
  pref_age_max: '',
  pref_gender: '',
  pref_caste: '',
  pref_gotra_safe: true,
  pref_education: '',
  pref_location: '',
  pref_diet: '',
  pref_profession: '',
  pref_marital_status: '',
  pref_children: '',
  pref_living_arrangement: '',
  pref_career: '',
  pref_marriage_timeline: '',
  pref_manglik: '',
  pref_notes: '',
  marital_status: '',
  mother_tongue: '',
  degree: '',
  education_level_id: '',
  specialization: '',
  institution: '',
  passing_year: '',
  employment_type: '',
  industry: '',
  job_title: '',
  experience_years: '',
  work_type: '',
  family_type: '',
  managed_by: '',
  family_values: '',
  parents_info: '',
  siblings_info: '',
  family_expectations: '',
  family_introduction: '',
}


type Option = { value: string; label: string }
type OptionsMap = Record<string, Option[]>

// A <select> driven by master-data options. If the profile's stored value is
// not present in the (active) options list, it is appended so the user never
// silently loses a value an admin later deactivated.
/**
 * Gram (ancestral village), findable by PIN code.
 *
 * A Mithila village is frequently not in any place database, and a member often
 * cannot spell it the way a search index would. What they do know is the PIN
 * code. India Post lists every post office under a PIN, and for rural Mithila
 * those names *are* the villages — so entering the PIN turns an unanswerable
 * question into picking your own village off a short list.
 *
 * Typing the name directly still works; the field stores free text either way.
 */
function GramField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputId = useId()
  const pinId = useId()
  const [pin, setPin] = useState('')
  const [places, setPlaces] = useState<string[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function lookup() {
    const q = pin.trim()
    if (!/^[1-9][0-9]{5}$/.test(q)) { setNote('Enter a six-digit PIN code.'); setPlaces([]); return }
    setBusy(true); setNote(null); setPlaces([])
    try {
      const j = await fetch(`/api/pincode?pin=${q}`).then(r => r.json())
      if (j.ok && Array.isArray(j.places) && j.places.length > 0) {
        setPlaces(j.places as string[])
        setNote(`${[j.district, j.state].filter(Boolean).join(', ')} — pick your village.`)
      } else {
        setNote(j.message ?? 'No villages found for that PIN code.')
      }
    } catch {
      setNote('Could not look that up just now — type the name instead.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1">Gram (Ancestral Village)</label>
      <input id={inputId} type="text" value={value} maxLength={100}
        onChange={e => onChange(e.target.value)}
        placeholder="Type your village, or find it by PIN code below"
        className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />

      <div className="mt-2 flex items-end gap-2">
        <div className="w-[136px]">
          <label htmlFor={pinId} className="block text-xs text-ink-soft mb-1">Find by PIN code</label>
          <input id={pinId} type="text" inputMode="numeric" maxLength={6} value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookup() } }}
            placeholder="847211"
            className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
        </div>
        <button type="button" onClick={lookup} disabled={busy || pin.length !== 6}
          className="rounded-mj-sm border border-maroon px-3 py-2 text-sm font-medium text-maroon transition-colors hover:bg-maroon hover:text-gold-lt disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-maroon">
          {busy ? 'Looking…' : 'Find'}
        </button>
      </div>

      {note && <p className="mt-1.5 text-xs text-ink-soft">{note}</p>}

      {places.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {places.map(p => (
            <button key={p} type="button" onClick={() => { onChange(p); setPlaces([]); setNote(null) }}
              className={`rounded-pill border px-2.5 py-1 text-[12.5px] transition-colors ${
                value === p ? 'border-maroon bg-maroon text-gold-lt'
                            : 'border-ink/20 text-ink-soft hover:border-maroon hover:text-maroon'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Multi-select as toggleable chips over a master list.
 *
 * These fields were comma-separated text boxes — "Use commas to add multiple
 * values" — so a member had to know the exact spelling of every accepted value,
 * and anything mistyped was silently dropped on save. Chips show the whole
 * choice set and cannot produce an invalid value.
 *
 * The form still holds a comma-joined string, which is what the save path
 * already splits, so nothing downstream changes.
 */
function MultiChips({
  label, value, onChange, opts, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  opts: Option[]
  hint?: string
}) {
  const chosen = value.split(',').map(v => v.trim()).filter(Boolean)
  const toggle = (v: string) => {
    const next = chosen.includes(v) ? chosen.filter(c => c !== v) : [...chosen, v]
    onChange(next.join(', '))
  }
  return (
    <div>
      <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>
      {opts.length === 0 ? (
        <p className="text-xs text-ink-soft">Loading…</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {opts.map(o => {
            const on = chosen.includes(o.value)
            return (
              <button key={o.value} type="button" onClick={() => toggle(o.value)} aria-pressed={on}
                className={`rounded-pill border px-2.5 py-1 text-[12.5px] transition-colors ${
                  on ? 'border-maroon bg-maroon text-gold-lt'
                     : 'border-ink/20 text-ink-soft hover:border-maroon hover:text-maroon'}`}>
                {o.label}
              </button>
            )
          })}
        </div>
      )}
      <p className="mt-1 text-xs text-ink-soft">{hint ?? (chosen.length === 0 ? 'Nothing selected — treated as no preference.' : `${chosen.length} selected`)}</p>
    </div>
  )
}

/**
 * Multiple locations, added one at a time and shown as removable chips.
 *
 * Replaces a text input labelled "Preferred location IDs" that expected a member
 * to type comma-separated numeric database ids.
 */
function MultiLocation({
  label, ids, names, onChange,
}: {
  label: string
  ids: string
  names: Record<string, string>
  onChange: (ids: string, names: Record<string, string>) => void
}) {
  const chosen = ids.split(',').map(v => v.trim()).filter(Boolean)
  const remove = (id: string) => {
    const nextNames = { ...names }
    delete nextNames[id]
    onChange(chosen.filter(c => c !== id).join(', '), nextNames)
  }
  return (
    <div>
      <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>
      {chosen.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {chosen.map(id => (
            <span key={id} className="inline-flex items-center gap-1 rounded-pill border border-maroon bg-maroon px-2.5 py-1 text-[12.5px] text-gold-lt">
              {names[id] ?? `#${id}`}
              <button type="button" onClick={() => remove(id)} aria-label={`Remove ${names[id] ?? id}`}
                className="text-gold-lt/80 hover:text-white">×</button>
            </span>
          ))}
        </div>
      )}
      <LocationPicker
        label=""
        value={null}
        compact
        placeholder="Add a city or district…"
        onChange={(id, name) => {
          if (id == null) return
          const key = String(id)
          if (chosen.includes(key)) return
          onChange([...chosen, key].join(', '), { ...names, [key]: name })
        }}
      />
      <p className="mt-1 text-xs text-ink-soft">
        {chosen.length === 0 ? 'No location preference — matches anywhere in India.' : `${chosen.length} added`}
      </p>
    </div>
  )
}

/**
 * A searchable picker over a master list that stores the option *key*.
 *
 * This replaces CommunitySearch for the community fields. CommunitySearch wrote
 * `label_en` into the form, so profiles ended up holding display text
 * ('Kashyap', 'Hindu') while the option lists are keyed by slug ('kashyapa',
 * 'hindu'). Every one of those fields then rendered a duplicate entry, because
 * the select prepends an unmatched value as its own option — the reported
 * "Hindu listed twice", which was really happening to caste, gotra and mool too.
 *
 * It also accepts a filtered subset, which is how choosing a mool narrows the
 * gotra list to the gotras that mool actually belongs to.
 */
function MasterCombo({
  label, value, onChange, opts, hint, placeholder = 'Type to search…', allowOther = true,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  opts: Option[]
  hint?: string
  placeholder?: string
  allowOther?: boolean
}) {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selected = opts.find(o => o.value === value)
  // A value with no matching option is legacy free text; show it as typed
  // rather than silently blanking what the member previously saved.
  const display = selected?.label ?? value ?? ''

  const q = query.trim().toLowerCase()
  const matches = (q ? opts.filter(o => o.label.toLowerCase().includes(q)) : opts).slice(0, 60)

  return (
    <div className="relative">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1">{label}</label>
      <input
        id={inputId}
        type="text"
        value={open ? query : display}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${inputId}-list`}
        className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-ink text-sm focus:outline-none focus:border-maroon bg-white"
        onFocus={() => { setQuery(''); setOpen(true) }}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {value && !open && (
        <button type="button" onClick={() => onChange('')}
          className="absolute right-2 top-[34px] text-ink-soft hover:text-maroon text-sm leading-none"
          aria-label={`Clear ${label}`}>×</button>
      )}
      {open && (
        <ul id={`${inputId}-list`} role="listbox"
          className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-mj-sm border border-ink/20 bg-white shadow-mj-xs">
          {matches.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-soft">No match in the list.</li>
          )}
          {matches.map(o => (
            <li key={o.value} role="option" aria-selected={o.value === value}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-cream ${o.value === value ? 'text-maroon font-medium' : 'text-ink'}`}
              onMouseDown={() => { onChange(o.value); setOpen(false) }}>
              {o.label}
            </li>
          ))}
          {allowOther && !opts.some(o => o.value === 'other') && (
            <li role="option" aria-selected={value === 'other'}
              className="cursor-pointer border-t border-paper-3 px-3 py-2 text-sm text-ink-soft hover:bg-cream"
              onMouseDown={() => { onChange('other'); setOpen(false) }}>
              Not listed / Other
            </li>
          )}
        </ul>
      )}
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  )
}

/**
 * Height in centimetres and in feet/inches, kept in step.
 *
 * cm is what the database stores and what matching uses, but almost nobody in
 * India volunteers their height in centimetres — a family says "five foot ten".
 * Asking only for cm made people either guess or leave it blank, and height is
 * one of the twelve fields the completion score counts.
 *
 * Editing either side rewrites the other immediately. cm remains the single
 * stored value, so nothing downstream changes.
 */
function HeightField({ cm, onChange }: { cm: string; onChange: (cm: string) => void }) {
  const cmId = useId()
  const n = parseInt(cm, 10)
  const valid = Number.isFinite(n) && n > 0
  const totalInches = valid ? Math.round(n / 2.54) : null
  const feet = totalInches != null ? Math.floor(totalInches / 12) : ''
  const inches = totalInches != null ? totalInches % 12 : ''

  // Recompose cm from whichever part the member just edited.
  const fromImperial = (f: number | '', i: number | '') => {
    const ft = typeof f === 'number' ? f : 0
    const inch = typeof i === 'number' ? i : 0
    if (ft === 0 && inch === 0) { onChange(''); return }
    onChange(String(Math.round((ft * 12 + inch) * 2.54)))
  }

  const box = 'w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon'

  return (
    <div>
      <label htmlFor={cmId} className="block text-sm font-medium text-ink mb-1">Height</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input id={cmId} type="number" min={100} max={250} value={cm} placeholder="165"
            onChange={e => onChange(e.target.value)} className={`${box} pr-9`} aria-label="Height in centimetres" />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-soft">cm</span>
        </div>
        <span className="text-xs text-ink-soft">or</span>
        <div className="relative w-[72px]">
          <input type="number" min={3} max={8} value={feet} placeholder="5"
            onChange={e => fromImperial(e.target.value === '' ? '' : parseInt(e.target.value, 10), inches)}
            className={`${box} pr-6`} aria-label="Height, feet" />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-soft">ft</span>
        </div>
        <div className="relative w-[72px]">
          <input type="number" min={0} max={11} value={inches} placeholder="7"
            onChange={e => fromImperial(feet, e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            className={`${box} pr-7`} aria-label="Height, inches" />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-soft">in</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        {valid ? `${feet}′${inches}″ · ${n} cm` : 'Type centimetres, or feet and inches — the other updates itself.'}
      </p>
    </div>
  )
}

function MasterSelect({
  label, value, onChange, opts, placeholder = 'Select…',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  opts: Option[]
  placeholder?: string
}) {
  const selectId = useId()
  const list = [...opts]
  if (value && !list.some(o => o.value === value)) {
    list.unshift({ value, label: value })
  }
  return (
    <div>
      <label htmlFor={selectId} className="block text-sm font-medium text-ink mb-1">{label}</label>
      <select
        id={selectId}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white"
      >
        <option value="">{placeholder}</option>
        {list.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

/**
 * The three visibility levels, in decreasing order of exposure. The help text is
 * deliberately concrete about what each one means for the open internet — the
 * old single "discoverable" switch left that ambiguous.
 */
const VISIBILITY_OPTIONS = [
  {
    value: 'public' as const,
    label: 'Public — anyone can see it',
    help: 'May be shown on our homepage and Explore page, which do not require an account, and in member search. Your name, photo and community details are visible there; your date of birth, contact details and address are never included.',
  },
  {
    value: 'members' as const,
    label: 'Members only — signed-in members',
    help: 'Appears in search for registered Mithila Jodi members. Never shown on public pages or to search engines.',
  },
  {
    value: 'private' as const,
    label: 'Private — hidden',
    help: 'Not shown in search or on public pages, and members cannot send you new interests. Conversations you have already started are unaffected.',
  },
]

/**
 * Which fields belong to which section.
 *
 * Used for the "4 of 7" counter in each section header. That counter is the
 * whole point of collapsing the form: this page has around ninety inputs, and
 * showing all of them at once made a member's own profile feel like a tax
 * return with no indication of what was left. Collapsed sections state their
 * progress, so nothing is hidden — only folded.
 */

const SECTION_FIELDS = {
  basic:       ['first_name', 'last_name', 'gender', 'dob', 'height_cm', 'marital_status', 'mother_tongue'],
  community:   ['religion', 'caste', 'sub_caste', 'mool', 'self_gotra', 'maternal_gotra', 'gram'],
  location:    ['native_place_id', 'current_loc_id', 'job_loc_id'],
  about:       ['about_me'],
  education:   ['education_level_id', 'degree', 'specialization', 'institution', 'passing_year', 'education_detail'],
  career:      ['job_title', 'employer', 'industry', 'employment_type', 'work_type', 'experience_years', 'profession_detail'],
  lifestyle:   ['diet', 'smoking', 'drinking', 'marriage_timeline'],
  family:      ['family_type', 'family_values', 'managed_by', 'parents_info', 'siblings_info', 'family_about', 'family_expectations', 'family_introduction'],
  preferences: ['pref_age_min', 'pref_age_max', 'pref_gender', 'pref_caste', 'pref_education', 'pref_location',
                'pref_diet', 'pref_profession', 'pref_marital_status', 'pref_children', 'pref_living_arrangement',
                'pref_career', 'pref_marriage_timeline', 'pref_manglik', 'pref_notes'],
  private:     ['income_range', 'rashi', 'nakshatra', 'mangalik', 'birth_time', 'birth_place',
                'contact_mobile', 'contact_relation', 'contact_email', 'address', 'kundli_url', 'photo_visibility'],
} as const satisfies Record<string, readonly (keyof FormData)[]>

/**
 * Sections open on first load: the ones a profile is useless without, plus the
 * privacy control, which nobody should have to go looking for.
 */
const DEFAULT_OPEN = ['basic', 'community', 'location', 'photos', 'visibility']

function FormSection({
  id, title, subtitle, filled, total, open, onToggle, anchorId, children,
}: {
  id: string
  title: string
  subtitle: string
  /** Omitted for sections whose progress is not a field count (photos, visibility). */
  filled?: number
  total?: number
  open: boolean
  onToggle: (id: string) => void
  anchorId?: string
  children: React.ReactNode
}) {
  const panelId = `section-${id}`
  const complete = total != null && filled != null && filled >= total
  return (
    <section id={anchorId} className="card overflow-hidden scroll-mt-4">
      <h2 id={`section-heading-${id}`}>
        <button
          type="button"
          onClick={() => onToggle(id)}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-paper-2/60 transition-colors"
        >
          <span className="flex-1 min-w-0">
            <span className="block font-semibold text-ink text-[15px] leading-tight">{title}</span>
            <span className="block text-[12px] text-ink-soft leading-snug mt-0.5">{subtitle}</span>
          </span>
          {total != null && filled != null && (
            <span
              className={`text-[11px] font-semibold rounded-pill px-2 py-0.5 whitespace-nowrap border ${
                complete
                  ? 'bg-green/[0.08] border-green/30 text-green'
                  : filled > 0
                    ? 'bg-gold/[0.10] border-gold/40 text-maroon'
                    : 'bg-paper-2 border-paper-3 text-ink-soft'
              }`}
            >
              {complete ? '✓ All set' : `${filled} of ${total}`}
            </span>
          )}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"
            className={`flex-shrink-0 text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </h2>
      {/* Unmounted rather than hidden: a collapsed section must not keep
          focusable inputs in the tab order, and required fields inside a
          display:none block still block form submission in some browsers. */}
      {open && <div id={panelId} className="px-5 pb-5 pt-1 border-t border-paper-3">{children}</div>}
    </section>
  )
}

type SaveState = 'idle' | 'saving' | 'success' | 'error'

export default function ProfileEditPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [photos, setPhotos] = useState<PhotoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [error, setError] = useState('')
  const [profileComplete, setProfileComplete] = useState<number>(0)
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0, failed: false, message: '', file: null
  })
  const uploadingRef = useRef(false)
  const [locationNames, setLocationNames] = useState<{ native: string; current: string; job: string }>({ native: '', current: '', job: '' })
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(DEFAULT_OPEN))
  // A ref, not state: the scroll has to happen after `openSections` commits, and
  // storing the target in state made the effect re-run the moment it cleared
  // itself — whose cleanup then cancelled the fallback timer below before it
  // could fire.
  const jumpTargetRef = useRef<string | null>(null)
  const fallbackTimer = useRef<number | null>(null)
  const [options, setOptions] = useState<OptionsMap>({})
  /** mool key → the gotras that mool belongs to. Empty until /api/options loads. */
  const [moolGotra, setMoolGotra] = useState<Record<string, string[]>>({})
  /** Preferred-location id → place name, so the chips read as places not numbers. */
  const [prefLocationNames, setPrefLocationNames] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/options?types=religion,mother_tongue,marital_status,gotra,mool,caste,sub_caste,industry,employment_type,work_type,diet,family_type,family_values,managed_by,rashi,nakshatra,manglik,income_range,contact_relation,children_pref,living_arrangement,career_pref,marriage_timeline,manglik_pref,education_level')
      .then(r => r.json())
      .then(j => {
        if (j.ok && j.options) setOptions(j.options as OptionsMap)
        if (j.ok && j.moolGotra) setMoolGotra(j.moolGotra as Record<string, string[]>)
      })
      .catch(() => { /* non-fatal: selects fall back to stored value only */ })
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    fetch('/api/profile', { signal: ac.signal })
      .then(async r => {
        // Only an actual auth failure should send someone to /login. Previously
        // *any* rejection here did, so a transient network blip looked exactly
        // like a logout and silently discarded whatever was on screen.
        if (r.status === 401) { router.push('/login'); return null }
        if (!r.ok) throw new Error(`profile load failed: ${r.status}`)
        return r.json()
      })
      .then(j => {
        if (!j) return
        if (j.profile) {
          const p = j.profile
          setProfileComplete(p.profile_complete ?? 0)
          setForm({
            profile_for: p.profile_for ?? 'self',
            first_name: p.first_name ?? '',
            last_name: p.last_name ?? '',
            gender: p.gender ?? '',
            dob: p.dob ?? '',
            religion: p.religion ?? 'hindu',
            caste: p.caste ?? '',
            sub_caste: p.sub_caste ?? '',
            self_gotra: p.self_gotra ?? '',
            maternal_gotra: p.maternal_gotra ?? '',
            mool: p.mool ?? '',
            gram: p.gram ?? '',
            native_place_id: p.native_place_id ?? null,
            current_loc_id: p.current_loc_id ?? null,
            job_loc_id: p.job_loc_id ?? null,
            height_cm: p.height_cm?.toString() ?? '',
            diet: p.diet ?? '',
            smoking: p.smoking ?? '',
            drinking: p.drinking ?? '',
            marriage_timeline: p.marriage_timeline ?? '',
            education_detail: p.education_detail ?? '',
            profession_detail: p.profession_detail ?? '',
            employer: p.employer ?? '',
            about_me: p.about_me ?? '',
            family_about: p.family_about ?? '',
            discoverable: p.discoverable ?? false,
            visibility: p.visibility ?? (p.discoverable ? 'members' : 'private'),
            marital_status: p.marital_status ?? '',
            mother_tongue: p.mother_tongue ?? '',
            degree: p.degree ?? '',
            education_level_id: p.education_level_id?.toString() ?? '',
            specialization: p.specialization ?? '',
            institution: p.institution ?? '',
            passing_year: p.passing_year?.toString() ?? '',
            employment_type: p.employment_type ?? '',
            industry: p.industry ?? '',
            job_title: p.job_title ?? '',
            experience_years: p.experience_years?.toString() ?? '',
            work_type: p.work_type ?? '',
            family_type: p.family_type ?? '',
            managed_by: p.managed_by ?? '',
            family_values: p.family_values ?? '',
            parents_info: p.parents_info ?? '',
            siblings_info: p.siblings_info ?? '',
            family_expectations: p.family_expectations ?? '',
            family_introduction: p.family_introduction ?? '',
            income_min_lpa: j.private?.income_min_lpa?.toString() ?? '',
            income_max_lpa: j.private?.income_max_lpa?.toString() ?? '',
            income_range: j.private?.income_range ?? '',
            contact_relation: j.private?.contact_relation ?? '',
            rashi: j.private?.rashi ?? '',
            nakshatra: j.private?.nakshatra ?? '',
            mangalik: j.private?.mangalik ?? '',
            birth_time: j.private?.birth_time ?? '',
            birth_place: j.private?.birth_place ?? '',
            contact_mobile: j.private?.contact_mobile ?? '',
            contact_email: j.private?.contact_email ?? '',
            address: j.private?.address ?? '',
            kundli_url: j.private?.kundli_url ?? '',
            photo_visibility: j.private?.photo_visibility ?? '',
            pref_age_min: j.preferences?.pref_age_min?.toString() ?? '',
            pref_age_max: j.preferences?.pref_age_max?.toString() ?? '',
            pref_gender: j.preferences?.pref_gender ?? '',
            pref_caste: Array.isArray(j.preferences?.pref_caste) ? j.preferences.pref_caste.join(', ') : '',
            pref_gotra_safe: j.preferences?.pref_gotra_safe ?? true,
            pref_education: Array.isArray(j.preferences?.pref_education) ? j.preferences.pref_education.join(', ') : '',
            pref_location: Array.isArray(j.preferences?.pref_location) ? j.preferences.pref_location.join(', ') : '',
            pref_diet: Array.isArray(j.preferences?.pref_diet) ? j.preferences.pref_diet.join(', ') : '',
            pref_profession: Array.isArray(j.preferences?.pref_profession) ? j.preferences.pref_profession.join(', ') : '',
            pref_marital_status: Array.isArray(j.preferences?.pref_marital_status) ? j.preferences.pref_marital_status.join(', ') : '',
            pref_children: j.preferences?.pref_children ?? '',
            pref_living_arrangement: j.preferences?.pref_living_arrangement ?? '',
            pref_career: j.preferences?.pref_career ?? '',
            pref_marriage_timeline: j.preferences?.pref_marriage_timeline ?? '',
            pref_manglik: j.preferences?.pref_manglik ?? '',
            pref_notes: j.preferences?.pref_notes ?? '',
          })
          setLocationNames({ native: j.native_place_name ?? '', current: j.current_loc_name ?? '', job: j.job_loc_name ?? '' })
        }
        setPhotos(j.photos ?? [])
        if (j.pref_location_names) setPrefLocationNames(j.pref_location_names as Record<string, string>)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[profile/edit] load failed:', err)
        setLoading(false)
        setError('Could not load your profile. Check your connection and reload the page.')
      })

    return () => ac.abort()
  }, [router])

  const set = (key: keyof FormData, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }))

  // Preferred gender follows from the profile's own gender: a groom's family is
  // looking for a bride. Only ever seeded when the family has not answered —
  // never overwrites a deliberate choice, and never fights the user mid-edit.
  const genderSeeded = useRef(false)
  useEffect(() => {
    if (loading || genderSeeded.current) return
    if (!form.gender || form.pref_gender) { genderSeeded.current = !!form.pref_gender; return }
    const opposite = form.gender === 'male' ? 'female' : form.gender === 'female' ? 'male' : ''
    if (!opposite) return
    genderSeeded.current = true
    setForm(f => (f.pref_gender ? f : { ...f, pref_gender: opposite }))
  }, [loading, form.gender, form.pref_gender])

  // Deep-link support: /profile/edit#community opens that section and scrolls to
  // it once the form has loaded. The profile-completion checklist on /profile
  // links straight to the section a member still needs to fill, so without this
  // they would land at the top of a long form with that section collapsed. Runs
  // once, after loading clears, reusing the same jump machinery as the top chips.
  useEffect(() => {
    if (loading) return
    const id = window.location.hash.replace(/^#/, '').replace(/-section$/, '')
    if (!id) return
    jumpTargetRef.current = id
    setOpenSections(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  useEffect(() => {
    const id = jumpTargetRef.current
    if (!id) return
    jumpTargetRef.current = null
    const el = document.getElementById(`section-heading-${id}`)
    if (!el) return

    const target = el.getBoundingClientRect().top + window.scrollY - 12
    const start = window.scrollY
    window.scrollTo({ top: target, behavior: 'smooth' })

    // Smooth scrolling is a silent no-op in several embedded browsers — the
    // WhatsApp and Instagram in-app webviews among them, which is how a lot of
    // people will open a link to their own profile. Navigation that does
    // nothing is worse than navigation without the animation, so if the page
    // has not begun moving shortly after, jump.
    //
    // The timer is held in a ref rather than cancelled from this effect's
    // cleanup, because React's development double-invoke runs that cleanup
    // immediately and killed the fallback every time.
    if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current)
    fallbackTimer.current = window.setTimeout(() => {
      // `behavior: 'instant'` is required, not merely tidy: the stylesheet sets
      // `scroll-behavior: smooth` on <html>, so omitting it makes the fallback
      // smooth as well — and therefore just as broken as what it is rescuing.
      if (Math.abs(window.scrollY - start) < 4) window.scrollTo({ top: target, behavior: 'instant' })
    }, 250)
  }, [openSections])

  useEffect(() => () => {
    if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current)
  }, [])

  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return

    // Collapsed sections are unmounted, not hidden — which is deliberate (a
    // hidden `required` input blocks submission in some browsers with no
    // visible reason). The cost is that the browser can no longer enforce
    // `required` for a section that is closed, so the check happens here, and
    // opens the section it is complaining about.
    const missing = ([
      ['first_name', 'your first name'],
      ['gender', 'gender'],
      ['dob', 'date of birth'],
    ] as const).filter(([key]) => !String(form[key] ?? '').trim())

    if (missing.length > 0) {
      jumpToSection('basic')
      setSaveState('error')
      setError(`Please fill in ${missing.map(([, label]) => label).join(', ')} before saving.`)
      return
    }

    // Cheap client-side guard: the API rejects an inverted range, but catching
    // it here avoids a round trip and points at the offending field.
    const ageMin = form.pref_age_min ? parseInt(form.pref_age_min) : null
    const ageMax = form.pref_age_max ? parseInt(form.pref_age_max) : null
    if (ageMin != null && ageMax != null && ageMin > ageMax) {
      setSaveState('error')
      setError('Partner preferences: minimum age cannot be greater than maximum age.')
      return
    }

    setSaving(true)
    setSaveState('saving')
    setError('')

    const payload = {
      ...form,
      height_cm: form.height_cm ? parseInt(form.height_cm) : null,
      native_place_id: form.native_place_id,
      current_loc_id: form.current_loc_id,
      job_loc_id: form.job_loc_id,
      passing_year: form.passing_year ? parseInt(form.passing_year) : null,
      education_level_id: form.education_level_id ? parseInt(form.education_level_id) : null,
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      // Only the band is sent; the API derives income_min_lpa / income_max_lpa
      // from it, so there is one copy of that mapping rather than two that can
      // drift apart.
      income_range: form.income_range || null,
      contact_relation: form.contact_relation || null,
      pref_age_min: form.pref_age_min ? parseInt(form.pref_age_min) : null,
      pref_age_max: form.pref_age_max ? parseInt(form.pref_age_max) : null,
      pref_caste: form.pref_caste.split(',').map(v => v.trim()).filter(Boolean),
      pref_education: form.pref_education.split(',').map(v => parseInt(v.trim(), 10)).filter(Number.isFinite),
      pref_location: form.pref_location.split(',').map(v => parseInt(v.trim(), 10)).filter(Number.isFinite),
      pref_diet: form.pref_diet.split(',').map(v => v.trim()).filter(Boolean),
      pref_profession: form.pref_profession.split(',').map(v => v.trim()).filter(Boolean),
      pref_marital_status: form.pref_marital_status.split(',').map(v => v.trim()).filter(Boolean),
    }

    try {
      const r = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      // A 500 returning an HTML error page would make r.json() throw and get
      // reported as a network error; check the status first.
      const j = r.headers.get('content-type')?.includes('application/json')
        ? await r.json()
        : { ok: false, message: `Save failed (${r.status}). Please try again.` }

      if (j.ok) {
        // The save already succeeded. The completion-percentage refresh below is
        // cosmetic, so its failure must NOT be reported as a failed save — that
        // previously told people their changes were lost when they were not.
        setSaveState('success')
        try {
          const r2 = await fetch('/api/profile')
          if (r2.ok) {
            const j2 = await r2.json()
            if (j2.profile?.profile_complete != null) setProfileComplete(j2.profile.profile_complete)
          }
        } catch (err) {
          console.error('[profile/edit] completion refresh failed (save itself succeeded):', err)
        }
      } else {
        setSaveState('error')
        setError(j.message ?? 'Failed to save. Please try again.')
      }
    } catch (err) {
      console.error('[profile/edit] save failed:', err)
      setSaveState('error')
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Photo helpers ────────────────────────────────────────────────────────────
  function compressImage(file: File): Promise<File> {
    const MAX_DIM = 1200
    const QUALITY = 0.85
    if (file.type === 'image/heic' || file.type === 'image/heif') return Promise.resolve(file)
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        const { width, height } = img
        let newW = width, newH = height
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
          newW = Math.round(width * ratio)
          newH = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = newW; canvas.height = newH
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, newW, newH)
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Compression failed')); return }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          },
          'image/jpeg', QUALITY
        )
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
      img.src = url
    })
  }

  function uploadWithXhr(file: File, onProgress: (pct: number) => void): Promise<{ ok: boolean; photo_id?: string; message?: string }> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      const fd = new globalThis.FormData()
      fd.append('photo', file)
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
      xhr.onload = () => { try { resolve(JSON.parse(xhr.responseText)) } catch { resolve({ ok: false, message: 'Upload failed' }) } }
      xhr.onerror = () => resolve({ ok: false, message: 'Network error. Please try again.' })
      xhr.ontimeout = () => resolve({ ok: false, message: 'Upload timed out. Please try again.' })
      xhr.timeout = 120000
      xhr.open('POST', '/api/profile/photos')
      xhr.send(fd)
    })
  }

  async function doUpload(file: File) {
    if (uploadingRef.current) return
    uploadingRef.current = true
    setUploadState({ progress: 0, failed: false, message: '', file })
    setError('')

    let compressed: File
    try {
      compressed = await compressImage(file)
    } catch {
      compressed = file
    }

    const result = await uploadWithXhr(compressed, (pct) =>
      setUploadState(s => ({ ...s, progress: pct }))
    )
    uploadingRef.current = false

    if (result.ok) {
      // Show local preview immediately (status = pending_moderation)
      const preview = URL.createObjectURL(file)
      setPhotos(prev => [...prev, {
        id: result.photo_id!,
        is_primary: prev.length === 0,
        status: 'pending_moderation',
        display_order: prev.length,
        signed_url: null,
        local_preview: preview,
      }])
      setUploadState({ progress: 0, failed: false, message: '', file: null })
    } else {
      setUploadState(s => ({ ...s, progress: 0, failed: true, message: result.message ?? 'Upload failed. Please try again.' }))
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await doUpload(file)
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm('Remove this photo?')) return
    const r = await fetch(`/api/profile/photos/${photoId}`, { method: 'DELETE' })
    const j = await r.json()
    if (j.ok) setPhotos(p => p.filter(x => x.id !== photoId))
    else setError('Failed to delete photo.')
  }

  async function handleSetPrimaryPhoto(photoId: string) {
    setError('')
    try {
      const r = await fetch(`/api/profile/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      const j = await r.json()
      if (j.ok) setPhotos(current => current.map(photo => ({ ...photo, is_primary: photo.id === photoId })))
      else setError(j.message ?? 'Only approved photos can be set as primary.')
    } catch {
      setError('Network error. Could not update the primary photo.')
    }
  }

  // ── Mool → gotra. The mool is the fact a Maithil family actually knows; the
  //    gotra follows from it. So once a mool is chosen the gotra list is narrowed
  //    to the gotras that mool belongs to, which both saves a decision and stops
  //    a contradictory pair being saved. A mool with no recorded link (or the
  //    "not listed" fallback) leaves the full list alone rather than blocking.
  const allGotras = options.gotra ?? []
  const linkedGotras = form.mool ? (moolGotra[form.mool] ?? []) : []
  const gotraOptionsForMool =
    linkedGotras.length > 0
      ? allGotras.filter(o => linkedGotras.includes(o.value) || o.value === 'other')
      : allGotras

  const moolGotraHint = (() => {
    if (!form.mool || form.mool === 'other') return undefined
    if (linkedGotras.length === 0) return 'No gotra recorded for this mool — please pick it yourself.'
    const names = linkedGotras
      .map(g => allGotras.find(o => o.value === g)?.label ?? g)
      .join(', ')
    return linkedGotras.length === 1
      ? `Gotra for this mool: ${names}.`
      : `This mool appears under ${linkedGotras.length} gotras: ${names}. Pick the one your family follows.`
  })()

  if (loading) {
    return (
      <main id="main-content" className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-soft">Loading profile…</p>
      </main>
    )
  }

  // Per-section counters for the collapsed headers. `pref_gotra_safe` and
  // `discoverable` are excluded from SECTION_FIELDS on purpose: both default to
  // a sensible value, so counting them would show progress nobody made.
  const sectionProgress = Object.fromEntries(
    Object.entries(SECTION_FIELDS).map(([key, fields]) => [
      key,
      {
        filled: (fields as readonly (keyof FormData)[]).filter(f => {
          const v = form[f]
          return v !== '' && v !== null && v !== undefined
        }).length,
        total: fields.length,
      },
    ]),
  ) as Record<keyof typeof SECTION_FIELDS, { filled: number; total: number }>

  // Each chip jumps to its section, so the summary at the top is navigation
  // rather than decoration — the point of collapsing the form is that you can
  // get to the one thing you came to change without scrolling past ninety
  // inputs.
  const sections = [
    { id: 'basic',       label: 'Basic Info',         done: !!(form.first_name && form.gender && form.dob) },
    { id: 'community',   label: 'Community',          done: !!(form.caste) },
    { id: 'location',    label: 'Location',           done: !!(form.current_loc_id) },
    { id: 'career',      label: 'Education & Career', done: !!(form.education_detail || form.profession_detail) },
    { id: 'lifestyle',   label: 'Lifestyle',          done: !!(form.diet || form.marriage_timeline) },
    { id: 'about',       label: 'About Me',           done: !!(form.about_me) },
    { id: 'photos',      label: 'Photos',             done: photos.some(p => p.status === 'approved' || p.status === 'pending_moderation') },
    { id: 'preferences', label: 'Preferences',        done: !!(form.pref_age_min || form.pref_age_max || form.pref_caste) },
  ]
  const doneSections = sections.filter(s => s.done).length

  function jumpToSection(id: string) {
    // The scroll is deferred to an effect rather than done here: opening the
    // section is a state update, and scrolling in the same tick (or in a
    // requestAnimationFrame) measures the layout React has not committed yet.
    // Doing that left the page at the top instead of at the section.
    jumpTargetRef.current = id
    // A fresh Set even when the section is already open, so the effect's
    // dependency always changes and the jump always runs.
    setOpenSections(prev => new Set(prev).add(id))
  }

  return (
    <main className="min-h-screen bg-paper py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ── Progress header ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-serif text-2xl text-ink">Edit Profile</h1>
            <span className="text-sm font-semibold text-maroon">{profileComplete}% complete</span>
          </div>
          <div className="w-full bg-ink/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-maroon rounded-full transition-all duration-700"
              style={{ width: `${profileComplete}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sections.map(s => (
              <button
                key={s.label}
                type="button"
                onClick={() => jumpToSection(s.id)}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors hover:border-maroon ${
                  s.done
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-paper border-ink/20 text-ink-soft'
                }`}
              >
                <span aria-hidden="true">{s.done ? '✓' : '○'}</span>
                {s.label}
                <span className="sr-only">{s.done ? ' — done' : ' — not filled in'}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3 pb-4">
          <FormSection
            id="basic"
            title="Basic information"
            subtitle="Name, gender, date of birth, height."
            filled={sectionProgress.basic.filled}
            total={sectionProgress.basic.total}
            open={openSections.has('basic')}
            onToggle={toggleSection}
          >
            <div className="space-y-4">
              <div>
                <span className="block text-sm font-medium text-ink mb-1.5">This profile is for</span>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(['self', 'son', 'daughter', 'sibling', 'other'] as const).map(v => (
                <label key={v} className={`flex items-center justify-center py-2 px-3 border rounded-mj-sm cursor-pointer text-sm font-medium transition-colors
                  ${form.profile_for === v ? 'border-maroon bg-maroon text-cream' : 'border-ink/20 text-ink hover:border-maroon'}`}>
                  <input type="radio" className="sr-only" name="profile_for" value={v}
                    checked={form.profile_for === v} onChange={() => set('profile_for', v)} />
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </label>
              ))}
            </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">First Name *</label>
                  <input required type="text" maxLength={100} value={form.first_name}
                    onChange={e => set('first_name', e.target.value)}
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Last Name</label>
                  <input type="text" maxLength={100} value={form.last_name}
                    onChange={e => set('last_name', e.target.value)}
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Gender *</label>
                  <select required value={form.gender} onChange={e => set('gender', e.target.value)}
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white">
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Date of Birth *</label>
                  <input required type="date" value={form.dob}
                    max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    onChange={e => set('dob', e.target.value)}
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
              </div>

              <HeightField cm={form.height_cm} onChange={v => set('height_cm', v)} />

              <MasterSelect label="Marital Status" value={form.marital_status}
                opts={options.marital_status ?? []} onChange={v => set('marital_status', v)} />

              <MasterSelect label="Mother Tongue" value={form.mother_tongue}
                opts={options.mother_tongue ?? []} onChange={v => set('mother_tongue', v)} />
            </div>
          </FormSection>

          <FormSection
            id="community"
            title="Community"
            subtitle="Caste, gotra, mool and gram — used for gotra-safe matching."
            filled={sectionProgress.community.filled}
            total={sectionProgress.community.total}
            open={openSections.has('community')}
            onToggle={toggleSection}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <MasterCombo label="Religion" value={form.religion}
                  opts={options.religion ?? []} onChange={v => set('religion', v)} allowOther={false} />
                <MasterCombo label="Caste" value={form.caste}
                  opts={options.caste ?? []} onChange={v => set('caste', v)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MasterCombo label="Sub-caste" value={form.sub_caste}
                  opts={options.sub_caste ?? []} onChange={v => set('sub_caste', v)} />
                <MasterCombo
                  label="Mool"
                  value={form.mool}
                  opts={options.mool ?? []}
                  hint={moolGotraHint}
                  onChange={v => {
                    // Choosing a mool settles the gotra in most cases, so fill it
                    // in rather than asking the same question twice. Only when the
                    // mool maps to exactly one gotra, and only when the member has
                    // not already chosen one — never overwrite their answer.
                    const linked = moolGotra[v] ?? []
                    if (linked.length === 1 && !form.self_gotra) {
                      setForm(f => ({ ...f, mool: v, self_gotra: linked[0] }))
                    } else {
                      set('mool', v)
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MasterCombo label="Self Gotra" value={form.self_gotra}
                  opts={gotraOptionsForMool} onChange={v => set('self_gotra', v)} />
                <MasterCombo label="Maternal Gotra" value={form.maternal_gotra}
                  opts={options.gotra ?? []} onChange={v => set('maternal_gotra', v)} />
              </div>

              <GramField value={form.gram} onChange={v => set('gram', v)} />
            </div>
          </FormSection>

          <FormSection
            id="location"
            title="Location"
            subtitle="Native place, where you live, where you work."
            filled={sectionProgress.location.filled}
            total={sectionProgress.location.total}
            open={openSections.has('location')}
            onToggle={toggleSection}
          >
            <p className="text-xs text-ink-soft mb-4">
              India only. Pick a place from the suggestions — matches are made on the place you select,
              so free text is not stored.
            </p>
            <div className="space-y-4">
              <LocationPicker
                label="Native Place"
                value={form.native_place_id}
                initialName={locationNames.native}
                hint="Your ancestral district or village in Mithila. Used for community matching."
                onChange={(id, name) => {
                  set('native_place_id', id)
                  setLocationNames(n => ({ ...n, native: name }))
                }}
              />
              <LocationPicker
                label="Current Location"
                value={form.current_loc_id}
                initialName={locationNames.current}
                hint="Where you live now — this is what “same city” matching scores on."
                onChange={(id, name) => {
                  set('current_loc_id', id)
                  setLocationNames(n => ({ ...n, current: name }))
                }}
              />
              <LocationPicker
                label="Work Location"
                value={form.job_loc_id}
                initialName={locationNames.job}
                hint="Leave blank if it is the same as your current location."
                onChange={(id, name) => {
                  set('job_loc_id', id)
                  setLocationNames(n => ({ ...n, job: name }))
                }}
              />
            </div>
          </FormSection>

          <FormSection
            id="photos"
            title="Photos"
            subtitle="Reviewed before they go live. Up to 5."
            open={openSections.has('photos')}
            onToggle={toggleSection} anchorId="photos-section"
          >
            <p className="text-xs text-ink-soft mb-4">
              Photos are reviewed by our team. Max 5 photos, 5 MB each. JPEG, PNG, WebP, HEIC accepted.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {photos.map(photo => (
                <div key={photo.id} className="relative rounded-mj-sm overflow-hidden border border-ink/10 bg-cream aspect-square">
                  {(photo.signed_url || photo.local_preview) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.signed_url ?? photo.local_preview!} alt="Profile photo"
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-soft text-xs">No preview</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-ink/70 px-2 py-1 flex items-center justify-between">
                    <span className={`text-[10px] font-medium ${
                      photo.status === 'approved' ? 'text-green-300' :
                      photo.status === 'rejected' ? 'text-red-300' : 'text-amber-300'
                    }`}>
                      {photo.is_primary && '★ '}
                      {photo.status === 'pending_moderation' ? 'Under review' :
                       photo.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                    <div className="flex items-center gap-2">
                      {!photo.is_primary && (
                        <button type="button" onClick={() => void handleSetPrimaryPhoto(photo.id)} disabled={photo.status !== 'approved'}
                          className="text-white text-[10px] hover:text-gold-lt transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                          {photo.status === 'approved' ? 'Set primary' : 'Awaiting review'}
                        </button>
                      )}
                      <button type="button" onClick={() => handleDeletePhoto(photo.id)}
                        className="text-white text-[10px] hover:text-red-300 transition-colors">Remove</button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Upload progress card */}
              {uploadState.file && !uploadState.failed && (
                <div className="relative rounded-mj-sm border border-maroon/30 bg-cream aspect-square flex flex-col items-center justify-center gap-2 px-3">
                  <div className="w-full bg-ink/10 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-maroon rounded-full transition-all duration-200"
                      style={{ width: `${uploadState.progress}%` }} />
                  </div>
                  <p className="text-xs text-ink-soft text-center">
                    {uploadState.progress < 100 ? `Uploading… ${uploadState.progress}%` : 'Processing…'}
                  </p>
                </div>
              )}

              {/* Failed upload retry card */}
              {uploadState.failed && uploadState.file && (
                <div className="relative rounded-mj-sm border-2 border-red-200 bg-red-50 aspect-square flex flex-col items-center justify-center gap-2 px-3">
                  <p className="text-[10px] text-red-600 text-center leading-tight">{uploadState.message}</p>
                  <button type="button"
                    onClick={() => { if (uploadState.file) doUpload(uploadState.file) }}
                    className="text-xs text-maroon border border-maroon/30 rounded px-2 py-1 hover:bg-maroon/5">
                    Retry
                  </button>
                </div>
              )}

              {/* Add photo button */}
              {photos.length < 5 && !uploadState.file && (
                <label className="aspect-square rounded-mj-sm border-2 border-dashed border-ink/20 flex flex-col items-center justify-center cursor-pointer hover:border-maroon transition-colors bg-cream">
                  <span className="text-2xl text-ink-soft">+</span>
                  <span className="text-xs text-ink-soft mt-1">Add photo</span>
                  <input ref={fileRef} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/heic"
                    onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          </FormSection>

          <FormSection
            id="about"
            title="About you"
            subtitle="A few lines in your own words."
            filled={sectionProgress.about.filled}
            total={sectionProgress.about.total}
            open={openSections.has('about')}
            onToggle={toggleSection}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  About Me <span className="text-ink-soft font-normal">({form.about_me.length}/1000)</span>
                </label>
                <textarea rows={4} maxLength={1000} value={form.about_me}
                  onChange={e => set('about_me', e.target.value)}
                  placeholder="A short introduction about yourself…"
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon resize-none" />
              </div>
            </div>
          </FormSection>

          <FormSection
            id="education"
            title="Education"
            subtitle="Qualification level, degree, specialisation, institution."
            filled={sectionProgress.education.filled}
            total={sectionProgress.education.total}
            open={openSections.has('education')}
            onToggle={toggleSection}
          >
            <div className="space-y-4">
              {/* The qualification level, asked first because it is what a family
                  filters on before reading the degree name. This is the one field
                  in the section with a fixed answer set, so it is a picker; the
                  rest stay free text because degree names vary endlessly. */}
              <MasterCombo label="Qualification level" value={form.education_level_id}
                opts={options.education_level ?? []} onChange={v => set('education_level_id', v)}
                placeholder="Graduate, Post Graduate…" allowOther={false} />

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Education summary</label>
                <input type="text" maxLength={500} value={form.education_detail}
                  onChange={e => set('education_detail', e.target.value)}
                  placeholder="e.g. B.Tech Computer Science, IIT Delhi"
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Degree</label>
                  <input type="text" maxLength={200} value={form.degree}
                    onChange={e => set('degree', e.target.value)}
                    placeholder="e.g. B.Tech, MBA"
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Specialization</label>
                  <input type="text" maxLength={200} value={form.specialization}
                    onChange={e => set('specialization', e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Institution</label>
                  <input type="text" maxLength={200} value={form.institution}
                    onChange={e => set('institution', e.target.value)}
                    placeholder="e.g. IIT Delhi"
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Passing Year</label>
                  <input type="number" min={1950} max={new Date().getFullYear() + 1} value={form.passing_year}
                    onChange={e => set('passing_year', e.target.value)}
                    placeholder="e.g. 2018"
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            id="career"
            title="Career"
            subtitle="Role, employer, industry, experience."
            filled={sectionProgress.career.filled}
            total={sectionProgress.career.total}
            open={openSections.has('career')}
            onToggle={toggleSection}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <MasterSelect label="Employment Type" value={form.employment_type}
                  opts={options.employment_type ?? []} onChange={v => set('employment_type', v)} />
                <MasterSelect label="Industry" value={form.industry}
                  opts={options.industry ?? []} onChange={v => set('industry', v)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Job Title</label>
                  <input type="text" maxLength={200} value={form.job_title}
                    onChange={e => set('job_title', e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Company / Employer</label>
                  <input type="text" maxLength={500} value={form.employer}
                    onChange={e => set('employer', e.target.value)}
                    placeholder="e.g. Infosys, Self-employed"
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Profession Summary</label>
                <input type="text" maxLength={500} value={form.profession_detail}
                  onChange={e => set('profession_detail', e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Experience (years)</label>
                  <input type="number" min={0} max={70} value={form.experience_years}
                    onChange={e => set('experience_years', e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
                <MasterSelect label="Work Type" value={form.work_type}
                  opts={options.work_type ?? []} onChange={v => set('work_type', v)} />
              </div>
            </div>
          </FormSection>

          <FormSection
            id="lifestyle"
            title="Lifestyle & timeline"
            subtitle="Diet, habits, and when you are looking to marry."
            filled={sectionProgress.lifestyle.filled}
            total={sectionProgress.lifestyle.total}
            open={openSections.has('lifestyle')}
            onToggle={toggleSection}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Diet</label>
                <select value={form.diet} onChange={e => set('diet', e.target.value)}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white">
                  <option value="">Select…</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="non_vegetarian">Non-vegetarian</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Looking to marry</label>
                <select value={form.marriage_timeline} onChange={e => set('marriage_timeline', e.target.value)}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white">
                  <option value="">Select…</option>
                  <option value="within_3_months">Within 3 months</option>
                  <option value="within_6_months">Within 6 months</option>
                  <option value="within_1_year">Within 1 year</option>
                  <option value="within_2_years">Within 2 years</option>
                  <option value="no_rush">No rush</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Smoking</label>
                <select value={form.smoking} onChange={e => set('smoking', e.target.value)}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white">
                  <option value="">Select…</option>
                  <option value="no">No</option>
                  <option value="occasionally">Occasionally</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Drinking</label>
                <select value={form.drinking} onChange={e => set('drinking', e.target.value)}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white">
                  <option value="">Select…</option>
                  <option value="no">No</option>
                  <option value="occasionally">Occasionally</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection
            id="family"
            title="Family"
            subtitle="Family type, values, and who is managing this profile."
            filled={sectionProgress.family.filled}
            total={sectionProgress.family.total}
            open={openSections.has('family')}
            onToggle={toggleSection}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <MasterSelect label="Profile Managed By" value={form.managed_by}
                  opts={options.managed_by ?? []} onChange={v => set('managed_by', v)} />
                <MasterSelect label="Family Type" value={form.family_type}
                  opts={options.family_type ?? []} onChange={v => set('family_type', v)} />
              </div>
              <MasterSelect label="Family Values" value={form.family_values}
                opts={options.family_values ?? []} onChange={v => set('family_values', v)} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Parents</label>
                  <textarea rows={2} maxLength={200} value={form.parents_info}
                    onChange={e => set('parents_info', e.target.value)}
                    placeholder="e.g. Father — retired teacher; Mother — homemaker"
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Siblings</label>
                  <textarea rows={2} maxLength={200} value={form.siblings_info}
                    onChange={e => set('siblings_info', e.target.value)}
                    placeholder="e.g. One elder sister, married"
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon resize-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  About Our Family <span className="text-ink-soft font-normal">({form.family_about.length}/1000)</span>
                </label>
                <textarea rows={3} maxLength={1000} value={form.family_about}
                  onChange={e => set('family_about', e.target.value)}
                  placeholder="About your family background…"
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Family Introduction</label>
                <textarea rows={2} maxLength={200} value={form.family_introduction}
                  onChange={e => set('family_introduction', e.target.value)}
                  placeholder="A short introduction to your family…"
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Family Expectations</label>
                <textarea rows={2} maxLength={200} value={form.family_expectations}
                  onChange={e => set('family_expectations', e.target.value)}
                  placeholder="What your family is looking for…"
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon resize-none" />
              </div>
            </div>
          </FormSection>

          <FormSection
            id="preferences"
            title="Partner preferences"
            subtitle="What you are looking for. Drives your match scores."
            filled={sectionProgress.preferences.filled}
            total={sectionProgress.preferences.total}
            open={openSections.has('preferences')}
            onToggle={toggleSection}
          >
            <p className="text-xs text-ink-soft mb-4">
              Leave anything blank to mean &ldquo;no preference&rdquo; — a blank field never narrows your matches.
            </p>
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Age from</label>
                  <input type="number" min={18} max={90} value={form.pref_age_min}
                    onChange={e => set('pref_age_min', e.target.value)}
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Age to</label>
                  <input type="number" min={18} max={90} value={form.pref_age_max}
                    onChange={e => set('pref_age_max', e.target.value)}
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon" />
                </div>
                <div>
                  <label htmlFor="pref-gender" className="block text-sm font-medium text-ink mb-1">Looking for</label>
                  <select id="pref-gender" value={form.pref_gender} onChange={e => set('pref_gender', e.target.value)}
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon">
                    <option value="">Any</option>
                    <option value="female">A bride (female)</option>
                    <option value="male">A groom (male)</option>
                  </select>
                  {/* Set from the profile's own gender when the family has not
                      chosen otherwise — see the effect that seeds it. */}
                  <p className="mt-1 text-xs text-ink-soft">Set from your profile; change it if you need to.</p>
                </div>
              </div>

              <MultiChips label="Preferred caste / community" value={form.pref_caste}
                opts={options.caste ?? []} onChange={v => set('pref_caste', v)} />

              <MultiChips label="Preferred education level" value={form.pref_education}
                opts={options.education_level ?? []} onChange={v => set('pref_education', v)} />

              <MultiLocation label="Preferred locations" ids={form.pref_location} names={prefLocationNames}
                onChange={(ids, names) => { set('pref_location', ids); setPrefLocationNames(names) }} />

              <div className="grid grid-cols-2 gap-5">
                <MultiChips label="Preferred diet" value={form.pref_diet}
                  opts={options.diet ?? []} onChange={v => set('pref_diet', v)} />
                <MultiChips label="Preferred marital status" value={form.pref_marital_status}
                  opts={options.marital_status ?? []} onChange={v => set('pref_marital_status', v)} />
              </div>

              <MultiChips label="Preferred profession / industry" value={form.pref_profession}
                opts={options.industry ?? []} onChange={v => set('pref_profession', v)} />

              <div className="grid grid-cols-2 gap-4">
                <MasterCombo label="Children" value={form.pref_children}
                  opts={options.children_pref ?? []} onChange={v => set('pref_children', v)}
                  placeholder="No preference" allowOther={false} />
                <MasterCombo label="Living arrangement" value={form.pref_living_arrangement}
                  opts={options.living_arrangement ?? []} onChange={v => set('pref_living_arrangement', v)}
                  placeholder="No preference" allowOther={false} />
                <MasterCombo label="Career after marriage" value={form.pref_career}
                  opts={options.career_pref ?? []} onChange={v => set('pref_career', v)}
                  placeholder="No preference" allowOther={false} />
                <MasterCombo label="Marriage timeline" value={form.pref_marriage_timeline}
                  opts={options.marriage_timeline ?? []} onChange={v => set('pref_marriage_timeline', v)}
                  placeholder="No preference" allowOther={false} />
                <MasterCombo label="Manglik" value={form.pref_manglik}
                  opts={options.manglik_pref ?? []} onChange={v => set('pref_manglik', v)}
                  placeholder="Does not matter" allowOther={false} />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Anything else</label>
                <textarea value={form.pref_notes} onChange={e => set('pref_notes', e.target.value)} rows={3}
                  placeholder="Anything else that matters to your family."
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon" />
              </div>

              <label className="flex items-start gap-2 text-sm text-ink">
                <input type="checkbox" className="mt-0.5" checked={form.pref_gotra_safe}
                  onChange={e => set('pref_gotra_safe', e.target.checked)} />
                <span>
                  Keep gotra safety rules enabled
                  <span className="block text-xs text-ink-soft">Hides matches that share your gotra.</span>
                </span>
              </label>
            </div>
          </FormSection>

          <FormSection
            id="private"
            title="Private details"
            subtitle="Horoscope, income and contact. Never shown in search."
            filled={sectionProgress.private.filled}
            total={sectionProgress.private.total}
            open={openSections.has('private')}
            onToggle={toggleSection}
          >
            <p className="text-xs text-ink-soft mb-4">These details are stored securely and are only shared according to your privacy settings.</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Income as one chosen band. Two "LPA" number boxes asked members
                  to translate their salary into a pair of integers, which is why
                  the field was mostly empty; the band is what a family discusses
                  anyway. The stored min/max are derived from it on save. */}
              <div className="col-span-2">
                <MasterCombo label="Annual income" value={form.income_range}
                  opts={options.income_range ?? []} onChange={v => set('income_range', v)}
                  placeholder="Select a range…" allowOther={false}
                  hint="Shown only as a range, and only per your privacy settings." />
              </div>

              <MasterCombo label="Rashi (moon sign)" value={form.rashi}
                opts={options.rashi ?? []} onChange={v => set('rashi', v)} allowOther={false} />
              <MasterCombo label="Nakshatra" value={form.nakshatra}
                opts={options.nakshatra ?? []} onChange={v => set('nakshatra', v)} allowOther={false} />
              <MasterCombo label="Manglik" value={form.mangalik}
                opts={options.manglik ?? []} onChange={v => set('mangalik', v)} allowOther={false} />

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Birth time</label>
                <input type="time" value={form.birth_time} onChange={e => set('birth_time', e.target.value)}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">Birth place</label>
                <input type="text" value={form.birth_place} onChange={e => set('birth_place', e.target.value)}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon" />
              </div>

              {/* Whose number this is. A matrimonial enquiry very often goes to
                  the father or a brother rather than the candidate, and members
                  were writing that into the number field where nothing could
                  read it. */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Contact mobile</label>
                <input type="tel" inputMode="numeric" value={form.contact_mobile}
                  onChange={e => set('contact_mobile', e.target.value)}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon" />
              </div>
              <MasterCombo label="This number belongs to" value={form.contact_relation}
                opts={options.contact_relation ?? []} onChange={v => set('contact_relation', v)}
                placeholder="Self, father, brother…" allowOther={false} />

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Contact email</label>
                <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Kundli URL</label>
                <input type="url" value={form.kundli_url} onChange={e => set('kundli_url', e.target.value)}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon" />
              </div>
              <div className="col-span-2"><label className="block text-sm font-medium text-ink mb-1">Address</label><textarea value={form.address} onChange={e => set('address', e.target.value)} rows={3} className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon" /></div>
              <div className="col-span-2 text-xs text-ink-soft bg-paper border border-paper-3 rounded-mj-sm p-3">
                The contact details above are private. They are never shown to other members,
                whatever your profile visibility is set to. Your registered mobile can only be
                shared through the WhatsApp request flow, which you approve one request at a time.
              </div>

              {/* Photo visibility is a separate axis from profile visibility:
                  this decides who, among the people who can already see your
                  profile, also sees your photographs. Only the two options we
                  actually enforce are offered. */}
              <div className="col-span-2">
                <label htmlFor="photo-visibility" className="block text-sm font-medium text-ink mb-1">
                  Who can see your photographs
                </label>
                <select
                  id="photo-visibility"
                  value={form.photo_visibility === 'all' || form.photo_visibility === '' ? 'all' : 'connected'}
                  onChange={e => set('photo_visibility', e.target.value)}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white"
                >
                  <option value="all">Everyone who can see my profile</option>
                  <option value="connected">Only my accepted connections</option>
                </select>
                <p className="mt-1 text-xs text-ink-soft">
                  Choosing connections-only keeps your profile visible but hides your photographs
                  from search, from members who have only sent you an interest, and from the public
                  pages — until you accept them.
                </p>
              </div>
            </div>
          </FormSection>

          <FormSection
            id="visibility"
            title="Who can see your profile"
            subtitle="Public, members only, or hidden."
            open={openSections.has('visibility')}
            onToggle={toggleSection}
          >
            <p className="text-xs text-ink-soft mb-4">
              You can change this at any time. Your contact details are never shown to
              other members on any of these settings.
            </p>

            <div className="space-y-2.5" role="radiogroup" aria-label="Profile visibility">
              {VISIBILITY_OPTIONS.map((opt) => {
                const active = form.visibility === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-mj-sm border cursor-pointer transition-colors ${
                      active ? 'border-maroon bg-cream' : 'border-ink/15 hover:border-gold'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      className="mt-1 accent-maroon"
                      value={opt.value}
                      checked={active}
                      onChange={() => set('visibility', opt.value)}
                    />
                    <span>
                      <span className="block text-sm font-medium text-ink">{opt.label}</span>
                      <span className="block text-xs text-ink-soft leading-relaxed mt-0.5">{opt.help}</span>
                    </span>
                  </label>
                )
              })}
            </div>

            {form.visibility === 'public' && (
              <p className="mt-3 text-xs text-ink-soft bg-paper border border-paper-3 rounded-mj-sm p-3">
                Choosing this makes your profile <strong className="text-ink">eligible</strong> to be
                shown on our public pages. It does not publish it by itself — the Mithila Jodi team
                still chooses which profiles are featured.
              </p>
            )}
          </FormSection>


          {error && saveState === 'error' && (
            <div className="rounded-mj-sm bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">{error}</div>
          )}

          {/* ── Animated save area ── */}
          {saveState === 'success' ? (
            <SaveSuccessCard
              profileComplete={profileComplete}
              doneSections={doneSections}
              totalSections={sections.length}
              onContinueEditing={() => setSaveState('idle')}
              onViewProfile={() => router.push('/profile')}
            />
          ) : (
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 relative overflow-hidden rounded-mj py-3 font-semibold text-sm transition-all duration-300 ${
                  saving
                    ? 'bg-maroon/80 text-gold-lt cursor-wait'
                    : 'btn-primary'
                }`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Saving your profile…
                  </span>
                ) : 'Save Profile'}
              </button>
              <button type="button" onClick={() => router.push('/profile')} className="btn-ghost px-6">
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}

/* ── Save Success Card ──────────────────────────────────────── */
function SaveSuccessCard({
  profileComplete,
  doneSections,
  totalSections,
  onContinueEditing,
  onViewProfile,
}: {
  profileComplete: number
  doneSections: number
  totalSections: number
  onContinueEditing: () => void
  onViewProfile: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [lineW, setLineW]     = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 60)
    const t2 = setTimeout(() => setLineW(100), 200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const isStrong = profileComplete >= 70

  return (
    <div
      className="rounded-mj border border-gold/40 bg-gradient-to-br from-cream to-paper p-6 text-center"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}
    >
      {/* Gold progress line */}
      <div className="w-full h-0.5 bg-ink/10 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold to-maroon rounded-full"
          style={{ width: `${lineW}%`, transition: 'width 0.8s ease' }}
        />
      </div>

      {/* Checkmark */}
      <div className="w-14 h-14 rounded-full bg-maroon mx-auto mb-3 flex items-center justify-center shadow-mj-xs">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path
            d="M 6 14 L 11 19 L 22 8"
            stroke="#E4C572" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 28, strokeDashoffset: visible ? 0 : 28, transition: 'stroke-dashoffset 0.5s ease 0.3s' }}
          />
        </svg>
      </div>

      <p className="font-serif text-xl text-maroon mb-1">Profile Saved</p>
      <p className="text-sm text-ink-soft mb-4">
        {doneSections}/{totalSections} sections complete — your profile is <strong className="text-maroon">{profileComplete}%</strong> filled in.
      </p>

      {/* Progress bar */}
      <div className="w-full bg-ink/10 rounded-full h-2 overflow-hidden mb-4">
        <div
          className="h-full bg-maroon rounded-full"
          style={{ width: `${profileComplete}%`, transition: 'width 0.9s ease 0.4s' }}
        />
      </div>

      {/* Subtle petal decoration */}
      <div className="flex justify-center gap-1 mb-5" aria-hidden="true">
        {['#C4562F', '#E4C572', '#7A1220', '#E4C572', '#C4562F'].map((c, i) => (
          <div key={i} className="w-2 h-2 rounded-full opacity-60" style={{ background: c }} />
        ))}
      </div>

      {/* Next actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onViewProfile} className="btn-primary px-6 py-2.5 text-sm">
          View My Profile
        </button>
        {!isStrong && (
          <button onClick={onContinueEditing} className="btn-ghost px-6 py-2.5 text-sm">
            Keep Editing
          </button>
        )}
        <button
          type="button"
          onClick={() => { onContinueEditing(); setTimeout(() => document.getElementById('photos-section')?.scrollIntoView({ behavior: 'smooth' }), 100) }}
          className="btn-ghost px-6 py-2.5 text-sm"
        >
          Add Photos
        </button>
      </div>
    </div>
  )
}
