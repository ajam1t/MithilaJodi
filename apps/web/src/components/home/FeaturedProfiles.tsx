'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SearchCard } from '@/types/profile'
import { SectionHeading, Skeleton } from '@/components/ui'
import { FeaturedCarousel } from './FeaturedCarousel'

/**
 * Homepage "Featured Profiles" band. Loads the curated public showcase
 * client-side (after paint) so the homepage stays static and LCP-friendly.
 * Renders nothing if no profiles are curated.
 */
export function FeaturedProfiles() {
  const [profiles, setProfiles] = useState<SearchCard[] | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/public/profiles')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('failed'))))
      .then((d) => {
        if (alive) setProfiles(Array.isArray(d?.results) ? d.results : [])
      })
      .catch(() => {
        if (alive) setProfiles([])
      })
    return () => {
      alive = false
    }
  }, [])

  // Nothing curated yet — don't render an empty section.
  if (profiles !== null && profiles.length === 0) return null

  return (
    <section className="py-14 sm:py-20 bg-paper-2/40" aria-label="Featured profiles">
      <div className="wrap">
        <SectionHeading
          eyebrow="From Our Community"
          title="Featured Profiles"
          subtitle="A glimpse of Maithil individuals and families seeking a meaningful marriage on Mithila Jodi."
        />
        {profiles === null ? (
          <div className="flex gap-5 overflow-hidden pb-4" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="shrink-0 w-[280px] sm:w-[300px]">
                <Skeleton className="h-[452px] w-full rounded-mj-lg" />
              </div>
            ))}
          </div>
        ) : (
          <FeaturedCarousel profiles={profiles} />
        )}
        <div className="text-center mt-8">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-maroon font-semibold hover:text-terra transition-colors"
          >
            Explore all profiles
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
