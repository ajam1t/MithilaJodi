'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type PrefsForm = {
  pref_age_min: string
  pref_age_max: string
  pref_gender: string
  pref_caste: string
  pref_gotra_safe: boolean
  pref_diet: string[]
  pref_notes: string
}

const EMPTY: PrefsForm = {
  pref_age_min: '',
  pref_age_max: '',
  pref_gender: '',
  pref_caste: '',
  pref_gotra_safe: true,
  pref_diet: [],
  pref_notes: '',
}

const DIET_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'non_vegetarian', label: 'Non-vegetarian' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'vegan', label: 'Vegan' },
]

export default function PreferencesPage() {
  const router = useRouter()
  const [form, setForm] = useState<PrefsForm>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(auth => {
        if (!auth.ok) { router.replace('/login'); return }
        return fetch('/api/profile/preferences').then(r => r.json())
      })
      .then(j => {
        if (j?.ok && j.preferences) {
          const p = j.preferences
          setForm({
            pref_age_min: p.pref_age_min?.toString() ?? '',
            pref_age_max: p.pref_age_max?.toString() ?? '',
            pref_gender:  p.pref_gender ?? '',
            pref_caste:   (p.pref_caste ?? []).join(', '),
            pref_gotra_safe: p.pref_gotra_safe ?? true,
            pref_diet:    p.pref_diet ?? [],
            pref_notes:   p.pref_notes ?? '',
          })
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router])

  function toggleDiet(value: string) {
    setForm(f => ({
      ...f,
      pref_diet: f.pref_diet.includes(value)
        ? f.pref_diet.filter(v => v !== value)
        : [...f.pref_diet, value],
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const casteArr = form.pref_caste
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const payload = {
      pref_age_min:    form.pref_age_min ? parseInt(form.pref_age_min) : null,
      pref_age_max:    form.pref_age_max ? parseInt(form.pref_age_max) : null,
      pref_gender:     form.pref_gender || null,
      pref_caste:      casteArr.length ? casteArr : null,
      pref_gotra_safe: form.pref_gotra_safe,
      pref_diet:       form.pref_diet.length ? form.pref_diet : null,
      pref_notes:      form.pref_notes || null,
    }

    try {
      const res = await fetch('/api/profile/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json()
      if (!j.ok) { setError(j.message ?? 'Failed to save preferences.'); return }
      setSuccess(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-soft">Loading…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-paper py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/profile" className="text-xs text-ink-soft hover:text-maroon">← Back to Profile</Link>
          <h1 className="font-serif text-2xl text-ink mt-2">Partner Preferences</h1>
          <p className="text-sm text-ink-soft mt-1">
            Help us find better matches. All fields are optional.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">

          {/* Age range */}
          <section className="card p-5">
            <h2 className="font-semibold text-ink text-sm mb-4">Age Range</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-soft uppercase tracking-wide mb-1.5">Minimum age</label>
                <input
                  type="number" min={18} max={80} placeholder="e.g. 24"
                  value={form.pref_age_min}
                  onChange={e => setForm(f => ({ ...f, pref_age_min: e.target.value }))}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-soft uppercase tracking-wide mb-1.5">Maximum age</label>
                <input
                  type="number" min={18} max={80} placeholder="e.g. 32"
                  value={form.pref_age_max}
                  onChange={e => setForm(f => ({ ...f, pref_age_max: e.target.value }))}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon"
                />
              </div>
            </div>
          </section>

          {/* Gender */}
          <section className="card p-5">
            <h2 className="font-semibold text-ink text-sm mb-4">Preferred Gender</h2>
            <div className="flex gap-3">
              {['', 'male', 'female'].map(v => (
                <label key={v}
                  className={`flex-1 text-center py-2 border rounded-mj-sm text-sm font-medium cursor-pointer transition-colors
                    ${form.pref_gender === v
                      ? 'border-maroon bg-maroon text-cream'
                      : 'border-ink/20 text-ink hover:border-maroon'}`}>
                  <input type="radio" className="sr-only" value={v}
                    checked={form.pref_gender === v}
                    onChange={() => setForm(f => ({ ...f, pref_gender: v }))} />
                  {v === '' ? 'Any' : v === 'male' ? 'Male' : 'Female'}
                </label>
              ))}
            </div>
          </section>

          {/* Community */}
          <section className="card p-5">
            <h2 className="font-semibold text-ink text-sm mb-4">Community</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-soft uppercase tracking-wide mb-1.5">
                  Preferred caste(s)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brahmin, Maithil — separate with commas"
                  value={form.pref_caste}
                  onChange={e => setForm(f => ({ ...f, pref_caste: e.target.value }))}
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon"
                />
                <p className="text-xs text-ink-soft mt-1">Leave blank for no preference</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-11 h-6 rounded-full transition-colors ${form.pref_gotra_safe ? 'bg-maroon' : 'bg-ink/20'} relative shrink-0`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.pref_gotra_safe ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <input type="checkbox" className="sr-only"
                  checked={form.pref_gotra_safe}
                  onChange={e => setForm(f => ({ ...f, pref_gotra_safe: e.target.checked }))} />
                <div>
                  <p className="text-sm font-medium text-ink">Exclude same gotra</p>
                  <p className="text-xs text-ink-soft">Only show profiles with a different self gotra</p>
                </div>
              </label>
            </div>
          </section>

          {/* Diet */}
          <section className="card p-5">
            <h2 className="font-semibold text-ink text-sm mb-4">Diet Preference</h2>
            <div className="grid grid-cols-2 gap-2">
              {DIET_OPTIONS.map(opt => (
                <label key={opt.value}
                  className={`flex items-center gap-2 py-2.5 px-3 border rounded-mj-sm cursor-pointer transition-colors
                    ${form.pref_diet.includes(opt.value)
                      ? 'border-maroon bg-maroon/5 text-maroon'
                      : 'border-ink/20 text-ink hover:border-maroon/40'}`}>
                  <input type="checkbox" className="sr-only"
                    checked={form.pref_diet.includes(opt.value)}
                    onChange={() => toggleDiet(opt.value)} />
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                    ${form.pref_diet.includes(opt.value) ? 'bg-maroon border-maroon' : 'border-ink/30'}`}>
                    {form.pref_diet.includes(opt.value) && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-ink-soft mt-2">Select all that apply, or leave blank for no preference</p>
          </section>

          {/* Notes */}
          <section className="card p-5">
            <h2 className="font-semibold text-ink text-sm mb-3">Additional Notes</h2>
            <textarea
              rows={3} maxLength={1000}
              placeholder="Any other preferences or requirements…"
              value={form.pref_notes}
              onChange={e => setForm(f => ({ ...f, pref_notes: e.target.value }))}
              className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon resize-none"
            />
            <p className="text-xs text-ink-soft mt-1">{form.pref_notes.length}/1000</p>
          </section>

          {error && <p className="text-sm text-terra">{error}</p>}
          {success && <p className="text-sm text-green-700">Preferences saved.</p>}

          <div className="flex gap-3 pb-4">
            <button type="submit" disabled={saving}
              className="flex-1 btn-primary justify-center text-sm">
              {saving ? 'Saving…' : 'Save Preferences'}
            </button>
            <Link href="/profile" className="px-5 btn-ghost text-sm">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  )
}
