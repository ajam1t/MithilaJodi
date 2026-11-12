import Link from 'next/link'
import { requireAdminPage } from '@/lib/adminAuth'
import { createAdminClient } from '@/lib/supabase/server'
import { DEACTIVATION_REASONS } from '@/lib/deactivation'

/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic'

const when = (s: string) => new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

/** Why members deactivated (Settings → Deactivate asks every time). Newest first. */
export default async function DeactivationsPage() {
  await requireAdminPage('view')
  const admin = await createAdminClient()
  const { data: rows, error } = await admin.from('account_deactivations').select('*').order('created_at', { ascending: false }).limit(200)
  const ids = [...new Set((rows ?? []).map((r: any) => r.profile_id).filter(Boolean))]
  const { data: profiles } = ids.length ? await admin.from('profiles').select('id, first_name, last_name, gender').in('id', ids) : { data: [] }
  const name = new Map((profiles ?? []).map((p: any) => [p.id, [p.first_name, p.last_name].filter(Boolean).join(' ')]))
  const label = (v: string) => DEACTIVATION_REASONS.find(r => r.value === v)?.en ?? v
  const tally = DEACTIVATION_REASONS.map(r => ({ ...r, n: (rows ?? []).filter((x: any) => x.reason === r.value).length }))

  return (
    <div className="max-w-5xl">
      <h1 className="font-serif text-2xl text-ink mb-1">Deactivations</h1>
      <p className="text-sm text-ink-soft mb-5">Every self-deactivation, with the reason and feedback the member gave. Data is kept; nothing here deletes anything.</p>
      {error ? <p className="card p-4 text-sm text-error">{error.code === '42P01' ? 'Run migration 20261112000001 first.' : error.message}</p> : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {tally.map(t => <div key={t.value} className="card p-3"><p className="font-serif text-2xl text-maroon">{t.n}</p><p className="text-[12.5px] text-ink-soft">{t.en}</p></div>)}
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-paper-3 text-left text-ink-soft"><th className="p-3">Member</th><th className="p-3">Reason</th><th className="p-3">Feedback</th><th className="p-3">Previous status</th><th className="p-3">Date</th></tr></thead>
              <tbody>
                {(rows ?? []).length === 0 && <tr><td colSpan={5} className="p-4 text-ink-soft">No deactivations recorded yet.</td></tr>}
                {(rows ?? []).map((r: any) => (
                  <tr key={r.id} className="border-b border-paper-3 align-top">
                    <td className="p-3"><Link href={`/admin/members/${r.account_id}`} className="text-maroon hover:underline">{name.get(r.profile_id) || 'Member'}</Link></td>
                    <td className="p-3">{label(r.reason)}{r.other_reason ? <span className="block text-ink-soft">“{r.other_reason}”</span> : null}</td>
                    <td className="p-3 max-w-xs whitespace-pre-wrap text-ink-soft">{r.feedback ?? '—'}</td>
                    <td className="p-3">{r.previous_status ?? '—'}</td>
                    <td className="p-3 whitespace-nowrap">{when(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
