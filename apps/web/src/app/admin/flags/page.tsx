'use client'

import { useState, useEffect } from 'react'

type Flag = {
  id: string
  type: string
  confidence: number | null
  notes: string | null
  created_at: string
  profile_name: string | null
  mobile: string | null
}

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/flags')
      .then(r => r.json())
      .then(j => { if (j.ok) setFlags(j.flags) })
      .finally(() => setLoading(false))
  }, [])

  async function resolve(flagId: string) {
    setBusy(flagId)
    const res = await fetch(`/api/admin/flags/${flagId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved: true }),
    })
    const json = await res.json()
    if (json.ok) setFlags(f => f.filter(x => x.id !== flagId))
    setBusy(null)
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <h1 className="font-serif text-2xl text-ink mb-2">Moderation Flags</h1>
      <p className="text-xs text-ink-soft mb-6">
        Automated risk signals for admin review. Flags do not trigger automatic bans.
      </p>

      {loading ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading…</p>
      ) : flags.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">No unresolved flags.</div>
      ) : (
        <div className="space-y-3">
          {flags.map(f => (
            <div key={f.id} className="card p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium capitalize">
                    {f.type.replace(/_/g, ' ')}
                  </span>
                  {f.confidence != null && (
                    <span className="text-xs text-ink-soft">
                      {Math.round(f.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink">
                  {f.profile_name && <span className="font-medium">{f.profile_name}</span>}
                  {f.mobile && <span className="text-ink-soft ml-1">({f.mobile})</span>}
                </p>
                {f.notes && <p className="text-xs text-ink-soft">{f.notes}</p>}
                <p className="text-xs text-ink-soft">{new Date(f.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <button
                type="button"
                onClick={() => resolve(f.id)}
                disabled={busy === f.id}
                className="btn-ghost text-xs py-1.5 px-3 shrink-0 disabled:opacity-60"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
