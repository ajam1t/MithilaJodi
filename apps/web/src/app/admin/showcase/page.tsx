'use client'

import { useState, useEffect, useCallback } from 'react'

type ShowcaseEntry = {
  profile_id: string
  display_name: string
  mobile: string | null
  sort_order: number
  is_active: boolean
}

type Candidate = {
  id: string
  name: string
  mobile: string | null
}

const MAX = 20

export default function AdminShowcasePage() {
  const [showcase, setShowcase] = useState<ShowcaseEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  // Add-candidate search
  const [q, setQ] = useState('')
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const [searching, setSearching] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/showcase')
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setShowcase(j.showcase as ShowcaseEntry[])
        else setError('Failed to load showcase.')
      })
      .catch(() => setError('Failed to load showcase.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function runSearch(term: string) {
    const t = term.trim()
    if (!t) { setCandidates(null); return }
    setSearching(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/showcase?search=${encodeURIComponent(t)}`)
      const json = await res.json()
      if (json.ok) {
        setShowcase(json.showcase as ShowcaseEntry[])
        setCandidates((json.candidates ?? []) as Candidate[])
      } else {
        setError('Search failed.')
      }
    } catch {
      setError('Search failed.')
    } finally {
      setSearching(false)
    }
  }

  async function addProfile(id: string) {
    setBusy(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: id }),
      })
      const json = await res.json()
      if (json.ok) {
        setCandidates((cs) => (cs ? cs.filter((c) => c.id !== id) : cs))
        load()
      } else {
        setError(json.message ?? 'Failed to add.')
      }
    } catch {
      setError('Failed to add.')
    } finally {
      setBusy(null)
    }
  }

  async function patchEntry(id: string, update: { sort_order?: number; is_active?: boolean }) {
    const res = await fetch(`/api/admin/showcase/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.message ?? 'Update failed')
  }

  async function toggleActive(entry: ShowcaseEntry) {
    setBusy(entry.profile_id)
    setError(null)
    try {
      await patchEntry(entry.profile_id, { is_active: !entry.is_active })
      setShowcase((s) =>
        s.map((e) => (e.profile_id === entry.profile_id ? { ...e, is_active: !e.is_active } : e))
      )
    } catch {
      setError('Could not update active state.')
    } finally {
      setBusy(null)
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= showcase.length) return
    const a = showcase[index]
    const b = showcase[target]
    setBusy(a.profile_id)
    setError(null)
    try {
      // Swap sort_order via two PATCHes.
      await patchEntry(a.profile_id, { sort_order: b.sort_order })
      await patchEntry(b.profile_id, { sort_order: a.sort_order })
      setShowcase((s) => {
        const next = [...s]
        const swappedA = { ...a, sort_order: b.sort_order }
        const swappedB = { ...b, sort_order: a.sort_order }
        next[index] = swappedB
        next[target] = swappedA
        return next
      })
    } catch {
      setError('Could not reorder.')
    } finally {
      setBusy(null)
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Remove this profile from the public Search Profiles showcase?')) return
    setBusy(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/showcase/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.ok) setShowcase((s) => s.filter((e) => e.profile_id !== id))
      else setError('Failed to remove.')
    } catch {
      setError('Failed to remove.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <h1 className="font-serif text-xl sm:text-2xl text-ink mb-1">Search Showcase</h1>
      <p className="text-sm text-ink-soft mb-5">
        Shown to logged-out visitors on Search Profiles (max {MAX}).
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-mj-sm px-3 py-2">
          {error}
        </div>
      )}

      {/* ── Add profiles ── */}
      <div className="card p-3 sm:p-4 mb-6">
        <h2 className="font-serif text-base text-ink mb-3">Add a profile</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(q) }}
          className="flex gap-2 mb-3"
        >
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find by name or mobile…"
            className="flex-1 min-w-0 border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
          />
          <button
            type="submit"
            disabled={searching}
            className="shrink-0 text-sm py-2 px-4 bg-maroon text-cream rounded-mj-sm hover:bg-maroon-deep disabled:opacity-60"
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
          {candidates !== null && (
            <button
              type="button"
              onClick={() => { setQ(''); setCandidates(null) }}
              className="shrink-0 text-sm py-2 px-3 border border-ink/20 text-ink-soft rounded-mj-sm hover:text-ink"
            >
              Clear
            </button>
          )}
        </form>

        {candidates !== null && (
          candidates.length === 0 ? (
            <p className="text-sm text-ink-soft">No matching profiles to add.</p>
          ) : (
            <ul className="space-y-2">
              {candidates.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-sm bg-cream rounded-mj-sm px-3 py-2">
                  <span className="min-w-0">
                    <span className="font-semibold text-ink">{c.name}</span>
                    {c.mobile && <span className="ml-2 text-[11px] text-ink-soft font-mono">{c.mobile}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => addProfile(c.id)}
                    disabled={busy === c.id}
                    className="shrink-0 text-xs py-1.5 px-3 bg-maroon text-cream rounded-mj-sm hover:bg-maroon-deep disabled:opacity-60"
                  >
                    {busy === c.id ? 'Adding…' : 'Add'}
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      {/* ── Current showcase ── */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-serif text-base text-ink">Current showcase</h2>
        <span className="text-xs text-ink-soft">{showcase.length} / {MAX}</span>
      </div>

      {loading ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading…</p>
      ) : showcase.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">
          No profiles in the showcase yet. Search above to add some.
        </div>
      ) : (
        <div className="space-y-2">
          {showcase.map((e, i) => (
            <div key={e.profile_id} className="card p-3 flex items-center gap-3">
              <span className="text-xs text-ink-soft font-mono w-6 shrink-0 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-ink text-sm">{e.display_name}</span>
                  {e.mobile && <span className="text-[11px] text-ink-soft font-mono">{e.mobile}</span>}
                  {!e.is_active && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                      Hidden
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Reorder */}
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || busy === e.profile_id}
                  aria-label="Move up"
                  className="text-xs py-1 px-2 border border-ink/20 text-ink rounded hover:bg-cream disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === showcase.length - 1 || busy === e.profile_id}
                  aria-label="Move down"
                  className="text-xs py-1 px-2 border border-ink/20 text-ink rounded hover:bg-cream disabled:opacity-40"
                >
                  ↓
                </button>

                {/* Active toggle */}
                <button
                  type="button"
                  onClick={() => toggleActive(e)}
                  disabled={busy === e.profile_id}
                  className={[
                    'text-xs py-1.5 px-3 border rounded-mj-sm disabled:opacity-60',
                    e.is_active
                      ? 'border-green-200 text-green-700 hover:bg-green-50'
                      : 'border-ink/20 text-ink-soft hover:bg-cream',
                  ].join(' ')}
                >
                  {e.is_active ? 'Active' : 'Hidden'}
                </button>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => remove(e.profile_id)}
                  disabled={busy === e.profile_id}
                  className="text-xs py-1.5 px-3 border border-red-200 text-red-600 rounded-mj-sm hover:bg-red-50 disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
