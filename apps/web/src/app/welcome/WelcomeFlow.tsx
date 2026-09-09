'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { LocationPicker } from '@/components/LocationPicker'
import { JoinCommunityButton } from '@/components/whatsapp/JoinCommunity'
import type { OnboardingState } from '@/lib/onboarding'

/**
 * The required onboarding form.
 *
 * Two steps, in the order the information becomes possible to collect: the
 * profile row has to exist before a photo can be attached to it.
 *
 * It writes through the same PUT /api/profile and POST /api/profile/photos that
 * the full editor uses, so there is no second code path that could accept a
 * profile the editor would reject.
 */

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const MAX_DIM = 1200

/** Youngest permitted date of birth — the API enforces 18+ as well. */
function maxDob(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().slice(0, 10)
}

/**
 * Downscale before upload. Phone cameras produce 4–8 MB files that would be
 * rejected by the 5 MB limit, which reads to the member as "my photo is not
 * allowed" rather than "it is too big".
 */
function compress(file: File): Promise<File> {
  if (file.type === 'image/heic' || file.type === 'image/heif') return Promise.resolve(file)
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width: w, height: h } = img
      if (w > MAX_DIM || h > MAX_DIM) {
        const r = Math.min(MAX_DIM / w, MAX_DIM / h)
        w = Math.round(w * r); h = Math.round(h * r)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        blob => blob
          ? resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          : reject(new Error('Could not process that image')),
        'image/jpeg', 0.85,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')) }
    img.src = url
  })
}

