'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { WhatsAppIcon } from '@/components/whatsapp/JoinCommunity'

/**
 * Create and manage shareable links to your own profile.
 *
 * The section-by-section checkboxes are the point of the whole feature: a link
 * sent on WhatsApp will be forwarded, so what matters is not that the URL is
 * secret but that the owner decided what it exposes. Contact details are off
 * unless ticked, and the copy says why rather than leaving it as an unexplained
 * default.
 */

// Mirrors SHARE_SECTIONS in lib/profileShare. Duplicated because that module is
// `server-only` — it reads private profile fields — and this is a client
// component. The API re-validates every key, so a drift here cannot widen
// what a link actually exposes.
const SECTIONS: Array<{ key: string; label: string; hint: string; locked?: boolean; sensitive?: boolean }> = [
  { key: 'basic',     label: 'Name, age, height', hint: 'Always included.', locked: true },
  { key: 'photos',    label: 'Photos',            hint: 'Your approved photos.' },
  { key: 'community', label: 'Community',         hint: 'Caste, gotra, maternal gotra, mool, gram.' },
  { key: 'location',  label: 'Location',          hint: 'Where you live, your native place.' },
  { key: 'education', label: 'Education',         hint: 'Degree, specialisation, institution.' },
  { key: 'career',    label: 'Career',            hint: 'Role, employer, industry, experience.' },
  { key: 'lifestyle', label: 'Lifestyle',         hint: 'Diet, habits, marriage timeline.' },
  { key: 'family',    label: 'Family',            hint: 'Family type, values, parents, siblings.' },
  { key: 'about',     label: 'About you',         hint: 'Your own words.' },
  { key: 'horoscope', label: 'Horoscope',         hint: 'Rashi, nakshatra, manglik, birth details.' },
  {
    key: 'preferences', label: 'What you are looking for',
    hint: 'Age, community, education, location and timeline you are hoping for.',
  },
  {
    key: 'contact', label: 'Contact details',
    hint: 'Mobile, email and address. Anyone this link reaches would get them — including whoever it is forwarded to.',
    sensitive: true,
  },
]

const DEFAULT_FIELDS = ['basic', 'photos', 'community', 'location', 'education', 'career', 'lifestyle', 'family', 'about']

const EXPIRY_CHOICES = [
  { days: 30, label: '30 days' },
  { days: 90, label: '3 months' },
  { days: 365, label: '1 year' },
  { days: 730, label: '2 years' },
]

type Share = {
  id: string
  token: string
  label: string | null
  fields: string[]
  expiresAt: string
  revokedAt: string | null
  viewCount: number
  lastViewedAt: string | null
  createdAt: string
  live: boolean
}

function shareUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/p/${token}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ShareProfileLinks({ hasProfile }: { hasProfile: boolean }) {
  const [shares, setShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const [label, setLabel] = useState('')
  const [fields, setFields] = useState<string[]>(DEFAULT_FIELDS)
  const [expiryDays, setExpiryDays] = useState(365)

  /** Which link the form is editing, or null when it is creating a new one. */
  const [editingId, setEditingId] = useState<string | null>(null)

  // Guards the one-time "give this member their first link" call, so a re-render
  // or a second load cannot fire it twice.
  const ensuredRef = useRef(false)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/profile/shares', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!j.ok) return

      const existing: Share[] = j.shares ?? []
      setShares(existing)

      // A member should not have to discover a button before they have a link
      // to send. If this profile has never had one, mint it now with the safe
      // defaults, which they can then edit or turn off like any other link.
      //
      // The server decides whether this is a no-op — it refuses if the profile
      // has ever had a share row, including revoked ones — so a member who
      // turned their link off does not get a replacement on the next visit, and
      // two tabs racing cannot produce two links.
      if (existing.length === 0 && !ensuredRef.current) {
        ensuredRef.current = true
        const er = await fetch('/api/profile/shares', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ensure: true }),
        })
        const ej = await er.json().catch(() => ({}))
        if (ej.ok && ej.share) setShares([ej.share])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (hasProfile) void load(); else setLoading(false) }, [hasProfile, load])

  if (!hasProfile) return null

  function toggleField(key: string) {
    setFields(f => (f.includes(key) ? f.filter(k => k !== key) : [...f, key]))
  }

  function openCreate() {
    setEditingId(null)
    setLabel('')
    setFields(DEFAULT_FIELDS)
    setExpiryDays(365)
    setError('')
    setShowForm(true)
  }

  /** Open the same form over an existing link so its settings can be changed. */
  function openEdit(s: Share) {
    setEditingId(s.id)
    setLabel(s.label ?? '')
    setFields(s.fields)
    // 0 means "leave the existing date alone" — the API takes a number of days
    // from now, so re-sending the current choice would quietly extend the link
    // every time the member edited anything else.
    setExpiryDays(0)
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  async function submit() {
    setCreating(true); setError('')
    try {
      const editing = editingId !== null
      const body: Record<string, unknown> = { label: label.trim() || null, fields }
      if (!editing || expiryDays > 0) body.expires_in_days = expiryDays || 365

      const r = await fetch(
        editing ? `/api/profile/shares/${editingId}` : '/api/profile/shares',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) {
        setError(j.message ?? (editing ? 'Could not update the link.' : 'Could not create the link.'))
        return
      }

      if (editing) {
        setShares(s => s.map(x => (x.id === editingId ? j.share : x)))
      } else {
        setShares(s => [j.share, ...s])
        // Only on creation. Copying on every edit would hijack the clipboard of
        // someone who just wanted to untick a section.
        void copy(j.share.token)
      }
      closeForm()
    } catch {
      setError('Network error. Please try again.')
    } finally { setCreating(false) }
  }

  async function revoke(id: string) {
    setError('')
    const r = await fetch(`/api/profile/shares/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revoke: true }),
    })
    const j = await r.json().catch(() => ({}))
    if (j.ok) setShares(s => s.map(x => (x.id === id ? j.share : x)))
    else setError(j.message ?? 'Could not turn off the link.')
  }

  async function copy(token: string) {
    const url = shareUrl(token)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedToken(token)
      window.setTimeout(() => setCopiedToken(null), 2000)
    } catch {
      // Clipboard is blocked in some in-app browsers; a prompt still lets the
      // member get the link out rather than leaving the button doing nothing.
      window.prompt('Copy your profile link:', url)
    }
  }

  const live = shares.filter(s => s.live)
  const dead = shares.filter(s => !s.live)

  return (
    <section className="card p-5" aria-label="Share your profile">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-[18px] text-maroon leading-tight">Share your profile</h2>
          <p className="text-[12.5px] text-ink-soft leading-relaxed mt-1">
            Your link is ready to send on WhatsApp. Whoever opens it sees your profile without
            needing an account — and you choose what it shows, any time.
          </p>
        </div>
        {!showForm && (
          <button type="button" onClick={openCreate} className="btn-primary shrink-0 text-[13px] px-3.5 py-2">
            New link
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-mj-sm bg-error-soft border border-error/30 px-3 py-2 text-[13px] text-error-fg">
          {error}
        </p>
      )}

      {showForm && (
        <div className="mt-4 rounded-mj-sm border border-gold/35 bg-paper-2/60 p-4">
          <p className="font-serif text-[15px] text-maroon mb-3">
            {editingId ? 'Edit what this link shows' : 'Create a new link'}
          </p>
          <div>
            <label className="field-label" htmlFor="share-label">Label (only you see this)</label>
            <input
              id="share-label"
              type="text"
              maxLength={80}
              value={label}
              placeholder="e.g. For the Sharma family"
              onChange={e => setLabel(e.target.value)}
              className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white"
            />
          </div>

          <fieldset className="mt-3.5">
            <legend className="field-label">What this link shows</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
              {SECTIONS.map(sec => {
                const checked = sec.locked || fields.includes(sec.key)
                return (
                  <label
                    key={sec.key}
                    className={`flex items-start gap-2.5 py-1 ${sec.locked ? 'opacity-70' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={sec.locked}
                      onChange={() => toggleField(sec.key)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-maroon"
                    />
                    <span className="min-w-0">
                      <span className={`block text-[13.5px] leading-tight ${sec.sensitive ? 'text-terra font-medium' : 'text-ink'}`}>
                        {sec.label}
                      </span>
                      <span className="block text-[11.5px] text-ink-soft leading-snug mt-0.5">{sec.hint}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-3.5">
            <label className="field-label" htmlFor="share-expiry">Link stops working after</label>
            <select
              id="share-expiry"
              value={expiryDays}
              onChange={e => setExpiryDays(Number(e.target.value))}
              className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white"
            >
              {/* Editing starts on "leave it as it is": the API counts days from
                  now, so re-submitting the original choice would push the expiry
                  date further out every time someone edited a section. */}
              {editingId && <option value={0}>Leave the date as it is</option>}
              {EXPIRY_CHOICES.map(c => (
                <option key={c.days} value={c.days}>{c.label}</option>
              ))}
            </select>
            <p className="text-[11.5px] text-ink-soft mt-1">You can turn any link off before then, at any time.</p>
          </div>

          <div className="flex gap-2 mt-4">
            <button type="button" onClick={submit} disabled={creating} className="btn-primary text-[13.5px] px-4 py-2 disabled:opacity-60">
              {creating
                ? (editingId ? 'Saving…' : 'Creating…')
                : (editingId ? 'Save changes' : 'Create link')}
            </button>
            <button type="button" onClick={closeForm} className="btn-ghost text-[13.5px] px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-ink-soft mt-4">Loading your links…</p>
      ) : shares.length === 0 && !showForm ? (
        // Reached only by a member who has turned every link off — a new profile
        // is given one automatically. Worth saying so, otherwise it reads as if
        // the feature is broken.
        <p className="text-[13px] text-ink-soft mt-4">
          You have turned off all your links. Create a new one whenever you are ready to share.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {[...live, ...dead].map(s => {
            const url = shareUrl(s.token)
            const shown = SECTIONS.filter(x => s.fields.includes(x.key) && !x.locked).length
            return (
              <li
                key={s.id}
                className={`rounded-mj-sm border p-3.5 ${s.live ? 'border-paper-3 bg-paper/60' : 'border-paper-3 bg-paper-2/50 opacity-70'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] text-ink font-medium truncate">
                      {s.label || 'Profile link'}
                      {!s.live && (
                        <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-terra">
                          {s.revokedAt ? 'Turned off' : 'Expired'}
                        </span>
                      )}
                    </p>
                    <p className="text-[11.5px] text-ink-soft mt-0.5">
                      {shown} {shown === 1 ? 'section' : 'sections'}
                      {s.fields.includes('contact') && <span className="text-terra"> · includes contact</span>}
                      {' · '}
                      {s.live ? `until ${formatDate(s.expiresAt)}` : `created ${formatDate(s.createdAt)}`}
                      {' · '}
                      {s.viewCount === 0 ? 'not opened yet' : `opened ${s.viewCount}×`}
                    </p>
                  </div>
                  {s.live && (
                    <div className="shrink-0 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="text-[12.5px] text-maroon underline underline-offset-2 hover:text-terra"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => revoke(s.id)}
                        className="text-[12.5px] text-terra underline underline-offset-2 hover:text-maroon"
                      >
                        Turn off
                      </button>
                    </div>
                  )}
                </div>

                {s.live && (
                  <>
                    <p className="mt-2 rounded-mj-sm bg-white border border-paper-3 px-2.5 py-1.5 text-[11.5px] text-ink-soft break-all font-mono">
                      {url}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => copy(s.token)}
                        className="rounded-mj-sm border border-maroon/30 px-3 py-1.5 text-[12.5px] font-semibold text-maroon hover:bg-maroon hover:text-cream transition-colors"
                      >
                        {copiedToken === s.token ? 'Copied' : 'Copy link'}
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Namaste. Sharing our marriage biodata from Mithila Jodi: ${url}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-mj-sm bg-green px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-green-2 transition-colors"
                      >
                        <WhatsAppIcon /> Send on WhatsApp
                      </a>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-mj-sm border border-ink/20 px-3 py-1.5 text-[12.5px] font-semibold text-ink-soft hover:text-ink transition-colors"
                      >
                        Preview
                      </a>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-4 pt-3 border-t border-paper-3 text-[11.5px] text-ink-soft leading-relaxed">
        Anyone holding the link can open it, so treat it as unlisted rather than private — links get
        forwarded. It is kept out of Google, it stops working on the date you chose, and you can turn
        it off here at any moment.
      </p>
    </section>
  )
}

export default ShareProfileLinks
