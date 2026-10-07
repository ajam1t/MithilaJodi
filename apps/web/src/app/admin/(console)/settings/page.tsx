import Link from 'next/link'
import { AdminEmailForm } from '@/components/admin/AdminEmailForm'
import { LimitsForm } from '@/components/admin/SettingForms'
import { DataNote, PageHeader, Section, ago } from '@/components/admin/ui'
import { can, requireAdminPage } from '@/lib/adminAuth'
import { getSetting } from '@/lib/siteSettings'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await requireAdminPage('view')
  const admin = await createAdminClient()
  const [limits, me] = await Promise.all([
    getSetting('platform_limits'),
    admin.from('accounts').select('email').eq('id', session.id).maybeSingle(),
  ])

  return (
    <>
      <PageHeader eyebrow="Settings" title="Platform settings" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Your admin sign-in" description="The Admin Console accepts your email or your mobile number, with your password.">
          <AdminEmailForm current={me.data?.email ?? null} />
          <DataNote>Password resets use your registered mobile number (one-time code). Two-factor sign-in is not available yet.</DataNote>
        </Section>

        <Section title="Supabase plan limits" description={limits.updated_at ? `Last changed ${ago(limits.updated_at)}` : 'Not set yet'}>
          <LimitsForm limits={limits.value} canEdit={can(session, 'manage_settings')} />
          <DataNote>
            The console can measure what you use but cannot read your plan’s quotas without a Supabase management token, which it deliberately does not hold.
            Copy the limits from your Supabase dashboard (Settings → Billing / Usage) so the Supabase page can show what remains.
          </DataNote>
        </Section>
      </div>

      <Section title="Other settings" className="mt-4">
        <div className="flex flex-wrap gap-2 text-[13px]">
          {[
            ['Membership plans', '/admin/config'], ['Accounts & memberships', '/admin/accounts'], ['Master data (gotra, mool, …)', '/admin/master-data'],
            ['WhatsApp & social links', '/admin/community'], ['Search showcase', '/admin/showcase'],
          ].map(([l, h]) => <Link key={h} href={h} className="rounded-lg border border-[#E8E1D5] px-3 py-1.5 hover:border-[#CDBFA6]">{l} →</Link>)}
        </div>
      </Section>
    </>
  )
}
