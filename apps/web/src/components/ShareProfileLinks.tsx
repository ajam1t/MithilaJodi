'use client'

import { useCallback, useEffect, useState } from 'react'

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

function WhatsAppIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.03c-.24.68-1.4 1.3-1.93 1.35-.53.05-1.02.24-3.44-.72-2.9-1.15-4.7-4.15-4.84-4.34-.14-.2-1.13-1.5-1.13-2.87 0-1.36.71-2.03.97-2.31.24-.27.53-.34.7-.34.17 0 .34 0 .49.01.16.01.37-.06.58.44.2.5.7 1.72.76 1.84.06.12.1.27.02.44-.09.17-.17.27-.34.46-.17.19-.26.29-.38.48-.12.19-.26.4-.11.68.14.29.63 1.16 1.35 1.88.93.93 1.71 1.22 1.99 1.36.27.14.44.12.6-.07.17-.19.7-.82.89-1.1.19-.29.38-.24.63-.14.25.09 1.6.76 1.87.9.27.14.46.2.53.32.06.12.06.68-.18 1.36z" />
    </svg>
  )
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

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/profile/shares', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (j.ok) setShares(j.shares ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (hasProfile) void load(); else setLoading(false) }, [hasProfile, load])

  if (!hasProfile) return null

  function toggleField(key: string) {
    setFields(f => (f.includes(key) ? f.filter(k => k !== key) : [...f, key]))
  }

  async function create() {
    setCreating(true); setError('')
    try {
      const r = await fetch('/api/profile/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || null, fields, expires_in_days: expiryDays }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) { setError(j.message ?? 'Could not create the link.'); return }
      setShares(s => [j.share, ...s])
      setShowForm(false)
      setLabel('')
      setFields(DEFAULT_FIELDS)
      void copy(j.share.token)
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
            Create a link you can send on WhatsApp. Whoever opens it sees your profile without
            needing an account — and you choose what the link shows.
          </p>
        </div>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)} className="btn-primary shrink-0 text-[13px] px-3.5 py-2">
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
              {EXPIRY_CHOICES.map(c => (
                <option key={c.days} value={c.days}>{c.label}</option>
              ))}
            </select>
            <p className="text-[11.5px] text-ink-soft mt-1">You can turn any link off before then, at any time.</p>
          </div>

          <div className="flex gap-2 mt-4">
            <button type="button" onClick={create} disabled={creating} className="btn-primary text-[13.5px] px-4 py-2 disabled:opacity-60">
              {creating ? 'Creating…' : 'Create link'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError('') }} className="btn-ghost text-[13.5px] px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-ink-soft mt-4">Loading your links…</p>
      ) : shares.length === 0 && !showForm ? (
        <p className="text-[13px] text-ink-soft mt-4">You have not created any links yet.</p>
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
                    <button
                      type="button"
                      onClick={() => revoke(s.id)}
                      className="shrink-0 text-[12.5px] text-terra underline underline-offset-2 hover:text-maroon"
                    >
                      Turn off
                    </button>
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
