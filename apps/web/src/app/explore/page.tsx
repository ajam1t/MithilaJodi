import type { Metadata } from 'next'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { ExploreGrid } from './ExploreGrid'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mithilajodi.com'

export const metadata: Metadata = {
  title: 'Browse Profiles — Discover Mithila Matches | Mithila Jodi',
  description:
    'Browse featured Maithili matrimonial profiles on Mithila Jodi. Create a free account to send interests and connect with matches rooted in Mithila heritage.',
  alternates: { canonical: `${SITE}/explore` },
}

export default function ExplorePage() {
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

          <ExploreGrid />
        </section>
      </main>
      <MithilaFooter />
      <MobileBottomNav />
    </div>
  )
}
