import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { getOnboardingState } from '@/lib/onboarding'
import { noindexMetadata } from '@/lib/seo'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { WelcomeFlow, type WelcomeOptions } from './WelcomeFlow'

export const dynamic = 'force-dynamic'

export const metadata = noindexMetadata('Complete Your Profile', { follow: false })

const TYPES = ['caste', 'gotra', 'mool', 'sub_caste', 'marital_status'] as const

/* eslint-disable @typescript-eslint/no-explicit-any */
async function loadOptions(admin: any): Promise<WelcomeOptions> {
  const options: WelcomeOptions = { caste: [], gotra: [], mool: [], sub_caste: [], marital_status: [], moolGotra: {} }
  const [{ data, error }, { data: map }] = await Promise.all([
    admin.from('community_masters').select('type, value, label_en').in('type', TYPES).eq('is_active', true).order('sort_order', { ascending: true }),
    admin.from('maithil_mool_gotra').select('mool_value, gotra_value'),
  ])
  if (error) console.error('[welcome] options:', error.message)
  for (const r of (data ?? []) as any[]) (options as any)[r.type]?.push({ value: r.value, label: r.label_en })
  for (const r of (map ?? []) as any[]) (options.moolGotra[r.mool_value] ??= []).push(r.gotra_value)
  return options
}

/**
 * Join steps 2–5: About you → Mithila → Photo → Ready.
 *
 * Deliberately OUTSIDE the (main) route group: that group's layout redirects
 * every incomplete member here, so a page inside it would redirect to itself.
 *
 * Resumes at the first step with anything missing, prefilled. A complete
 * member is sent on to /home — unless they just finished (?done=1), when the
 * Ready screen is the page.
 */
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const account = await getSessionAccount()
  if (!account) redirect('/login?next=/welcome')

  const admin = await createAdminClient()
  const [state, options] = await Promise.all([
    getOnboardingState(admin, account.id, { withNames: true }),
    loadOptions(admin),
  ])

  if (state.complete && (await searchParams).done !== '1') redirect('/home')

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <header className="bg-cream border-b border-paper-3">
        <div className="wrap py-3 text-center">
          <span className="font-serif text-maroon text-[19px] leading-none">Mithila Jodi</span>
          <span className="block font-deva text-ink-soft text-[11.5px] mt-0.5" lang="hi">
            जहाँ परंपरा मिले, प्रेम से
          </span>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <WelcomeFlow initial={state} options={options} />
      </main>

      <MithilaFooter />
    </div>
  )
}
