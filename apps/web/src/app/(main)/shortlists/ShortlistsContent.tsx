'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type ShortlistedProfile = {
  saved_at: string
  profile: {
    id: string
    display_name: string
    age: number | null
    gender: string
    caste: string | null
    current_loc_name: string | null
    photo_url: string | null
  }
}

export default function ShortlistsContent() {
  const [items, setItems] = useState<ShortlistedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/shortlists')
      .then(r => r.json())
      .then(j => {
        if (j.ok) setItems(j.shortlists ?? [])
        else setError(j.message ?? 'Failed to load shortlist')
      })
      .catch(() => setError('Could not load shortlist'))
      .finally(() => setLoading(false))
  }, [])

  async function remove(profileId: string) {
    setRemoving(profileId)
    setError('')
    try {
      const res = await fetch(`/api/shortlists/${profileId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.ok) {
        setItems(prev => prev.filter(i => i.profile.id !== profileId))
      } else {
        setError(json.message ?? 'Could not remove from shortlist. Please try again.')
      }
    } catch {
      setError('Could not remove from shortlist. Please try again.')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <main className="min-h-screen bg-paper">
      <div className="wrap py-8">
        <div className="max-w-2xl mx-auto space-y-5">
          <h1 className="font-serif text-3xl text-ink">Shortlist</h1>

          {error && (
            <div className="rounded-mj-sm bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="card p-3 space-y-2">
                  <div className="w-full aspect-[3/4] bg-paper-3 rounded-mj-sm" />
                  <div className="h-4 bg-paper-3 rounded w-3/4" />
                  <div className="h-3 bg-paper-3 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-ink-soft text-sm">Your shortlist is empty.</p>
              <Link href="/search" className="text-maroon text-sm underline mt-2 inline-block">
                Browse profiles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {items.map(item => {
                const p = item.profile
                return (
                  <div key={p.id} className="card p-3 space-y-2 relative group">
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      disabled={removing === p.id}
                      title="Remove from shortlist"
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-mj-xs text-red-500 text-sm leading-none flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity disabled:opacity-50 z-10"
                    >
                      ✕
                    </button>

                    <Link href={`/profile/${p.id}`} className="block">
                      <div className="w-full aspect-[3/4] rounded-mj-sm overflow-hidden bg-cream border border-paper-3 flex items-center justify-center">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt={p.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl text-ink-soft">{p.display_name[0]?.toUpperCase()}</span>
                        )}
                      </div>
                    </Link>

                    <div>
                      <Link href={`/profile/${p.id}`} className="font-semibold text-ink text-sm hover:text-maroon block truncate">
                        {p.display_name}
                      </Link>
                      <p className="text-xs text-ink-soft truncate">
                        {[p.age ? `${p.age} yrs` : null, p.caste ?? p.current_loc_name]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
