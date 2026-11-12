'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

/* eslint-disable @typescript-eslint/no-explicit-any */

const TABS = ['pending', 'approved', 'rejected'] as const
const age = (dob?: string | null) => { if (!dob) return null; const d = new Date(dob), n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a }
const when = (s?: string | null) => s ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : '—'

/**
 * Account approvals. Every new member waits here until approved; photo review
 * (Admin → Photo review) is separate and approving a photo does not approve an
 * account. Open the member's full record from "View profile".
 */
export default function ApprovalsPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('pending')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [reason, setReason] = useState<Record<string, string>>({})
  const [done, setDone] = useState<Record<string, string>>({})

  const load = useCallback(() => {
    setLoading(true); setErr('')
    fetch(`/api/admin/approvals?status=${tab}`).then(r => r.json()).then(j => { if (j.ok) setRows(j.rows); else setErr(j.message ?? 'Could not load') }).finally(() => setLoading(false))
  }, [tab])
  useEffect(() => { load() }, [load])

  async function act(accountId: string, action: 'approve' | 'reject') {
    if (action === 'reject' && !(reason[accountId] ?? '').trim()) { setDone(d => ({ ...d, [accountId]: 'Write a reason to reject.' })); return }
    setBusy(accountId)
    const res = await fetch('/api/admin/approvals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId, action, reason: reason[accountId] ?? '' }) })
    const j = await res.json().catch(() => ({}))
    setBusy(null)
    if (!j.ok) { setDone(d => ({ ...d, [accountId]: j.message ?? 'Failed' })); return }
    setDone(d => ({ ...d, [accountId]: action === 'approve' ? (j.journey?.ok ? 'Approved · welcome message sent' : `Approved · welcome not sent (${j.journey?.message ?? 'see Engagement'})`) : 'Rejected · member informed' }))
    setTimeout(load, 1200)
  }

  return (
    <div className="max-w-5xl">
      <h1 className="font-serif text-2xl text-ink mb-1">Account approvals</h1>
      <p className="text-sm text-ink-soft mb-5">New members cannot use member features until approved here. Approving sends the Day 1 welcome message and starts their 30-day journey.</p>
      <div className="flex border-b border-paper-3 mb-5">
        {TABS.map(s => (
          <button key={s} type="button" onClick={() => setTab(s)} className={`px-4 py-2 text-sm capitalize border-b-2 transition-colors ${tab === s ? 'border-maroon text-maroon' : 'border-transparent text-ink-soft hover:text-ink'}`}>{s}</button>
        ))}
      </div>
      {err && <p className="card p-4 text-sm text-error">{err}</p>}
      {loading ? <p className="text-sm text-ink-soft">Loading…</p> : rows.length === 0 && !err ? <p className="card p-6 text-sm text-ink-soft">Nothing here.</p> : (
        <div className="space-y-3">
          {rows.map(r => {
            const p = r.profile
            return (
              <div key={r.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : 'No profile yet'}
                      {p && <span className="ml-2 text-sm font-normal text-ink-soft">{p.gender === 'male' ? 'Groom' : p.gender === 'female' ? 'Bride' : ''}{age(p.dob) ? ` · ${age(p.dob)} yrs` : ''}{p.profile_for && p.profile_for !== 'self' ? ` · created by ${p.profile_for === 'son' || p.profile_for === 'daughter' ? 'parent' : p.profile_for}` : ''}</span>}</p>
                    <p className="mt-0.5 text-[13px] text-ink-soft">Mobile {r.mobile} · registered {when(r.created_at)} · account {r.account_status}</p>
                    {p && <p className="mt-1 text-[13px] text-ink-soft">Gotra {p.self_gotra ?? '—'} · Mool {p.mool ?? '—'} · Gram {p.gram ?? '—'} · Profile {p.profile_complete ?? 0}% · Photos {r.photos.total} ({r.photos.approved} approved, {r.photos.pending} awaiting review)</p>}
                    {p?.about_me && <p className="mt-2 max-w-2xl text-[13.5px] text-ink line-clamp-3">{p.about_me}</p>}
                    {r.history.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-[12px] text-ink-soft">
                        {r.history.map((h: any, i: number) => <li key={i}>{when(h.created_at)} · {h.from_status ?? '—'} → <b>{h.to_status}</b>{h.reason ? ` · ${h.reason}` : ''}</li>)}
                      </ul>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {p && <Link href={`/admin/profiles/${p.id}`} className="text-[13px] font-semibold text-maroon hover:underline">View profile & photos →</Link>}
                    <Link href={`/admin/members/${r.id}`} className="text-[13px] text-maroon hover:underline">Member record →</Link>
                  </div>
                </div>
                {tab !== 'approved' && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-paper-3 pt-3">
                    <button type="button" disabled={busy === r.id} onClick={() => act(r.id, 'approve')} className="rounded-mj-sm bg-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Approve</button>
                    {tab === 'pending' && <>
                      <input value={reason[r.id] ?? ''} onChange={e => setReason(x => ({ ...x, [r.id]: e.target.value }))} placeholder="Reason (required to reject; shown to the member)" maxLength={500} className="input min-w-[16rem] flex-1 text-sm" />
                      <button type="button" disabled={busy === r.id} onClick={() => act(r.id, 'reject')} className="rounded-mj-sm border border-error/40 px-4 py-2 text-sm text-error disabled:opacity-60">Reject</button>
                    </>}
                    {done[r.id] && <span className="text-[13px] text-ink-soft">{done[r.id]}</span>}
                  </div>
                )}
                {tab === 'approved' && r.approval_updated_at && <p className="mt-2 text-[12px] text-ink-soft">Approved {when(r.approval_updated_at)}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