export function WelcomeFlow({ initial }: { initial: OnboardingState }) {
  const v = initial.values
  // Start on the photo step if the details are already saved — someone returning
  // to finish should not have to re-confirm what they already entered.
  const detailsDone = !initial.missing.some(m => m === 'name' || m === 'gender' || m === 'dob')
  const [step, setStep] = useState<1 | 2>(detailsDone ? 2 : 1)

  const [profileFor, setProfileFor] = useState(v.profileFor ?? 'self')
  const [firstName, setFirstName] = useState(v.firstName ?? '')
  const [lastName, setLastName] = useState(v.lastName ?? '')
  const [gender, setGender] = useState(v.gender ?? '')
  const [dob, setDob] = useState(v.dob ?? '')
  const [caste, setCaste] = useState(v.caste ?? '')
  const [locId, setLocId] = useState<number | null>(v.currentLocId)
  const [locName, setLocName] = useState(v.currentLocName ?? '')

  const [photoCount, setPhotoCount] = useState(initial.photoCount)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!firstName.trim()) { setError('Please enter a name.'); return }
    if (!gender) { setError('Please choose bride or groom.'); return }
    if (!dob) { setError('Please enter a date of birth.'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_for: profileFor,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          gender,
          dob,
          religion: 'Hindu',
          caste: caste.trim() || null,
          current_loc_id: locId,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.ok) { setError(j.message ?? 'Could not save. Please try again.'); return }
      setStep(2)
    } catch {
      setError('Network error. Please try again.')
    } finally { setSaving(false) }
  }

  async function upload(file: File | undefined) {
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return }

    setUploading(true)
    try {
      let toSend = file
      try { toSend = await compress(file) } catch { /* send the original */ }
      if (toSend.size > MAX_PHOTO_BYTES) {
        setError('That photo is too large even after resizing. Please pick another.')
        return
      }

      setPreview(URL.createObjectURL(file))
      const body = new FormData()
      body.append('photo', toSend)
      const res = await fetch('/api/profile/photos', { method: 'POST', body })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.ok) {
        setError(j.message ?? 'Could not upload that photo. Please try again.')
        setPreview(null)
        return
      }
      setPhotoCount(c => c + 1)
    } catch {
      setError('Upload failed. Please check your connection and try again.')
      setPreview(null)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <header className="text-center mb-6">
        <p className="eyebrow mb-1.5">Step {step} of 2</p>
        <h1 className="font-serif text-maroon text-[24px] sm:text-[28px] leading-tight">
          {step === 1 ? 'Tell us who this profile is for' : 'Add a photo'}
        </h1>
        <div className="ornament-line w-14 mx-auto mt-2.5" />
        <p className="text-ink-soft text-[13.5px] leading-relaxed mt-3">
          {step === 1
            ? 'These few details are required so families can see a real profile rather than an empty one.'
            : 'A profile with a photo is the difference between being considered and being skipped. Your photo is reviewed by our team before it appears to anyone.'}
        </p>
      </header>

      <div className="h-1.5 rounded-full bg-paper-3 overflow-hidden mb-6" aria-hidden="true">
        <div className="h-full bg-maroon rounded-full transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }} />
      </div>

      {error && (
        <p className="mb-4 rounded-mj-sm bg-error-soft border border-error/30 px-3.5 py-2.5 text-[13.5px] text-error-fg">
          {error}
        </p>
      )}

      {step === 1 ? (
        <form onSubmit={saveDetails} className="card p-5 space-y-4">
          <div>
            <span className="block text-sm font-medium text-ink mb-1.5">This profile is for</span>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(['self', 'son', 'daughter', 'sibling', 'other'] as const).map(opt => (
                <label
                  key={opt}
                  className={`flex items-center justify-center py-2 px-2 border rounded-mj-sm cursor-pointer text-[13px] font-medium transition-colors ${
                    profileFor === opt ? 'border-maroon bg-maroon text-cream' : 'border-ink/20 text-ink hover:border-maroon'
                  }`}
                >
                  <input type="radio" name="profile_for" value={opt} checked={profileFor === opt}
                    onChange={() => setProfileFor(opt)} className="sr-only" />
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="w-first" className="block text-sm font-medium text-ink mb-1">First name *</label>
              <input id="w-first" required maxLength={100} value={firstName}
                onChange={e => setFirstName(e.target.value)} placeholder="Priya"
                className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white" />
            </div>
            <div>
              <label htmlFor="w-last" className="block text-sm font-medium text-ink mb-1">Last name</label>
              <input id="w-last" maxLength={100} value={lastName}
                onChange={e => setLastName(e.target.value)} placeholder="Jha"
                className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white" />
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-ink mb-1.5">Bride or groom *</span>
            <div className="grid grid-cols-2 gap-2">
              {([['female', 'Bride'], ['male', 'Groom']] as const).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex items-center justify-center py-2.5 border rounded-mj-sm cursor-pointer text-sm font-medium transition-colors ${
                    gender === value ? 'border-maroon bg-maroon text-cream' : 'border-ink/20 text-ink hover:border-maroon'
                  }`}
                >
                  <input type="radio" name="gender" value={value} checked={gender === value}
                    onChange={() => setGender(value)} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="w-dob" className="block text-sm font-medium text-ink mb-1">Date of birth *</label>
            <input id="w-dob" type="date" required value={dob} max={maxDob()}
              onChange={e => setDob(e.target.value)}
              className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white" />
            <p className="text-[11.5px] text-ink-soft mt-1">
              Members must be 18 or older. Your date of birth is never shown — only your age.
            </p>
          </div>

          {/* Recommended rather than required: these two carry most of the
              matching value, but blocking on them would turn a two-minute
              signup into an interrogation. */}
          <div className="pt-1 border-t border-paper-3">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft mb-2.5 mt-3">
              Recommended
            </p>
            <div className="space-y-3">
              <div>
                <label htmlFor="w-caste" className="block text-sm font-medium text-ink mb-1">Caste</label>
                <input id="w-caste" maxLength={100} value={caste}
                  onChange={e => setCaste(e.target.value)} placeholder="e.g. Maithil Brahmin"
                  className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white" />
              </div>
              <LocationPicker
                label="Current city"
                value={locId}
                initialName={locName}
                hint="Where you live now. Used for “same city” matching."
                onChange={(id, name) => { setLocId(id); setLocName(name) }}
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-60">
            {saving ? 'Saving…' : 'Continue to photo'}
          </button>
        </form>
      ) : (
        <div className="card p-5">
          {photoCount > 0 ? (
            <div className="text-center">
              <div className="mx-auto mb-3 h-28 w-28 rounded-full overflow-hidden border-[3px] border-green/50 bg-paper-2">
                {preview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={preview} alt="The photo you just uploaded" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center font-serif text-3xl text-maroon/60">✓</span>
                )}
              </div>
              <p className="font-serif text-[18px] text-maroon">Photo received</p>
              <p className="text-[13px] text-ink-soft leading-relaxed mt-1.5">
                Our team reviews photos before they appear to other members, usually within a day.
                You can add more or change it any time from your profile.
              </p>
              <Link href="/profile" className="btn-primary w-full justify-center py-2.5 text-sm mt-4">
                Go to my profile
              </Link>
              <Link href="/profile/edit" className="btn-ghost w-full justify-center py-2.5 text-sm mt-2">
                Complete the rest of my profile
              </Link>

              {/* Optional, and deliberately last. Onboarding is already complete
                  by the time this renders — the two buttons above are the way
                  forward — so this can be ignored entirely and nothing is
                  blocked. It is an external link, not a step. */}
              <div className="mt-5 border-t border-paper-3 pt-4 text-left">
                <p className="font-serif text-[16px] text-maroon">🎉 Welcome to Mithila Jodi!</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
                  Join our WhatsApp Community to stay updated with Mithila Jodi announcements
                  and community activities.
                </p>
                <JoinCommunityButton size="sm" className="mt-3 w-full" />
              </div>
            </div>
          ) : (
            <>
              <label
                htmlFor="w-photo"
                className="block rounded-mj-sm border-2 border-dashed border-gold/50 bg-paper-2/50 px-4 py-8 text-center cursor-pointer hover:border-gold transition-colors"
              >
                <span className="block font-serif text-[17px] text-maroon">
                  {uploading ? 'Uploading…' : 'Choose a photo'}
                </span>
                <span className="block text-[12.5px] text-ink-soft mt-1.5">
                  A clear photo of your face. JPEG, PNG, WebP or HEIC.
                </span>
                <input
                  id="w-photo" ref={fileRef} type="file" accept="image/*" className="sr-only"
                  disabled={uploading}
                  onChange={e => upload(e.target.files?.[0])}
                />
              </label>

              <ul className="mt-4 space-y-1.5 text-[12.5px] text-ink-soft">
                <li>· Reviewed by our team before anyone sees it.</li>
                <li>· You choose whether it is visible to all members or only to your matches.</li>
                <li>· You can replace or remove it at any time.</li>
              </ul>

              {!detailsDone && (
                <button type="button" onClick={() => setStep(1)} className="btn-ghost w-full justify-center py-2 text-[13px] mt-4">
                  Back to details
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* An escape hatch matters: the gate redirects every member page here, so
          without this someone who is not ready would have no way out but to
          clear cookies. Logout is POST-only, so this cannot be a link. */}
      <p className="text-center text-[12px] text-ink-soft mt-5">
        Not ready to continue?{' '}
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
            window.location.href = '/'
          }}
          className="text-maroon hover:underline"
        >
          Log out
        </button>{' '}
        — your progress is saved.
      </p>
    </div>
  )
}

export default WelcomeFlow
