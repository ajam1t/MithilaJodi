'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { refreshPendingCounts, usePendingCounts } from '@/lib/hooks/usePendingCounts'
import { useToast } from '@/components/ui'
import { ConversationList } from '@/components/inbox/ConversationList'
import {
  BTN, EmptyCard, MatchCard, MatchedActions, ViewProfile, fromInterest, type ApiResponse,
} from '@/components/inbox/MatchPieces'

/*
 * Inbox — every relationship in one place, in the order it happens:
 * interest → mutual interest → message. Messages | Interests | Mutual.
 *
 * Presentation only. Interests are still answered through
 * PATCH /api/interests/[id], and conversations are still the ones acceptance
 * opens. Members talk through Mithila Jodi messaging; there is no phone-number
 * exchange.
 */

export type InboxTab = 'messages' | 'interests' | 'mutual'
const TABS: InboxTab[] = ['messages', 'interests', 'mutual']

export default function InboxContent() {
  const router = useRouter()
  const params = useSearchParams()
  const toast = useToast()
  const pending = usePendingCounts()

  const initial = params.get('tab') as InboxTab | null
  const [tab, setTab] = useState<InboxTab>(initial && TABS.includes(initial) ? initial : 'messages')
  const [view, setView] = useState<'received' | 'sent'>(params.get('view') === 'sent' ? 'sent' : 'received')
  const [data, setData] = useState<ApiResponse | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const j = await fetch('/api/interests').then(r => r.json()).catch(() => null)
    if (j?.ok) setData(j)
    else setError(j?.message ?? 'Could not load your interests.')
  }, [])
  useEffect(() => { void load() }, [load])

  function go(t: InboxTab) {
    setTab(t)
    router.replace(t === 'messages' ? '/inbox' : `/inbox?tab=${t}`, { scroll: false })
  }

  async function respond(interestId: string, action: 'accept' | 'decline' | 'withdraw') {
    setError('')
    setBusyId(interestId)
    try {
      const res = await fetch(`/api/interests/${interestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.ok) {
        await load()
        // Keep the nav badge honest — responding here is what clears it.
        refreshPendingCounts()
        if (action === 'accept') toast("It's a Match! ❤️ You can now message each other.", { type: 'success' })
      } else {
        setError(json.message ?? 'Could not complete that action. Please try again.')
      }
    } catch {
      setError('Could not complete that action. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const received = data?.received ?? []
  const sent = (data?.sent ?? []).filter(s => s.status !== 'withdrawn')
  const mutual = data?.mutual ?? []

  const tabs: Array<{ id: InboxTab; label: string; badge: number }> = [
    { id: 'messages', label: 'Messages', badge: pending.messages },
    { id: 'interests', label: 'Interests', badge: received.length },
    { id: 'mutual', label: 'Mutual', badge: 0 },
  ]

  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <h1 className="font-serif text-[28px] leading-tight text-maroon sm:text-[32px]">Inbox</h1>
        <p className="mt-1 text-[13.5px] text-ink-soft">Your messages, interests and matches.</p>

        <div className="mt-4 grid grid-cols-3 rounded-full border border-gold/30 bg-cream p-1" role="tablist" aria-label="Inbox">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => go(t.id)}
              className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40 ${
                tab === t.id ? 'bg-maroon text-cream shadow-mj-xs' : 'text-ink-soft hover:text-maroon'
              }`}
            >
              {t.label}
              {t.badge > 0 && (
                <span className={`min-w-[18px] rounded-full px-1.5 text-[11px] leading-[18px] ${tab === t.id ? 'bg-gold-lt text-maroon-deep' : 'bg-maroon text-cream'}`}>
                  {t.badge > 9 ? '9+' : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-mj-sm border border-error/30 bg-error-soft px-4 py-3 text-sm text-error-fg">{error}</div>
        )}

        <div className="mt-4" role="tabpanel">
          {tab === 'messages' && <ConversationList />}

          {tab !== 'messages' && !data && !error && (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex animate-pulse gap-3.5 rounded-mj border border-gold/20 bg-cream p-4">
                  <div className="h-[92px] w-[76px] rounded-mj-sm bg-paper-3" />
                  <div className="flex-1 space-y-2 py-1"><div className="h-4 w-1/2 rounded bg-paper-3" /><div className="h-3 w-2/3 rounded bg-paper-3" /></div>
                </div>
              ))}
            </div>
          )}

          {tab === 'interests' && data && (
            <>
              <div className="mb-3 flex gap-2" role="group" aria-label="Interests">
                {(['received', 'sent'] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${view === v ? 'border-maroon bg-maroon/[0.06] text-maroon' : 'border-ink/15 text-ink-soft'}`}
                  >
                    {v === 'received' ? `Received${received.length ? ` (${received.length})` : ''}` : 'Sent'}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {view === 'received' ? (
                  received.length === 0 ? (
                    <EmptyCard cta={<Link href="/digital-profile" className="btn-primary inline-flex px-5 py-2.5 text-[14px]">Share your Digital Profile</Link>}>
                      No interests waiting for you right now. Sharing your Digital Profile helps more families find you.
                    </EmptyCard>
                  ) : received.map(item => (
                    <MatchCard key={item.interest_id} c={fromInterest(item.profile)}>
                      <button type="button" disabled={busyId === item.interest_id} onClick={() => respond(item.interest_id, 'accept')} className={`${BTN} bg-maroon-gradient border-maroon text-cream`}>Accept</button>
                      <button type="button" disabled={busyId === item.interest_id} onClick={() => respond(item.interest_id, 'decline')} className={`${BTN} border-ink/15 bg-cream text-ink-soft hover:text-ink`}>Decline</button>
                      <ViewProfile id={item.profile.id} />
                    </MatchCard>
                  ))
                ) : (
                  sent.length === 0 ? (
                    <EmptyCard cta={<Link href="/search" className="btn-primary inline-flex px-5 py-2.5 text-[14px]">Explore Profiles</Link>}>
                      You have not sent any interests yet.
                    </EmptyCard>
                  ) : sent.map(item => (
                    <MatchCard key={item.interest_id} c={fromInterest(item.profile)}>
                      {item.status === 'accepted' ? (
                        <MatchedActions id={item.profile.id} conversationId={item.conversation_id} />
                      ) : item.status === 'sent' ? (
                        <>
                          <span className={`${BTN} border-green/30 bg-green/[0.07] text-green`}>Interest Sent <span aria-hidden="true">✓</span></span>
                          <ViewProfile id={item.profile.id} />
                          <button type="button" disabled={busyId === item.interest_id} onClick={() => respond(item.interest_id, 'withdraw')} className="px-2 text-[12.5px] font-medium text-ink-soft underline-offset-2 hover:underline">
                            Withdraw
                          </button>
                        </>
                      ) : (
                        <>
                          <span className={`${BTN} border-ink/10 bg-paper-2/60 text-ink-soft`}>Not taken forward</span>
                          <ViewProfile id={item.profile.id} />
                        </>
                      )}
                    </MatchCard>
                  ))
                )}
              </div>
            </>
          )}

          {tab === 'mutual' && data && (
            <div className="space-y-3">
              {mutual.length === 0 ? (
                <EmptyCard cta={<Link href="/search" className="btn-primary inline-flex px-5 py-2.5 text-[14px]">Explore Profiles</Link>}>
                  No mutual matches yet. Accept interests, or send a few of your own.
                </EmptyCard>
              ) : mutual.map(item => (
                <MatchCard key={item.interest_id} c={fromInterest(item.profile)}>
                  <MatchedActions id={item.profile.id} conversationId={item.conversation_id} />
                </MatchCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
