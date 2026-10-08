'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Action = 'suspend' | 'enable' | 'hide' | 'show' | 'revoke_dp' | 'delete'

const COPY: Record<Action, { title: string; body: string; cta: string; danger?: boolean }> = {
  suspend: { title: 'Suspend this member?', body: 'They are signed out everywhere and cannot sign in until re-enabled. Their profile stays in the database.', cta: 'Suspend member', danger: true },
  enable: { title: 'Re-enable this member?', body: 'They can sign in again. Any sign-in lock is cleared.', cta: 'Re-enable' },
  hide: { title: 'Hide from search?', body: 'The profile stops appearing in member search and matches. The member can still sign in.', cta: 'Hide profile' },
  show: { title: 'Show in search again?', body: 'The profile becomes discoverable to other members again.', cta: 'Show profile' },
  revoke_dp: { title: 'Revoke all Digital Profile links?', body: 'Every shared link stops working immediately. The member can create a new link later.', cta: 'Revoke links', danger: true },
  delete: { title: 'Delete this member?', body: 'This is a soft delete: the account and profile are marked deleted, the member is signed out, shared links are revoked and the profile leaves search. Data is kept for legal and audit purposes. This cannot be undone from the console.', cta: 'Delete member', danger: true },
}

export function MemberActions({ accountId, status, hasProfile, discoverable, liveLinks, perms, mobileMasked, mobileFull }: {
  accountId: string
  status: string
  hasProfile: boolean
  discoverable: boolean
  liveLinks: number
  perms: { moderate: boolean; manage: boolean; del: boolean }
  mobileMasked: string
  /** Shown to admins in full (owner's decision, 2026-10-09); moderators get the masked form. */
  mobileFull?: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState<Action | null>(null)
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [contact, setContact] = useState<{ mobile: string; email: string | null } | null>(null)

  const deleted = status === 'deleted'
  const suspended = status === 'suspended' || status === 'banned'

  async function run() {
    if (!pending) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/members/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: pending, reason: reason || undefined, confirm: pending === 'delete' ? confirm : undefined }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) {
        setMsg({ ok: true, text: 'Done. The change is recorded in the audit log.' })
        setPending(null); setReason(''); setConfirm('')
        router.refresh()
      } else {
        setMsg({ ok: false, text: json.message ?? 'That did not work. Nothing was changed.' })
      }
    } catch {
      setMsg({ ok: false, text: 'Network problem. Nothing was changed — try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function reveal() {
    const res = await fetch(`/api/admin/members/${accountId}/contact`, { method: 'POST' })
    const json = await res.json().catch(() => ({}))
    if (res.ok && json.ok) setContact({ mobile: json.mobile, email: json.email })
    else setMsg({ ok: false, text: json.message ?? 'Could not load contact details.' })
  }

  const btn = 'w-full rounded-lg border px-3 py-2 text-left text-[13.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'
  const normal = `${btn} border-[#DDD3C2] bg-white text-ink hover:border-[#BFAF95]`
  const danger = `${btn} border-[#EDC4C4] bg-white text-[#8A1C1C] hover:bg-[#FBEFEF]`
  const open = (a: Action) => { setPending(a); setReason(''); setConfirm(''); setMsg(null) }

  return (
    <div className="space-y-2">
      <div className="mb-3 rounded-lg bg-[#FAF7F2] px-3 py-2 text-[13px]">
        <span className="text-ink-soft">Mobile </span>
        {mobileFull ? (
          <>
            <a href={`tel:${mobileFull.replace(/\s/g, '')}`} className="font-medium tabular-nums text-ink hover:text-maroon">{mobileFull}</a>
            {contact?.email && <span className="font-medium text-ink"> · {contact.email}</span>}
            {!contact && perms.manage && (
              <button type="button" onClick={reveal} className="ml-2 text-[12.5px] font-medium text-maroon hover:underline">Show email (audited)</button>
            )}
          </>
        ) : (
          <>
            {contact ? <span className="font-medium text-ink">{contact.mobile}{contact.email ? ` · ${contact.email}` : ''}</span> : <span className="font-medium text-ink">{mobileMasked}</span>}
            {!contact && perms.manage && (
              <button type="button" onClick={reveal} className="ml-2 text-[12.5px] font-medium text-maroon hover:underline">Reveal (audited)</button>
            )}
          </>
        )}
      </div>

      {deleted ? <p className="text-[13px] text-ink-soft">This member was deleted. No further actions are available here.</p> : (
        <>
          {suspended
            ? <button type="button" className={normal} disabled={!perms.moderate} onClick={() => open('enable')}>Re-enable account</button>
            : <button type="button" className={danger} disabled={!perms.moderate} onClick={() => open('suspend')}>Suspend account</button>}
          {hasProfile && (discoverable
            ? <button type="button" className={normal} disabled={!perms.manage} onClick={() => open('hide')}>Hide from search</button>
            : <button type="button" className={normal} disabled={!perms.manage} onClick={() => open('show')}>Show in search</button>)}
          {hasProfile && (
            <button type="button" className={normal} disabled={!perms.manage || liveLinks === 0} onClick={() => open('revoke_dp')}>
              Revoke Digital Profile links {liveLinks > 0 ? `(${liveLinks} live)` : '(none live)'}
            </button>
          )}
          <button type="button" className={danger} disabled={!perms.del} onClick={() => open('delete')}>Delete member…</button>
          {!perms.del && <p className="text-[11.5px] text-ink-soft">Some actions need the Admin role.</p>}
        </>
      )}

      {msg && <p role="status" className={`rounded-lg px-3 py-2 text-[13px] ${msg.ok ? 'bg-[#E7F0E9] text-[#1B4A2E]' : 'bg-[#FBEFEF] text-[#8A1C1C]'}`}>{msg.text}</p>}

      {pending && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="ma-title">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 id="ma-title" className="text-[16px] font-semibold text-ink">{COPY[pending].title}</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{COPY[pending].body}</p>
            <label className="mt-4 block text-[12.5px] font-medium text-ink" htmlFor="ma-reason">Reason (optional, kept in the audit log)</label>
            <textarea id="ma-reason" value={reason} onChange={e => setReason(e.target.value)} maxLength={500} rows={2}
              className="mt-1 w-full rounded-lg border border-[#DDD3C2] px-3 py-2 text-[13.5px] outline-none focus:border-maroon" />
            {pending === 'delete' && (
              <>
                <label className="mt-3 block text-[12.5px] font-medium text-ink" htmlFor="ma-confirm">Type DELETE to confirm</label>
                <input id="ma-confirm" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-[#DDD3C2] px-3 py-2 text-[13.5px] outline-none focus:border-maroon" />
              </>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPending(null)} className="rounded-lg border border-[#DDD3C2] px-4 py-2 text-[13.5px] font-medium">Cancel</button>
              <button type="button" onClick={run} disabled={busy || (pending === 'delete' && confirm !== 'DELETE')}
                className={`rounded-lg px-4 py-2 text-[13.5px] font-medium text-white disabled:opacity-50 ${COPY[pending].danger ? 'bg-[#8A1C1C]' : 'bg-maroon'}`}>
                {busy ? 'Working…' : COPY[pending].cta}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
