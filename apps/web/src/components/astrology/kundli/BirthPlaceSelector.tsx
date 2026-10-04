'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { placeSchema } from '@/lib/astrology/schema'
import type { BirthPlace } from '@/lib/astrology/types'
import { formatCoords } from './format'

type Suggestion = BirthPlace & { detail: string }
type PinInfo = { pin: string; district: string | null; state: string | null; postOffices: string[] }

const PIN = /^[1-9][0-9]{5}$/

type Props = {
  id: string
  value: BirthPlace | null
  onChange: (place: BirthPlace | null) => void
  error?: string
}

const FALLBACK_ZONES = [
  'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'Europe/Berlin', 'America/New_York',
  'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'Australia/Sydney',
  'Australia/Melbourne', 'Australia/Perth', 'Pacific/Auckland', 'Africa/Johannesburg', 'UTC',
]

// India-only platform rule: no zones for Nepal are offered.
const EXCLUDED_ZONES = new Set(['Asia/Kathmandu', 'Asia/Katmandu', 'Asia/Calcutta', 'Asia/Kolkata'])

function timeZones(): string[] {
  const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf
  const list = supported ? supported('timeZone') : FALLBACK_ZONES
  return ['Asia/Kolkata', ...list.filter(z => !EXCLUDED_ZONES.has(z))]
}

