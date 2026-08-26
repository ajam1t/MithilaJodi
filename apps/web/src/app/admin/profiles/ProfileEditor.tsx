'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type LocationResult = { id: number; name_en: string; level: string; is_mithila_region: boolean }
type Photo = { id: string; signed_url: string | null; is_primary: boolean; status: string }

type FormState = {
  mobile: string
  profile_for: string; first_name: string; last_name: string; gender: string; dob: string; religion: string
  caste: string; sub_caste: string; self_gotra: string; maternal_gotra: string; mool: string; gram: string
  native_place_id: number | null; current_loc_id: number | null; job_loc_id: number | null
  education_detail: string; profession_detail: string; employer: string; height_cm: string; diet: string
  smoking: string; drinking: string; about_me: string; family_about: string
  marital_status: string; mother_tongue: string; degree: string; specialization: string; institution: string
  passing_year: string; employment_type: string; industry: string; job_title: string; experience_years: string
  work_type: string; family_type: string; managed_by: string; family_values: string; parents_info: string
  siblings_info: string; family_expectations: string; family_introduction: string
  profile_status: string; discoverable: boolean; showcase: boolean; profile_complete: string
  income_min_lpa: string; income_max_lpa: string; rashi: string; nakshatra: string; mangalik: string
  contact_mobile: string; contact_email: string; address: string; birth_time: string; birth_place: string
  kundli_url: string; contact_visibility: string; photo_visibility: string
  pref_age_min: string; pref_age_max: string; pref_gender: string; pref_caste: string; pref_gotra_safe: boolean
  pref_education: string; pref_location: string; pref_diet: string; pref_notes: string; pref_profession: string
  pref_marital_status: string; pref_children: string; pref_living_arrangement: string; pref_career: string
  pref_marriage_timeline: string; pref_manglik: string
}

const EMPTY: FormState = {
  mobile: '', profile_for: 'self', first_name: '', last_name: '', gender: '', dob: '', religion: 'Hindu',
  caste: '', sub_caste: '', self_gotra: '', maternal_gotra: '', mool: '', gram: '', native_place_id: null,
  current_loc_id: null, job_loc_id: null, education_detail: '', profession_detail: '', employer: '', height_cm: '',
  diet: '', smoking: '', drinking: '', about_me: '', family_about: '', marital_status: '', mother_tongue: '',
  degree: '', specialization: '', institution: '', passing_year: '', employment_type: '', industry: '', job_title: '',
  experience_years: '', work_type: '', family_type: '', managed_by: '', family_values: '', parents_info: '',
  siblings_info: '', family_expectations: '', family_introduction: '', profile_status: 'active', discoverable: true, showcase: false,
  profile_complete: '0', income_min_lpa: '', income_max_lpa: '', rashi: '', nakshatra: '', mangalik: '',
  contact_mobile: '', contact_email: '', address: '', birth_time: '', birth_place: '', kundli_url: '',
  contact_visibility: 'mutual', photo_visibility: 'all', pref_age_min: '', pref_age_max: '', pref_gender: '',
  pref_caste: '', pref_gotra_safe: true, pref_education: '', pref_location: '', pref_diet: '', pref_notes: '',
  pref_profession: '', pref_marital_status: '', pref_children: '', pref_living_arrangement: '', pref_career: '',
  pref_marriage_timeline: '', pref_manglik: '',
}

function asText(value: unknown): string { return value == null ? '' : String(value) }
function asNumber(value: string): number | null { return value.trim() ? Number(value) : null }
function csv(value: string): string[] { return value.split(',').map(x => x.trim()).filter(Boolean) }

function Field({ label, value, onChange, type = 'text', required = false, multiline = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; multiline?: boolean }) {
  const className = 'w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm focus:outline-none focus:border-maroon bg-white'
  return <label className="block text-sm text-ink"><span className="block font-medium mb-1">{label}{required ? ' *' : ''}</span>{multiline ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={className} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} className={className} required={required} />}</label>
}

