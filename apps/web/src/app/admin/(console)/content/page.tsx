import Link from 'next/link'
import { Badge, DataNote, PageHeader, Section, fmt } from '@/components/admin/ui'
import { requireAdminPage } from '@/lib/adminAuth'
import { getEventPeriods } from '@/lib/adminData'
import { createAdminClient } from '@/lib/supabase/server'
import { FESTIVALS } from '@/lib/festivals'

export const metadata = { title: 'Content' }
export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  await requireAdminPage('view')
  const admin = await createAdminClient()
  const [posts, ev] = await Promise.all([
    admin.from('blog_posts').select('status, featured'),
    getEventPeriods(),
  ])
  const rows = (posts.data ?? []) as Array<{ status: string; featured: boolean }>
  const n = (s: string) => rows.filter(r => r.status === s).length
  const plays = ev?.byKey['song_played'] ?? {}

  return (
    <>
      <PageHeader eyebrow="Content" title="Content"
        description="Journal articles are managed here in the console. Festival guides and their song lists are part of the website’s code today." />

      <Section title="Mithila Jodi Journal" actions={<Link href="/admin/blog/new" className="rounded-lg bg-maroon px-3.5 py-2 text-[13px] font-medium text-white">New article</Link>}>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13.5px]">
          <span><strong className="tabular-nums">{fmt(n('published'))}</strong> published</span>
          <span><strong className="tabular-nums">{fmt(n('draft'))}</strong> drafts</span>
          <span><strong className="tabular-nums">{fmt(n('archived'))}</strong> unpublished</span>
          <span><strong className="tabular-nums">{fmt(rows.filter(r => r.featured).length)}</strong> featured</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
          <Link href="/admin/blog" className="rounded-lg border border-[#E8E1D5] px-3 py-1.5 hover:border-[#CDBFA6]">All articles →</Link>
          <Link href="/admin/blog/categories" className="rounded-lg border border-[#E8E1D5] px-3 py-1.5 hover:border-[#CDBFA6]">Categories →</Link>
        </div>
        <DataNote>The article editor covers draft / publish / unpublish, featured, category, SEO title, meta description, cover (OG) image and publish date. Articles are written in Markdown and rendered without raw HTML. “Updated” is shown on the site only when an article was genuinely revised.</DataNote>
      </Section>

      <Section title="Festivals & festival songs" className="mt-4" description="Defined in code (lib/festivals.ts). Adding or editing a festival or song is a code change for now.">
        <div className="-mx-4 overflow-x-auto sm:-mx-5">
          <table className="w-full min-w-[640px] text-[13.5px]">
            <thead><tr className="border-b border-[#EFE9DF] text-left text-[11.5px] uppercase tracking-wide text-ink-soft">
              <th className="px-5 py-2 font-semibold">Festival</th><th className="px-3 py-2 font-semibold">Season</th><th className="px-3 py-2 text-right font-semibold">Songs</th><th className="px-3 py-2 text-right font-semibold">Plays (30 d)</th><th className="px-5 py-2 font-semibold">Pages</th>
            </tr></thead>
            <tbody>
              {FESTIVALS.map(f => (
                <tr key={f.slug} className="border-b border-[#F3EEE6] last:border-0">
                  <td className="px-5 py-2 font-medium">{f.name} {f.uniquelyMithila && <Badge tone="info">Mithila</Badge>}</td>
                  <td className="px-3 py-2 text-ink-soft">{f.season}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{f.songs.length}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(plays[f.slug]?.d30 ?? 0)}</td>
                  <td className="px-5 py-2">
                    <a href={`/festivals/${f.slug}`} target="_blank" rel="noopener" className="text-maroon hover:underline">Guide ↗</a>
                    {f.songs.length > 0 && <> · <a href={`/festival-songs/${f.slug}`} target="_blank" rel="noopener" className="text-maroon hover:underline">Songs ↗</a></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DataNote>
          Moving festivals and songs into the database would let you add, edit, feature and remove them here without a deployment — it is a contained follow-up (a songs table, an editor, and the public pages reading from it). It was not done in this release so the live festival pages are not put at risk.
        </DataNote>
      </Section>
    </>
  )
}
