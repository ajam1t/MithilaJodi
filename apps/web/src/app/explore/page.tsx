import type { Metadata } from 'next'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { ExploreGrid } from './ExploreGrid'
import { getPublicShowcaseProfiles } from '@/lib/publicProfiles'
import type { SearchCard } from '@/types/profile'
import { SITE_URL } from '@/lib/constants'

const SITE = SITE_URL

// Server-render the curated showcase on each request so the first meaningful
// profile content is present in the initial HTML (crawlable, no JS required).
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Browse Profiles — Discover Mithila Matches | Mithila Jodi',
  description:
    'Browse featured Maithili matrimonial profiles on Mithila Jodi. Create a free account to send interests and connect with matches rooted in Mithila heritage.',
  alternates: { canonical: `${SITE}/explore` },
}

export default async function ExplorePage() {
  let initialProfiles: SearchCard[] = []
  let loadError = false
  try {
    initialProfiles = await getPublicShowcaseProfiles()
  } catch {
    loadError = true
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />
      <main className="flex-1 pb-16 lg:pb-0">
        <section className="wrap py-8 sm:py-12">
          <header className="text-center mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl text-maroon">Browse Profiles</h1>
            <p className="text-sm sm:text-base text-ink-soft mt-2">
              Discover Mithila matches featured from our community.
            </p>
          </header>

          <ExploreGrid initialProfiles={initialProfiles} initialError={loadError} />
        </section>
      </main>
      <MithilaFooter />
      <MobileBottomNav />
    </div>
  )
}
