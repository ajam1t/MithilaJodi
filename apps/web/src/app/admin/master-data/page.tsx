'use client'

import { useState, useEffect, useCallback } from 'react'

type Category = {
  type: string
  total: number
  active: number
}

type Item = {
  id: number
  type: string
  value: string
  label_en: string
  label_hi: string | null
  label_mai: string | null
  is_mithila: boolean
  sort_order: number
  is_active: boolean
  usage_count: number
}

function prettyType(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function AdminMasterDataPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  // Add-form state
  const [nValue, setNValue] = useState('')
  const [nLabelEn, setNLabelEn] = useState('')
  const [nLabelHi, setNLabelHi] = useState('')
  const [nLabelMai, setNLabelMai] = useState('')
  const [nIsMithila, setNIsMithila] = useState(false)

  const loadCategories = useCallback(() => {
    setLoadingCats(true)
    fetch('/api/admin/master-data')
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setCategories(j.categories)
          setSelected((cur) => cur ?? (j.categories[0]?.type ?? null))
        }
      })
      .finally(() => setLoadingCats(false))
  }, [])

  const loadItems = useCallback((type: string) => {
    setLoadingItems(true)
    setError(null)
    fetch(`/api/admin/master-data/${encodeURIComponent(type)}`)
      .then((r) => r.json())
      .then((j) => { if (j.ok) setItems(j.items); else setError('Failed to load items') })
      .catch(() => setError('Failed to load items'))
      .finally(() => setLoadingItems(false))
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])
  useEffect(() => { if (selected) loadItems(selected) }, [selected, loadItems])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    if (!nValue.trim() || !nLabelEn.trim()) { setError('Value and English label are required'); return }
    setBusy('add')
    setError(null)
    try {
      const res = await fetch(`/api/admin/master-data/${encodeURIComponent(selected)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: nValue.trim(),
          label_en: nLabelEn.trim(),
          label_hi: nLabelHi.trim() || undefined,
          label_mai: nLabelMai.trim() || undefined,
          is_mithila: nIsMithila,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setNValue(''); setNLabelEn(''); setNLabelHi(''); setNLabelMai(''); setNIsMithila(false)
        loadItems(selected)
        loadCategories()
      } else {
        setError(json.message ?? 'Failed to add option')
      }
    } catch {
      setError('Failed to add option')
    } finally {
      setBusy(null)
    }
  }

  async function patchItem(id: number, updates: Partial<Item>, key: string) {
    if (!selected) return
    setBusy(key)
    setError(null)
    try {
      const res = await fetch(`/api/admin/master-data/${encodeURIComponent(selected)}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!json.ok) { setError(json.message ?? 'Update failed'); return false }
      return true
    } catch {
      setError('Update failed')
      return false
    } finally {
      setBusy(null)
    }
  }

  async function toggleActive(item: Item) {
    const ok = await patchItem(item.id, { is_active: !item.is_active }, `active-${item.id}`)
    if (ok) {
      setItems((xs) => xs.map((x) => x.id === item.id ? { ...x, is_active: !x.is_active } : x))
      loadCategories()
    }
  }

  async function saveLabel(item: Item, newLabel: string) {
    if (newLabel.trim() === item.label_en || !newLabel.trim()) return
    const ok = await patchItem(item.id, { label_en: newLabel.trim() }, `label-${item.id}`)
    if (ok) setItems((xs) => xs.map((x) => x.id === item.id ? { ...x, label_en: newLabel.trim() } : x))
  }

  async function move(index: number, dir: -1 | 1) {
    // Reorder based on the full (sort_order) list, not the filtered view.
    const ordered = [...items].sort((a, b) => a.sort_order - b.sort_order)
    const pos = ordered.findIndex((x) => x.id === items[index].id)
    const swapPos = pos + dir
    if (swapPos < 0 || swapPos >= ordered.length) return
    const a = ordered[pos]
    const b = ordered[swapPos]
    setBusy(`move-${a.id}`)
    setError(null)
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/admin/master-data/${encodeURIComponent(selected!)}/${a.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: b.sort_order }),
        }),
        fetch(`/api/admin/master-data/${encodeURIComponent(selected!)}/${b.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: a.sort_order }),
        }),
      ])
      const [j1, j2] = await Promise.all([r1.json(), r2.json()])
      if (j1.ok && j2.ok && selected) loadItems(selected)
      else setError('Reorder failed')
    } catch {
      setError('Reorder failed')
    } finally {
      setBusy(null)
    }
  }

  async function deleteItem(item: Item) {
    if (!selected) return
    if (!window.confirm(`Permanently delete "${item.label_en}"? This cannot be undone.`)) return
    setBusy(`del-${item.id}`)
    setError(null)
    try {
      const res = await fetch(`/api/admin/master-data/${encodeURIComponent(selected)}/${item.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.ok) { loadItems(selected); loadCategories() }
      else setError(json.message ?? 'Delete failed')
    } catch {
      setError('Delete failed')
    } finally {
      setBusy(null)
    }
  }

  const shown = items.filter((x) => {
    const t = filter.trim().toLowerCase()
    if (!t) return true
    return x.label_en.toLowerCase().includes(t) || x.value.toLowerCase().includes(t)
      || (x.label_hi ?? '').toLowerCase().includes(t) || (x.label_mai ?? '').toLowerCase().includes(t)
  })

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <h1 className="font-serif text-xl sm:text-2xl text-ink mb-4">Master Data</h1>

      {/* Category picker */}
      {loadingCats ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading categories…</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
          {categories.map((c) => (
            <button
              key={c.type}
              type="button"
              onClick={() => setSelected(c.type)}
              className={`shrink-0 text-xs sm:text-sm py-1.5 px-3 rounded-mj-sm border transition-colors
                ${selected === c.type
                  ? 'bg-maroon text-cream border-maroon'
                  : 'border-ink/20 text-ink hover:bg-cream'}`}
            >
              {prettyType(c.type)}
              <span className={`ml-1.5 text-[11px] ${selected === c.type ? 'text-cream/80' : 'text-ink-soft'}`}>
                {c.active}/{c.total}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-mj-sm px-3 py-2">
          {error}
        </div>
      )}

      {selected && (
        <>
          {/* Add option form */}
          <form onSubmit={addItem} className="card p-3 sm:p-4 mb-4 space-y-3">
            <p className="text-sm font-semibold text-ink">Add option to {prettyType(selected)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={nValue} onChange={(e) => setNValue(e.target.value)}
                placeholder="value (stored key, e.g. brahmin)"
                className="border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white font-mono focus:outline-none focus:border-maroon" />
              <input value={nLabelEn} onChange={(e) => setNLabelEn(e.target.value)}
                placeholder="label (English)"
                className="border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon" />
              <input value={nLabelHi} onChange={(e) => setNLabelHi(e.target.value)}
                placeholder="label (Hindi, optional)"
                className="border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon" />
              <input value={nLabelMai} onChange={(e) => setNLabelMai(e.target.value)}
                placeholder="label (Maithili, optional)"
                className="border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon" />
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={nIsMithila} onChange={(e) => setNIsMithila(e.target.checked)} />
                Mithila
              </label>
              <button type="submit" disabled={busy === 'add'}
                className="text-sm py-2 px-4 bg-maroon text-cream rounded-mj-sm hover:bg-maroon-deep disabled:opacity-60">
                {busy === 'add' ? 'Adding…' : 'Add option'}
              </button>
            </div>
          </form>

          {/* Search filter */}
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter options…"
            className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white mb-3 focus:outline-none focus:border-maroon"
          />

          <p className="text-xs text-ink-soft mb-3">
            Deactivated options stay saved on existing profiles but can&apos;t be chosen for new entries.
          </p>

          {/* Item list */}
          {loadingItems ? (
            <p className="text-ink-soft text-sm animate-pulse">Loading options…</p>
          ) : shown.length === 0 ? (
            <div className="card p-8 text-center text-ink-soft text-sm">No options found.</div>
          ) : (
            <div className="space-y-2">
              {shown.map((item, i) => (
                <div key={item.id}
                  className={`card p-3 flex items-start gap-3 ${item.is_active ? '' : 'opacity-60'}`}>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        defaultValue={item.label_en}
                        onBlur={(e) => saveLabel(item, e.target.value)}
                        disabled={busy === `label-${item.id}`}
                        className="text-sm font-medium text-ink bg-transparent border-b border-transparent hover:border-ink/20 focus:border-maroon focus:outline-none min-w-0"
                      />
                      {item.is_mithila && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-maroon/10 text-maroon font-medium">Mithila</span>
                      )}
                      {!item.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-ink-soft flex-wrap">
                      <span className="font-mono">{item.value}</span>
                      <span>·</span>
                      <span>{item.usage_count} in use</span>
                      {(item.label_hi || item.label_mai) && (
                        <>
                          <span>·</span>
                          <span>{[item.label_hi, item.label_mai].filter(Boolean).join(' / ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => move(i, -1)} disabled={busy === `move-${item.id}` || i === 0}
                        className="text-xs w-6 h-6 flex items-center justify-center border border-ink/20 rounded-mj-sm text-ink hover:bg-cream disabled:opacity-40"
                        aria-label="Move up">↑</button>
                      <button type="button" onClick={() => move(i, 1)} disabled={busy === `move-${item.id}` || i === shown.length - 1}
                        className="text-xs w-6 h-6 flex items-center justify-center border border-ink/20 rounded-mj-sm text-ink hover:bg-cream disabled:opacity-40"
                        aria-label="Move down">↓</button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => toggleActive(item)} disabled={busy === `active-${item.id}`}
                        className={`text-[11px] py-1 px-2 rounded-mj-sm border disabled:opacity-60
                          ${item.is_active
                            ? 'border-ink/20 text-ink-soft hover:text-ink'
                            : 'border-maroon/30 text-maroon hover:bg-maroon/5'}`}>
                        {item.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      {item.usage_count === 0 && (
                        <button type="button" onClick={() => deleteItem(item)} disabled={busy === `del-${item.id}`}
                          className="text-[11px] py-1 px-2 border border-red-200 text-red-600 rounded-mj-sm hover:bg-red-50 disabled:opacity-60">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
