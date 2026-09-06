import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { getOnboardingState } from '@/lib/onboarding'
import { noindexMetadata } from '@/lib/seo'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { WelcomeFlow } from './WelcomeFlow'

export const dynamic = 'force-dynamic'

export const metadata = noindexMetadata('Complete Your Profile', { follow: false })

/**
 * Required onboarding.
 *
 * Deliberately OUTSIDE the (main) route group: that group's layout redirects
 * every incomplete member here, so a page inside it would redirect to itself.
 *
 * Sends an already-complete member on to their profile, so the URL is not a
 * dead end for anyone who bookmarks it or comes back to it later.
 */
export default async function WelcomePage() {
  const account = await getSessionAccount()
  if (!account) redirect('/login?next=/welcome')

  const admin = await createAdminClient()
  const state = await getOnboardingState(admin, account.id)

  if (state.complete) redirect('/profile')

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <header className="bg-cream border-b border-paper-3">
        <div className="wrap py-3.5 text-center">
          <span className="font-serif text-maroon text-[19px] leading-none">Mithila Jodi</span>
          <span className="block font-deva text-ink-soft text-[11.5px] mt-0.5" lang="hi">
            जहाँ परम्परा मिले, प्रेम से
          </span>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <WelcomeFlow initial={state} />
      </main>

      <MithilaFooter />
    </div>
  )
}
