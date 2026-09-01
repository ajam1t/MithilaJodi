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
 * allowlist (masked surname, no dob/contact/free-text) is identical.
 *
 * The photo URLs are signed with a 1 hour TTL, so the page embedding this must
 * revalidate well inside that window — see `revalidate` in app/page.tsx.
 * Renders nothing if no profiles are curated.
 */
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

  return (
    <section className="pt-9 pb-8 sm:pt-12 sm:pb-10 bg-paper-2/40" aria-label="Featured profiles">
      <div className="wrap">
        <SectionHeading
          eyebrow="From Our Community"
          title="Featured Profiles"
          subtitle="A glimpse of Maithil individuals and families seeking a meaningful marriage on Mithila Jodi."
        />
        <FeaturedCarousel profiles={profiles} />
        <div className="text-center mt-5">
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
