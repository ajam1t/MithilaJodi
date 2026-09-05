'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Message = {
  id: string
  sender_id: string
  body: string
  sent_at: string
  is_mine: boolean
}

type ConvData = {
  ok: boolean
  conversation_id: string
  partner: { id: string; display_name: string; photo_url: string | null }
  messages: Message[]
  has_more: boolean
  message?: string
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(messages: Message[]): { date: string; msgs: Message[] }[] {
  const groups: { date: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const d = formatDate(msg.sent_at)
    if (!groups.length || groups[groups.length - 1].date !== d) {
      groups.push({ date: d, msgs: [msg] })
    } else {
      groups[groups.length - 1].msgs.push(msg)
    }
  }
  return groups
}

export default function ThreadContent() {
  const params = useParams()
  const conversationId = params?.id as string

  const [data, setData] = useState<ConvData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!conversationId) return
    fetch(`/api/conversations/${conversationId}`)
      .then(r => r.json())
      .then((j: ConvData) => {
        if (j.ok) {
          setData(j)
          setMessages(j.messages)
          setHasMore(j.has_more)
          setTimeout(scrollToBottom, 50)
        } else {
          setError(j.message ?? 'Could not load conversation')
        }
      })
      .catch(() => setError('Could not load conversation'))
      .finally(() => setLoading(false))
  }, [conversationId, scrollToBottom])

  async function loadMore() {
    if (!messages.length || loadingMore) return
    setLoadingMore(true)
    const oldest = messages[0]
    const res = await fetch(`/api/conversations/${conversationId}?before=${oldest.id}`)
    const j: ConvData = await res.json()
    if (j.ok) {
      setMessages(prev => [...j.messages, ...prev])
      setHasMore(j.has_more)
    }
    setLoadingMore(false)
  }

  async function send() {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setSendError('')
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    const j = await res.json()
    if (j.ok) {
      setMessages(prev => [...prev, j.message])
      setDraft('')
      setTimeout(scrollToBottom, 50)
    } else {
      setSendError(j.message ?? 'Could not send message')
    }
    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const partner = data?.partner
  const groups = groupByDate(messages)

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-56px)] bg-paper">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-ink-soft text-sm animate-pulse">Loading conversation…</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <main id="main-content" className="min-h-screen bg-paper">
        <div className="wrap py-16 text-center">
          <p className="text-ink-soft text-sm">{error}</p>
          <Link href="/messages" className="text-maroon underline text-sm mt-3 inline-block">
            Back to messages
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="flex flex-col bg-paper" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="border-b border-paper-3 bg-cream px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/messages" className="text-ink-soft hover:text-ink text-lg leading-none">
          ←
        </Link>
        {partner && (
          <>
            <Link href={`/profile/${partner.id}`}>
              <div className="w-9 h-9 rounded-full overflow-hidden bg-paper-3 border border-paper-3 flex items-center justify-center shrink-0">
                {partner.photo_url ? (
                  <img src={partner.photo_url} alt={partner.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-ink-soft">{partner.display_name[0]?.toUpperCase()}</span>
                )}
              </div>
            </Link>
            <Link href={`/profile/${partner.id}`} className="font-semibold text-ink text-sm hover:text-maroon">
              {partner.display_name}
            </Link>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {hasMore && (
          <div className="text-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs text-maroon underline disabled:opacity-60"
            >
              {loadingMore ? 'Loading…' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center text-ink-soft text-sm py-8">
            No messages yet. Say hello!
          </div>
        )}

        {groups.map(group => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-paper-3" />
              <span className="text-xs text-ink-soft shrink-0">{group.date}</span>
              <div className="flex-1 h-px bg-paper-3" />
            </div>

            <div className="space-y-1.5">
              {group.msgs.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.is_mine
                        ? 'bg-maroon text-white rounded-br-sm'
                        : 'bg-cream border border-paper-3 text-ink rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    <p className={`text-xs mt-1 ${msg.is_mine ? 'text-white/60' : 'text-ink-soft'} text-right`}>
                      {formatTime(msg.sent_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-paper-3 bg-cream px-4 py-3 shrink-0">
        {sendError && (
          <p className="text-xs text-red-600 mb-2">{sendError}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none rounded-mj-sm border border-paper-3 bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:border-maroon/50 focus:ring-1 focus:ring-maroon/20 max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 128) + 'px'
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || sending}
            className="btn-primary py-2.5 px-4 text-sm shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-ink-soft mt-1.5 text-right">
          {draft.length}/2000
        </p>
      </div>
    </div>
  )
}
