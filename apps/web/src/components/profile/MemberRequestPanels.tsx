'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui'
import { ContactCard } from '@/components/digital-profile/ContactCard'
import type { SharedProfile } from '@/lib/profileShare'
import type { PartnerPreferencesDisplay } from '@/types/profile'

/*
 * The member profile page's two request panels (lib/memberRequests.ts):
 *
 *   PhotoRequestPanel    in place of withheld photos. 'on_request' owners get
 *                        "Request photos" and the state of this viewer's
 *                        request; 'connected' owners only "visible to matches".
 *   ContactRequestPanel  between matches: "Request contact details", and once
 *                        approved the family's ContactCard, loaded only when
 *                        the member asks to view it.
 *
 * Presentation and fetches only; every rule is enforced by the API.
 */

export type RequestState = { id: string; status: 'pending' | 'approved' | 'declined' | 'revoked'; created_at: string; decided_at: string | null }

export type PhotoGate = { level: 'connected' | 'on_request'; request: RequestState | null; askAgainAt: string | null }
export type ContactRequestInfo = { request: RequestState | null; askAgainAt: string | null; theyAsked: boolean }

const PILL = 'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium'

async function ask(kind: 'photo' | 'contact', ownerId: string): Promise<{ ok: true; request: RequestState } | { ok: false; message: string }> {
  try {
    const res = await fetch(`/api/${kind}-requests`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_profile_id: ownerId }),
    })
    const j = await res.json().catch(() => ({}))
    if (res.ok && j.ok) return { ok: true, request: j.request }
    return { ok: false, message: j.message ?? 'Could not send the request. Please try again.' }
  } catch {
    return { ok: false, message: 'Could not send the request. Please try again.' }
  }
}

