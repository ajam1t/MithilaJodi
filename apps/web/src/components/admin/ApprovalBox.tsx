'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Approve or reject a new member's account, on their member page. Same API as
 * Admin → Account approvals: approving sends the Day 1 welcome to their Inbox
 * and starts the 30-day messages; rejecting needs a reason the member sees.
 */
export function ApprovalBox({ accountId, status }: { accountId: string; status: 'pending' | 'rejected' }) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function act(action: 'approve' | 'reject') {
    if (action === 'reject' && !reason.trim()) { setMsg('Write a reason to reject — the member will see it.'); return }
    setBusy(true); setMsg('')
    const res = await fetch('/api/admin/approvals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId, action, reason }) })
    const j = await res.json().catch(() => ({}))
    setBusy(false)
    if (!j.ok) { setMsg(j.message ?? 'Could not save. Please try again.'); return }
    setMsg(action === 'approve' ? (j.journey?.ok ? 'Approved. The welcome message was sent.' : 'Approved.') : 'Rejected. The member has been told.')
    router.refresh()
  }

  return (
    <div className="rounded-mj border-2 border-gold/60 bg-[#FFF8EC] p-4">
      <p className="font-semibold text-ink">{status === 'pending' ? 'This member is waiting for approval' : 'This account was rejected'}</p>
      <p className="mt-1 text-[13px] text-ink-soft">
        {status === 'pending' ? 'Until approved they can only finish their profile — nobody can see or find them.' : 'You can still approve it.'}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => act('approve')} className="rounded-mj-sm bg-green px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Approve</button>
        {status === 'pending' && <button type="button" disabled={busy} onClick={() => act('reject')} className="rounded-mj-sm border border-error/40 px-5 py-2.5 text-sm text-error disabled:opacity-60">Reject</button>}
      </div>
      {status === 'pending' && (
        <input value={reason} onChange={e => setReason(e.target.value)} maxLength={500} placeholder="Reason, if rejecting (shown to the member)" className="input mt-2 w-full text-sm" />
      )}
      {msg && <p className="mt-2 text-[13px] text-ink">{msg}</p>}
    </div>
  )
}
