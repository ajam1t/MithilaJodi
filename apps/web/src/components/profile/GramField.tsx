'use client'

import { useId, useState } from 'react'

/**
 * Gram (ancestral village), findable by PIN code.
 *
 * A Mithila village is frequently not in any place database, and a member often
 * cannot spell it the way a search index would. What they do know is the PIN
 * code. India Post lists every post office under a PIN, and for rural Mithila
 * those names *are* the villages — so entering the PIN turns an unanswerable
 * question into picking your own village off a short list.
 *
 * Typing the name directly still works; the field stores free text either way.
 */
export function GramField({ value, onChange, label = 'Gram (Ancestral Village)' }: { value: string; onChange: (v: string) => void; label?: string }) {
  const inputId = useId()
  const pinId = useId()
  const [pin, setPin] = useState('')
  const [places, setPlaces] = useState<string[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function lookup() {
    const q = pin.trim()
    if (!/^[1-9][0-9]{5}$/.test(q)) { setNote('Enter a six-digit PIN code.'); setPlaces([]); return }
    setBusy(true); setNote(null); setPlaces([])
    try {
      const j = await fetch(`/api/pincode?pin=${q}`).then(r => r.json())
      if (j.ok && Array.isArray(j.places) && j.places.length > 0) {
        setPlaces(j.places as string[])
        setNote(`${[j.district, j.state].filter(Boolean).join(', ')} — pick your village.`)
      } else {
        setNote(j.message ?? 'No villages found for that PIN code.')
      }
    } catch {
      setNote('Could not look that up just now — type the name instead.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1">{label}</label>
      <input id={inputId} type="text" value={value} maxLength={100}
        onChange={e => onChange(e.target.value)}
        placeholder="Type your village, or find it by PIN code below"
        className="w-full border border-ink/20 rounded-mj-sm px-3 py-2.5 sm:py-2 text-base sm:text-sm text-ink focus:outline-none focus:border-maroon bg-white" />

      <div className="mt-2 flex items-end gap-2">
        <div className="w-[136px]">
          <label htmlFor={pinId} className="block text-xs text-ink-soft mb-1">Find by PIN code</label>
          <input id={pinId} type="text" inputMode="numeric" maxLength={6} value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookup() } }}
            placeholder="847211"
            className="w-full border border-ink/20 rounded-mj-sm px-3 py-2.5 sm:py-2 text-base sm:text-sm text-ink focus:outline-none focus:border-maroon bg-white" />
        </div>
        <button type="button" onClick={lookup} disabled={busy || pin.length !== 6}
          className="rounded-mj-sm border border-maroon px-3 py-2 text-sm font-medium text-maroon transition-colors hover:bg-maroon hover:text-gold-lt disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-maroon">
          {busy ? 'Looking…' : 'Find'}
        </button>
      </div>

      {note && <p className="mt-1.5 text-xs text-ink-soft">{note}</p>}

      {places.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {places.map(p => (
            <button key={p} type="button" onClick={() => { onChange(p); setPlaces([]); setNote(null) }}
              className={`rounded-pill border px-2.5 py-1 text-[12.5px] transition-colors ${
                value === p ? 'border-maroon bg-maroon text-gold-lt'
                            : 'border-ink/20 text-ink-soft hover:border-maroon hover:text-maroon'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
