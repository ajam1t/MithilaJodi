'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Account = {
  id: string
  mobile: string
  role: string
  account_status: string
  created_at: string
  profile: { id: string; name: string; profile_status: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-amber-100 text-amber-800',
  banned: 'bg-red-100 text-red-700',
  pending_verification: 'bg-blue-100 text-blue-700',
  deactivated: 'bg-gray-100 text-gray-600',
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [actionMap, setActionMap] = useState<Record<string, string>>({})
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({})

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    fetch(`/api/admin/accounts?${params}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setAccounts(j.accounts) })
      .finally(() => setLoading(false))
  }, [q, status])

  useEffect(() => { load() }, [load])

  async function updateStatus(accountId: string) {
    const newStatus = actionMap[accountId]
    if (!newStatus) return
    setBusy(accountId)
    const res = await fetch(`/api/admin/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_status: newStatus, reason: reasonMap[accountId] }),
    })
    const json = await res.json()
    if (json.ok) load()
    setBusy(null)
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-serif text-2xl text-ink mb-5">Accounts</h1>

      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by mobile…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          className="border border-paper-3 rounded-mj-sm px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:border-maroon/50"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border border-paper-3 rounded-mj-sm px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending_verification">Pending verification</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {loading ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading…</p>
      ) : accounts.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">No accounts found.</div>
      ) : (
        <div className="space-y-3">
          {accounts.map(a => (
            <div key={a.id} className="card p-4 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-sm text-ink">{a.mobile}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${STATUS_COLORS[a.account_status] ?? 'bg-paper-3 text-ink-soft'}`}>
                  {a.account_status.replace('_', ' ')}
                </span>
                <span className="text-xs text-ink-soft capitalize">{a.role}</span>
                {a.profile && (
                  <Link href={`/profile/${a.profile.id}`} target="_blank" className="text-xs text-maroon underline">
                    {a.profile.name} ({a.profile.profile_status})
                  </Link>
                )}
                <span className="text-xs text-ink-soft ml-auto">
                  {new Date(a.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                <select
                  value={actionMap[a.id] ?? ''}
                  onChange={e => setActionMap(m => ({ ...m, [a.id]: e.target.value }))}
                  className="text-xs border border-paper-3 rounded-mj-sm px-2 py-1.5 focus:outline-none"
                >
                  <option value="">Change status…</option>
                  <option value="active">Set active</option>
                  <option value="suspended">Suspend</option>
                  <option value="banned">Ban</option>
                </select>
                <input
                  type="text"
                  placeholder="Reason"
                  value={reasonMap[a.id] ?? ''}
                  onChange={e => setReasonMap(m => ({ ...m, [a.id]: e.target.value }))}
                  className="text-xs border border-paper-3 rounded-mj-sm px-2 py-1.5 focus:outline-none flex-1 max-w-xs"
                />
                <button
                  type="button"
                  onClick={() => updateStatus(a.id)}
                  disabled={busy === a.id || !actionMap[a.id]}
                  className="btn-primary text-xs py-1.5 px-3 disabled:opacity-60"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
