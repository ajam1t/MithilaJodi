'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function OrphanList({ files, canDelete }: { files: Array<{ name: string; size: string; created: string }>; canDelete: boolean }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function remove(name: string) {
    setBusy(true); setMsg(null)
    const res = await fetch('/api/admin/storage/orphan', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    const json = await res.json().catch(() => ({}))
    setBusy(false); setConfirm(null)
    if (res.ok && json.ok) { setMsg({ ok: true, text: 'File deleted and recorded in the audit log.' }); router.refresh() }
    else setMsg({ ok: false, text: json.message ?? 'Could not delete the file.' })
  }

  return (
    <>
      {msg && <p role="status" className={`mb-3 rounded-lg px-3 py-2 text-[13px] ${msg.ok ? 'bg-[#E7F0E9] text-[#1B4A2E]' : 'bg-[#FBEFEF] text-[#8A1C1C]'}`}>{msg.text}</p>}
      <ul className="divide-y divide-[#F3EEE6] text-[13px]">
        {files.map(f => (
          <li key={f.name} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="min-w-0 break-all font-mono text-[12px]">{f.name}</span>
            <span className="flex items-center gap-3 text-ink-soft">
              {f.size} · {f.created}
              {canDelete && (confirm === f.name ? (
                <>
                  <button type="button" disabled={busy} onClick={() => remove(f.name)} className="rounded-lg bg-[#8A1C1C] px-2.5 py-1 text-[12px] font-medium text-white">{busy ? 'Deleting…' : 'Confirm delete'}</button>
                  <button type="button" onClick={() => setConfirm(null)} className="text-[12px] font-medium">Cancel</button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirm(f.name)} className="rounded-lg border border-[#EDC4C4] px-2.5 py-1 text-[12px] font-medium text-[#8A1C1C]">Delete…</button>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}
