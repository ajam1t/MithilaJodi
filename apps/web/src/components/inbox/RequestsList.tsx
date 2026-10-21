'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui'
import { BTN, EmptyCard, MatchCard, ViewProfile, type CardData } from '@/components/inbox/MatchPieces'

/*
 * Inbox → Requests: photo and contact requests (lib/memberRequests.ts).
 * Received: approve or decline what is waiting, revoke what was shared.
 * Sent: each request's status, and Cancel while it is still waiting.
 * Presentation only; the API decides who may do what.
 */

export type RequestKind = 'photo' | 'contact'
export type RequestItem = {
  id: string
  kind: RequestKind
  status: 'pending' | 'approved' | 'declined' | 'revoked'
  created_at: string
  decided_at: string | null
  profile: { id: string; display_name: string; age: number | null; current_loc_name: string | null; photo_url: string | null }
}
export type RequestsData = { received: RequestItem[]; sent: RequestItem[] }

/** Load all four lists. 'off' when the feature is not switched on yet; null on failure. */
export async function loadRequests(): Promise<RequestsData | 'off' | null> {
  const pairs = (['photo', 'contact'] as const).flatMap(k => (['received', 'sent'] as const).map(b => [k, b] as const))
  try {
    const results = await Promise.all(pairs.map(async ([k, b]) => {
      const res = await fetch(`/api/${k}-requests?box=${b}`, { cache: 'no-store' })
      const j = await res.json().catch(() => ({}))
      return { b, res, j }
    }))
    if (results.some(r => r.j?.code === 'FEATURE_OFF')) return 'off'
    if (results.some(r => !r.res.ok || !r.j?.ok)) return null
    const byDate = (a: RequestItem, z: RequestItem) => z.created_at.localeCompare(a.created_at)
    return {
      received: results.filter(r => r.b === 'received').flatMap(r => r.j.items as RequestItem[]).sort(byDate),
      sent: results.filter(r => r.b === 'sent').flatMap(r => r.j.items as RequestItem[]).sort(byDate),
    }
  } catch {
    return null
  }
}

function card(p: RequestItem['profile']): CardData {
  return { id: p.id, name: p.display_name, age: p.age, location: p.current_loc_name, culture: [], occupation: null, photo: p.photo_url, match: null }
}

const WHAT: Record<RequestKind, { received: string; sent: string; shared: string }> = {
  photo: { received: 'Asked to see your photos', sent: 'You asked to see their photos', shared: 'Photos shared' },
  contact: { received: 'Asked for your contact details', sent: 'You asked for their contact details', shared: 'Contact shared' },
}

const QUIET = 'rounded-mj-sm px-3 py-1.5 text-[12.5px] font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline disabled:opacity-60'

export function RequestsList({ data, onChanged }: { data: RequestsData; onChanged: () => Promise<void> }) {
  const toast = useToast()
  const [view, setView] = useState<'received' | 'sent'>('received')
  const [busyId, setBusyId] = useState<string | null>(null)
  const pending = data.received.filter(r => r.status === 'pending').length

  async function act(item: RequestItem, action: 'approve' | 'decline' | 'revoke' | 'cancel') {
    const first = item.profile.display_name.split(' ')[0]
    if (action === 'decline' && !confirm(`Decline ${first}'s request? They will not be told why.`)) return
    if (action === 'revoke' && !confirm(item.kind === 'photo'
      ? `Stop sharing your photos with ${first}?`
      : `Stop sharing your contact details with ${first}?`)) return
    setBusyId(item.id)
    try {
      const res = await fetch(`/api/${item.kind}-requests/${item.id}`, action === 'cancel'
        ? { method: 'DELETE' }
        : { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      const j = await res.json().catch(() => ({}))
      if (!j.ok) toast(j.message ?? 'Could not complete that action. Please try again.', { type: 'error' })
      else if (action === 'approve') toast(item.kind === 'photo' ? `${first} can now see your photos.` : `${first} can now see your contact details.`, { type: 'success' })
      await onChanged()
    } catch {
      toast('Could not complete that action. Please try again.', { type: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  const list = view === 'received' ? data.received : data.sent

  return (
    <>
      <div className="mb-3 flex gap-2" role="group" aria-label="Requests">
        {(['received', 'sent'] as const).map(v => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${view === v ? 'border-maroon bg-maroon/[0.06] text-maroon' : 'border-ink/15 text-ink-soft'}`}
          >
            {v === 'received' ? `Received${pending ? ` (${pending})` : ''}` : 'Sent'}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {list.length === 0 ? (
          <EmptyCard>
            {view === 'received'
              ? 'No photo or contact requests right now. When a member asks to see your photos or for your number, it appears here.'
              : 'You have not asked anyone for photos or contact details yet.'}
          </EmptyCard>
        ) : list.map(item => (
          <MatchCard key={`${item.kind}-${item.id}`} c={card(item.profile)}>
            <p className="basis-full text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8A6516]">
              {view === 'received' ? WHAT[item.kind].received : WHAT[item.kind].sent}
            </p>
            {view === 'received' ? (
              item.status === 'pending' ? (
                <>
                  <button type="button" disabled={busyId === item.id} onClick={() => act(item, 'approve')} className={`${BTN} bg-maroon-gradient border-maroon text-cream`}>Approve</button>
                  <ViewProfile id={item.profile.id} />
                  {/* Kept apart from Approve and quieter, as on interests. */}
                  <div className="flex basis-full justify-end">
                    <button type="button" disabled={busyId === item.id} onClick={() => act(item, 'decline')} className={QUIET}>Decline</button>
                  </div>
                </>
              ) : (
                <>
                  <span className={`${BTN} border-green/30 bg-green/[0.07] text-green`}>{WHAT[item.kind].shared} <span aria-hidden="true">✓</span></span>
                  <ViewProfile id={item.profile.id} />
                  <div className="flex basis-full justify-end">
                    <button type="button" disabled={busyId === item.id} onClick={() => act(item, 'revoke')} className={QUIET}>Revoke access</button>
                  </div>
                </>
              )
            ) : item.status === 'pending' ? (
              <>
                <span className={`${BTN} border-green/30 bg-green/[0.07] text-green`}>Requested · waiting</span>
                <ViewProfile id={item.profile.id} />
                <button type="button" disabled={busyId === item.id} onClick={() => act(item, 'cancel')} className="px-2 text-[12.5px] font-medium text-ink-soft underline-offset-2 hover:underline disabled:opacity-60">
                  Cancel
                </button>
              </>
            ) : item.status === 'approved' ? (
              <>
                <span className={`${BTN} border-gold bg-gold/15 text-maroon`}>Shared with you <span aria-hidden="true">✓</span></span>
                <Link
                  href={item.kind === 'contact' ? `/profile/${item.profile.id}#contact-details` : `/profile/${item.profile.id}`}
                  className={`${BTN} bg-maroon-gradient border-maroon text-cream`}
                >
                  {item.kind === 'contact' ? 'View contact' : 'View photos'}
                </Link>
              </>
            ) : (
              <>
                <span className={`${BTN} border-ink/10 bg-paper-2/60 text-ink-soft`}>Not shared</span>
                <ViewProfile id={item.profile.id} />
              </>
            )}
          </MatchCard>
        ))}
      </div>
    </>
  )
}
