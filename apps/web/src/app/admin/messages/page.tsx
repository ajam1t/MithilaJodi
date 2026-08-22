'use client'

import { useState, useEffect, useCallback } from 'react'

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

type AdminMessage = {
  id: string
  sender_id: string
  sender_name: string
  body: string
  sent_at: string
  is_deleted: boolean
}

export default function AdminMessagesPage() {
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [msgLoading, setMsgLoading] = useState(false)

  const load = useCallback((term: string) => {
    setLoading(true)
    const url = term.trim() ? `/api/admin/messages?q=${encodeURIComponent(term.trim())}` : '/api/admin/messages'
    fetch(url)
      .then(r => r.json())
      .then(j => { if (j.ok) setConvs(j.conversations) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load('') }, [load])

  async function openMessages(convId: string) {
    if (expandedId === convId) { setExpandedId(null); return }
    setExpandedId(convId)
    setMsgLoading(true)
    setMessages([])
    const res = await fetch(`/api/admin/messages/${convId}`)
    const json = await res.json()
    if (json.ok) setMessages(json.messages)
    setMsgLoading(false)
  }

  async function deleteMessage(convId: string, msgId: string) {
    if (!window.confirm('Hide this message from both users? It will be removed from their chat (recoverable by an admin).')) return
    setBusy(msgId)
    const res = await fetch(`/api/admin/messages/${convId}?message_id=${msgId}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) setMessages(ms => ms.map(m => m.id === msgId ? { ...m, is_deleted: true } : m))
    setBusy(null)
  }

  async function restoreMessage(convId: string, msgId: string) {
    setBusy(msgId)
    const res = await fetch(`/api/admin/messages/${convId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: msgId, action: 'restore' }),
    })
    const json = await res.json()
    if (json.ok) setMessages(ms => ms.map(m => m.id === msgId ? { ...m, is_deleted: false } : m))
    setBusy(null)
  }

  async function deleteConv(convId: string) {
    if (!window.confirm('Remove this entire chat? All messages are hidden from both users and the chat is closed (data is preserved and recoverable).')) return
    setBusy(convId)
    const res = await fetch(`/api/admin/messages/${convId}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) {
      setConvs(c => c.map(x => x.id === convId ? { ...x, status: 'closed' } : x))
      if (expandedId === convId) setMessages(ms => ms.map(m => ({ ...m, is_deleted: true })))
    }
    setBusy(null)
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <h1 className="font-serif text-xl sm:text-2xl text-ink mb-4">Conversations</h1>

      {/* User search */}
      <form
        onSubmit={e => { e.preventDefault(); load(q) }}
        className="flex gap-2 mb-5"
      >
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Filter by user name or mobile…"
          className="flex-1 min-w-0 border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
        />
        <button type="submit" className="shrink-0 text-sm py-2 px-4 bg-maroon text-cream rounded-mj-sm hover:bg-maroon-deep">
          Search
        </button>
        {q && (
          <button type="button" onClick={() => { setQ(''); load('') }}
            className="shrink-0 text-sm py-2 px-3 border border-ink/20 text-ink-soft rounded-mj-sm hover:text-ink">
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading…</p>
      ) : convs.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">No conversations found.</div>
      ) : (
        <div className="space-y-3">
          {convs.map(c => (
            <div key={c.id} className="card p-3 sm:p-4">
              {/* Header: participants + actions */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap text-sm">
                    <span className="font-semibold text-ink">{c.profile_a.display_name ?? '—'}</span>
                    <span className="text-[11px] text-ink-soft font-mono">{c.profile_a.mobile ?? ''}</span>
                    <span className="text-ink-soft text-xs">↔</span>
                    <span className="font-semibold text-ink">{c.profile_b.display_name ?? '—'}</span>
                    <span className="text-[11px] text-ink-soft font-mono">{c.profile_b.mobile ?? ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-soft flex-wrap">
                    <span>{c.message_count} msg{c.message_count !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{new Date(c.updated_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                    <span className={`px-2 py-0.5 rounded-full capitalize font-medium
                      ${c.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </div>
                  {c.last_message && (
                    <p className="text-xs text-ink-soft truncate italic">&ldquo;{c.last_message.body}&rdquo;</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button"
                    onClick={() => openMessages(c.id)}
                    className="text-xs py-1.5 px-3 border border-ink/20 text-ink rounded-mj-sm hover:bg-cream">
                    {expandedId === c.id ? 'Hide' : 'View'} messages
                  </button>
                  <button type="button"
                    onClick={() => deleteConv(c.id)}
                    disabled={busy === c.id}
                    className="text-xs py-1.5 px-3 border border-red-200 text-red-600 rounded-mj-sm hover:bg-red-50 disabled:opacity-60">
                    Delete chat
                  </button>
                </div>
              </div>

              {/* Expanded message list */}
              {expandedId === c.id && (
                <div className="mt-3 pt-3 border-t border-ink/10">
                  {msgLoading ? (
                    <p className="text-ink-soft text-xs animate-pulse">Loading messages…</p>
                  ) : messages.length === 0 ? (
                    <p className="text-ink-soft text-xs">No messages in this chat.</p>
                  ) : (
                    <ul className="space-y-2">
                      {messages.map(m => (
                        <li key={m.id}
                          className={`flex items-start gap-2 text-sm rounded-mj-sm px-2.5 py-2 ${m.is_deleted ? 'bg-red-50' : 'bg-cream'}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-semibold text-maroon">{m.sender_name}</span>
                              <span className="text-[10px] text-ink-soft">
                                {new Date(m.sent_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                              {m.is_deleted && <span className="text-[10px] text-red-600 font-medium">removed</span>}
                            </div>
                            <p className={`text-sm break-words ${m.is_deleted ? 'text-ink-soft line-through' : 'text-ink'}`}>
                              {m.body}
                            </p>
                          </div>
                          {m.is_deleted ? (
                            <button type="button"
                              onClick={() => restoreMessage(c.id, m.id)}
                              disabled={busy === m.id}
                              className="shrink-0 text-[11px] py-1 px-2 border border-ink/20 text-ink-soft rounded hover:text-ink disabled:opacity-60">
                              Restore
                            </button>
                          ) : (
                            <button type="button"
                              onClick={() => deleteMessage(c.id, m.id)}
                              disabled={busy === m.id}
                              className="shrink-0 text-[11px] py-1 px-2 border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-60">
                              Delete
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
