'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminEmailForm({ current }: { current: string | null }) {
  const router = useRouter()
  const [email, setEmail] = useState(current ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form
      onSubmit={async e => {
        e.preventDefault(); setBusy(true); setMsg(null)
        const res = await fetch('/api/admin/me/email', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
        const json = await res.json().catch(() => ({}))
        setBusy(false)
        if (res.ok && json.ok) { setMsg({ ok: true, text: 'Saved. You can now sign in with this email and your password.' }); router.refresh() }
        else setMsg({ ok: false, text: json.message ?? 'Could not save.' })
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="min-w-[240px] flex-1">
        <label htmlFor="ae" className="text-[13px] font-medium text-ink">Your sign-in email</label>
        <input id="ae" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-[#DDD3C2] px-3 py-2 text-[14px] outline-none focus:border-maroon" />
      </div>
      <button type="submit" disabled={busy} className="rounded-lg bg-maroon px-4 py-2 text-[13.5px] font-medium text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save email'}</button>
      {msg && <p role="status" className={`w-full rounded-lg px-3 py-2 text-[13px] ${msg.ok ? 'bg-[#E7F0E9] text-[#1B4A2E]' : 'bg-[#FBEFEF] text-[#8A1C1C]'}`}>{msg.text}</p>}
    </form>
  )
}
