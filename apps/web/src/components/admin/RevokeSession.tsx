'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RevokeSession({ id, current }: { id: string; current: boolean }) {
  const router = useRouter()
  const [ask, setAsk] = useState(false)
  const [busy, setBusy] = useState(false)
  if (current) return <span className="text-[12px] text-ink-soft">This device</span>
  if (!ask) return <button type="button" onClick={() => setAsk(true)} className="rounded-lg border border-[#EDC4C4] px-2.5 py-1 text-[12px] font-medium text-[#8A1C1C]">Sign out…</button>
  return (
    <span className="flex items-center gap-2">
      <button type="button" disabled={busy} onClick={async () => { setBusy(true); await fetch(`/api/admin/security/sessions/${id}`, { method: 'DELETE' }); router.refresh() }}
        className="rounded-lg bg-[#8A1C1C] px-2.5 py-1 text-[12px] font-medium text-white">{busy ? '…' : 'Confirm'}</button>
      <button type="button" onClick={() => setAsk(false)} className="text-[12px] font-medium">Cancel</button>
    </span>
  )
}
