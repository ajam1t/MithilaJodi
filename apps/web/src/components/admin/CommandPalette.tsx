'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { NavGroup } from './nav'
import { GROUP_ICON, Icon } from './icons'

/**
 * ⌘K / Ctrl+K (or "/") — jump to any console page the role can open, or
 * search members by name or number. Only links the menu already shows are
 * offered; every page still checks permission on the server.
 */
type Cmd = { id: string; label: string; hint?: string; section: string; icon: string; href?: string; run?: () => void }

export function CommandPalette({ groups, open, onClose, onSignOut }: {
  groups: NavGroup[]
  open: boolean
  onClose: () => void
  onSignOut: () => void
}) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const all = useMemo<Cmd[]>(() => {
    const pages: Cmd[] = groups.flatMap(g => g.href
      ? [{ id: g.href, label: g.label, section: 'Pages', icon: GROUP_ICON[g.label] ?? 'dashboard', href: g.href }]
      : (g.items ?? []).map(i => ({ id: i.href, label: i.label, hint: i.hint ? `${g.label} · ${i.hint}` : g.label, section: 'Pages', icon: GROUP_ICON[g.label] ?? 'dashboard', href: i.href })))
    return [
      ...pages,
      { id: 'site', label: 'View public site', section: 'Actions', icon: 'globe', href: '/' },
      { id: 'out', label: 'Sign out', section: 'Actions', icon: 'out', run: onSignOut },
    ]
  }, [groups, onSignOut])

  const results = useMemo<Cmd[]>(() => {
    const t = q.trim().toLowerCase()
    const hits = t ? all.filter(c => `${c.label} ${c.hint ?? ''}`.toLowerCase().includes(t)) : all
    return t
      ? [{ id: 'find', label: `Search members for “${q.trim()}”`, hint: 'Name, mobile, gotra, place', section: 'Members', icon: 'search', href: `/admin/members?q=${encodeURIComponent(q.trim())}` }, ...hits]
      : hits
  }, [q, all])

  useEffect(() => { if (open) { setQ(''); setSel(0); requestAnimationFrame(() => inputRef.current?.focus()) } }, [open])
  useEffect(() => { setSel(0) }, [q])
  useEffect(() => { listRef.current?.querySelector('[data-sel]')?.scrollIntoView({ block: 'nearest' }) }, [sel])

  function go(c: Cmd | undefined) {
    if (!c) return
    onClose()
    if (c.run) c.run()
    else if (c.href) router.push(c.href)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[sel]) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  if (!open || typeof document === 'undefined') return null
  let lastSection = ''
  return createPortal(
    <>
      <div className="acx-k-bg" onClick={onClose} aria-hidden="true" />
      <div className="acx-k" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKey}>
        <div className="acx-k-in">
          <Icon name="search" size={19} className="text-[#B98A2E]" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Jump to a page, or search members…"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="acx-k-list"
            aria-activedescendant={results[sel] ? `acx-k-${sel}` : undefined}
          />
          <span className="acx-kbd">Esc</span>
        </div>
        <div className="acx-k-list" id="acx-k-list" role="listbox" ref={listRef}>
          {results.length === 0 && <p className="px-4 py-6 text-center text-[13.5px] text-ink-soft">Nothing matches.</p>}
          {results.map((c, i) => {
            const head = c.section !== lastSection ? (lastSection = c.section) : null
            return (
              <div key={c.id}>
                {head && <p className="acx-k-sec">{head}</p>}
                <button
                  type="button"
                  id={`acx-k-${i}`}
                  role="option"
                  aria-selected={i === sel}
                  data-sel={i === sel || undefined}
                  className="acx-k-item"
                  onMouseMove={() => setSel(i)}
                  onClick={() => go(c)}
                >
                  <span className="acx-k-ico"><Icon name={c.icon} size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{c.label}</span>
                    {c.hint && <small className="truncate">{c.hint}</small>}
                  </span>
                  {i === sel && <span className="acx-kbd">↵</span>}
                </button>
              </div>
            )
          })}
        </div>
        <div className="acx-k-foot" aria-hidden="true"><span>↑↓ Move</span><span>↵ Open</span><span>Esc Close</span></div>
      </div>
    </>,
    document.body,
  )
}
