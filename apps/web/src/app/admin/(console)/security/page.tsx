import Link from 'next/link'
import { RevokeSession } from '@/components/admin/RevokeSession'
import { Badge, DataNote, PageHeader, Section, StatGrid, StatTile, Unavailable, ago, fmt, ist } from '@/components/admin/ui'
import { SENSITIVE, actionLabel, actorLabel } from '@/components/admin/format'
import { ROLE_LABEL, requireAdminPage } from '@/lib/adminAuth'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata = { title: 'Security' }
export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */

function device(ua: string | null): string {
  if (!ua) return 'Unknown device'
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac OS/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Other'
  const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  return `${br} on ${os}`
}

export default async function SecurityPage() {
  const session = await requireAdminPage('security')
  const admin = await createAdminClient()
  const nowIso = new Date().toISOString()
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString()
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const { data: admins } = await admin.from('accounts').select('id, role, email, mobile, account_status, created_at, locked_until, failed_login_attempts').in('role', ['admin', 'moderator'])
  const adminIds = (admins ?? []).map((a: any) => a.id)
  const [sessions, logins, failed, sensitive] = await Promise.all([
    adminIds.length ? admin.from('account_sessions').select('id, account_id, created_at, last_seen, user_agent, ip_address, device_hash').in('account_id', adminIds).is('revoked_at', null).gt('expires_at', nowIso).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    admin.from('admin_audit_logs').select('id, actor_id, created_at, ip_address, user_agent, payload, accounts!actor_id(role, mobile, email)').eq('action', 'admin_login').order('created_at', { ascending: false }).limit(15),
    admin.from('admin_audit_logs').select('id, actor_id, action, created_at, ip_address, payload, accounts!actor_id(role, mobile, email)').in('action', ['admin_login_failed', 'admin_login_blocked']).gte('created_at', monthAgo).order('created_at', { ascending: false }).limit(30),
    admin.from('admin_audit_logs').select('id, actor_id, action, target_type, created_at, accounts!actor_id(role, mobile, email)').in('action', [...SENSITIVE]).order('created_at', { ascending: false }).limit(15),
  ])
  const failed24 = ((failed.data ?? []) as any[]).filter(f => f.created_at >= dayAgo).length
  const locked = (admins ?? []).filter((a: any) => a.locked_until && a.locked_until > nowIso)
  const memberSessions = ((sessions.data ?? []) as any[]).filter(s => s.device_hash !== 'admin-console').length

  const signals: string[] = []
  if (failed24 >= 3) signals.push(`${failed24} failed admin sign-ins in the last 24 hours.`)
  if (locked.length) signals.push(`${locked.length} admin account(s) currently locked after repeated failures.`)
  if (memberSessions) signals.push(`${memberSessions} admin session(s) were opened through the member login (30-day sessions). Prefer the Admin Console sign-in (12-hour sessions).`)
  if ((admins ?? []).some((a: any) => !a.email)) signals.push('An admin account has no email set — set one in Settings to use email sign-in.')

  return (
    <>
      <PageHeader eyebrow="Security" title="Admin access"
        description="Who can administer Mithila Jodi, where they are signed in, and anything that looks wrong."
        actions={<Link href="/admin/security/audit" className="rounded-lg border border-[#DDD3C2] bg-white px-3.5 py-2 text-[13.5px] font-medium">Audit log →</Link>} />
      <StatGrid>
        <StatTile label="Administrators" value={fmt((admins ?? []).filter((a: any) => a.role === 'admin').length)} sub={`${fmt((admins ?? []).filter((a: any) => a.role === 'moderator').length)} moderators`} />
        <StatTile label="Active admin sessions" value={fmt((sessions.data ?? []).length)} />
        <StatTile label="Failed sign-ins (24 h)" value={fmt(failed24)} tone={failed24 >= 3 ? 'attention' : undefined} sub={`${fmt((failed.data ?? []).length)} in 30 days`} />
        <StatTile label="Locked admin accounts" value={fmt(locked.length)} tone={locked.length ? 'attention' : undefined} />
      </StatGrid>

      <Section title="Signals" className="mt-4">
        {signals.length === 0 ? <p className="text-[13.5px] text-ink">No suspicious activity detected.</p> : (
          <ul className="space-y-1.5 text-[13.5px]">{signals.map(s => <li key={s} className="flex gap-2"><span aria-hidden="true" className="text-[#A87D24]">▲</span>{s}</li>)}</ul>
        )}
      </Section>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Section title="Admin roles" description="Roles are set on the account in the database; Admin has every permission, Moderator reviews and moderates.">
          <ul className="divide-y divide-[#F3EEE6] text-[13.5px]">
            {(admins ?? []).map((a: any) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{a.email ?? `••••${a.mobile.slice(-4)}`} <span className="text-[12px] text-ink-soft">· since {ist(a.created_at, false)}</span></span>
                <span className="flex gap-1.5"><Badge tone="info">{ROLE_LABEL[a.role]}</Badge>{a.account_status !== 'active' && <Badge tone="bad">{a.account_status}</Badge>}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Active admin sessions">
          {(sessions.data ?? []).length === 0 ? <Unavailable title="No active sessions." /> : (
            <ul className="divide-y divide-[#F3EEE6] text-[13px]">
              {((sessions.data ?? []) as any[]).map(s => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    {device(s.user_agent)} {s.device_hash === 'admin-console' ? <Badge tone="good">console</Badge> : <Badge tone="warn">member login</Badge>}
                    <span className="block text-[12px] text-ink-soft">Signed in {ist(s.created_at)} · active {ago(s.last_seen ?? s.created_at)}{s.ip_address ? ` · ${s.ip_address}` : ''}</span>
                  </span>
                  <RevokeSession id={s.id} current={s.id === session.session_id} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Sign-in history" description="Successful console sign-ins">
          {(logins.data ?? []).length === 0 ? <Unavailable title="No console sign-ins recorded yet." /> : (
            <ul className="divide-y divide-[#F3EEE6] text-[13px]">
              {((logins.data ?? []) as any[]).map(l => (
                <li key={l.id} className="py-1.5">{actorLabel(l)} <span className="text-ink-soft">· {ist(l.created_at)} · {device(l.user_agent)}{l.ip_address ? ` · ${l.ip_address}` : ''}</span></li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Failed sign-ins (30 days)" description="Attempts against admin accounts">
          {(failed.data ?? []).length === 0 ? <p className="text-[13.5px] text-ink">None.</p> : (
            <ul className="divide-y divide-[#F3EEE6] text-[13px]">
              {((failed.data ?? []) as any[]).map(f => (
                <li key={f.id} className="py-1.5">{actionLabel(f.action)} · {actorLabel(f)} <span className="text-ink-soft">· {ist(f.created_at)}{f.ip_address ? ` · ${f.ip_address}` : ''}</span></li>
              ))}
            </ul>
          )}
          <DataNote>Attempts with an unknown email or mobile, or a member’s credentials, are refused with the same message and are not stored, so the sign-in page cannot be used to discover accounts.</DataNote>
        </Section>
      </div>

      <Section title="Recent sensitive actions" className="mt-4" actions={<Link href="/admin/security/audit" className="text-[12.5px] font-medium text-maroon hover:underline">All →</Link>}>
        {(sensitive.data ?? []).length === 0 ? <p className="text-[13.5px] text-ink">None yet.</p> : (
          <ul className="divide-y divide-[#F3EEE6] text-[13px]">
            {((sensitive.data ?? []) as any[]).map(a => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-1.5"><span>{actionLabel(a.action)}</span><span className="text-ink-soft">{actorLabel(a)} · {ago(a.created_at)}</span></li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}
