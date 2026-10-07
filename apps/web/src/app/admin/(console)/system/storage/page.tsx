import { OrphanList } from '@/components/admin/OrphanList'
import { DataNote, PageHeader, Section, Unavailable, bytes, ist } from '@/components/admin/ui'
import { can, requireAdminPage } from '@/lib/adminAuth'
import { getDbUsage } from '@/lib/adminData'

export const metadata = { title: 'Storage review' }
export const dynamic = 'force-dynamic'

export default async function StoragePage() {
  const session = await requireAdminPage('view')
  const usage = await getDbUsage()
  const yearAgo = Date.now() - 365 * 86_400_000

  return (
    <>
      <PageHeader eyebrow="System" title="Storage review"
        description="Find files worth cleaning up. Nothing is deleted automatically; each deletion needs your confirmation and is audited." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Largest files">
          {!usage ? <Unavailable /> : usage.largest.length === 0 ? <Unavailable title="No files stored." /> : (
            <ul className="divide-y divide-[#F3EEE6] text-[13px]">
              {usage.largest.map(f => (
                <li key={f.bucket + f.name} className="flex flex-wrap justify-between gap-2 py-2">
                  <span className="min-w-0 break-all font-mono text-[12px]">{f.bucket}/{f.name}</span>
                  <span className="text-ink-soft">{bytes(Number(f.bytes))} · {ist(f.created_at, false)}{new Date(f.created_at).getTime() < yearAgo ? ' · over a year old' : ''}</span>
                </li>
              ))}
            </ul>
          )}
          <DataNote>Large profile photos are normal; members upload phone photos. Files here are shown for review only.</DataNote>
        </Section>
        <Section title="Orphaned photo files" description="In the profile-photos bucket but not referenced by any photo record (any status)">
          {!usage ? <Unavailable /> : usage.orphans.length === 0 ? <Unavailable title="No orphaned files — every stored photo belongs to a record." /> : (
            <OrphanList
              canDelete={can(session, 'manage_settings')}
              files={usage.orphans.map(o => ({ name: o.name, size: bytes(Number(o.bytes)), created: ist(o.created_at, false) }))}
            />
          )}
          <DataNote>Rejected and deleted photos keep their record, so they are not listed as orphans. The server re-checks each file before deleting it.</DataNote>
        </Section>
      </div>
    </>
  )
}
