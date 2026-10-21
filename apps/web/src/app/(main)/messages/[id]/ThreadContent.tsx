'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { OFFICIAL_AVATAR_SRC } from '@/lib/constants'

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
  partner: { id: string; display_name: string; photo_url: string | null; is_official?: boolean }
  messages: Message[]
  has_more: boolean
  message?: string
}

/*
 * The thread fills exactly the space the (main) layout leaves it, so the
 * composer always sits above the bottom nav. On mobile that is the dynamic
 * viewport (which shrinks with the browser bars and the keyboard) less the
 * 48px top bar and the layout's bottom padding for the fixed nav plus the
 * home-indicator inset; on desktop, less the 56px top nav only. Keep these in
 * step with src/app/(main)/layout.tsx.
 */
const THREAD_HEIGHT =
  'h-[calc(100dvh-3rem-4.5rem-env(safe-area-inset-bottom))] lg:h-[calc(100dvh-3.5rem)]'

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

/** A message the member tried to send that has not reached the server yet. */
type Outgoing = {
  localId: string
  body: string
  status: 'sending' | 'failed'
  /** The server's reason, when it gave one (e.g. the conversation is closed). */
  reason?: string
}

/** How often an open thread checks for new messages while it is on screen. */
const POLL_MS = 8000
/** Within this many pixels of the end counts as "reading the latest". */
const NEAR_BOTTOM_PX = 120

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
  const [outgoing, setOutgoing] = useState<Outgoing[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const refreshing = useRef(false)
  // The latest list, for the poll to compare against without re-subscribing.
  const messagesRef = useRef<Message[]>([])
  useEffect(() => { messagesRef.current = messages }, [messages])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const isNearBottom = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
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

  /*
   * Fetch the latest page again and append anything new. The same GET marks
   * the partner's messages read, so a reply that arrives while the thread is
   * open is read straight away, as it would be on first load.
   *
   * Earlier pages the member loaded are kept. Only if every message in the
   * latest page is new (more than a page arrived since the last check) is the
   * list replaced, with "Load earlier" offered for the gap.
   */
  const refresh = useCallback(async () => {
    if (!conversationId || refreshing.current) return
    refreshing.current = true
    try {
      const res = await fetch(`/api/conversations/${conversationId}`)
      const j: ConvData = await res.json()
      // The header (partner name and photo) is left as first loaded: the
      // photo URL is re-signed on every call, and swapping it would reload
      // the image every few seconds.
      if (!j.ok) return
      const stick = isNearBottom()
      const prev = messagesRef.current
      const known = new Set(prev.map(m => m.id))
      const fresh = j.messages.filter(m => !known.has(m.id))
      if (!fresh.length) return
      if (prev.length && fresh.length === j.messages.length && j.has_more) {
        setMessages(j.messages)
        setHasMore(true)
      } else {
        setMessages(cur => {
          const have = new Set(cur.map(m => m.id))
          return [...cur, ...fresh.filter(m => !have.has(m.id))].sort((a, b) => a.sent_at.localeCompare(b.sent_at))
        })
      }
      // Follow the conversation only if the member was already at the end;
      // someone scrolled up reading older messages is left where they are.
      if (stick) setTimeout(scrollToBottom, 50)
    } catch {
      // A missed check is harmless: the next one (or a refocus) tries again.
    } finally {
      refreshing.current = false
    }
  }, [conversationId, isNearBottom, scrollToBottom])

  // Poll while the thread is visible; pause in a background tab, and check at
  // once when the member comes back to it.
  useEffect(() => {
    if (loading || error) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, POLL_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    const onFocus = () => { void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
    }
  }, [loading, error, refresh])

  async function loadMore() {
    if (!messages.length || loadingMore) return
    setLoadingMore(true)
    try {
      const oldest = messages[0]
      const res = await fetch(`/api/conversations/${conversationId}?before=${oldest.id}`)
      const j: ConvData = await res.json()
      if (j.ok) {
        setMessages(prev => {
          const known = new Set(prev.map(m => m.id))
          return [...j.messages.filter(m => !known.has(m.id)), ...prev]
        })
        setHasMore(j.has_more)
      }
    } catch {
      // Leave the button in place so the member can try again.
    } finally {
      setLoadingMore(false)
    }
  }

  async function deliver(item: Outgoing) {
    setOutgoing(prev => prev.map(o => (o.localId === item.localId ? { ...o, status: 'sending', reason: undefined } : o)))
    let reason: string | undefined
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: item.body }),
      })
      const j = await res.json()
      if (j.ok) {
        setOutgoing(prev => prev.filter(o => o.localId !== item.localId))
        setMessages(prev => (prev.some(m => m.id === j.message.id) ? prev : [...prev, j.message]))
        setTimeout(scrollToBottom, 50)
        return
      }
      reason = j.message
    } catch {
      // Network failure or an unreadable response: fall through to "failed".
    } finally {
      setOutgoing(prev => prev.map(o => (o.localId === item.localId && o.status === 'sending' ? { ...o, status: 'failed', reason } : o)))
    }
  }

  function send() {
    const body = draft.trim()
    if (!body) return
    // The draft clears at once and the message waits in the thread as
    // "sending"; if it fails it stays there, marked, until retried — nothing
    // the member wrote is lost.
    const item: Outgoing = { localId: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`, body, status: 'sending' }
    setOutgoing(prev => [...prev, item])
    setDraft('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setTimeout(scrollToBottom, 50)
    inputRef.current?.focus()
    void deliver(item)
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
      <div className={`flex flex-col bg-paper ${THREAD_HEIGHT}`}>
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
          <Link href="/inbox" className="text-maroon underline text-sm mt-3 inline-block">
            Back to messages
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className={`flex flex-col bg-paper ${THREAD_HEIGHT}`}>
      {/* Header */}
      <div className="border-b border-paper-3 bg-cream px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/inbox" className="text-ink-soft hover:text-ink text-lg leading-none">
          ←
        </Link>
        {partner && (() => {
          const avatar = (
            <div className="w-9 h-9 rounded-full overflow-hidden bg-paper-3 border border-paper-3 flex items-center justify-center shrink-0">
              {partner.is_official ? (
                /* The brand mark, on cream and contained rather than cropped:
                   the monogram already fills its own square, and the
                   object-[center_35%] framing used for member photographs
                   (which biases towards faces) would cut into it. */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={OFFICIAL_AVATAR_SRC} alt={partner.display_name} className="w-full h-full object-contain bg-cream" />
              ) : partner.photo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={partner.photo_url} alt={partner.display_name} className="w-full h-full object-cover object-[center_35%]" />
              ) : (
                <span className="text-sm text-ink-soft">{partner.display_name[0]?.toUpperCase()}</span>
              )}
            </div>
          )

          // Mithila Jodi itself is not a match. Linking it to /profile/[id]
          // would open a deliberately empty profile and ask the matcher to
          // score the member against the platform, so the official sender is
          // plain text with a badge instead.
          if (partner.is_official) {
            return (
              <>
                {avatar}
                <span className="font-semibold text-ink text-sm">{partner.display_name}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-maroon bg-maroon/10 border border-maroon/25 rounded-full px-2 py-0.5">
                  Official
                </span>
              </>
            )
          }

          return (
            <>
              <Link href={`/profile/${partner.id}`}>{avatar}</Link>
              <Link href={`/profile/${partner.id}`} className="font-semibold text-ink text-sm hover:text-maroon">
                {partner.display_name}
              </Link>
            </>
          )
        })()}
      </div>

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
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

        {outgoing.length > 0 && (
          <div className="space-y-1.5">
            {outgoing.map(o => (
              <div key={o.localId} className="flex flex-col items-end">
                <div
                  className={`max-w-[75%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed bg-maroon text-white ${
                    o.status === 'sending' ? 'opacity-70' : 'opacity-60'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{o.body}</p>
                  {o.status === 'sending' && <p className="text-xs mt-1 text-white/60 text-right">Sending…</p>}
                </div>
                {o.status === 'failed' && (
                  <button
                    type="button"
                    onClick={() => void deliver(o)}
                    className="mt-1 text-xs font-medium text-red-700 hover:underline"
                  >
                    Not sent — tap to retry{o.reason ? ` · ${o.reason}` : ''}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-paper-3 bg-cream px-4 py-3 shrink-0">
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
            disabled={!draft.trim()}
            className="btn-primary py-2.5 px-4 text-sm shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-ink-soft mt-1.5 text-right">
          {draft.length}/2000
        </p>
      </div>
    </div>
  )
}
