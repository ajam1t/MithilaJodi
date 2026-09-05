'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type ConversationItem = {
  id: string
  partner: {
    id: string
    display_name: string
    photo_url: string | null
  }
  last_message: {
    body: string
    sent_at: string
    is_mine: boolean
  } | null
  unread_count: number
  updated_at: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function MessagesContent() {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.json())
      .then(j => {
        if (j.ok) setConversations(j.conversations ?? [])
        else setError(j.message ?? 'Failed to load messages')
      })
      .catch(() => setError('Could not load messages'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <div className="wrap py-8">
        <div className="max-w-2xl mx-auto space-y-5">
          <h1 className="font-serif text-3xl text-ink">Messages</h1>

          {error && (
            <div className="rounded-mj-sm bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="card p-4 flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-paper-3 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-paper-3 rounded w-1/3" />
                    <div className="h-3 bg-paper-3 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-ink-soft text-sm">No conversations yet.</p>
              <p className="text-xs text-ink-soft mt-1">
                Conversations open when both parties accept each other&apos;s interest.
              </p>
              <Link href="/interests" className="text-maroon text-sm underline mt-3 inline-block">
                View interests
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-paper-3 card overflow-hidden">
              {conversations.map(conv => (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-cream transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-cream border border-paper-3 flex items-center justify-center">
                      {conv.partner.photo_url ? (
                        <img
                          src={conv.partner.photo_url}
                          alt={conv.partner.display_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-lg text-ink-soft">
                          {conv.partner.display_name[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-maroon text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`font-semibold text-sm truncate ${conv.unread_count > 0 ? 'text-ink' : 'text-ink'}`}>
                        {conv.partner.display_name}
                      </span>
                      <span className="text-xs text-ink-soft shrink-0">
                        {conv.last_message ? timeAgo(conv.last_message.sent_at) : timeAgo(conv.updated_at)}
                      </span>
                    </div>
                    {conv.last_message ? (
                      <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? 'text-ink font-medium' : 'text-ink-soft'}`}>
                        {conv.last_message.is_mine ? 'You: ' : ''}{conv.last_message.body}
                      </p>
                    ) : (
                      <p className="text-xs text-ink-soft mt-0.5 italic">No messages yet</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
