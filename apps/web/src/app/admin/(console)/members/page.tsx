import Link from 'next/link'
import { AccountBadge, Badge, PageHeader, Section, Unavailable, ago, fmt, ist } from '@/components/admin/ui'
import { getMembers, getMemberSnapshot, type MemberRow } from '@/lib/adminData'
import { can, requireAdminPage } from '@/lib/adminAuth'
import { formatMobile } from '@/components/admin/format'
import { getCommunityLabels, labelFor } from '@/lib/communityLabels'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata = { title: 'Members' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

const STATUS_OPTIONS: Array<[string, string]> = [
  ['', 'Any status'], ['active', 'Account active'], ['suspended', 'Suspended'], ['banned', 'Banned'],
  ['deactivated', 'Deactivated by member'], ['deleted', 'Deleted'], ['pending_review', 'Profile awaiting review'],
  ['draft', 'Profile in draft'], ['hidden', 'Hidden from search'], ['incomplete', 'Profile incomplete'], ['no_profile', 'No profile yet'],
]
const SORT_OPTIONS: Array<[string, string]> = [
  ['newest', 'Newest first'], ['oldest', 'Oldest first'], ['last_active', 'Recently active'], ['completion', 'Most complete'], ['name', 'Name A–Z'],
]

type SP = { q?: string; gender?: string; status?: string; sort?: string; page?: string }

function age(dob: string | null): number | null {
  if (!dob) return null
  const b = new Date(dob)
  const n = new Date()
  let a = n.getFullYear() - b.getFullYear()
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--
  return a
}

export default async function MembersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await requireAdminPage('view')
  // Admins see full numbers (owner's decision, 2026-10-09); moderators, masked.
  const fullMobile = can(session, 'manage_members')
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const q = (sp.q ?? '').trim().slice(0, 80)
  const [data, snap, labels] = await Promise.all([
    getMembers({ q, gender: sp.gender, status: sp.status, sort: sp.sort, page, pageSize: PAGE_SIZE }),
    getMemberSnapshot(),
    createAdminClient().then(getCommunityLabels),
  ])
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const qs = (p: number) => {
    const u = new URLSearchParams()
    if (q) u.set('q', q)
    if (sp.gender) u.set('gender', sp.gender)
    if (sp.status) u.set('status', sp.status)
    if (sp.sort) u.set('sort', sp.sort)
    if (p > 1) u.set('page', String(p))
    const s = u.toString()
    return `/admin/members${s ? `?${s}` : ''}`
  }
  const community = (r: MemberRow) => [labelFor(labels, 'caste', r.caste), labelFor(labels, 'gotra', r.self_gotra), labelFor(labels, 'mool', r.mool)].filter(Boolean).join(' · ')

  const field = 'rounded-lg border border-[#DDD3C2] bg-white px-3 py-2 text-[13.5px] text-ink outline-none focus:border-maroon'

  return (
    <>
      <PageHeader
        eyebrow="Members"
        title="All members"
        description={snap ? `${fmt(snap.members)} members · ${fmt(snap.profiles)} profiles · ${fmt(snap.active_30d)} active in 30 days · ${fmt(snap.suspended)} suspended or banned` : undefined}
      />

      <form method="get" className="mb-4 grid gap-2 rounded-xl border border-[#E8E1D5] bg-white p-3 sm:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <label className="sr-only" htmlFor="m-q">Search members</label>
        <input id="m-q" name="q" defaultValue={q} placeholder="Name, profile ID, place, gotra, mool, gram, or mobile number" className={field} />
        <select name="gender" defaultValue={sp.gender ?? ''} className={field} aria-label="Gender">
          <option value="">Any gender</option><option value="female">Female</option><option value="male">Male</option>
        </select>
        <select name="status" defaultValue={sp.status ?? ''} className={field} aria-label="Status">
          {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="sort" defaultValue={sp.sort ?? 'newest'} className={field} aria-label="Sort">
          {SORT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button type="submit" className="rounded-lg bg-maroon px-4 py-2 text-[13.5px] font-medium text-white">Search</button>
      </form>

      <Section
        title={data ? `${fmt(data.total)} ${data.total === 1 ? 'member' : 'members'}${q || sp.gender || sp.status ? ' match' : ''}` : 'Members'}
        description={fullMobile ? 'Open a member for their full details and admin actions.' : 'Mobile numbers are masked for moderators. Open a member for more.'}
      >
        {!data ? <Unavailable>The member directory could not be loaded. Try again in a moment.</Unavailable>
          : data.rows.length === 0 ? <Unavailable title="No members match">Try fewer filters, or search by a different word.</Unavailable>
          : (
            <>
              {/* Desktop table */}
              <div className="-mx-4 hidden overflow-x-auto sm:-mx-5 md:block">
                <table className="w-full min-w-[960px] text-[13.5px]">
                  <thead>
                    <tr className="border-b border-[#EFE9DF] text-left text-[11.5px] uppercase tracking-wide text-ink-soft">
                      <th className="px-5 py-2 font-semibold">Member</th>
                      <th className="px-3 py-2 font-semibold">Location</th>
                      <th className="px-3 py-2 font-semibold">Community</th>
                      <th className="px-3 py-2 font-semibold">Profile</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                      <th className="px-3 py-2 font-semibold">Registered</th>
                      <th className="px-3 py-2 font-semibold">Last active</th>
                      <th className="px-5 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map(r => (
                      <tr key={r.account_id} className="border-b border-[#F3EEE6] last:border-0 hover:bg-[#FCFAF6]">
                        <td className="px-5 py-2.5">
                          <Link href={`/admin/members/${r.account_id}`} className="font-medium text-ink hover:text-maroon">{r.name || 'No profile yet'}</Link>
                          <span className="block text-[12px] text-ink-soft">
                            {[r.gender, age(r.dob) ? `${age(r.dob)} yrs` : null].filter(Boolean).join(' · ')}
                            {(r.gender || age(r.dob)) && ' · '}
                            <span className="whitespace-nowrap tabular-nums">{fullMobile && r.mobile ? formatMobile(r.mobile) : `••••${r.mobile_last4}`}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-ink">{r.location ?? <span className="text-ink-soft">—</span>}</td>
                        <td className="max-w-[220px] px-3 py-2.5 text-ink">{community(r) || <span className="text-ink-soft">—</span>}</td>
                        <td className="px-3 py-2.5">
                          {r.profile_id ? (
                            <>
                              <span className="tabular-nums">{r.profile_complete}%</span>
                              <div className="mt-1 h-1 w-20 rounded-full bg-[#F1ECE3]"><div className="h-full rounded-full bg-[#B3424F]" style={{ width: `${r.profile_complete}%` }} /></div>
                            </>
                          ) : <span className="text-ink-soft">—</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            <AccountBadge status={r.account_status} />
                            {r.profile_status && r.profile_status !== 'active' && <Badge>{r.profile_status.replace(/_/g, ' ')}</Badge>}
                            {r.profile_id && r.discoverable === false && <Badge>hidden</Badge>}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-ink-soft">{ist(r.registered_at, false)}</td>
                        <td className="px-3 py-2.5 text-ink-soft">{ago(r.last_active)}</td>
                        <td className="px-5 py-2.5 text-right"><Link href={`/admin/members/${r.account_id}`} className="font-medium text-maroon hover:underline">Open</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <ul className="space-y-2 md:hidden">
                {data.rows.map(r => (
                  <li key={r.account_id}>
                    <Link href={`/admin/members/${r.account_id}`} className="block rounded-lg border border-[#EFE9DF] px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-ink">{r.name || 'No profile yet'}</span>
                        <AccountBadge status={r.account_status} />
                      </div>
                      <p className="mt-0.5 text-[12px] text-ink-soft">{[r.gender, age(r.dob) ? `${age(r.dob)} yrs` : null, r.location].filter(Boolean).join(' · ')}</p>
                      <p className="mt-0.5 text-[12px] text-ink-soft">{community(r) || '—'}</p>
                      <p className="mt-1 text-[11.5px] text-ink-soft">{r.profile_id ? `${r.profile_complete}% complete · ` : ''}active {ago(r.last_active)}</p>
                    </Link>
                  </li>
                ))}
              </ul>

              {pages > 1 && (
                <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-[13px]">
                  <span className="text-ink-soft">Page {page} of {pages}</span>
                  <span className="flex gap-2">
                    {page > 1 && <Link href={qs(page - 1)} className="rounded-lg border border-[#DDD3C2] px-3 py-1.5">← Previous</Link>}
                    {page < pages && <Link href={qs(page + 1)} className="rounded-lg border border-[#DDD3C2] px-3 py-1.5">Next →</Link>}
                  </span>
                </nav>
              )}
            </>
          )}
      </Section>
    </>
  )
}
