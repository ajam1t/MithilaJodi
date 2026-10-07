import Link from 'next/link'
import { SocialLinksForm, WhatsAppForm } from '@/components/admin/SettingForms'
import { Badge, DataNote, PageHeader, Section, ago, ist } from '@/components/admin/ui'
import { actionLabel } from '@/components/admin/format'
import { can, requireAdminPage } from '@/lib/adminAuth'
import { getSetting } from '@/lib/siteSettings'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata = { title: 'Community' }
export const dynamic = 'force-dynamic'

async function who(id: string | null): Promise<string> {
  if (!id) return 'Initial setup'
  const admin = await createAdminClient()
  const { data } = await admin.from('accounts').select('role, email, mobile').eq('id', id).maybeSingle()
  if (!data) return 'Unknown'
  return `${data.role === 'admin' ? 'Admin' : 'Moderator'} (${data.email ?? `••••${data.mobile.slice(-4)}`})`
}

export default async function CommunityPage() {
  const session = await requireAdminPage('view')
  const admin = await createAdminClient()
  const [wa, social, history] = await Promise.all([
    getSetting('whatsapp_community'),
    getSetting('social_links'),
    admin.from('admin_audit_logs').select('id, action, payload, created_at').in('action', ['setting_whatsapp_community', 'setting_social_links']).order('created_at', { ascending: false }).limit(10),
  ])
  const [waBy, socialBy] = await Promise.all([who(wa.updated_by), who(social.updated_by)])
  const editable = can(session, 'manage_community')

  return (
    <>
      <PageHeader eyebrow="Community" title="WhatsApp community & social links"
        description="The website’s Join and social buttons point to these values through mithilajodi.com/go/… links, so a change here works immediately — no code change or deployment." />

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="WhatsApp community" id="whatsapp"
          actions={wa.value.enabled ? <Badge tone="good">● Enabled</Badge> : <Badge tone="warn">▲ Disabled</Badge>}>
          <dl className="mb-4 grid grid-cols-2 gap-3 text-[13px]">
            <div><dt className="text-ink-soft">Last updated</dt><dd className="text-ink">{wa.updated_at ? `${ist(wa.updated_at)} (${ago(wa.updated_at)})` : '—'}</dd></div>
            <div><dt className="text-ink-soft">Updated by</dt><dd className="text-ink">{waBy}</dd></div>
          </dl>
          <WhatsAppForm url={wa.value.url} enabled={wa.value.enabled} canEdit={editable} />
          <DataNote>When the community is full, paste the new invite link and Save. While disabled, Join buttons open the Contact page instead of a dead invite. Website link: <code className="rounded bg-[#F3EEE6] px-1">/go/whatsapp</code></DataNote>
        </Section>

        <Section title="Official social links" id="social" description={`Last updated ${social.updated_at ? ago(social.updated_at) : '—'} by ${socialBy}`}>
          <SocialLinksForm links={social.value} canEdit={editable} />
          <DataNote>Used by the footer and the menu (<code className="rounded bg-[#F3EEE6] px-1">/go/instagram</code>, <code className="rounded bg-[#F3EEE6] px-1">/go/youtube</code>).</DataNote>
        </Section>
      </div>

      <Section title="Change history" description="From the audit log" className="mt-4" actions={<Link href="/admin/security/audit?q=setting_" className="text-[12.5px] font-medium text-maroon hover:underline">Full audit log →</Link>}>
        {(history.data ?? []).length === 0 ? <p className="text-[13px] text-ink-soft">No changes since the console launched.</p> : (
          <ul className="divide-y divide-[#F3EEE6] text-[13px]">
            {(history.data ?? []).map((h: { id: number; action: string; payload: { before?: unknown; after?: unknown } | null; created_at: string }) => (
              <li key={h.id} className="py-2">
                <p className="text-ink">{actionLabel(h.action)} · <span className="text-ink-soft">{ist(h.created_at)}</span></p>
                <p className="mt-0.5 break-all font-mono text-[11.5px] text-ink-soft">{JSON.stringify(h.payload?.before)} → {JSON.stringify(h.payload?.after)}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Announcements & messages" className="mt-4">
        <div className="flex flex-wrap gap-2 text-[13px]">
          <Link href="/admin/notifications" className="rounded-lg border border-[#E8E1D5] px-3 py-1.5 hover:border-[#CDBFA6]">Announcement campaigns →</Link>
          <Link href="/admin/messages" className="rounded-lg border border-[#E8E1D5] px-3 py-1.5 hover:border-[#CDBFA6]">Official messages →</Link>
        </div>
      </Section>
    </>
  )
}
