'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

type LocationResult = { id: number; name_en: string; level: string; is_mithila_region: boolean }
type CommunityResult = { id: number; value: string; label_en: string; is_mithila: boolean }

type PhotoRow = {
  id: string
  is_primary: boolean
  status: string
  display_order: number
  signed_url: string | null
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
}

function LocationSearch({
  label, value, onChange
}: {
  label: string
  value: number | null
  onChange: (id: number | null, name: string) => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<LocationResult[]>([])
  const [open, setOpen] = useState(false)
  const [selectedName, setSelectedName] = useState('')
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      <input
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
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      <input
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

export default function ProfileEditPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [photos, setPhotos] = useState<PhotoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [locationNames, setLocationNames] = useState<{ native: string; current: string }>({ native: '', current: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(j => {
        if (j.profile) {
          const p = j.profile
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
          })
        }
        setPhotos(j.photos ?? [])
        setLoading(false)
      })
      .catch(() => { router.push('/login'); })
  }, [router])

  const set = (key: keyof FormData, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      ...form,
      height_cm: form.height_cm ? parseInt(form.height_cm) : null,
      native_place_id: form.native_place_id,
      current_loc_id: form.current_loc_id,
    }

    const r = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const j = await r.json()
    setSaving(false)
    if (j.ok) {
      setSuccess('Profile saved.')
    } else {
      setError(j.message ?? 'Failed to save. Please try again.')
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const fd = new FormData()
    fd.append('photo', file)

    const r = await fetch('/api/profile/photos', { method: 'POST', body: fd })
    const j = await r.json()
    setUploading(false)

    if (j.ok) {
      // Reload photos
      const pr = await fetch('/api/profile/photos')
      const pj = await pr.json()
      setPhotos(pj.photos ?? [])
    } else {
      setError(j.message ?? 'Photo upload failed.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm('Remove this photo?')) return
    const r = await fetch(`/api/profile/photos/${photoId}`, { method: 'DELETE' })
    const j = await r.json()
    if (j.ok) setPhotos(p => p.filter(x => x.id !== photoId))
    else setError('Failed to delete photo.')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-soft">Loading profile…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-paper py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-ink">Edit Profile</h1>
          <p className="text-ink-soft text-sm mt-1">Your profile helps families find the right match for your community.</p>
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

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Height (cm)</label>
                <input type="number" min={100} max={250} value={form.height_cm}
                  onChange={e => set('height_cm', e.target.value)}
                  placeholder="e.g. 165"
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
              </div>
            </div>
          </section>

          {/* ── Section: Community ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-4">Community</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Religion</label>
                  <input type="text" maxLength={100} value={form.religion}
                    onChange={e => set('religion', e.target.value)}
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
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
                onChange={(id, name) => {
                  set('native_place_id', id)
                  setLocationNames(n => ({ ...n, native: name }))
                }}
              />
              <LocationSearch
                label="Current Location"
                value={form.current_loc_id}
                onChange={(id, name) => {
                  set('current_loc_id', id)
                  setLocationNames(n => ({ ...n, current: name }))
                }}
              />
            </div>
            {(locationNames.native || locationNames.current) && (
              <div className="mt-3 text-xs text-ink-soft space-y-1">
                {locationNames.native && <p>Native: {locationNames.native}</p>}
                {locationNames.current && <p>Current: {locationNames.current}</p>}
              </div>
            )}
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

          {/* ── Section: Education & Career ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-4">Education & Career</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Education</label>
                <input type="text" maxLength={500} value={form.education_detail}
                  onChange={e => set('education_detail', e.target.value)}
                  placeholder="e.g. B.Tech Computer Science, IIT Delhi"
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Profession / Job Title</label>
                  <input type="text" maxLength={500} value={form.profession_detail}
                    onChange={e => set('profession_detail', e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Employer / Company</label>
                  <input type="text" maxLength={500} value={form.employer}
                    onChange={e => set('employer', e.target.value)}
                    placeholder="e.g. Infosys, Self-employed"
                    className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon" />
                </div>
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
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  About Family <span className="text-ink-soft font-normal">({form.family_about.length}/1000)</span>
                </label>
                <textarea rows={3} maxLength={1000} value={form.family_about}
                  onChange={e => set('family_about', e.target.value)}
                  placeholder="About your family background…"
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon resize-none" />
              </div>
            </div>
          </section>

          {/* ── Section: Photos ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-1">Photos</h2>
            <p className="text-xs text-ink-soft mb-4">
              Photos are reviewed by our team before being visible. Max 5 photos, 5 MB each. Allowed: JPEG, PNG, WebP, HEIC.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {photos.map(photo => (
                <div key={photo.id} className="relative rounded-mj-sm overflow-hidden border border-ink/10 bg-cream aspect-square">
                  {photo.signed_url ? (
                    <img src={photo.signed_url} alt="Profile photo"
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-soft text-xs">No preview</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-ink/60 px-2 py-1 flex items-center justify-between">
                    <span className={`text-[10px] font-medium ${
                      photo.status === 'approved' ? 'text-green-300' :
                      photo.status === 'rejected' ? 'text-red-300' : 'text-amber-300'
                    }`}>
                      {photo.is_primary && '★ '}
                      {photo.status === 'pending_moderation' ? 'Under review' :
                       photo.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                    <button type="button" onClick={() => handleDeletePhoto(photo.id)}
                      className="text-white text-[10px] hover:text-red-300 transition-colors">Remove</button>
                  </div>
                </div>
              ))}

              {photos.length < 5 && (
                <label className="aspect-square rounded-mj-sm border-2 border-dashed border-ink/20 flex flex-col items-center justify-center cursor-pointer hover:border-maroon transition-colors bg-cream">
                  <span className="text-2xl text-ink-soft">+</span>
                  <span className="text-xs text-ink-soft mt-1">{uploading ? 'Uploading…' : 'Add photo'}</span>
                  <input ref={fileRef} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/heic"
                    disabled={uploading} onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          </section>

          {/* ── Section: Visibility ── */}
          <section className="card p-6">
            <h2 className="font-semibold text-ink mb-3">Visibility</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-11 h-6 rounded-full transition-colors ${form.discoverable ? 'bg-maroon' : 'bg-ink/20'} relative`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.discoverable ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <input type="checkbox" className="sr-only" checked={form.discoverable}
                onChange={e => set('discoverable', e.target.checked)} />
              <div>
                <p className="text-sm font-medium text-ink">Make profile discoverable</p>
                <p className="text-xs text-ink-soft">Other families can find your profile in search results</p>
              </div>
            </label>
          </section>

          {error && (
            <div className="rounded-mj-sm bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="rounded-mj-sm bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">{success}</div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="btn-primary flex-1 justify-center">
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
            <button type="button" onClick={() => router.push('/profile')}
              className="btn-ghost px-6">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