function LocationField({ label, value, name, onChange }: { label: string; value: number | null; name: string; onChange: (id: number | null, name: string) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationResult[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function search(text: string) {
    setQuery(text)
    if (timer.current) clearTimeout(timer.current)
    if (text.trim().length < 2) { setResults([]); return }
    timer.current = setTimeout(async () => {
      const response = await fetch(`/api/locations?q=${encodeURIComponent(text)}&level=state,district,city,town,village`)
      const json = await response.json()
      setResults(json.results ?? [])
      setOpen(true)
    }, 250)
  }
  return <div className="relative"><Field label={label} value={query || name} onChange={search} />{value && !query && <button type="button" className="absolute right-2 top-8 text-xs text-ink-soft" onClick={() => onChange(null, '')}>Clear</button>}{open && results.length > 0 && <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-mj-sm border border-paper-3 bg-white shadow-mj-xs">{results.map(result => <li key={result.id} onMouseDown={() => { onChange(result.id, result.name_en); setQuery(''); setOpen(false) }} className="cursor-pointer px-3 py-2 text-sm hover:bg-cream">{result.name_en} <span className="text-xs text-ink-soft">{result.level}</span></li>)}</ul>}</div>
}

export default function ProfileEditor({ profileId }: { profileId?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [names, setNames] = useState({ native: '', current: '', job: '' })
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(Boolean(profileId))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState(profileId)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof FormState, value: string | number | boolean | null) => setForm(current => ({ ...current, [key]: value }))
  const isNew = !createdId
  const editorTitle = isNew ? 'Create profile' : 'Edit profile'

  useEffect(() => {
    if (!profileId) return
    fetch(`/api/admin/profiles/${profileId}`).then(r => r.json()).then(json => {
      if (!json.ok) { setError(json.message ?? 'Profile not found.'); setLoading(false); return }
      const p = json.profile ?? {}
      const pr = json.private ?? {}
      const pref = json.preferences ?? {}
      setForm(current => ({ ...current, ...Object.fromEntries(Object.keys(current).map(key => [key, key === 'mobile' ? asText(p.accounts?.mobile) : key === 'showcase' ? Boolean(json.showcase) : key.startsWith('pref_') ? (key === 'pref_gotra_safe' ? pref[key] ?? true : Array.isArray(pref[key]) ? pref[key].join(', ') : asText(pref[key])) : Object.prototype.hasOwnProperty.call(pr, key) ? asText(pr[key]) : key === 'discoverable' ? Boolean(p[key]) : asText(p[key])])) as FormState))
      setNames({ native: asText(json.native_place_name), current: asText(json.current_loc_name), job: asText(json.job_loc_name) })
      setPhotos(json.photos ?? [])
      setLoading(false)
    }).catch(() => { setError('Could not load profile.'); setLoading(false) })
  }, [profileId])

  const profilePayload = useMemo(() => {
    const profileKeys = ['profile_for','first_name','last_name','gender','dob','religion','caste','sub_caste','self_gotra','maternal_gotra','mool','gram','native_place_id','current_loc_id','job_loc_id','education_detail','profession_detail','employer','height_cm','diet','smoking','drinking','about_me','family_about','marital_status','mother_tongue','degree','specialization','institution','passing_year','employment_type','industry','job_title','experience_years','work_type','family_type','managed_by','family_values','parents_info','siblings_info','family_expectations','family_introduction','profile_status','discoverable','profile_complete']
    const payload: Record<string, unknown> = {}
    for (const key of profileKeys) payload[key] = ['height_cm','passing_year','experience_years','profile_complete'].includes(key) ? asNumber(String(form[key as keyof FormState])) : form[key as keyof FormState]
    return payload
  }, [form])

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(''); setMessage('')
    try {
      let id = createdId
      if (!id) {
        const created = await fetch('/api/admin/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile: form.mobile, profile: profilePayload, showcase: form.showcase }) }).then(r => r.json())
        if (!created.ok) throw new Error(created.message ?? 'Could not create profile.')
        id = created.profile_id; setCreatedId(id)
      } else {
        const updated = await fetch(`/api/admin/profiles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', profile: profilePayload, private: privatePayload(), preferences: preferencePayload(), showcase: form.showcase }) }).then(r => r.json())
        if (!updated.ok) throw new Error(updated.message ?? 'Could not save profile.')
      }
      if (!createdId && id) {
        await fetch(`/api/admin/profiles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', profile: {}, private: privatePayload(), preferences: preferencePayload(), showcase: form.showcase }) })
        router.replace(`/admin/profiles/${id}`)
      }
      setMessage('Profile saved successfully.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save profile.') } finally { setSaving(false) }
  }

  function privatePayload() { return { income_min_lpa: asNumber(form.income_min_lpa), income_max_lpa: asNumber(form.income_max_lpa), rashi: form.rashi, nakshatra: form.nakshatra, mangalik: form.mangalik, contact_mobile: form.contact_mobile, contact_email: form.contact_email, address: form.address, birth_time: form.birth_time, birth_place: form.birth_place, kundli_url: form.kundli_url, contact_visibility: form.contact_visibility, photo_visibility: form.photo_visibility } }
  function preferencePayload() { return { pref_age_min: asNumber(form.pref_age_min), pref_age_max: asNumber(form.pref_age_max), pref_gender: form.pref_gender || null, pref_caste: csv(form.pref_caste), pref_gotra_safe: form.pref_gotra_safe, pref_education: csv(form.pref_education).map(Number).filter(Number.isFinite), pref_location: csv(form.pref_location).map(Number).filter(Number.isFinite), pref_diet: csv(form.pref_diet), pref_notes: form.pref_notes, pref_profession: csv(form.pref_profession), pref_marital_status: csv(form.pref_marital_status), pref_children: form.pref_children, pref_living_arrangement: form.pref_living_arrangement, pref_career: form.pref_career, pref_marriage_timeline: form.pref_marriage_timeline, pref_manglik: form.pref_manglik } }

  async function uploadPhoto(file: File) {
    if (!createdId) { setError('Save the profile before uploading a photo.'); return }
    const body = new FormData(); body.set('photo', file); body.set('is_primary', photos.length === 0 ? 'true' : 'false')
    const json = await fetch(`/api/admin/profiles/${createdId}/photos`, { method: 'POST', body }).then(r => r.json())
    if (!json.ok) { setError(json.message ?? 'Photo upload failed.'); return }
    const refreshed = await fetch(`/api/admin/profiles/${createdId}`).then(r => r.json())
    setPhotos(refreshed.photos ?? []); setMessage('Photo uploaded and approved.')
  }

  if (loading) return <div className="p-8 text-sm text-ink-soft animate-pulse">Loading profile…</div>
  return <div className="max-w-6xl p-4 sm:p-8"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><Link href="/admin/profiles" className="text-xs text-maroon">← Profiles</Link><h1 className="mt-2 font-serif text-2xl text-ink">{editorTitle}</h1></div>{createdId && <Link href={`/profile/${createdId}`} target="_blank" className="text-sm text-maroon underline">Preview profile</Link>}</div>
    {error && <p className="mb-4 rounded-mj-sm bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mb-4 rounded-mj-sm bg-green-50 p-3 text-sm text-green-700">{message}</p>}
    <form onSubmit={save} className="space-y-6">
      <section className="card grid gap-4 p-4 sm:grid-cols-3"><h2 className="sm:col-span-3 font-serif text-lg text-ink">Account & visibility</h2>{isNew && <Field label="Mobile number" value={form.mobile} onChange={v => set('mobile', v)} required />}{!isNew && <p className="text-sm text-ink-soft">Mobile: {form.mobile}</p>}<label className="text-sm text-ink"><span className="mb-1 block font-medium">Profile status</span><select value={form.profile_status} onChange={e => set('profile_status', e.target.value)} className="w-full rounded-mj-sm border border-paper-3 bg-white px-3 py-2"><option value="active">Active</option><option value="draft">Draft</option><option value="pending_review">Pending review</option><option value="suspended">Suspended</option><option value="deactivated">Deactivated</option></select></label><label className="flex items-center gap-2 pt-7 text-sm text-ink"><input type="checkbox" checked={form.discoverable} onChange={e => set('discoverable', e.target.checked)} /> Discoverable in member Search</label><label className="flex items-center gap-2 pt-7 text-sm text-ink"><input type="checkbox" checked={form.showcase} onChange={e => set('showcase', e.target.checked)} /> Show on public home/explore</label><p className="sm:col-span-3 text-xs text-ink-soft">Active + discoverable profiles appear in member Search. Public home/explore uses the curated showcase switch.</p></section>
      <section className="card grid gap-4 p-4 sm:grid-cols-3"><h2 className="sm:col-span-3 font-serif text-lg text-ink">Identity</h2><Field label="First name" value={form.first_name} onChange={v => set('first_name', v)} required /><Field label="Last name" value={form.last_name} onChange={v => set('last_name', v)} /><Field label="Date of birth" type="date" value={form.dob} onChange={v => set('dob', v)} required /><label className="text-sm text-ink"><span className="mb-1 block font-medium">Gender *</span><select value={form.gender} onChange={e => set('gender', e.target.value)} required className="w-full rounded-mj-sm border border-paper-3 bg-white px-3 py-2"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></label><Field label="Profile for" value={form.profile_for} onChange={v => set('profile_for', v)} /><Field label="Religion" value={form.religion} onChange={v => set('religion', v)} /><Field label="Caste" value={form.caste} onChange={v => set('caste', v)} /><Field label="Sub-caste" value={form.sub_caste} onChange={v => set('sub_caste', v)} /><Field label="Mother tongue" value={form.mother_tongue} onChange={v => set('mother_tongue', v)} /><Field label="Self gotra" value={form.self_gotra} onChange={v => set('self_gotra', v)} /><Field label="Maternal gotra" value={form.maternal_gotra} onChange={v => set('maternal_gotra', v)} /><Field label="Mool" value={form.mool} onChange={v => set('mool', v)} /><Field label="Gram" value={form.gram} onChange={v => set('gram', v)} /></section>
      <section className="card grid gap-4 p-4 sm:grid-cols-3"><h2 className="sm:col-span-3 font-serif text-lg text-ink">Locations</h2><LocationField label="Native place" value={form.native_place_id} name={names.native} onChange={(id, name) => { set('native_place_id', id); setNames(n => ({ ...n, native: name })) }} /><LocationField label="Current location" value={form.current_loc_id} name={names.current} onChange={(id, name) => { set('current_loc_id', id); setNames(n => ({ ...n, current: name })) }} /><LocationField label="Job location" value={form.job_loc_id} name={names.job} onChange={(id, name) => { set('job_loc_id', id); setNames(n => ({ ...n, job: name })) }} /></section>
      <section className="card grid gap-4 p-4 sm:grid-cols-3"><h2 className="sm:col-span-3 font-serif text-lg text-ink">Education & work</h2><Field label="Education" value={form.education_detail} onChange={v => set('education_detail', v)} /><Field label="Degree" value={form.degree} onChange={v => set('degree', v)} /><Field label="Specialization" value={form.specialization} onChange={v => set('specialization', v)} /><Field label="Institution" value={form.institution} onChange={v => set('institution', v)} /><Field label="Passing year" type="number" value={form.passing_year} onChange={v => set('passing_year', v)} /><Field label="Profession" value={form.profession_detail} onChange={v => set('profession_detail', v)} /><Field label="Job title" value={form.job_title} onChange={v => set('job_title', v)} /><Field label="Employer" value={form.employer} onChange={v => set('employer', v)} /><Field label="Industry" value={form.industry} onChange={v => set('industry', v)} /><Field label="Employment type" value={form.employment_type} onChange={v => set('employment_type', v)} /><Field label="Experience (years)" type="number" value={form.experience_years} onChange={v => set('experience_years', v)} /><Field label="Work type" value={form.work_type} onChange={v => set('work_type', v)} /><Field label="Height (cm)" type="number" value={form.height_cm} onChange={v => set('height_cm', v)} /><Field label="Diet" value={form.diet} onChange={v => set('diet', v)} /><Field label="Smoking" value={form.smoking} onChange={v => set('smoking', v)} /><Field label="Drinking" value={form.drinking} onChange={v => set('drinking', v)} /></section>
      <section className="card grid gap-4 p-4 sm:grid-cols-2"><h2 className="sm:col-span-2 font-serif text-lg text-ink">About & family</h2><Field label="About the person" value={form.about_me} onChange={v => set('about_me', v)} multiline /><Field label="Family about" value={form.family_about} onChange={v => set('family_about', v)} multiline /><Field label="Family type" value={form.family_type} onChange={v => set('family_type', v)} /><Field label="Managed by" value={form.managed_by} onChange={v => set('managed_by', v)} /><Field label="Family values" value={form.family_values} onChange={v => set('family_values', v)} /><Field label="Parents info" value={form.parents_info} onChange={v => set('parents_info', v)} multiline /><Field label="Siblings info" value={form.siblings_info} onChange={v => set('siblings_info', v)} multiline /><Field label="Family expectations" value={form.family_expectations} onChange={v => set('family_expectations', v)} multiline /><Field label="Family introduction" value={form.family_introduction} onChange={v => set('family_introduction', v)} multiline /></section>
      <section className="card grid gap-4 p-4 sm:grid-cols-3"><h2 className="sm:col-span-3 font-serif text-lg text-ink">Private details</h2><Field label="Income min (LPA)" type="number" value={form.income_min_lpa} onChange={v => set('income_min_lpa', v)} /><Field label="Income max (LPA)" type="number" value={form.income_max_lpa} onChange={v => set('income_max_lpa', v)} /><Field label="Rashi" value={form.rashi} onChange={v => set('rashi', v)} /><Field label="Nakshatra" value={form.nakshatra} onChange={v => set('nakshatra', v)} /><Field label="Mangalik" value={form.mangalik} onChange={v => set('mangalik', v)} /><Field label="Birth time" value={form.birth_time} onChange={v => set('birth_time', v)} /><Field label="Birth place" value={form.birth_place} onChange={v => set('birth_place', v)} /><Field label="Contact mobile" value={form.contact_mobile} onChange={v => set('contact_mobile', v)} /><Field label="Contact email" value={form.contact_email} onChange={v => set('contact_email', v)} /><Field label="Address" value={form.address} onChange={v => set('address', v)} multiline /><Field label="Kundli URL" value={form.kundli_url} onChange={v => set('kundli_url', v)} /><Field label="Contact visibility" value={form.contact_visibility} onChange={v => set('contact_visibility', v)} /><Field label="Photo visibility" value={form.photo_visibility} onChange={v => set('photo_visibility', v)} /></section>
      <section className="card grid gap-4 p-4 sm:grid-cols-3"><h2 className="sm:col-span-3 font-serif text-lg text-ink">Partner preferences</h2><Field label="Age min" type="number" value={form.pref_age_min} onChange={v => set('pref_age_min', v)} /><Field label="Age max" type="number" value={form.pref_age_max} onChange={v => set('pref_age_max', v)} /><Field label="Preferred gender" value={form.pref_gender} onChange={v => set('pref_gender', v)} /><Field label="Preferred caste(s)" value={form.pref_caste} onChange={v => set('pref_caste', v)} /><Field label="Preferred education IDs" value={form.pref_education} onChange={v => set('pref_education', v)} /><Field label="Preferred location IDs" value={form.pref_location} onChange={v => set('pref_location', v)} /><Field label="Preferred diet(s)" value={form.pref_diet} onChange={v => set('pref_diet', v)} /><Field label="Preferred profession(s)" value={form.pref_profession} onChange={v => set('pref_profession', v)} /><Field label="Preferred marital status" value={form.pref_marital_status} onChange={v => set('pref_marital_status', v)} /><Field label="Children preference" value={form.pref_children} onChange={v => set('pref_children', v)} /><Field label="Living arrangement" value={form.pref_living_arrangement} onChange={v => set('pref_living_arrangement', v)} /><Field label="Career preference" value={form.pref_career} onChange={v => set('pref_career', v)} /><Field label="Marriage timeline" value={form.pref_marriage_timeline} onChange={v => set('pref_marriage_timeline', v)} /><Field label="Manglik preference" value={form.pref_manglik} onChange={v => set('pref_manglik', v)} /><Field label="Preference notes" value={form.pref_notes} onChange={v => set('pref_notes', v)} multiline /><label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={form.pref_gotra_safe} onChange={e => set('pref_gotra_safe', e.target.checked)} /> Gotra safe</label></section>
      <section className="card p-4"><h2 className="mb-4 font-serif text-lg text-ink">Profile pictures</h2><div className="flex flex-wrap gap-3">{photos.map(photo => <div key={photo.id} className="relative h-28 w-24 overflow-hidden rounded-mj-sm border border-paper-3 bg-paper-2">{photo.signed_url && <img src={photo.signed_url} alt="Profile" className="h-full w-full object-cover" />}{photo.is_primary && <span className="absolute bottom-0 left-0 right-0 bg-ink/70 px-1 py-0.5 text-center text-[10px] text-white">Primary</span>}</div>)}<button type="button" onClick={() => fileRef.current?.click()} className="h-28 w-24 rounded-mj-sm border border-dashed border-maroon/50 text-xs text-maroon hover:bg-cream">+ Add photo</button><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) void uploadPhoto(file); e.currentTarget.value = '' }} /></div><p className="mt-3 text-xs text-ink-soft">Admin uploads are approved immediately. The first photo becomes primary; up to five photos are supported.</p></section>
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={saving} className="btn-primary px-5 py-2 disabled:opacity-60">{saving ? 'Saving…' : 'Save profile'}</button>{createdId && <Link href="/admin/showcase" className="rounded-mj-sm border border-maroon px-5 py-2 text-sm text-maroon">Manage home/Search showcase</Link>}</div>
    </form>
  </div>
}
