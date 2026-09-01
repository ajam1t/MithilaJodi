'use client'

import { useCallback, useEffect, useState } from 'react'

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

function WhatsAppIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.03c-.24.68-1.4 1.3-1.93 1.35-.53.05-1.02.24-3.44-.72-2.9-1.15-4.7-4.15-4.84-4.34-.14-.2-1.13-1.5-1.13-2.87 0-1.36.71-2.03.97-2.31.24-.27.53-.34.7-.34.17 0 .34 0 .49.01.16.01.37-.06.58.44.2.5.7 1.72.76 1.84.06.12.1.27.02.44-.09.17-.17.27-.34.46-.17.19-.26.29-.38.48-.12.19-.26.4-.11.68.14.29.63 1.16 1.35 1.88.93.93 1.71 1.22 1.99 1.36.27.14.44.12.6-.07.17-.19.7-.82.89-1.1.19-.29.38-.24.63-.14.25.09 1.6.76 1.87.9.27.14.46.2.53.32.06.12.06.68-.18 1.36z" />
    </svg>
  )
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

          {mine?.status === 'approved' && mine.whatsappNumber ? (
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
    } finally { setBusyId(null) }
  }

  const pending = state?.incoming.filter((r) => r.status === 'pending') ?? []
  const approved = state?.incoming.filter((r) => r.status === 'approved') ?? []
  if (pending.length === 0 && approved.length === 0) return null

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
          Lets members you have matched with ask to connect on WhatsApp. Your number is never shown
          publicly and is shared only with members you individually approve.
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
