'use client'

import { useEffect, useState } from 'react'

/**
 * "Make web copies": runs the backfill in batches until every photo that can
 * be read has its web-sized copy, showing progress. Stops when a batch makes
 * nothing (the rest are photos the server cannot read; they stay originals).
 */
export function WebCopies({ canRun }: { canRun: boolean }) {
  const [state, setState] = useState<{ total: number; remaining: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    fetch('/api/admin/storage/web-copies').then(r => r.json()).then(j => { if (j.ok) setState({ total: j.total, remaining: j.remaining }) }).catch(() => {})
  }, [])

  async function run() {
    setBusy(true); setNote('')
    try {
      for (;;) {
        const j = await fetch('/api/admin/storage/web-copies', { method: 'POST' }).then(r => r.json())
        if (!j.ok) { setNote(j.message ?? 'Could not make copies.'); break }
        setState({ total: j.total, remaining: j.remaining })
        if (j.remaining === 0) { setNote('Every photo now has a web copy.'); break }
        if (j.made === 0) { setNote(`${j.remaining} photo(s) could not be converted and are served as originals.`); break }
      }
    } catch { setNote('Network problem — run it again to continue where it stopped.') }
    setBusy(false)
  }

  const done = state ? state.total - state.remaining : 0
  return (
    <div className="space-y-3 text-[13.5px]">
      {state ? (
        <>
          <p><b className="tabular-nums">{done}</b> of <b className="tabular-nums">{state.total}</b> photos have a web copy.</p>
          <div className="h-2 overflow-hidden rounded-full bg-[#F1ECE3]" aria-hidden="true">
            <div className="h-full rounded-full bg-gradient-to-r from-[#B98A2E] to-[#E9C977] transition-all" style={{ width: `${state.total ? (done / state.total) * 100 : 100}%` }} />
          </div>
        </>
      ) : <p className="text-ink-soft">Checking…</p>}
      {canRun && state && state.remaining > 0 && (
        <button type="button" disabled={busy} onClick={run} className="inline-flex min-h-[36px] items-center rounded-xl border border-[#6B0A0A] bg-gradient-to-br from-[#8A1414] to-[#6B0A0A] px-3.5 text-[13.5px] font-medium text-[#FFF6E2] disabled:opacity-60">
          {busy ? `Making copies… ${state.remaining} left` : `Make ${state.remaining} web copies`}
        </button>
      )}
      {note && <p role="status" className="text-ink-soft">{note}</p>}
    </div>
  )
}
