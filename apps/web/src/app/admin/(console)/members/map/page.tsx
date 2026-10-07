import { IndiaTileMap } from '@/components/admin/IndiaTileMap'
import { DataNote, PageHeader, Section, Unavailable, fmt } from '@/components/admin/ui'
import { getGeo } from '@/lib/adminData'
import { requireAdminPage } from '@/lib/adminAuth'

export const metadata = { title: 'Member map' }
export const dynamic = 'force-dynamic'

export default async function MemberMapPage() {
  await requireAdminPage('view')
  const geo = await getGeo()
  const located = geo ? geo.total - geo.no_location : 0

  return (
    <>
      <PageHeader
        eyebrow="Members"
        title="Where members are"
        description="Members by the state of their current location. Aggregated counts only — never an address, and never below city."
      />
      <Section title="India" description={geo ? `${fmt(located)} of ${fmt(geo.total)} profiles have a location · ${fmt(geo.states.length)} states and UTs` : undefined}>
        {geo ? <IndiaTileMap states={geo.states} /> : <Unavailable>Member locations could not be loaded.</Unavailable>}
        <DataNote>Each square is one state or union territory, placed roughly where it lies; squares are equal so small states stay readable.</DataNote>
      </Section>

      {geo && geo.states.length > 0 && (
        <Section title="All states" className="mt-4">
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full min-w-[640px] text-[13.5px]">
              <thead>
                <tr className="border-b border-[#EFE9DF] text-left text-[11.5px] uppercase tracking-wide text-ink-soft">
                  <th className="px-5 py-2 font-semibold">State</th>
                  {['Members', 'Female', 'Male', 'New (30 d)', 'Active (30 d)'].map(h => <th key={h} className="px-3 py-2 text-right font-semibold">{h}</th>)}
                  <th className="px-5 py-2 font-semibold">Main cities</th>
                </tr>
              </thead>
              <tbody>
                {geo.states.map(s => (
                  <tr key={s.state} className="border-b border-[#F3EEE6] last:border-0">
                    <td className="px-5 py-2 font-medium">{s.state}</td>
                    {[s.total, s.female, s.male, s.new_30d, s.active_30d].map((v, i) => <td key={i} className="px-3 py-2 text-right tabular-nums">{fmt(Number(v))}</td>)}
                    <td className="px-5 py-2 text-ink-soft">{s.cities?.map(c => c.city).join(', ') ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </>
  )
}
