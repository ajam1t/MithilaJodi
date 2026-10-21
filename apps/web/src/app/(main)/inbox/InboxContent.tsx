'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { refreshPendingCounts, usePendingCounts } from '@/lib/hooks/usePendingCounts'
import { useToast } from '@/components/ui'
import { ConversationList } from '@/components/inbox/ConversationList'
import {
  BTN, EmptyCard, MatchCard, MatchedActions, ViewProfile, fromInterest, type ApiResponse, type InterestProfile,
} from '@/components/inbox/MatchPieces'
import { RequestsList, loadRequests, type RequestsData } from '@/components/inbox/RequestsList'

/*
 * Inbox — every relationship in one place, in the order it happens:
 * interest → mutual interest → message. Messages | Interests | Mutual |
 * Requests.
 *
 * Presentation only. Interests are still answered through
 * PATCH /api/interests/[id], and conversations are still the ones acceptance
 * opens. Members talk through Mithila Jodi messaging; a phone number is shared
 * only through an approved contact request (Requests, lib/memberRequests.ts).
 * The Requests tab is left out entirely until that feature is switched on.
 */

export type InboxTab = 'messages' | 'interests' | 'mutual' | 'requests'
const TABS: InboxTab[] = ['messages', 'interests', 'mutual', 'requests']

