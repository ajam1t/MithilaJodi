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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
