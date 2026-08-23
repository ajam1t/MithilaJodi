'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProfileCard3D } from '@/components/ProfileCard3D'
import type { SearchCard } from '@/components/ProfileCard'

export function ExploreGrid() {
  const [results, setResults] = useState<SearchCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/public/profiles')
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        if (j.ok) setResults(j.results as SearchCard[])
        else setError(true)
      })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      {/* Gentle, non-blocking CTA (just a link — never a modal / gate) */}
      <p className="text-center text-sm text-ink-soft mb-8">
        <Link href="/register" className="text-maroon font-medium hover:underline">
          Create a free account to send interests and connect →
        </Link>
      </p>

      {loading ? (
        <p className="text-center text-ink-soft text-sm animate-pulse py-16">
          Loading profiles…
        </p>
      ) : error ? (
        <div className="card p-8 text-center text-ink-soft text-sm max-w-md mx-auto">
          Could not load profiles right now. Please try again later.
        </div>
      ) : results.length === 0 ? (
        <div className="card p-10 text-center max-w-md mx-auto">
          <p className="font-serif text-lg text-maroon">Profiles coming soon</p>
          <p className="text-sm text-ink-soft mt-2">
            We are curating profiles to feature here. Please check back shortly.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 sm:gap-10 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {results.map((card) => (
            <ProfileCard3D key={card.id} profile={card} hideActions />
          ))}
        </div>
      )}
    </div>
  )
}
