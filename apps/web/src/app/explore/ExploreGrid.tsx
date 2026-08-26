'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProfileCard3D } from '@/components/ProfileCard3D'
import type { SearchCard } from '@/types/profile'

type ExploreGridProps = {
  /** Profiles rendered server-side into the initial HTML (SSR). */
  initialProfiles?: SearchCard[]
  /** True when the server-side fetch failed. */
  initialError?: boolean
}

export function ExploreGrid({ initialProfiles, initialError = false }: ExploreGridProps) {
  const hasInitial = Array.isArray(initialProfiles)
  const [results, setResults] = useState<SearchCard[]>(initialProfiles ?? [])
  // When the server already provided data (or an error), skip the loading state
  // entirely — the first paint shows real content, not a spinner.
  const [loading, setLoading] = useState(!hasInitial && !initialError)
  const [error, setError] = useState(initialError)

  useEffect(() => {
    // Server-rendered data is authoritative; only fetch client-side when the
    // page was rendered without it (defensive fallback).
    if (hasInitial || initialError) return
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
  }, [hasInitial, initialError])

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
