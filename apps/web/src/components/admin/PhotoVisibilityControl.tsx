'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PHOTO_VISIBILITY_OPTIONS, type PhotoVisibility } from '@/lib/photoVisibility'

/** Admin → member: who may see the member's photographs (Public / Members / Matches). */
export function PhotoVisibilityControl({ accountId, value, canEdit }: { accountId: string; value: PhotoVisibility; canEdit: boolean }) {
  const router = useRouter()
  const [current, setCurrent] = useState(value)
  const [busy, setBusy] = useState<PhotoVisibility | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function choose(v: PhotoVisibility) {
    if (v === current || busy) return
    setBusy(v)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/members/${accountId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'photo_visibility', value: v }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j.ok) { setCurrent(v); setMsg({ ok: true, text: 'Saved. Recorded in the audit log.' }); router.refresh() }
      else setMsg({ ok: false, text: j.message ?? 'Not saved. Nothing was changed.' })
    } catch {
      setMsg({ ok: false, text: 'Network problem. Nothing was changed.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div role="radiogroup" aria-label="Who can see this member's photos" className="grid grid-cols-3 gap-1.5">
        {PHOTO_VISIBILITY_OPTIONS.map(o => (
          <button
            key={o.value} type="button" role="radio" aria-checked={current === o.value}
            disabled={!canEdit || !!busy} onClick={() => choose(o.value)} title={o.hint}
            className={`rounded-lg border px-2 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${
              current === o.value ? 'border-maroon bg-maroon text-white' : 'border-[#DDD3C2] bg-white text-ink hover:border-[#BFAF95] disabled:opacity-50'}`}
          >
            {busy === o.value ? 'Saving…' : o.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[12px] text-ink-soft">{PHOTO_VISIBILITY_OPTIONS.find(o => o.value === current)?.hint}.</p>
      {!canEdit && <p className="mt-1 text-[12px] text-ink-soft">Your admin role can view this but not change it.</p>}
      {msg && <p role="status" className={`mt-1 text-[12px] ${msg.ok ? 'text-[#2F6B3A]' : 'text-[#8A1C1C]'}`}>{msg.text}</p>}
    </div>
  )
}
