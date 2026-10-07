import Link from 'next/link'
import { DataNote, PageHeader, Section, Unavailable, fmt, ist } from '@/components/admin/ui'
import { actionLabel, actorLabel } from '@/components/admin/format'
import { requireAdminPage } from '@/lib/adminAuth'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata = { title: 'Audit log' }
export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */

const PAGE = 50

/**
 * The append-only record of administrative actions. Read-only here — and the
 * database itself rejects edits or deletions (trigger on admin_audit_logs).
 */
export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ q?: string; target?: string; page?: string }> }) {
  await requireAdminPage('security')
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const q = (sp.q ?? '').trim().replace(/[^a-z_]/gi, '').slice(0, 40)
  const target = (sp.target ?? '').trim()

  const admin = await createAdminClient()
  let query = admin
    .from('admin_audit_logs')
    .select('id, action, target_type, target_id, payload, ip_address, created_at, actor_id, accounts!actor_id(role, mobile, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1)
  if (q) query = query.ilike('action', `%${q}%`)
  if (/^[0-9a-f-]{36}$/i.test(target)) query = query.eq('target_id', target)
  const { data, count, error } = await query
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE))
  const link = (p: number) => `/admin/security/audit?${new URLSearchParams({ ...(q ? { q } : {}), ...(target ? { target } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`

  return (
    <>
      <PageHeader eyebrow="Security" title="Audit log" description="Every administrative action, newest first. Entries cannot be edited or deleted — not from here, and not in the database." />
      <form method="get" className="mb-4 flex flex-wrap gap-2 rounded-xl border border-[#E8E1D5] bg-white p-3">
        <input name="q" defaultValue={q} placeholder="Action contains… (e.g. member, setting, login)" className="min-w-[220px] flex-1 rounded-lg border border-[#DDD3C2] px-3 py-2 text-[13.5px]" aria-label="Filter by action" />
        <input name="target" defaultValue={target} placeholder="Target id (optional)" className="min-w-[220px] rounded-lg border border-[#DDD3C2] px-3 py-2 font-mono text-[12.5px]" aria-label="Filter by target id" />
        <button type="submit" className="rounded-lg bg-maroon px-4 py-2 text-[13.5px] font-medium text-white">Filter</button>
        {(q || target) && <Link href="/admin/security/audit" className="rounded-lg border border-[#DDD3C2] px-4 py-2 text-[13.5px] font-medium">Clear</Link>}
      </form>

      <Section title={`${fmt(count ?? 0)} entries`}>
        {error ? <Unavailable>The audit log could not be loaded. Try again in a moment.</Unavailable> : (data ?? []).length === 0 ? <Unavailable title="No entries match." /> : (
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full min-w-[860px] text-[13px]">
              <thead><tr className="border-b border-[#EFE9DF] text-left text-[11.5px] uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-2 font-semibold">When</th><th className="px-3 py-2 font-semibold">Who</th><th className="px-3 py-2 font-semibold">Action</th><th className="px-3 py-2 font-semibold">Resource</th><th className="px-5 py-2 font-semibold">Details</th>
              </tr></thead>
              <tbody>
                {((data ?? []) as any[]).map(a => (
                  <tr key={a.id} className="border-b border-[#F3EEE6] align-top last:border-0">
                    <td className="whitespace-nowrap px-5 py-2 text-ink-soft">{ist(a.created_at)}</td>
                    <td className="px-3 py-2">{actorLabel(a)}</td>
                    <td className="px-3 py-2"><span className="text-ink">{actionLabel(a.action)}</span><span className="block font-mono text-[11px] text-ink-soft">{a.action}</span></td>
                    <td className="px-3 py-2 text-ink-soft">
                      {a.target_type ?? '—'}
                      {a.target_id && (a.target_type === 'account'
                        ? <Link href={`/admin/members/${a.target_id}`} className="block font-mono text-[11px] text-maroon hover:underline">{a.target_id.slice(0, 8)}…</Link>
                        : <span className="block font-mono text-[11px]">{a.target_id.slice(0, 8)}…</span>)}
                    </td>
                    <td className="max-w-[360px] px-5 py-2"><span className="break-all font-mono text-[11px] text-ink-soft">{a.payload && Object.keys(a.payload).length ? JSON.stringify(a.payload).slice(0, 220) : '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-[13px]">
            <span className="text-ink-soft">Page {page} of {pages}</span>
            <span className="flex gap-2">
              {page > 1 && <Link href={link(page - 1)} className="rounded-lg border border-[#DDD3C2] px-3 py-1.5">← Newer</Link>}
              {page < pages && <Link href={link(page + 1)} className="rounded-lg border border-[#DDD3C2] px-3 py-1.5">Older →</Link>}
            </span>
          </nav>
        )}
        <DataNote>Admin sign-ins, member changes, content and setting changes are recorded with who, what, when and where from.</DataNote>
      </Section>
    </>
  )
}
