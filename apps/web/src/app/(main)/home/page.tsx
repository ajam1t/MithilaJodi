import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { loadHomeSummary } from '@/lib/memberActivity'
import { SITE_URL } from '@/lib/constants'
import { MemberHome } from './MemberHome'

export const dynamic = 'force-dynamic'
// The (main) layout supplies robots: noindex.
export const metadata = { title: 'Home' }

export default async function MemberHomePage() {
  const session = await getSessionAccount()
  if (!session) redirect('/login?next=/home')

  const admin = await createAdminClient()
  const summary = await loadHomeSummary(admin, session.id)
  if (!summary) redirect('/profile/edit')

  return <MemberHome summary={summary} siteUrl={SITE_URL} />
}
