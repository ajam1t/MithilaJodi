'use client'

import { useState, useEffect, useCallback, useRef, useId } from 'react'

export type LocationResult = {
  id: number
  name_en: string
  level: string
  is_mithila_region: boolean
  parent_name?: string | null
}

/**
 * Typeahead that resolves free text to an `india_locations` id.
 *
 * The stored value is always an id, never the text — which is exactly why this
 * needs to be loud rather than quiet. Two failure modes it is built to make
 * impossible:
 *
 *   - typing over an existing selection used to leave the old id in place, so
 *     replacing "Darbhanga" with "Mumbai" and saving brought Darbhanga back and
 *     read as "this form does not save". Editing the text drops the id at once,
 *     and the field says the value is not set until something is picked;
 *   - a search with no hits used to close the dropdown silently. It now says so.
 *
 * Shared by the profile editor and the search filters so both behave the same
 * way; they differ only in `hint` and `placeholder`.
 */
export function LocationPicker({
  label,
  value,
  onChange,
  initialName = '',
  hint,
  placeholder = 'Type a city or district…',
  levels = 'state,district,city,town,village',
  compact = false,
}: {
  label: string
  value: number | null
  onChange: (id: number | null, name: string) => void
  /**
   * Display name of an already-saved location. The parent usually loads this
   * asynchronously; without it the field renders empty and looks as though the
   * saved value was lost.
   */
  initialName?: string
  hint?: string
  placeholder?: string
  levels?: string
  compact?: boolean
}) {
  const inputId = useId()
  const listId = `${inputId}-list`
  const [text, setText] = useState(initialName)
  const [results, setResults] = useState<LocationResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [active, setActive] = useState(-1)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seeded = useRef(false)

  // Seed exactly once, so it can never clobber what the user is typing.
  useEffect(() => {
    if (!seeded.current && initialName) {
      seeded.current = true
      setText(initialName)
    }
  }, [initialName])

  useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current) }, [])

  const search = useCallback((query: string) => {
    if (debounce.current) clearTimeout(debounce.current)
    if (query.trim().length < 2) { setResults([]); setNoMatch(false); setSearching(false); return }
    setSearching(true)
    debounce.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/locations?q=${encodeURIComponent(query.trim())}&level=${levels}`)
        const j = await r.json()
        const rows: LocationResult[] = j.results ?? []
        setResults(rows)
        setNoMatch(rows.length === 0)
        setOpen(true)
        setActive(rows.length > 0 ? 0 : -1)
      } catch {
        setResults([]); setNoMatch(false)
      } finally {
        setSearching(false)
      }
    }, 250)
  }, [levels])

  function pick(r: LocationResult) {
    onChange(r.id, r.name_en)
    setText(r.name_en)
    setResults([])
    setNoMatch(false)
    setOpen(false)
    setActive(-1)
  }

  function clear() {
    onChange(null, '')
    setText('')
    setResults([])
    setNoMatch(false)
    setOpen(false)
  }

  // Text with no id behind it will not be saved or searched on. Say so.
  const unresolved = text.trim().length > 0 && value === null

  return (
    <div className="relative">
      <label htmlFor={inputId} className={compact ? 'field-label' : 'block text-sm font-medium text-ink mb-1'}>
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && results[active] ? `${listId}-${results[active].id}` : undefined}
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          className={`w-full border rounded-mj-sm pl-3 pr-8 text-ink focus:outline-none focus:border-maroon bg-white ${
            compact ? 'py-2 text-sm' : 'py-2 text-sm'
          } ${unresolved ? 'border-terra/60 bg-terra/[0.04]' : value ? 'border-green/40' : 'border-ink/20'}`}
          onChange={e => {
            const next = e.target.value
            setText(next)
            // Editing invalidates the selection — this is what stops a stale id
            // from being silently re-saved or re-searched.
            if (value !== null) onChange(null, '')
            search(next)
          }}
          onFocus={() => { if (results.length) setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={e => {
            if (!open || results.length === 0) return
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % results.length) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i - 1 + results.length) % results.length) }
            else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) pick(results[active]) }
            else if (e.key === 'Escape') { setOpen(false) }
          }}
        />
        {text && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center text-ink-soft text-xs hover:text-maroon"
            onClick={clear}
          >✕</button>
        )}
      </div>

      {unresolved && !searching && (
        <p className="text-[11.5px] text-terra mt-1">
          {noMatch
            ? `No place called “${text.trim()}” yet — try the nearest larger city or district.`
            : 'Pick a place from the list.'}
        </p>
      )}
      {!unresolved && hint && <p className="text-[11.5px] text-ink-soft mt-1">{hint}</p>}

      {open && (results.length > 0 || noMatch) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 w-full bg-white border border-ink/20 rounded-mj-sm shadow-mj-xs mt-1 max-h-56 overflow-y-auto"
        >
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`${listId}-${r.id}`}
              role="option"
              aria-selected={i === active}
              className={`px-3 py-2 text-sm cursor-pointer text-ink flex justify-between gap-2 ${i === active ? 'bg-cream' : 'hover:bg-cream'}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={() => pick(r)}
            >
              <span className="truncate">
                {r.name_en}
                {r.parent_name && <span className="text-ink-soft">, {r.parent_name}</span>}
              </span>
              <span className="text-ink-soft text-xs capitalize flex-shrink-0">
                {r.level}{r.is_mithila_region ? ' · Mithila' : ''}
              </span>
            </li>
          ))}
          {results.length === 0 && noMatch && (
            <li className="px-3 py-2 text-sm text-ink-soft">No matching place found.</li>
          )}
        </ul>
      )}
    </div>
  )
}

export default LocationPicker