export function BirthPlaceSelector({ id, value, onChange, error }: Props) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [fromOsm, setFromOsm] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pinInfo, setPinInfo] = useState<PinInfo | null>(null)
  const [manual, setManual] = useState(false)
  const [manualDraft, setManualDraft] = useState({ label: '', latitude: '', longitude: '', timezone: 'Asia/Kolkata' })
  const [manualError, setManualError] = useState<string | null>(null)
  const zones = useMemo(() => (manual ? timeZones() : []), [manual])

  useEffect(() => {
    if (value || manual) return
    const q = query.trim()
    setPinInfo(null)
    if (q.length < 2) { setResults([]); setMessage(null); return }
    // Digits only: a PIN code being typed. Wait for all six rather than searching names.
    if (/^\d+$/.test(q) && !PIN.test(q)) {
      setResults([])
      setMessage(q.length < 6 ? 'Keep typing — a PIN code has six digits.' : 'That is not a valid PIN code — it has six digits and does not start with 0.')
      setOpen(true)
      return
    }
    const isPin = PIN.test(q)
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/astrology/places?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        const json = await res.json()
        setFromOsm(isPin)
        setResults(json.ok ? json.results : [])
        if (isPin && json.ok) {
          const info: PinInfo | null = json.pin ? { pin: q, ...json.pin } : null
          setPinInfo(info)
          setMessage(
            json.notFound ? 'No such PIN code — please check the six digits, or type the town name.'
              : json.results.length ? null
              : 'We could not place this PIN code on the map. Type the town or district name instead.',
          )
        } else {
          setMessage(json.ok ? (json.results.length ? null : 'Not in our list yet — search more places below.') : json.message)
        }
        setOpen(true)
        setActive(-1)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setMessage('Could not search places right now.')
      } finally {
        setLoading(false)
      }
    }, isPin ? 0 : 220)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [query, value, manual])

  async function searchMore(text?: string) {
    const q = (text ?? query).trim()
    if (q.length < 2 || PIN.test(q)) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/astrology/places?q=${encodeURIComponent(q)}&provider=osm`)
      const json = await res.json()
      if (!json.ok) { setMessage(json.message); return }
      // A village from a PIN's list that the map does not know: keep the PIN-area result.
      if (text && json.results.length === 0) {
        setMessage(`${text.split(',')[0]} is not on the map yet — the PIN area centre is the closest available.`)
        return
      }
      setFromOsm(true)
      setResults(text ? [...json.results, ...results.filter(r => r.detail === 'PIN code area (centre)' || r.detail === 'District (centre)')] : json.results)
      setMessage(json.results.length ? null : 'No places found in India with that name. Try a nearby town or district, or enter the coordinates.')
      setOpen(true)
      setActive(-1)
    } catch {
      setMessage('Place search is not responding. You can enter the coordinates instead.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function choose(s: Suggestion) {
    const { detail: _detail, ...place } = s
    void _detail
    onChange(place)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(results.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)) }
    else if (e.key === 'Enter') {
      if (open && active >= 0 && results[active]) { e.preventDefault(); choose(results[active]) }
      else if (query.trim().length >= 2 && results.length === 0 && !/^\d+$/.test(query.trim())) { e.preventDefault(); void searchMore() }
    } else if (e.key === 'Escape') { setOpen(false) }
  }

  function applyManual() {
    const parsed = placeSchema.safeParse({
      label: manualDraft.label.trim() || `${manualDraft.latitude}, ${manualDraft.longitude}`,
      latitude: manualDraft.latitude.trim() === '' ? Number.NaN : Number(manualDraft.latitude),
      longitude: manualDraft.longitude.trim() === '' ? Number.NaN : Number(manualDraft.longitude),
      timezone: manualDraft.timezone,
      source: 'manual',
    })
    if (!parsed.success) {
      setManualError(parsed.error.issues[0]?.message ?? 'Please check the coordinates.')
      return
    }
    setManualError(null)
    onChange(parsed.data)
    setManual(false)
  }

  if (value) {
    return (
      <div id={id} className="rounded-mj-sm border border-gold/40 bg-white px-3.5 py-2.5 flex items-start justify-between gap-3" tabIndex={-1}>
        <div className="min-w-0">
          <p className="text-[15px] text-ink leading-snug">{value.label}</p>
          <p className="text-[12px] text-ink-soft mt-0.5">
            {formatCoords(value.latitude, value.longitude)} · {value.timezone === 'Asia/Kolkata' ? 'India (IST)' : value.timezone}
            {value.source === 'openstreetmap' && ' · © OpenStreetMap contributors'}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-[13px] font-semibold text-maroon underline underline-offset-2 min-h-[32px]"
          onClick={() => { onChange(null); setTimeout(() => inputRef.current?.focus(), 0) }}
        >
          Change
        </button>
      </div>
    )
  }

  if (manual) {
    return (
      <div id={id} className="rounded-mj-sm border border-gold/40 bg-paper p-3 space-y-3">
        <p className="text-[13px] text-ink-soft leading-relaxed">
          For a birth outside India, or a village we cannot find: enter the place’s coordinates (from any map app) and
          the time zone that applied there. Daylight saving for that date is applied automatically.
        </p>
        <div>
          <label className="field-label" htmlFor={`${id}-mlabel`}>Place name</label>
          <input id={`${id}-mlabel`} className="input kd-input" value={manualDraft.label} maxLength={120} onChange={e => setManualDraft(d => ({ ...d, label: e.target.value }))} placeholder="e.g. Dubai, UAE" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor={`${id}-mlat`}>Latitude</label>
            <input id={`${id}-mlat`} className="input kd-input" inputMode="decimal" value={manualDraft.latitude} onChange={e => setManualDraft(d => ({ ...d, latitude: e.target.value }))} placeholder="25.2048" />
          </div>
          <div>
            <label className="field-label" htmlFor={`${id}-mlng`}>Longitude</label>
            <input id={`${id}-mlng`} className="input kd-input" inputMode="decimal" value={manualDraft.longitude} onChange={e => setManualDraft(d => ({ ...d, longitude: e.target.value }))} placeholder="55.2708" />
          </div>
        </div>
        <p className="field-hint -mt-1">North and east are positive; south and west are negative.</p>
        <div>
          <label className="field-label" htmlFor={`${id}-mtz`}>Time zone</label>
          <select id={`${id}-mtz`} className="select kd-input" value={manualDraft.timezone} onChange={e => setManualDraft(d => ({ ...d, timezone: e.target.value }))}>
            {zones.map(z => <option key={z} value={z}>{z === 'Asia/Kolkata' ? 'India — Asia/Kolkata (IST)' : z.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        {manualError && <p className="field-error" role="alert">{manualError}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary btn-sm" onClick={applyManual}>Use these coordinates</button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setManual(false)}>Back to search</button>
        </div>
      </div>
    )
  }

  const describedBy = [`${id}-hint`, error ? `${id}-error` : null].filter(Boolean).join(' ')
  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        className={`input kd-input ${error ? 'input-error' : ''}`}
        role="combobox"
        aria-expanded={open && (results.length > 0 || !!message)}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        autoComplete="off"
        placeholder="Town, district or 6-digit PIN code"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        enterKeyHint="search"
        onKeyDown={onKeyDown}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {loading && <span className="absolute right-3 top-3.5 h-4 w-4 rounded-full border-2 border-gold border-t-transparent animate-spin" aria-hidden="true" />}

      {open && (results.length > 0 || message || pinInfo) && (
        <div className="absolute z-30 mt-1 w-full rounded-mj-sm border border-gold/40 bg-white shadow-mj-sm overflow-hidden">
          <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {results.map((s, i) => (
              <li
                key={`${s.label}-${i}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={`px-3.5 py-2.5 cursor-pointer ${i === active ? 'bg-paper-2' : 'hover:bg-paper'}`}
                onMouseDown={e => { e.preventDefault(); choose(s) }}
              >
                <span className="block text-[15px] text-ink leading-snug">{s.label}</span>
                <span className="block text-[12px] text-ink-soft">{s.detail} · {formatCoords(s.latitude, s.longitude)}</span>
              </li>
            ))}
          </ul>
          {message && <p className="px-3.5 py-2 text-[13px] text-ink-soft border-t border-paper-3">{message}</p>}
          {pinInfo && (
            <div className="px-3.5 py-2.5 border-t border-paper-3">
              <p className="text-[13px] text-ink">
                PIN {pinInfo.pin} · {[pinInfo.district, pinInfo.state].filter(Boolean).join(', ')}
              </p>
              {pinInfo.postOffices.length > 0 && (
                <>
                  <p className="mt-1 text-[12px] text-ink-soft">Born in one of the villages it serves? Find it exactly:</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {pinInfo.postOffices.slice(0, 10).map(po => (
                      <button
                        key={po}
                        type="button"
                        className="rounded-pill border border-gold/40 bg-paper px-2.5 py-1 text-[12px] text-maroon hover:bg-paper-2 min-h-[30px]"
                        onMouseDown={e => { e.preventDefault(); void searchMore([po, pinInfo.district, pinInfo.state].filter(Boolean).join(', ')) }}
                      >
                        {po}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="border-t border-paper-3 bg-paper px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
            {!fromOsm ? (
              <button type="button" className="text-[13px] font-semibold text-maroon underline underline-offset-2 min-h-[32px]" onMouseDown={e => { e.preventDefault(); void searchMore() }} hidden={/^\d+$/.test(query.trim())}>
                Search more places in India
              </button>
            ) : (
              <span className="text-[11px] text-ink-soft">Search results © OpenStreetMap contributors</span>
            )}
          </div>
        </div>
      )}

      <p id={`${id}-hint`} className="field-hint">
        You can type the 6-digit PIN code. Choose the nearest town if the village is not listed.{' '}
        <button type="button" className="text-maroon underline underline-offset-2" onClick={() => { setManual(true); setOpen(false) }}>
          Born outside India, or enter coordinates
        </button>
      </p>
      {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  )
}
