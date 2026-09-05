'use client'

import { useState, useEffect, useCallback, useRef, useId } from 'react'
import { useRouter } from 'next/navigation'

type LocationResult = { id: number; name_en: string; level: string; is_mithila_region: boolean }
type CommunityResult = { id: number; value: string; label_en: string; is_mithila: boolean }

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
  religion: 'Hindu',
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

function LocationSearch({
  label, value, onChange, initialName = ''
}: {
  label: string
  value: number | null
  onChange: (id: number | null, name: string) => void
  /**
   * Human-readable name of the already-saved location. The parent loads it
   * asynchronously, so without this the field rendered EMPTY for anyone who had
   * previously set a location — it looked like the value had been lost.
   */
  initialName?: string
}) {
  const inputId = useId()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<LocationResult[]>([])
  const [open, setOpen] = useState(false)
  const [selectedName, setSelectedName] = useState(initialName)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Seed once the parent's profile fetch resolves. Guarded on `q` so it never
  // clobbers what the user is actively typing.
  useEffect(() => {
    if (initialName && !q) setSelectedName(initialName)
  }, [initialName, q])

  const search = useCallback((query: string) => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      if (query.length < 2) { setResults([]); return }
      const r = await fetch(`/api/locations?q=${encodeURIComponent(query)}&level=state,district,city,town,village`)
      const j = await r.json()
      setResults(j.results ?? [])
      setOpen(true)
    }, 300)
  }, [])

  return (
    <div className="relative">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1">{label}</label>
      <input
        id={inputId}
        type="text"
        value={q || selectedName}
        placeholder="Type to search…"
        className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-ink text-sm focus:outline-none focus:border-maroon"
        onChange={e => {
          setQ(e.target.value)
          setSelectedName('')
          if (!e.target.value) onChange(null, '')
          search(e.target.value)
        }}
        onFocus={() => { if (results.length) setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {value && !q && (
        <button
          type="button"
          className="absolute right-2 top-8 text-ink-soft text-xs hover:text-maroon"
          onClick={() => { onChange(null, ''); setSelectedName(''); setQ('') }}
        >✕</button>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-ink/20 rounded-mj-sm shadow-mj-xs mt-1 max-h-48 overflow-y-auto">
          {results.map(r => (
            <li
              key={r.id}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-cream text-ink flex justify-between"
              onMouseDown={() => {
                onChange(r.id, r.name_en)
                setSelectedName(r.name_en)
                setQ('')
                setOpen(false)
              }}
            >
              <span>{r.name_en}</span>
              <span className="text-ink-soft text-xs capitalize">{r.level}{r.is_mithila_region ? ' · Mithila' : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CommunitySearch({
  label, type, value, onChange
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
}) {
  const inputId = useId()
  const [results, setResults] = useState<CommunityResult[]>([])
  const [open, setOpen] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((query: string) => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      const r = await fetch(`/api/community?type=${type}&q=${encodeURIComponent(query)}`)
      const j = await r.json()
      setResults(j.results ?? [])
      setOpen(true)
    }, 300)
  }, [type])

  return (
    <div className="relative">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1">{label}</label>
      <input
        id={inputId}
        type="text"
        value={value}
        placeholder="Type or select…"
        className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-ink text-sm focus:outline-none focus:border-maroon"
        onChange={e => {
          onChange(e.target.value)
          search(e.target.value)
        }}
        onFocus={() => search(value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-ink/20 rounded-mj-sm shadow-mj-xs mt-1 max-h-40 overflow-y-auto">
          {results.map(r => (
            <li
              key={r.id}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-cream text-ink"
              onMouseDown={() => { onChange(r.label_en); setOpen(false) }}
            >
              {r.label_en}{r.is_mithila ? '' : ' *'}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type Option = { value: string; label: string }
type OptionsMap = Record<string, Option[]>

// A <select> driven by master-data options. If the profile's stored value is
// not present in the (active) options list, it is appended so the user never
// silently loses a value an admin later deactivated.
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
    help: 'May be shown on our homepage and Explore page, which do not require an account, and in member search. Surname is shortened and your date of birth, contact details and address are never included.',
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
  const [options, setOptions] = useState<OptionsMap>({})
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/options?types=religion,mother_tongue,marital_status,gotra,mool,caste,sub_caste,industry,employment_type,work_type,diet,family_type,family_values,managed_by')
      .then(r => r.json())
      .then(j => { if (j.ok && j.options) setOptions(j.options as OptionsMap) })
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
            religion: p.religion ?? 'Hindu',
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return

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
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      income_min_lpa: form.income_min_lpa ? parseInt(form.income_min_lpa) : null,
      income_max_lpa: form.income_max_lpa ? parseInt(form.income_max_lpa) : null,
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

  if (loading) {
    return (
      <main id="main-content" className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-soft">Loading profile…</p>
      </main>
    )
  }

  const sections = [
    { label: 'Basic Info',        done: !!(form.first_name && form.gender && form.dob) },
    { label: 'Community',         done: !!(form.caste) },
    { label: 'Location',          done: !!(form.current_loc_id) },
    { label: 'Education & Career',done: !!(form.education_detail || form.profession_detail) },
    { label: 'Lifestyle',         done: !!(form.diet || form.marriage_timeline) },
    { label: 'About Me',          done: !!(form.about_me) },
    { label: 'Photos',            done: photos.some(p => p.status === 'approved' || p.status === 'pending_moderation') },
  ]
  const doneSections = sections.filter(s => s.done).length

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
              <span
                key={s.label}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  s.done
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-paper border-ink/20 text-ink-soft'
                }`}
              >
                {s.done ? '✓' : '○'} {s.label}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* ── Section: Who is this profile for ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-4">Profile For</h2>
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
          </section>

          {/* ── Section: Basic Info ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-4">Basic Information</h2>
            <div className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Height (cm)</label>
                  <input type="number" min={100} max={250} value={form.height_cm}
                    onChange={e => set('height_cm', e.target.value)}
                    placeholder="e.g. 165"
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
                <MasterSelect label="Marital Status" value={form.marital_status}
                  opts={options.marital_status ?? []} onChange={v => set('marital_status', v)} />
              </div>

              <MasterSelect label="Mother Tongue" value={form.mother_tongue}
                opts={options.mother_tongue ?? []} onChange={v => set('mother_tongue', v)} />
            </div>
          </section>

          {/* ── Section: Community ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-4">Community</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <MasterSelect label="Religion" value={form.religion}
                  opts={options.religion ?? []} onChange={v => set('religion', v)} />
                <div>
                  <CommunitySearch label="Caste" type="caste" value={form.caste}
                    onChange={v => set('caste', v)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CommunitySearch label="Sub-caste" type="sub_caste" value={form.sub_caste}
                  onChange={v => set('sub_caste', v)} />
                <CommunitySearch label="Mool" type="mool" value={form.mool}
                  onChange={v => set('mool', v)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CommunitySearch label="Self Gotra" type="gotra" value={form.self_gotra}
                  onChange={v => set('self_gotra', v)} />
                <CommunitySearch label="Maternal Gotra" type="gotra" value={form.maternal_gotra}
                  onChange={v => set('maternal_gotra', v)} />
              </div>

              <CommunitySearch label="Gram (Ancestral Village)" type="gram" value={form.gram}
                onChange={v => set('gram', v)} />
            </div>
          </section>

          {/* ── Section: Location ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-4">Location</h2>
            <p className="text-xs text-ink-soft mb-4">India only. Select the city, town, or village closest to your location.</p>
            <div className="space-y-4">
              <LocationSearch
                label="Native Place"
                value={form.native_place_id}
                initialName={locationNames.native}
                onChange={(id, name) => {
                  set('native_place_id', id)
                  setLocationNames(n => ({ ...n, native: name }))
                }}
              />
              <LocationSearch
                label="Current Location"
                value={form.current_loc_id}
                initialName={locationNames.current}
                onChange={(id, name) => {
                  set('current_loc_id', id)
                  setLocationNames(n => ({ ...n, current: name }))
                }}
              />
              <LocationSearch
                label="Job Location"
                value={form.job_loc_id}
                initialName={locationNames.job}
                onChange={(id, name) => {
                  set('job_loc_id', id)
                  setLocationNames(n => ({ ...n, job: name }))
                }}
              />
            </div>
            {(locationNames.native || locationNames.current || locationNames.job) && (
              <div className="mt-3 text-xs text-ink-soft space-y-1">
                {locationNames.native && <p>Native: {locationNames.native}</p>}
                {locationNames.current && <p>Current: {locationNames.current}</p>}
                {locationNames.job && <p>Job: {locationNames.job}</p>}
              </div>
            )}
          </section>

          {/* ── Section: Private details ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-1">Private details</h2>
            <p className="text-xs text-ink-soft mb-4">These details are stored securely and are only shared according to your privacy settings.</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['income_min_lpa', 'Income min (LPA)', 'number'], ['income_max_lpa', 'Income max (LPA)', 'number'],
                ['rashi', 'Rashi', 'text'], ['nakshatra', 'Nakshatra', 'text'], ['mangalik', 'Mangalik', 'text'],
                ['birth_time', 'Birth time', 'text'], ['birth_place', 'Birth place', 'text'],
                ['contact_mobile', 'Contact mobile', 'tel'], ['contact_email', 'Contact email', 'email'],
                ['kundli_url', 'Kundli URL', 'url'],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-ink mb-1">{label}</label>
                  <input type={type} value={form[key as keyof FormData] as string} onChange={e => set(key as keyof FormData, e.target.value)} className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon" />
                </div>
              ))}
              <div className="col-span-2"><label className="block text-sm font-medium text-ink mb-1">Address</label><textarea value={form.address} onChange={e => set('address', e.target.value)} rows={3} className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon" /></div>
              <div className="col-span-2 text-xs text-ink-soft bg-paper border border-paper-3 rounded-mj-sm p-3">
                These details are private. They are never shown to other members, whatever your
                profile visibility is set to. Your registered mobile can only be shared through the
                WhatsApp request flow, which you approve one request at a time.
              </div>
            </div>
          </section>

          {/* ── Section: Partner preferences ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-1">Partner preferences</h2>
            <p className="text-xs text-ink-soft mb-4">Use commas to add multiple values where applicable.</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-ink mb-1">Age min</label><input type="number" value={form.pref_age_min} onChange={e => set('pref_age_min', e.target.value)} className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Age max</label><input type="number" value={form.pref_age_max} onChange={e => set('pref_age_max', e.target.value)} className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Preferred gender</label><select value={form.pref_gender} onChange={e => set('pref_gender', e.target.value)} className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white"><option value="">Any</option><option value="male">Male</option><option value="female">Female</option></select></div>
              {[
                ['pref_caste', 'Preferred caste(s)'], ['pref_education', 'Preferred education IDs'], ['pref_location', 'Preferred location IDs'],
                ['pref_diet', 'Preferred diet(s)'], ['pref_profession', 'Preferred profession(s)'], ['pref_marital_status', 'Preferred marital status'],
                ['pref_children', 'Children preference'], ['pref_living_arrangement', 'Living arrangement'], ['pref_career', 'Career preference'],
                ['pref_marriage_timeline', 'Marriage timeline'], ['pref_manglik', 'Manglik preference'],
              ].map(([key, label]) => <div key={key}><label className="block text-sm font-medium text-ink mb-1">{label}</label><input value={form[key as keyof FormData] as string} onChange={e => set(key as keyof FormData, e.target.value)} className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm" /></div>)}
              <div className="col-span-2"><label className="block text-sm font-medium text-ink mb-1">Preference notes</label><textarea value={form.pref_notes} onChange={e => set('pref_notes', e.target.value)} rows={3} className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm" /></div>
              <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.pref_gotra_safe} onChange={e => set('pref_gotra_safe', e.target.checked)} /> Keep gotra safety rules enabled</label>
            </div>
          </section>

          {/* ── Section: Lifestyle ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-4">Lifestyle</h2>
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
          </section>

          {/* ── Section: Education ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-4">Education</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Education Level / Summary</label>
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
          </section>

          {/* ── Section: Career ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-4">Career</h2>
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
          </section>

          {/* ── Section: About ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-4">About</h2>
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
          </section>

          {/* ── Section: Family ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-4">Family</h2>
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
          </section>

          {/* ── Section: Photos ── */}
          <section id="photos-section" className="card p-6">
            <h2 className="font-semibold text-ink mb-1">Photos</h2>
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
          </section>

          {/* ── Section: Who can see your profile ──
              Three explicit levels instead of a single on/off switch. Each option
              spells out the consequence, because "discoverable" told a member
              nothing about whether the open internet could see them. */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-1">Who can see your profile</h2>
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
          </section>

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
