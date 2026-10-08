import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AccountBadge, Badge, PageHeader, Section, Unavailable, ago, fmt, ist } from '@/components/admin/ui'
import { MemberActions } from '@/components/admin/MemberActions'
import { formatMobile } from '@/components/admin/format'
import { can, requireAdminPage } from '@/lib/adminAuth'
import { createAdminClient } from '@/lib/supabase/server'
import { getCommunityLabels, labelFor } from '@/lib/communityLabels'
import { formatPartnerPreferences } from '@/lib/partnerPreferences'
import { isNoExpiry } from '@/lib/digitalProfile'
import { SITE_URL } from '@/lib/constants'
import { getOnboardingState, ONBOARDING_FIELDS } from '@/lib/onboarding'

export const metadata = { title: 'Member' }
export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */

const humanize = (v: string | null | undefined) => (v ? v.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : null)

function Facts({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  const shown = rows.filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (shown.length === 0) return <p className="text-[13px] text-ink-soft">Nothing filled in.</p>
  return (
    <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
      {shown.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-[11.5px] uppercase tracking-wide text-ink-soft">{k}</dt>
          <dd className="mt-0.5 break-words text-[13.5px] text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPage('view')
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const admin = await createAdminClient()

  const { data: account } = await admin
    .from('accounts')
    .select('id, role, mobile, mobile_verified, email, email_verified, account_status, status_reason, created_at, deleted_at, locked_until, is_demo')
    .eq('id', id)
    .maybeSingle()
  if (!account || account.role !== 'user' || account.mobile === '0000000000') notFound()

  const { data: profile } = await admin.from('profiles').select('*').eq('account_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle()
  const onboarding = await getOnboardingState(admin, id)
  const p: any = profile

  const [labels, sessions, locs, prefsRow, photos, shares, sent, received, convs, msgs, biodata, activity, views] = await Promise.all([
    getCommunityLabels(admin),
    admin.from('account_sessions').select('created_at, last_seen, revoked_at, expires_at').eq('account_id', id).order('created_at', { ascending: false }).limit(200),
    p ? admin.from('india_locations').select('id, name_en').in('id', [p.native_place_id, p.current_loc_id, p.job_loc_id].filter(Boolean)) : Promise.resolve({ data: [] }),
    p ? admin.from('profile_preferences').select('*').eq('profile_id', p.id).maybeSingle() : Promise.resolve({ data: null }),
    p ? admin.from('profile_photos').select('status').eq('profile_id', p.id) : Promise.resolve({ data: [] }),
    p ? admin.from('profile_shares').select('id, label, created_at, expires_at, revoked_at, view_count, last_viewed_at').eq('profile_id', p.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    p ? admin.from('interests').select('status').eq('from_profile', p.id) : Promise.resolve({ data: [] }),
    p ? admin.from('interests').select('status').eq('to_profile', p.id) : Promise.resolve({ data: [] }),
    p ? admin.rpc('admin_member_conversations').or(`profile_a.eq.${p.id},profile_b.eq.${p.id}`).select('id') : Promise.resolve({ data: [] }),
    p ? admin.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', p.id).is('deleted_at', null) : Promise.resolve({ count: 0 }),
    p ? admin.from('biodata_generations').select('id', { count: 'exact', head: true }).eq('profile_id', p.id) : Promise.resolve({ count: 0 }),
    admin.from('member_activity').select('kind, n').eq('account_id', id),
    admin.from('notifications').select('id', { count: 'exact', head: true }).eq('account_id', id).eq('type', 'profile_viewed'),
  ])

  const locName = new Map(((locs as any).data ?? []).map((l: any) => [l.id, l.name_en]))
  const prefs = p ? await formatPartnerPreferences(admin, (prefsRow as any).data) : null
  const sess = (sessions.data ?? []) as any[]
  const now = Date.now()
  const lastLogin = sess[0]?.created_at ?? null
  const lastActive = sess.reduce<string | null>((m, s) => { const t = s.last_seen ?? s.created_at; return !m || t > m ? t : m }, null)
  const activeSessions = sess.filter(s => !s.revoked_at && new Date(s.expires_at).getTime() > now).length
  const photoCounts = ((photos as any).data ?? []).reduce((a: Record<string, number>, r: any) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {})
  const shareRows = ((shares as any).data ?? []) as any[]
  const liveShares = shareRows.filter(s => !s.revoked_at && (isNoExpiry(s.expires_at) || new Date(s.expires_at).getTime() > now))
  const shareIds = shareRows.map(s => s.id)
  const { data: opens } = shareIds.length
    ? await admin.from('profile_share_opens').select('visitor').in('share_id', shareIds).limit(50000)
    : { data: [] as any[] }
  const count = (rows: any[], status?: string) => rows.filter(r => !status || r.status === status).length
  const act = Object.fromEntries((((activity as any).data ?? []) as any[]).reduce((m: Map<string, number>, r: any) => m.set(r.kind, (m.get(r.kind) ?? 0) + r.n), new Map()))
  const name = p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : 'No profile yet'
  const ageYears = p?.dob ? Math.floor((now - new Date(p.dob).getTime()) / (365.25 * 86_400_000)) : null

  return (
    <>
      <p className="mb-3 text-[13px]"><Link href="/admin/members" className="text-ink-soft hover:text-ink">← All members</Link></p>
      <PageHeader
        eyebrow="Member"
        title={name}
        description={
          <span className="flex flex-wrap items-center gap-1.5">
            <AccountBadge status={account.account_status} />
            {p && <Badge>{`profile ${humanize(p.profile_status)?.toLowerCase()}`}</Badge>}
            {p && <Badge tone={p.discoverable ? 'good' : 'neutral'}>{p.discoverable ? 'visible in search' : 'hidden from search'}</Badge>}
            {!onboarding.complete && (
              <span className="text-[12.5px]">· joining not finished — missing {onboarding.missing.map(m => ONBOARDING_FIELDS[m]).join(', ')}</span>
            )}
            {account.is_demo && <Badge tone="info">demo</Badge>}
            {account.status_reason && <span className="text-[12.5px]">· {account.status_reason}</span>}
          </span>
        }
        actions={p && can(session, 'manage_members') ? <Link href={`/admin/profiles/${p.id}`} className="rounded-lg border border-[#DDD3C2] bg-white px-3.5 py-2 text-[13.5px] font-medium hover:border-[#BFAF95]">Edit profile & photos</Link> : undefined}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Section title="Profile">
            {!p ? <Unavailable title="This member has not created a profile yet." /> : (
              <div className="space-y-5">
                <Facts rows={[
                  ['Gender', humanize(p.gender)], ['Age', ageYears ? `${ageYears} years` : null], ['Height', p.height_cm ? `${p.height_cm} cm` : null],
                  ['Marital status', labelFor(labels, 'marital_status', p.marital_status) ?? humanize(p.marital_status)],
                  ['Profile for', humanize(p.profile_for)], ['Mother tongue', labelFor(labels, 'mother_tongue', p.mother_tongue) ?? humanize(p.mother_tongue)],
                  ['Current location', locName.get(p.current_loc_id) as string], ['Native place', locName.get(p.native_place_id) as string],
                ]} />
                {p.about_me && <div><p className="text-[11.5px] uppercase tracking-wide text-ink-soft">About</p><p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{p.about_me}</p></div>}
                <div>
                  <p className="mb-2 text-[12.5px] font-semibold text-ink">Community & roots</p>
                  <Facts rows={[
                    ['Religion', labelFor(labels, 'religion', p.religion)], ['Caste', labelFor(labels, 'caste', p.caste)], ['Sub-caste', labelFor(labels, 'sub_caste', p.sub_caste)],
                    ['Gotra', labelFor(labels, 'gotra', p.self_gotra)], ['Maternal gotra', labelFor(labels, 'gotra', p.maternal_gotra)],
                    ['Mool', labelFor(labels, 'mool', p.mool)], ['Gram', p.gram],
                  ]} />
                </div>
                <div>
                  <p className="mb-2 text-[12.5px] font-semibold text-ink">Education & career</p>
                  <Facts rows={[
                    ['Degree', [p.degree, p.specialization].filter(Boolean).join(', ')], ['Institution', p.institution], ['Education', p.education_detail],
                    ['Job title', p.job_title], ['Profession', p.profession_detail], ['Employer', p.employer], ['Job location', locName.get(p.job_loc_id) as string],
                  ]} />
                </div>
                <div>
                  <p className="mb-2 text-[12.5px] font-semibold text-ink">Lifestyle & family</p>
                  <Facts rows={[
                    ['Diet', humanize(p.diet)], ['Smoking', humanize(p.smoking)], ['Drinking', humanize(p.drinking)], ['Marriage timeline', humanize(p.marriage_timeline)],
                    ['Family type', humanize(p.family_type)], ['Family values', humanize(p.family_values)], ['Managed by', humanize(p.managed_by)],
                  ]} />
                  {p.family_introduction && <p className="mt-2 whitespace-pre-wrap text-[13.5px] text-ink">{p.family_introduction}</p>}
                </div>
                <div>
                  <p className="mb-2 text-[12.5px] font-semibold text-ink">Partner preferences</p>
                  {prefs ? <Facts rows={[
                    ['Age', prefs.ageRange], ['Looking for', prefs.lookingFor], ['Community', prefs.community], ['Marital status', prefs.maritalStatus],
                    ['Education', prefs.education], ['Profession', prefs.profession], ['Location', prefs.location], ['Diet', prefs.diet], ['Timeline', prefs.marriageTimeline],
                  ]} /> : <p className="text-[13px] text-ink-soft">No preferences stated.</p>}
                </div>
              </div>
            )}
          </Section>

          <Section title="Activity" description="Counted from interests, conversations and messages. Astrology, biodata-maker and invitation use is anonymous by design, so it is not attributed to members.">
            <Facts rows={[
              ['Profile views received', `${fmt(views.count ?? 0)} (notified, one per viewer per week)`],
              ['Profiles opened by this member', fmt(act.profile_view ?? 0)],
              ['Searches (requests)', fmt(act.search ?? 0)],
              ['Interests sent', p ? `${fmt(count((sent as any).data ?? []))} · ${fmt(count((sent as any).data ?? [], 'accepted'))} accepted` : null],
              ['Interests received', p ? `${fmt(count((received as any).data ?? []))} · ${fmt(count((received as any).data ?? [], 'accepted'))} accepted` : null],
              ['Matches (conversations)', fmt(((convs as any).data ?? []).length)],
              ['Messages sent', fmt((msgs as any).count ?? 0)],
              ['Member biodata generated', fmt((biodata as any).count ?? 0)],
            ]} />
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Admin actions">
            <MemberActions
              accountId={account.id}
              status={account.account_status}
              hasProfile={!!p}
              discoverable={!!p?.discoverable}
              liveLinks={liveShares.length}
              perms={{ moderate: can(session, 'moderate'), manage: can(session, 'manage_members'), del: can(session, 'delete_members') }}
              mobileMasked={`••••••${account.mobile.slice(-4)}`}
              mobileFull={can(session, 'manage_members') ? formatMobile(account.mobile) : undefined}
            />
          </Section>

          <Section title="Account">
            <Facts rows={[
              ['Registered', ist(account.created_at)],
              ['Last sign-in', lastLogin ? ist(lastLogin) : 'Never'],
              ['Last active', ago(lastActive)],
              ['Signed-in devices', fmt(activeSessions)],
              ['Mobile', account.mobile_verified ? 'Verified by OTP' : 'Not verified'],
              ['Email', account.email ? (account.email_verified ? 'Set · verified' : 'Set · not verified') : 'Not set'],
              ['Profile completion', p ? `${p.profile_complete ?? 0}%` : null],
              ['Photos', p ? `${fmt(photoCounts.approved ?? 0)} approved · ${fmt(photoCounts.pending_moderation ?? 0)} pending · ${fmt(photoCounts.rejected ?? 0)} rejected` : null],
              ['Locked until', account.locked_until && new Date(account.locked_until).getTime() > now ? ist(account.locked_until) : null],
              ['Deleted', account.deleted_at ? ist(account.deleted_at) : null],
            ]} />
          </Section>

          <Section title="Digital Profile">
            {!p ? <Unavailable title="No profile, so no Digital Profile." /> : shareRows.length === 0 ? <Unavailable title="No Digital Profile link yet." /> : (
              <>
                <Facts rows={[
                  ['Links', `${fmt(liveShares.length)} live · ${fmt(shareRows.length - liveShares.length)} revoked or expired`],
                  ['Views', `${fmt((opens ?? []).length)} opens · ${fmt(new Set((opens ?? []).map((o: any) => o.visitor)).size)} unique visitors`],
                  ['First created', ist(shareRows[shareRows.length - 1].created_at, false)],
                  ['Last opened', ago(shareRows.map(s => s.last_viewed_at).filter(Boolean).sort().pop() ?? null)],
                ]} />
                <ul className="mt-3 divide-y divide-[#F3EEE6] text-[12.5px]">
                  {shareRows.slice(0, 6).map(s => {
                    const live = !s.revoked_at && (isNoExpiry(s.expires_at) || new Date(s.expires_at).getTime() > now)
                    return (
                      <li key={s.id} className="flex items-center justify-between gap-2 py-1.5">
                        <span className="min-w-0 truncate">{s.label || 'Link'} · {ist(s.created_at, false)}</span>
                        <span className="shrink-0">{live ? <Badge tone="good">live</Badge> : <Badge>{s.revoked_at ? 'revoked' : 'expired'}</Badge>}</span>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-2 text-[11.5px] text-ink-soft">Link addresses are not shown; members share them privately. Public base: {SITE_URL}/p/…</p>
              </>
            )}
          </Section>
        </div>
      </div>
    </>
  )
}
