'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  dob: string | null
  gender: string
  caste: string | null
  profile_status: string
  created_at: string
  account_id: string
  accounts: { mobile: string } | null
  discoverable: boolean
  primary_photo_url: string | null
}

const STATUS_TABS = [
  { label: 'All',       value: 'all' },
  { label: 'Pending',   value: 'pending_review' },
  { label: 'Active',    value: 'active' },
  { label: 'Draft',     value: 'draft' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Deleted',   value: 'deleted' },
]

const STATUS_COLORS: Record<string, string> = {
  active:         'bg-green-100 text-green-700',
  pending_review: 'bg-blue-100 text-blue-700',
  draft:          'bg-gray-100 text-gray-600',
  suspended:      'bg-amber-100 text-amber-800',
  deleted:        'bg-red-100 text-red-700',
}

/**
 * Ready-made messages, so the common asks are one click and are worded the same
 * way every time. A member reading "please upload a photo" from the platform
 * should get the same sentence whoever sent it.
 */
const MESSAGE_TEMPLATES: { label: string; body: string }[] = [
  {
    label: 'Ask for a photo',
    body:
      'Namaste! Your Mithila Jodi profile is looking good, but it does not have a photograph yet. ' +
      'Profiles with a clear photo get far more interest from families. You can add one from ' +
      'My Profile → Photos. Our team reviews photographs before they appear to other members.',
  },
  {
    label: 'Ask to complete profile',
    body:
      'Namaste! A few details are still missing from your Mithila Jodi profile. Completed profiles ' +
      'appear higher in search and receive more interest. You can finish them from My Profile — ' +
      'the checklist there shows exactly what is left.',
  },
  {
    label: 'Ask for gotra / mool',
    body:
      'Namaste! Your profile does not yet list your gotra and mool. These are the first things ' +
      'Maithil families look at, and we use them for gotra-safe matching, so adding them makes a ' +
      'real difference. You can add them from My Profile → Edit → Community.',
  },
  {
    label: 'Welcome',
    body:
      'Namaste, and welcome to Mithila Jodi! If you need any help with your profile or biodata, ' +
      'just reply to this message and our team will assist you.',
  },
]

function calcAge(dob: string | null): string | null {
  if (!dob) return null
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  return `${age}y`
}

export default function AdminProfilesPage() {
  const [filter, setFilter] = useState('all')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [reason, setReason] = useState<Record<string, string>>({})
  const [delConfirm, setDelConfirm] = useState<Record<string, string>>({})
  // Which profile's composer is open, and the draft per profile so switching
  // between two profiles does not lose what was typed.
  const [composeFor, setComposeFor] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [sent, setSent] = useState<Record<string, string>>({})

  const load = useCallback((status: string) => {
    setLoading(true)
    const qs = status && status !== 'all' ? `?status=${status}` : ''
    fetch(`/api/admin/profiles${qs}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setProfiles(j.profiles) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(filter) }, [filter, load])

  async function approve(id: string) {
    setBusy(id)
    const res = await fetch(`/api/admin/profiles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    const json = await res.json()
    if (json.ok) setProfiles(p => p.map(x => x.id === id ? { ...x, profile_status: 'active' } : x))
    setBusy(null)
  }

  async function suspend(id: string) {
    const r = reason[id]?.trim()
    if (!r) return
    setBusy(id)
    const res = await fetch(`/api/admin/profiles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suspend', reason: r }),
    })
    const json = await res.json()
    if (json.ok) setProfiles(p => p.map(x => x.id === id ? { ...x, profile_status: 'suspended' } : x))
    setBusy(null)
  }

  async function sendMessage(id: string) {
    const text = draft[id]?.trim()
    if (!text) return
    setBusy(id)
    setSent(s => ({ ...s, [id]: '' }))
    try {
      const res = await fetch('/api/admin/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: id, body: text }),
      })
      const json = await res.json()
      if (json.ok) {
        setSent(s => ({ ...s, [id]: 'Sent' }))
        setDraft(d => ({ ...d, [id]: '' }))
        setComposeFor(null)
      } else {
        setSent(s => ({ ...s, [id]: json.message ?? 'Could not send' }))
      }
    } catch {
      setSent(s => ({ ...s, [id]: 'Network error' }))
    } finally {
      setBusy(null)
    }
  }

  async function deleteProfile(id: string) {
    if (delConfirm[id] !== 'DELETE') return
    setBusy(id)
    const res = await fetch(`/api/admin/profiles/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) setProfiles(p => p.filter(x => x.id !== id))
    setBusy(null)
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="mb-5 flex items-center justify-between gap-3"><h1 className="font-serif text-2xl text-ink">Profiles</h1><Link href="/admin/profiles/new" className="btn-primary text-sm px-4 py-2">Create profile</Link></div>

      <div className="flex gap-1 mb-6 border-b border-paper-3">
        {STATUS_TABS.map(tab => (
          <button key={tab.value} type="button"
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
              ${filter === tab.value
                ? 'border-maroon text-maroon'
                : 'border-transparent text-ink-soft hover:text-ink'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading…</p>
      ) : profiles.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">No profiles found.</div>
      ) : (
        <div className="space-y-3">
          {profiles.map(p => {
            const name = p.first_name
              ? (p.last_name ? `${p.first_name} ${p.last_name}` : p.first_name)
              : '(anonymized)'
            const isActive = p.profile_status === 'active'
            const age = calcAge(p.dob)
            return (
              <div key={p.id} className="card p-4 space-y-3">
                <div className="flex gap-3 space-y-1">
                  {p.primary_photo_url && <img src={p.primary_photo_url} alt="" className="h-16 w-14 rounded-mj-sm object-cover" />}
                  <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link href={`/profile/${p.id}`} target="_blank"
                      className="font-semibold text-ink hover:text-maroon">
                      {name}
                    </Link>
                    <span className="text-xs text-ink-soft capitalize">{p.gender}</span>
                    {age && <span className="text-xs text-ink-soft">{age}</span>}
                    {p.caste && <span className="text-xs text-ink-soft">{p.caste}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
                      ${STATUS_COLORS[p.profile_status] ?? 'bg-paper-3 text-ink-soft'}`}>
                      {p.profile_status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft font-mono">{p.accounts?.mobile ?? '—'}</p>
                  <p className="text-xs text-ink-soft">
                    Joined {new Date(p.created_at).toLocaleDateString('en-IN')}
                  </p>
                  <p className="text-xs text-ink-soft">{p.discoverable ? 'Discoverable in Search' : 'Hidden from Search'}</p>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap items-center">
                  {!isActive && (
                    <button type="button" onClick={() => approve(p.id)}
                      disabled={busy === p.id}
                      className="btn-primary text-xs py-1.5 px-3 disabled:opacity-60">
                      Approve
                    </button>
                  )}

                  <Link href={`/admin/profiles/${p.id}`} className="btn-primary text-xs py-1.5 px-3">Edit all details</Link>

                  {/* Messaging as the platform. Placed next to the other
                      per-profile actions because the card above already shows
                      whether there is a photo, so the admin can see who needs
                      asking and ask them without leaving the list. */}
                  <button type="button"
                    onClick={() => setComposeFor(composeFor === p.id ? null : p.id)}
                    className="text-xs py-1.5 px-3 border border-maroon/40 text-maroon rounded-mj-sm hover:bg-maroon hover:text-cream transition-colors">
                    {composeFor === p.id ? 'Cancel message' : 'Message'}
                  </button>
                  {sent[p.id] && (
                    <span className={`text-xs ${sent[p.id] === 'Sent' ? 'text-green-700' : 'text-red-600'}`}>
                      {sent[p.id]}
                    </span>
                  )}

                  {isActive && (
                    <>
                      <input type="text" placeholder="Suspend reason (required)"
                        value={reason[p.id] ?? ''}
                        onChange={e => setReason(r => ({ ...r, [p.id]: e.target.value }))}
                        className="text-xs border border-paper-3 rounded-mj-sm px-2 py-1.5 focus:outline-none focus:border-amber-400 w-48" />
                      <button type="button" onClick={() => suspend(p.id)}
                        disabled={busy === p.id || !reason[p.id]?.trim()}
                        className="text-xs py-1.5 px-3 border border-amber-300 text-amber-700 rounded-mj-sm hover:bg-amber-50 disabled:opacity-60">
                        Suspend
                      </button>
                    </>
                  )}

                  <div className="flex gap-2 items-center ml-auto">
                    <input type="text" placeholder='Type DELETE to confirm'
                      value={delConfirm[p.id] ?? ''}
                      onChange={e => setDelConfirm(d => ({ ...d, [p.id]: e.target.value }))}
                      className="text-xs border border-paper-3 rounded-mj-sm px-2 py-1.5 focus:outline-none focus:border-red-300 w-44" />
                    <button type="button" onClick={() => deleteProfile(p.id)}
                      disabled={busy === p.id || delConfirm[p.id] !== 'DELETE'}
                      className="text-xs py-1.5 px-3 border border-red-200 text-red-600 rounded-mj-sm hover:bg-red-50 disabled:opacity-60">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Composer. Opens under the profile it belongs to rather than
                    in a modal, so the admin can still see the photo and the
                    missing details while writing. */}
                {composeFor === p.id && (
                  <div className="rounded-mj-sm border border-maroon/25 bg-paper-2/60 p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-ink-soft">
                        Sending to <span className="font-medium text-ink">{name}</span> as{' '}
                        <span className="font-medium text-maroon">Mithila Jodi</span>. It arrives in
                        their inbox and they can reply.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {MESSAGE_TEMPLATES.map(t => (
                        <button key={t.label} type="button"
                          onClick={() => setDraft(d => ({ ...d, [p.id]: t.body }))}
                          className="text-[11.5px] py-1 px-2.5 rounded-pill border border-ink/20 text-ink-soft hover:border-maroon hover:text-maroon transition-colors">
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={draft[p.id] ?? ''}
                      onChange={e => setDraft(d => ({ ...d, [p.id]: e.target.value }))}
                      rows={4}
                      maxLength={2000}
                      placeholder="Pick a template above, or write your own message…"
                      className="w-full text-xs border border-paper-3 rounded-mj-sm px-2.5 py-2 focus:outline-none focus:border-maroon"
                    />

                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => sendMessage(p.id)}
                        disabled={busy === p.id || !draft[p.id]?.trim()}
                        className="btn-primary text-xs py-1.5 px-4 disabled:opacity-60">
                        {busy === p.id ? 'Sending…' : 'Send as Mithila Jodi'}
                      </button>
                      <span className="text-[11px] text-ink-soft">
                        {(draft[p.id] ?? '').length}/2000
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
