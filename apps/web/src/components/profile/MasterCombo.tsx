'use client'

import { useId, useState } from 'react'

export type Option = { value: string; label: string }

/**
 * A searchable picker over a master list that stores the option *key*.
 *
 * Shared by the profile editor and registration (/welcome), so caste, gotra,
 * mool and the rest behave — and store values — identically in both.
 *
 * It replaced CommunitySearch for the community fields. CommunitySearch wrote
 * `label_en` into the form, so profiles ended up holding display text
 * ('Kashyap', 'Hindu') while the option lists are keyed by slug ('kashyapa',
 * 'hindu'). Every one of those fields then rendered a duplicate entry, because
 * the select prepends an unmatched value as its own option — the reported
 * "Hindu listed twice", which was really happening to caste, gotra and mool too.
 *
 * It also accepts a filtered subset, which is how choosing a mool narrows the
 * gotra list to the gotras that mool actually belongs to.
 */
export function MasterCombo({
  label, value, onChange, opts, hint, placeholder = 'Type to search…', allowOther = true,
  allowCustom = false, required = false, error, labelClassName,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  opts: Option[]
  hint?: string
  placeholder?: string
  allowOther?: boolean
  /**
   * Let the member keep what they typed when it is not in the list.
   *
   * For Mool specifically: the Panji records far more mools than any list we
   * hold, and spellings vary between families, so a closed list means some
   * people simply cannot state theirs. A typed value is stored verbatim —
   * their spelling of their own mool is not ours to normalise — and read paths
   * fall back to title-casing an unknown value, so it still displays properly.
   */
  allowCustom?: boolean
  required?: boolean
  /** Inline validation message, announced and linked to the input. */
  error?: string
  labelClassName?: string
}) {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const selected = opts.find(o => o.value === value)
  // A value with no matching option is legacy free text; show it as typed
  // rather than silently blanking what the member previously saved.
  const display = selected?.label ?? value ?? ''

  const q = query.trim().toLowerCase()
  const matches = (q ? opts.filter(o => o.label.toLowerCase().includes(q)) : opts).slice(0, 60)

  const typed = query.trim()
  // Offer the typed text only when it is not already an option, so the list
  // never shows "Use Sarisab" next to the real Sarisab entry.
  const canUseTyped =
    allowCustom && typed.length > 1 && !opts.some(o => o.label.toLowerCase() === typed.toLowerCase())
  const showOther = allowOther && !opts.some(o => o.value === 'other')

  // Everything selectable, in the order it is rendered — for arrow keys.
  const items: Array<{ key: string; pick: () => void }> = [
    ...(canUseTyped && matches.length === 0 ? [{ key: '__typed', pick: () => choose(typed) }] : []),
    ...matches.map(o => ({ key: o.value, pick: () => choose(o.value) })),
    ...(canUseTyped && matches.length > 0 ? [{ key: '__typed2', pick: () => choose(typed) }] : []),
    ...(showOther ? [{ key: '__other', pick: () => choose('other') }] : []),
  ]
  const optId = (i: number) => `${inputId}-opt-${i}`

  function choose(v: string) { onChange(v); setOpen(false); setActive(-1) }

  const hintId = hint ? `${inputId}-hint` : undefined
  const errId = error ? `${inputId}-err` : undefined
  let idx = -1
  const next = () => ++idx

  return (
    <div className="relative">
      <label htmlFor={inputId} className={labelClassName ?? 'block text-sm font-medium text-ink mb-1'}>
        {label}{required && <span className="text-terra" aria-hidden="true"> *</span>}
      </label>
      <input
        id={inputId}
        type="text"
        value={open ? query : display}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${inputId}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errId, hintId].filter(Boolean).join(' ') || undefined}
        // 16px on phones: anything smaller makes iOS zoom the page on focus.
        className={`w-full border rounded-mj-sm px-3 py-2.5 sm:py-2 pr-8 text-ink text-base sm:text-sm focus:outline-none bg-white ${
          error ? 'border-terra focus:border-terra' : 'border-ink/20 focus:border-maroon'}`}
        onFocus={() => { setQuery(''); setOpen(true); setActive(-1) }}
        onChange={e => { setQuery(e.target.value); setOpen(true); setActive(-1) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(a + 1, items.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
          else if (e.key === 'Enter') {
            // Enter picks the highlighted option, or keeps what was typed, so a
            // member entering a mool by hand does not have to reach for the mouse.
            if (open && active >= 0 && items[active]) { e.preventDefault(); items[active].pick() }
            else if (canUseTyped) { e.preventDefault(); choose(typed) }
            else if (open && matches.length === 1) { e.preventDefault(); choose(matches[0].value) }
          }
          else if (e.key === 'Escape') setOpen(false)
        }}
      />
      {value && !open && (
        <button type="button" onClick={() => onChange('')}
          className="absolute right-1 top-[30px] grid h-8 w-8 place-items-center text-ink-soft hover:text-maroon text-base leading-none"
          aria-label={`Clear ${label}`}>×</button>
      )}
      {open && (
        <ul id={`${inputId}-list`} role="listbox" aria-label={label}
          className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto overscroll-contain rounded-mj-sm border border-ink/20 bg-white shadow-mj-xs">
          {/* Keeping what was typed comes first when nothing matched — that is
              the only useful action at that point. */}
          {canUseTyped && matches.length === 0 && (() => { const i = next(); return (
            <li id={optId(i)} role="option" aria-selected={active === i}
              className={`cursor-pointer px-3 py-2.5 text-sm text-ink hover:bg-cream ${active === i ? 'bg-cream' : ''}`}
              onMouseDown={() => choose(typed)}>
              Use &ldquo;<span className="font-medium text-maroon">{typed}</span>&rdquo;
            </li>
          ) })()}
          {matches.length === 0 && !canUseTyped && (
            <li className="px-3 py-2.5 text-sm text-ink-soft">No match in the list.</li>
          )}
          {matches.map(o => { const i = next(); return (
            <li key={o.value} id={optId(i)} role="option" aria-selected={o.value === value}
              className={`cursor-pointer px-3 py-2.5 text-sm hover:bg-cream ${active === i ? 'bg-cream' : ''} ${o.value === value ? 'text-maroon font-medium' : 'text-ink'}`}
              onMouseDown={() => choose(o.value)}>
              {o.label}
            </li>
          ) })}
          {/* Also offered below the matches, so a member whose mool merely
              resembles a listed one can still enter their own spelling. */}
          {canUseTyped && matches.length > 0 && (() => { const i = next(); return (
            <li id={optId(i)} role="option" aria-selected={active === i}
              className={`cursor-pointer border-t border-paper-3 px-3 py-2.5 text-sm text-ink hover:bg-cream ${active === i ? 'bg-cream' : ''}`}
              onMouseDown={() => choose(typed)}>
              Use &ldquo;<span className="font-medium text-maroon">{typed}</span>&rdquo; instead
            </li>
          ) })()}
          {showOther && (() => { const i = next(); return (
            <li id={optId(i)} role="option" aria-selected={value === 'other'}
              className={`cursor-pointer border-t border-paper-3 px-3 py-2.5 text-sm text-ink-soft hover:bg-cream ${active === i ? 'bg-cream' : ''}`}
              onMouseDown={() => choose('other')}>
              Not listed / Other
            </li>
          ) })()}
        </ul>
      )}
      {error && <p id={errId} role="alert" className="mt-1 text-xs text-terra">{error}</p>}
      {hint && <p id={hintId} className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  )
}