async function cancel(kind: 'photo' | 'contact', id: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/${kind}-requests/${id}`, { method: 'DELETE' })
    const j = await res.json().catch(() => ({}))
    return { ok: !!j.ok, message: j.message }
  } catch {
    return { ok: false }
  }
}

/** Whether a fresh request may be sent now. */
function canAsk(request: RequestState | null, askAgainAt: string | null): boolean {
  if (!request) return true
  return (request.status === 'declined' || request.status === 'revoked') && !askAgainAt
}

function StatusLine({ request, askAgainAt, what }: { request: RequestState; askAgainAt: string | null; what: string }) {
  if (request.status === 'declined' && askAgainAt) {
    return <span className={`${PILL} border-ink/10 bg-paper-2/60 text-ink-soft`}>Not shared for now</span>
  }
  if (request.status === 'revoked' && askAgainAt) {
    return <span className={`${PILL} border-ink/10 bg-paper-2/60 text-ink-soft`}>{what} no longer shared</span>
  }
  return null
}

// ─── Photos ──────────────────────────────────────────────────────────────────

export function PhotoRequestPanel({ profileId, firstName, gate, canAct, onChange }: {
  profileId: string
  firstName: string
  gate: PhotoGate
  /** False in a preview, before the viewer has a profile, or while they have blocked this member. */
  canAct: boolean
  onChange: (g: PhotoGate) => void
}) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  if (gate.level === 'connected') {
    return (
      <section className="rounded-mj border border-gold/30 bg-cream px-5 py-5 text-center" aria-label="Photos">
        <p className="font-serif text-[18px] text-maroon">Photos are visible to matches</p>
        <p className="mt-1 text-[13px] text-ink-soft">{firstName} shares photographs with accepted matches.</p>
      </section>
    )
  }

  const r = gate.request
  async function request() {
    setBusy(true)
    const out = await ask('photo', profileId)
    setBusy(false)
    if (out.ok) { onChange({ ...gate, request: out.request, askAgainAt: null }); toast('Request sent', { type: 'success' }) }
    else toast(out.message, { type: 'error' })
  }
  async function withdraw() {
    if (!r) return
    setBusy(true)
    const out = await cancel('photo', r.id)
    setBusy(false)
    if (out.ok) onChange({ ...gate, request: null, askAgainAt: null })
    else toast(out.message ?? 'Could not cancel. Please try again.', { type: 'error' })
  }

  return (
    <section className="rounded-mj border border-gold/30 bg-cream px-5 py-5 text-center" aria-label="Photos">
      <p className="font-serif text-[18px] text-maroon">Photos are shared on request</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-ink-soft">
        {firstName}&rsquo;s family shows photographs to matches and to members they approve.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {r?.status === 'pending' ? (
          <>
            <span className={`${PILL} border-green/30 bg-green/[0.07] text-green`}>Requested · waiting</span>
            {canAct && (
              <button type="button" onClick={withdraw} disabled={busy} className="px-2 text-[12.5px] font-medium text-ink-soft underline-offset-2 hover:underline disabled:opacity-60">
                Cancel request
              </button>
            )}
          </>
        ) : r?.status === 'approved' ? (
          <button type="button" onClick={() => window.location.reload()} className="btn-ghost text-sm py-2 px-4">
            Approved — show photos
          </button>
        ) : r && !canAsk(r, gate.askAgainAt) ? (
          <StatusLine request={r} askAgainAt={gate.askAgainAt} what="Photos" />
        ) : canAct ? (
          <button type="button" onClick={request} disabled={busy} className="btn-primary text-sm py-2 px-4 disabled:opacity-60">
            Request photos
          </button>
        ) : null}
      </div>
    </section>
  )
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export function ContactRequestPanel({ profileId, firstName, info, partner, onChange }: {
  profileId: string
  firstName: string
  info: ContactRequestInfo
  partner: PartnerPreferencesDisplay | null
  onChange: (i: ContactRequestInfo) => void
}) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [shown, setShown] = useState<{ contact: SharedProfile['contact']; prefs: SharedProfile['contactPrefs'] } | null>(null)
  const r = info.request
  const approved = r?.status === 'approved'

  const view = useCallback(async () => {
    if (busy || shown) return
    setBusy(true)
    try {
      const res = await fetch(`/api/contact-requests/contact?profile_id=${encodeURIComponent(profileId)}`, { cache: 'no-store' })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j.ok) setShown({ contact: j.contact, prefs: j.prefs ?? null })
      else toast(j.message ?? 'Could not load contact details.', { type: 'error' })
    } catch {
      toast('Could not load contact details.', { type: 'error' })
    }
    setBusy(false)
  }, [busy, shown, profileId, toast])

  // "Contact shared ✓ — View" elsewhere on the page (and the notification)
  // link to #contact-details: arriving there opens the card.
  useEffect(() => {
    if (!approved) return
    const check = () => { if (window.location.hash === '#contact-details') void view() }
    check()
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
  }, [approved, view])

  async function request() {
    setBusy(true)
    const out = await ask('contact', profileId)
    setBusy(false)
    if (out.ok) { onChange({ ...info, request: out.request, askAgainAt: null }); toast('Request sent', { type: 'success' }) }
    else toast(out.message, { type: 'error' })
  }
  async function withdraw() {
    if (!r) return
    setBusy(true)
    const out = await cancel('contact', r.id)
    setBusy(false)
    if (out.ok) onChange({ ...info, request: null, askAgainAt: null })
    else toast(out.message ?? 'Could not cancel. Please try again.', { type: 'error' })
  }

  return (
    <section id="contact-details" className="card p-5 space-y-3 scroll-mt-28" aria-label="Contact details">
      <h2 className="font-semibold text-ink text-sm">Contact details</h2>

      {info.theyAsked && (
        <p className="rounded-mj-sm bg-maroon/10 px-3 py-1.5 text-xs text-maroon">
          {firstName} asked for your contact details.{' '}
          <Link href="/inbox?tab=requests" className="font-medium underline">Respond in Inbox</Link>
        </p>
      )}

      {approved ? (
        shown ? (
          <ContactCard first={firstName} contact={shown.contact} prefs={shown.prefs} partner={partner} profileHref={null} audience="member" />
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className={`${PILL} border-green/30 bg-green/[0.07] text-green`}>Contact shared <span aria-hidden="true">✓</span></span>
            <button type="button" onClick={view} disabled={busy} className="btn-primary text-sm py-2 px-4 disabled:opacity-60">
              View contact details
            </button>
          </div>
        )
      ) : r?.status === 'pending' ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className={`${PILL} border-green/30 bg-green/[0.07] text-green`}>Requested · waiting</span>
          <button type="button" onClick={withdraw} disabled={busy} className="px-2 text-[12.5px] font-medium text-ink-soft underline-offset-2 hover:underline disabled:opacity-60">
            Cancel request
          </button>
        </div>
      ) : r && !canAsk(r, info.askAgainAt) ? (
        <div className="flex flex-wrap items-center gap-3"><StatusLine request={r} askAgainAt={info.askAgainAt} what="Contact details" /></div>
      ) : (
        <>
          <p className="text-[13px] text-ink-soft">
            Ask {firstName}&rsquo;s family for their number. They decide whether to share it, and can stop sharing at any time.
          </p>
          <button type="button" onClick={request} disabled={busy} className="btn-primary text-sm py-2 px-4 disabled:opacity-60">
            Request contact details
          </button>
        </>
      )}
    </section>
  )
}
