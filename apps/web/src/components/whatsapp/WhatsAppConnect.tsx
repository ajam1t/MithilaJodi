'use client'

import { useCallback, useEffect, useState } from 'react'
import { refreshPendingCounts } from '@/lib/hooks/usePendingCounts'
import { WhatsAppIcon } from '@/components/whatsapp/JoinCommunity'

/**
 * WhatsApp connection UI — the consent flow, in two parts:
 *
 *   <WhatsAppConnect>  the REQUESTER side, shown on another member's profile
 *                      once an interest between you has been accepted.
 *   <WhatsAppRequests> the OWNER side: approve / decline / revoke.
 *
 * A number is only ever rendered after the owner has approved, and the server
 * re-checks both the approval and the owner's opt-in before returning it.
 */

type Outgoing = {
  id: string
  profileId: string
  name: string
  status: 'pending' | 'approved' | 'declined' | 'revoked'
  whatsappNumber: string | null
}
type Incoming = {
  id: string
  profileId: string
  name: string
  status: 'pending' | 'approved' | 'declined' | 'revoked'
}
type State = { optIn: boolean; incoming: Incoming[]; outgoing: Outgoing[] }

/** wa.me needs digits only (no +, no spaces). */
function waLink(mobile: string, message: string): string {
  const digits = mobile.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

async function loadState(): Promise<State | null> {
  try {
    const r = await fetch('/api/whatsapp', { cache: 'no-store' })
    if (!r.ok) return null
    const j = await r.json()
    if (!j.ok) return null
    return { optIn: !!j.optIn, incoming: j.incoming ?? [], outgoing: j.outgoing ?? [] }
  } catch {
    return null
  }
}

// ── Requester side, on another member's profile ─────────────────────────────

export function WhatsAppConnect({
  profileId,
  profileName,
  canRequest,
}: {
  profileId: string
  profileName: string
  /** True only when an interest between the two members has been accepted. */
  canRequest: boolean
}) {
  const [state, setState] = useState<State | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => setState(await loadState()), [])

  useEffect(() => { if (canRequest) void refresh() }, [canRequest, refresh])

  if (!canRequest) return null

  const mine = state?.outgoing.find((o) => o.profileId === profileId) ?? null

  async function request() {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_profile_id: profileId }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) setMsg(j.message ?? 'Could not send the request.')
      else { setMsg('Request sent. You will see WhatsApp here once they approve.'); await refresh() }
    } catch {
      setMsg('Network error. Please try again.')
    } finally { setBusy(false) }
  }

  const first = profileName.split(' ')[0] || 'there'

  return (
    <div className="rounded-mj-sm border border-green/25 bg-green/[0.05] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-green shrink-0"><WhatsAppIcon size={19} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[16px] text-maroon leading-snug">WhatsApp</p>

          {mine?.status === 'approved' && !mine.whatsappNumber ? (
            /* Approved, but the number is withheld — the owner has since turned
               WhatsApp sharing off. Without this branch the component fell all
               the way through to the initial state and showed "Request
               WhatsApp" again, as though nothing had ever happened. */
            <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">
              {first} approved WhatsApp, but has since turned off WhatsApp sharing,
              so their number is not available. Messaging here still works.
            </p>
          ) : mine?.status === 'approved' && mine.whatsappNumber ? (
            <>
              <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">
                {first} has approved WhatsApp contact.
              </p>
              <a
                href={waLink(mine.whatsappNumber, `Namaste ${first}, I found your profile on Mithila Jodi.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-mj-sm bg-green px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-green-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <WhatsAppIcon />
                Message on WhatsApp
              </a>
            </>
          ) : mine?.status === 'pending' ? (
            <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">
              Request sent — waiting for {first} to approve. Their number stays private until then.
            </p>
          ) : mine?.status === 'declined' ? (
            <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">
              {first} declined WhatsApp contact for now. Please respect their choice.
            </p>
          ) : mine?.status === 'revoked' ? (
            <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">
              WhatsApp access was withdrawn. You can ask again if appropriate.
            </p>
          ) : (
            <>
              <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">
                Ask {first} to share WhatsApp. They must approve before any number is shown.
              </p>
              <button
                type="button" onClick={request} disabled={busy}
                className="mt-3 inline-flex items-center gap-2 rounded-mj-sm border border-green/40 bg-cream px-4 py-2.5 text-[14px] font-semibold text-green hover:bg-green/10 disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <WhatsAppIcon />
                {busy ? 'Sending…' : 'Request WhatsApp'}
              </button>
            </>
          )}

          {(mine?.status === 'declined' || mine?.status === 'revoked') && (
            <button
              type="button" onClick={request} disabled={busy}
              className="mt-2 block text-[12.5px] text-maroon underline underline-offset-2 disabled:opacity-60"
            >
              Ask again
            </button>
          )}

          {msg && <p className="text-[12.5px] text-ink-soft mt-2 leading-relaxed">{msg}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Owner side: approve / decline / revoke ──────────────────────────────────

export function WhatsAppRequests() {
  const [state, setState] = useState<State | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => setState(await loadState()), [])
  useEffect(() => { void refresh() }, [refresh])

  async function act(id: string, action: 'approve' | 'decline' | 'revoke') {
    setBusyId(id)
    try {
      await fetch(`/api/whatsapp/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      await refresh()
      // Drop the nav badge straight away rather than leaving a count that is
      // visibly wrong until the next full page load.
      refreshPendingCounts()
    } finally { setBusyId(null) }
  }

  const pending = state?.incoming.filter((r) => r.status === 'pending') ?? []
  const approved = state?.incoming.filter((r) => r.status === 'approved') ?? []
  // Requests I have sent. Previously these were only visible on the other
  // member's profile page, so "did I already ask?" had no answer anywhere.
  const sent = state?.outgoing.filter((r) => r.status === 'pending' || r.status === 'approved') ?? []
  if (pending.length === 0 && approved.length === 0 && sent.length === 0) return null

  return (
    <section className="card p-4 sm:p-5" aria-label="WhatsApp requests">
      <h2 className="font-serif text-[17px] text-maroon flex items-center gap-2">
        <span className="text-green"><WhatsAppIcon size={16} /></span>
        WhatsApp requests
      </h2>
      <p className="text-[12.5px] text-ink-soft mt-1 mb-3.5 leading-relaxed">
        Your number is shared only with members you approve, and you can withdraw access at any time.
      </p>

      <ul className="space-y-2.5">
        {pending.map((r) => (
          <li key={r.id} className="rounded-mj-sm border border-paper-3 bg-paper/60 p-3.5">
            <p className="text-[14.5px] text-ink">
              <strong className="font-semibold">{r.name}</strong> would like to connect on WhatsApp.
            </p>
            <div className="flex gap-2 mt-2.5">
              <button
                type="button" onClick={() => act(r.id, 'approve')} disabled={busyId === r.id}
                className="rounded-mj-sm bg-green px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-green-2 disabled:opacity-60 transition-colors"
              >
                Approve
              </button>
              <button
                type="button" onClick={() => act(r.id, 'decline')} disabled={busyId === r.id}
                className="rounded-mj-sm border border-ink/20 px-3.5 py-2 text-[13px] font-semibold text-ink-soft hover:text-ink disabled:opacity-60 transition-colors"
              >
                Decline
              </button>
            </div>
          </li>
        ))}

        {approved.map((r) => (
          <li key={r.id} className="rounded-mj-sm border border-green/25 bg-green/[0.05] p-3.5 flex items-center justify-between gap-3">
            <p className="text-[14px] text-ink min-w-0">
              <strong className="font-semibold">{r.name}</strong>
              <span className="text-ink-soft"> can contact you on WhatsApp</span>
            </p>
            <button
              type="button" onClick={() => act(r.id, 'revoke')} disabled={busyId === r.id}
              className="shrink-0 text-[12.5px] text-terra underline underline-offset-2 disabled:opacity-60"
            >
              Withdraw
            </button>
          </li>
        ))}
      </ul>

      {sent.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-paper-3">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft mb-2">
            Requests you sent
          </p>
          <ul className="space-y-2">
            {sent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 text-[13.5px]">
                <span className="text-ink min-w-0 truncate">{r.name}</span>
                {r.status === 'approved' && r.whatsappNumber ? (
                  <a
                    href={waLink(r.whatsappNumber, `Namaste ${r.name.split(' ')[0] || 'there'}, I found your profile on Mithila Jodi.`)}
                    target="_blank" rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 text-green font-semibold hover:underline"
                  >
                    <WhatsAppIcon size={14} /> Message
                  </a>
                ) : (
                  <span className="shrink-0 text-ink-soft">
                    {r.status === 'approved' ? 'Number unavailable' : 'Waiting for approval'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// ── Opt-in toggle, for Settings ─────────────────────────────────────────────

export function WhatsAppOptIn() {
  const [optIn, setOptIn] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { void loadState().then((s) => setOptIn(s ? s.optIn : false)) }, [])

  async function toggle() {
    if (optIn === null) return
    setBusy(true)
    try {
      const r = await fetch('/api/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opt_in: !optIn }),
      })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.ok) setOptIn(!!j.optIn)
    } finally { setBusy(false) }
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">Allow WhatsApp requests</p>
        <p className="text-[12.5px] text-ink-soft mt-0.5 leading-relaxed">
          On by default. Lets members you have matched with ask to connect on WhatsApp — it does not
          share anything on its own. Your number is never shown publicly, and goes only to the
          members you approve one by one, on the Matches page. You can withdraw access at any time.
        </p>
      </div>
      <button
        type="button" onClick={toggle} disabled={busy || optIn === null}
        role="switch" aria-checked={optIn === true}
        aria-label="Allow WhatsApp requests"
        className={`shrink-0 mt-1 w-12 h-7 rounded-full transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
          optIn ? 'bg-green' : 'bg-paper-3'
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
            optIn ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
