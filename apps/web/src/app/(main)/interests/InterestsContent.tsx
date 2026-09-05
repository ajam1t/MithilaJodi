'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { WhatsAppRequests } from '@/components/whatsapp/WhatsAppConnect'

type InterestProfile = {
  interest_id: string
  status: string
  created_at: string
  conversation_id?: string | null
  profile: {
    id: string
    display_name: string
    age: number | null
    gender: string
    caste: string | null
    current_loc_name: string | null
    photo_url: string | null
  }
}

type ApiResponse = {
  ok: boolean
  received: InterestProfile[]
  sent: InterestProfile[]
  mutual: InterestProfile[]
  message?: string
}

type Tab = 'received' | 'sent' | 'mutual'

function ProfileRow({ item, tab, onAction }: {
  item: InterestProfile
  tab: Tab
  onAction: (interestId: string, action: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const p = item.profile

  async function handle(action: string) {
    setBusy(true)
    await onAction(item.interest_id, action)
    setBusy(false)
  }

  return (
    <div className="card p-4 flex items-center gap-4">
      {/* Avatar */}
      <Link href={`/profile/${p.id}`} className="shrink-0">
        <div className="w-14 h-16 rounded-mj-sm overflow-hidden bg-cream border border-paper-3 flex items-center justify-center">
          {p.photo_url ? (
            <img src={p.photo_url} alt={p.display_name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <span className="text-xl text-ink-soft">{p.display_name[0]?.toUpperCase()}</span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${p.id}`} className="font-semibold text-ink hover:text-maroon">
          {p.display_name}
        </Link>
        <p className="text-xs text-ink-soft mt-0.5">
          {[p.age ? `${p.age} yrs` : null, p.gender, p.caste, p.current_loc_name]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        {tab === 'received' && item.status === 'sent' && (
          <>
            <button
              type="button"
              onClick={() => handle('accept')}
              disabled={busy}
              className="btn-primary text-xs py-1.5 px-3 disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => handle('decline')}
              disabled={busy}
              className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-60"
            >
              Decline
            </button>
          </>
        )}
        {tab === 'received' && item.status === 'accepted' && (
          <span className="text-xs text-green-600 font-medium">Accepted</span>
        )}
        {tab === 'received' && item.status === 'declined' && (
          <span className="text-xs text-ink-soft">Declined</span>
        )}
        {tab === 'sent' && item.status === 'sent' && (
          <button
            type="button"
            onClick={() => handle('withdraw')}
            disabled={busy}
            className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-60"
          >
            Withdraw
          </button>
        )}
        {tab === 'sent' && item.status === 'accepted' && (
          <span className="text-xs text-green-600 font-medium">Accepted</span>
        )}
        {tab === 'sent' && item.status === 'declined' && (
          <span className="text-xs text-ink-soft">Declined</span>
        )}
        {tab === 'sent' && item.status === 'withdrawn' && (
          <span className="text-xs text-ink-soft">Withdrawn</span>
        )}
        {tab === 'mutual' && (
          item.conversation_id ? (
            <Link
              href={`/messages/${item.conversation_id}`}
              className="btn-primary text-xs py-1.5 px-3"
            >
              Message
            </Link>
          ) : (
            <span className="text-xs text-green-600 font-medium">Mutual match</span>
          )
        )}
      </div>
    </div>
  )
}

export default function InterestsContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as Tab | null
  const [tab, setTab] = useState<Tab>(tabParam ?? 'received')
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/interests')
      .then(r => r.json())
      .then(j => {
        if (j.ok) setData(j)
        else setError(j.message ?? 'Failed to load interests')
      })
      .catch(() => setError('Could not load interests'))
      .finally(() => setLoading(false))
  }, [])

  async function handleAction(interestId: string, action: string) {
    setError('')
    try {
      const res = await fetch(`/api/interests/${interestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.ok) {
        // Refresh
        const refreshRes = await fetch('/api/interests')
        const refreshJson = await refreshRes.json()
        if (refreshJson.ok) setData(refreshJson)
      } else {
        setError(json.message ?? 'Could not complete that action. Please try again.')
      }
    } catch {
      setError('Could not complete that action. Please try again.')
    }
  }

  const tabs: { id: Tab; label: string; count: number }[] = data
    ? [
        { id: 'received', label: 'Received', count: data.received.length },
        { id: 'sent', label: 'Sent', count: data.sent.length },
        { id: 'mutual', label: 'Mutual', count: data.mutual.length },
      ]
    : [
        { id: 'received', label: 'Received', count: 0 },
        { id: 'sent', label: 'Sent', count: 0 },
        { id: 'mutual', label: 'Mutual', count: 0 },
      ]

  const items: InterestProfile[] = data?.[tab] ?? []

  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <div className="wrap py-8">
        <div className="max-w-2xl mx-auto space-y-5">
          <h1 className="font-serif text-3xl text-ink">Interests</h1>

          {/* WhatsApp requests awaiting my approval */}
          <WhatsAppRequests />

          {error && (
            <div className="rounded-mj-sm bg-error-soft border border-error/30 px-4 py-3 text-error-fg text-sm">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-paper-3">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-maroon text-maroon'
                    : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${
                    tab === t.id ? 'bg-maroon text-white' : 'bg-paper-3 text-ink-soft'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="card p-4 flex gap-4 items-center">
                  <div className="w-14 h-16 rounded-mj-sm bg-paper-3 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-paper-3 rounded w-1/3" />
                    <div className="h-3 bg-paper-3 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="card p-8 text-center text-ink-soft text-sm">
              {tab === 'received' && 'No interests received yet.'}
              {tab === 'sent' && 'You have not sent any interests yet. Browse profiles to get started.'}
              {tab === 'mutual' && 'No mutual matches yet. Accept interests or wait for yours to be accepted.'}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <ProfileRow
                  key={item.interest_id}
                  item={item}
                  tab={tab}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