/** How long "Declined — Undo" waits before the decline is sent. */
const DECLINE_UNDO_MS = 5000

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
  const [loadFailed, setLoadFailed] = useState(false)
  // Accepted in this visit: kept on the Received list with the way into the
  // new conversation, rather than vanishing into Mutual the moment it is tapped.
  const [justMatched, setJustMatched] = useState<Array<{ item: InterestProfile; conversationId: string | null }>>([])
  // Declines waiting out their Undo window, by interest id.
  const [undoable, setUndoable] = useState<Set<string>>(new Set())
  const declineTimers = useRef(new Map<string, number>())
  // Photo and contact requests: null while loading or after a failure, 'off'
  // when the feature is not switched on (the tab is hidden).
  const [requests, setRequests] = useState<RequestsData | 'off' | null>(null)
  const [requestsFailed, setRequestsFailed] = useState(false)

  const load = useCallback(async () => {
    const j = await fetch('/api/interests').then(r => r.json()).catch(() => null)
    if (j?.ok) { setData(j); setLoadFailed(false) }
    else setLoadFailed(true)
  }, [])
  useEffect(() => { void load() }, [load])

  const reloadRequests = useCallback(async () => {
    const r = await loadRequests()
    if (r) { setRequests(r); setRequestsFailed(false) }
    else setRequestsFailed(true)
  }, [])
  useEffect(() => { void reloadRequests() }, [reloadRequests])
  // ?tab=requests before the feature is on falls back to Messages.
  useEffect(() => { if (requests === 'off' && tab === 'requests') setTab('messages') }, [requests, tab])

  function retry() {
    setLoadFailed(false)
    setData(null)
    void load()
  }

  function go(t: InboxTab) {
    setTab(t)
    router.replace(t === 'messages' ? '/inbox' : t === 'interests' && view === 'sent' ? '/inbox?tab=interests&view=sent' : `/inbox?tab=${t}`, { scroll: false })
  }

  function showView(v: 'received' | 'sent') {
    setView(v)
    router.replace(v === 'sent' ? '/inbox?tab=interests&view=sent' : '/inbox?tab=interests', { scroll: false })
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
        if (action === 'accept') {
          const item = data?.received.find(r => r.interest_id === interestId)
          if (item) setJustMatched(m => [{ item, conversationId: json.conversation_id ?? null }, ...m])
        }
        await load()
        // Keep the nav badge honest — responding here is what clears it.
        refreshPendingCounts()
        if (action === 'accept') toast("It's a Match! ❤️ You can now message each other.", { type: 'success' })
      } else {
        setError(json.message ?? 'Could not complete that action. Please try again.')
        // Someone else got there first (409): show what is true now.
        if (res.status === 409) await load()
      }
    } catch {
      setError('Could not complete that action. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  // ── Decline, with a moment to take it back ──
  // Declining tells the sender and starts a cool-off, so it waits a few
  // seconds behind an Undo before anything is sent. Leaving the page (or the
  // Inbox) sends whatever is still waiting, with keepalive so it survives
  // the navigation.
  const sendDecline = useCallback((interestId: string, keepalive = false) => {
    return fetch(`/api/interests/${interestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decline' }),
      keepalive,
    })
  }, [])

  const commitDecline = useCallback(async (interestId: string) => {
    declineTimers.current.delete(interestId)
    try {
      const res = await sendDecline(interestId)
      const json = await res.json().catch(() => ({}))
      if (!json.ok) setError(json.message ?? 'Could not decline. Please try again.')
    } catch {
      setError('Could not decline. Please try again.')
    }
    setUndoable(u => { const n = new Set(u); n.delete(interestId); return n })
    await load()
    refreshPendingCounts()
  }, [sendDecline, load])

  function decline(interestId: string) {
    if (declineTimers.current.has(interestId)) return
    setError('')
    setUndoable(u => new Set(u).add(interestId))
    declineTimers.current.set(interestId, window.setTimeout(() => { void commitDecline(interestId) }, DECLINE_UNDO_MS))
  }

  function undoDecline(interestId: string) {
    const t = declineTimers.current.get(interestId)
    if (t !== undefined) window.clearTimeout(t)
    declineTimers.current.delete(interestId)
    setUndoable(u => { const n = new Set(u); n.delete(interestId); return n })
  }

  useEffect(() => {
    const timers = declineTimers.current
    const flush = () => {
      for (const [id, t] of timers) {
        window.clearTimeout(t)
        void sendDecline(id, true).catch(() => {})
      }
      timers.clear()
    }
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [sendDecline])

  const received = data?.received ?? []
  const sent = (data?.sent ?? []).filter(s => s.status !== 'withdrawn')
  const mutual = data?.mutual ?? []

  const requestsOn = requests !== 'off'
  const pendingRequests = requests && requests !== 'off' ? requests.received.filter(r => r.status === 'pending').length : 0
  const tabs: Array<{ id: InboxTab; label: string; badge: number }> = [
    { id: 'messages', label: 'Messages', badge: pending.messages },
    { id: 'interests', label: 'Interests', badge: received.length },
    { id: 'mutual', label: 'Mutual', badge: 0 },
    ...(requestsOn ? [{ id: 'requests' as const, label: 'Requests', badge: pendingRequests }] : []),
  ]

  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <h1 className="font-serif text-[28px] leading-tight text-maroon sm:text-[32px]">Inbox</h1>
        <p className="mt-1 text-[13.5px] text-ink-soft">Your messages, interests and matches.</p>

        <div className={`mt-4 grid ${requestsOn ? 'grid-cols-4' : 'grid-cols-3'} rounded-full border border-line bg-cream p-1`} role="tablist" aria-label="Inbox">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => go(t.id)}
              className={`flex min-h-[40px] items-center justify-center gap-1 rounded-full ${requestsOn ? 'text-[12.5px] sm:text-[14px]' : 'text-[14px]'} font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40 ${
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
          <div role="alert" className="mt-4 rounded-mj-sm border border-error/30 bg-error-soft px-4 py-3 text-sm text-error-fg">{error}</div>
        )}

        <div className="mt-4" role="tabpanel">
          {tab === 'messages' && <ConversationList />}

          {tab === 'requests' && requestsOn && (
            requests ? (
              <RequestsList data={requests} onChanged={reloadRequests} />
            ) : requestsFailed ? (
              <div role="alert" className="rounded-mj border border-line bg-cream px-6 py-9 text-center">
                <p className="text-[14px] text-ink-soft">We could not load your requests just now.</p>
                <button type="button" onClick={() => { setRequestsFailed(false); void reloadRequests() }} className="btn-primary mt-4 inline-flex px-5 py-2.5 text-[14px]">Retry</button>
              </div>
            ) : (
              <div className="h-[124px] animate-pulse rounded-mj border border-line bg-cream" />
            )
          )}

          {tab !== 'messages' && tab !== 'requests' && !data && loadFailed && (
            <div role="alert" className="rounded-mj border border-line bg-cream px-6 py-9 text-center">
              <p className="text-[14px] text-ink-soft">We could not load your interests just now.</p>
              <button type="button" onClick={retry} className="btn-primary mt-4 inline-flex px-5 py-2.5 text-[14px]">Retry</button>
            </div>
          )}

          {tab !== 'messages' && tab !== 'requests' && !data && !loadFailed && (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex animate-pulse gap-3.5 rounded-mj border border-line bg-cream p-4">
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
                    onClick={() => showView(v)}
                    className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${view === v ? 'border-maroon bg-maroon/[0.06] text-maroon' : 'border-ink/15 text-ink-soft'}`}
                  >
                    {v === 'received' ? `Received${received.length ? ` (${received.length})` : ''}` : 'Sent'}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {view === 'received' ? (
                  <>
                    {justMatched.map(({ item, conversationId }) => (
                      <MatchCard key={`m-${item.interest_id}`} c={fromInterest(item.profile)} note={item.message ? { label: 'Their note', text: item.message } : null}>
                        <span className={`${BTN} basis-full border-gold bg-gold/15 text-maroon`}>It&rsquo;s a Match! <span aria-hidden="true">❤️</span></span>
                        <Link
                          href={conversationId ? `/messages/${conversationId}` : '/inbox?tab=messages'}
                          className={`${BTN} bg-maroon-gradient border-maroon text-cream`}
                        >
                          Message {item.profile.display_name.split(' ')[0]}
                        </Link>
                        <ViewProfile id={item.profile.id} />
                      </MatchCard>
                    ))}
                    {received.length === 0 && justMatched.length === 0 ? (
                      <EmptyCard cta={<Link href="/digital-profile" className="btn-primary inline-flex px-5 py-2.5 text-[14px]">Share your Digital Profile</Link>}>
                        No interests waiting for you right now. Sharing your Digital Profile helps more families find you.
                      </EmptyCard>
                    ) : received.map(item => (
                      <MatchCard key={item.interest_id} c={fromInterest(item.profile)} note={item.message ? { label: 'Their note', text: item.message } : null}>
                        {undoable.has(item.interest_id) ? (
                          <div className="flex basis-full items-center justify-between gap-3 rounded-mj-sm border border-ink/10 bg-paper-2/60 px-3 py-2" role="status">
                            <span className="text-[13px] text-ink-soft">Declined</span>
                            <button type="button" onClick={() => undoDecline(item.interest_id)} className="rounded-mj-sm px-3 py-1 text-[13px] font-semibold text-maroon underline-offset-2 hover:underline">
                              Undo
                            </button>
                          </div>
                        ) : (
                          <>
                            <button type="button" disabled={busyId === item.interest_id} onClick={() => respond(item.interest_id, 'accept')} className={`${BTN} bg-maroon-gradient border-maroon text-cream`}>Accept</button>
                            <ViewProfile id={item.profile.id} />
                            {/* Kept apart from Accept and quieter, so it is never the tap that was meant for Accept. */}
                            <div className="flex basis-full justify-end">
                              <button type="button" disabled={busyId === item.interest_id} onClick={() => decline(item.interest_id)} className="rounded-mj-sm px-3 py-1.5 text-[12.5px] font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline disabled:opacity-60">
                                Decline
                              </button>
                            </div>
                          </>
                        )}
                      </MatchCard>
                    ))}
                  </>
                ) : (
                  sent.length === 0 ? (
                    <EmptyCard cta={<Link href="/search" className="btn-primary inline-flex px-5 py-2.5 text-[14px]">Explore Profiles</Link>}>
                      You have not sent any interests yet.
                    </EmptyCard>
                  ) : sent.map(item => (
                    <MatchCard key={item.interest_id} c={fromInterest(item.profile)} note={item.message ? { label: 'Your note', text: item.message } : null}>
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
