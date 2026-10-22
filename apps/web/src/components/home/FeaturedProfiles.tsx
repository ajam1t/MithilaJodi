import Link from 'next/link'
import { SectionHeading } from '@/components/ui'
import { getPublicShowcaseProfiles } from '@/lib/publicProfiles'
import { FeaturedCarousel } from './FeaturedCarousel'

/**
 * Homepage "Featured Profiles" band.
 *
 * Server-rendered. This used to be a client component that fetched
 * /api/public/profiles from a useEffect, which meant:
 *   - search crawlers saw four grey skeletons where the profile content should
 *     be, so the homepage's most substantive content was invisible to indexing;
 *   - every visitor paid an extra round trip after paint, and the section
 *     visibly popped in.
 *
 * It now calls the same shared projection the API route uses, so the privacy
 * allowlist (no dob/contact/free-text) is identical.
 *
 * The photo URLs are signed with a 1 hour TTL, so the page embedding this must
 * revalidate well inside that window — see `revalidate` in app/page.tsx.
 * Renders nothing if no profiles are curated.
 */
const HOME_MAX = 8

export async function FeaturedProfiles() {
  let profiles: Awaited<ReturnType<typeof getPublicShowcaseProfiles>> = []
  try {
    profiles = await getPublicShowcaseProfiles()
  } catch (err) {
    // A showcase failure must never take down the homepage.
    console.error('[FeaturedProfiles] showcase load failed:', err)
    return null
  }

  // Nothing curated yet — don't render an empty section.
  if (profiles.length === 0) return null

  // The homepage shows the first eight (each card is ~30 elements to hydrate
  // and a photo to fetch); "Explore all profiles" opens the full showcase.
  const shown = profiles.slice(0, HOME_MAX)

  return (
    <section className="pt-9 pb-8 sm:pt-12 sm:pb-10 bg-paper-2/40" aria-label="Featured profiles">
      <div className="wrap">
        {/* The way to every profile sits beside the heading, where people look for it. */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-8">
          <SectionHeading
            align="left"
            className="mb-0"
            eyebrow="From Our Community"
            title="Featured Profiles"
            subtitle="A glimpse of Maithil individuals and families seeking a meaningful marriage on Mithila Jodi."
          />
          <Link
            href="/explore"
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-gold/50 bg-cream px-4 py-2 text-[14px] font-semibold text-maroon transition-colors hover:border-gold hover:bg-white"
          >
            Explore all profiles
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
        <FeaturedCarousel profiles={shown} />
      </div>
    </section>
  )
}
