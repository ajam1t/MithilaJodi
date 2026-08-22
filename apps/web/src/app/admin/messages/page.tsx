'use client'

import { useState, useEffect } from 'react'

type ConvProfile = {
  id: string
  display_name: string | null
  mobile: string | null
}

type Conversation = {
  id: string
  created_at: string
  updated_at: string
  status: string
  profile_a: ConvProfile
  profile_b: ConvProfile
  message_count: number
  last_message: { body: string; sent_at: string } | null
}

export default function AdminMessagesPage() {
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/messages')
      .then(r => r.json())
      .then(j => { if (j.ok) setConvs(j.conversations) })
      .finally(() => setLoading(false))
  }, [])

  async function deleteConv(convId: string) {
    if (!window.confirm('Delete this entire conversation and all its messages?')) return
    setBusy(convId)
    const res = await fetch(`/api/admin/messages/${convId}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) setConvs(c => c.filter(x => x.id !== convId))
    setBusy(null)
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-serif text-2xl text-ink mb-6">Conversations</h1>

      {loading ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading…</p>
      ) : convs.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">No conversations found.</div>
      ) : (
        <div className="space-y-3">
          {convs.map(c => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-semibold text-ink">{c.profile_a.display_name ?? '—'}</span>
                    <span className="text-xs text-ink-soft font-mono">{c.profile_a.mobile ?? ''}</span>
                    <span className="text-ink-soft text-xs">↔</span>
                    <span className="font-semibold text-ink">{c.profile_b.display_name ?? '—'}</span>
                    <span className="text-xs text-ink-soft font-mono">{c.profile_b.mobile ?? ''}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-soft flex-wrap">
                    <span>{c.message_count} message{c.message_count !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>Updated {new Date(c.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span className={`px-2 py-0.5 rounded-full capitalize font-medium
                      ${c.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </div>
                  {c.last_message && (
                    <p className="text-xs text-ink-soft truncate italic">
                      &ldquo;{c.last_message.body}&rdquo;
                    </p>
                  )}
                </div>
                <button type="button"
                  onClick={() => deleteConv(c.id)}
                  disabled={busy === c.id}
                  className="shrink-0 text-xs py-1.5 px-3 border border-red-200 text-red-600 rounded-mj-sm hover:bg-red-50 disabled:opacity-60">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
