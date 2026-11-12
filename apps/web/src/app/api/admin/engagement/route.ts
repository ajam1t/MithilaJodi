import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminApi, audit } from '@/lib/adminAuth'
import { getAutomation, runDue, sendNext, renderMessage, absoluteUrl } from '@/lib/engagement/journey'
import { getSetting } from '@/lib/siteSettings'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Member Engagement Manager.
 *  GET                                   stats, the messages, automation settings
 *  GET ?member=<accountId>               one member's journey and delivery history
 *  POST { op: 'save_message', id?, day, sort_order, title, body, feature_url, enabled }   edit or add
 *  POST { op: 'settings', paused?, send_hour?, send_minute? }
 *  POST { op: 'retry', accountId }       send this member's next due/failed message now
 *  POST { op: 'run' }                    send everything that is due now
 *  POST { op: 'preview', body, feature_url }
 */
const count = async (q: any) => { const { count: c } = await q; return c ?? 0 }

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi('view'); if (error) return error
  const admin = await createAdminClient()
  const member = request.nextUrl.searchParams.get('member')
  if (member) {
    const [{ data: j }, { data: log }, { data: acct }] = await Promise.all([
      admin.from('member_onboarding').select('*').eq('account_id', member).maybeSingle(),
      admin.from('onboarding_message_log').select('message_day, delivery_status, sent_at, created_at, attempts, error_details, chat_message_id').eq('account_id', member).order('message_day'),
      admin.from('accounts').select('id, approval_status, account_status').eq('id', member).maybeSingle(),
    ])
    const ids = (log ?? []).map((l: any) => l.chat_message_id).filter(Boolean)
    const { data: reads } = ids.length ? await admin.from('messages').select('id, read_at').in('id', ids) : { data: [] }
    const read = new Map((reads ?? []).map((r: any) => [r.id, r.read_at]))
    return NextResponse.json({ ok: true, journey: j, account: acct, log: (log ?? []).map((l: any) => ({ ...l, read_at: read.get(l.chat_message_id) ?? null })) })
  }
  const { data: messages, error: mErr } = await admin.from('onboarding_messages').select('*').order('sort_order').order('day')
  if (mErr) return NextResponse.json({ ok: false, message: mErr.code === '42P01' ? 'Run migration 20261112000001 first.' : mErr.message }, { status: 503 })
  const now = new Date().toISOString()
  const [enrolled, active, completed, scheduled, sent, failed, delivered, automation, social, { data: recent }] = await Promise.all([
    count(admin.from('member_onboarding').select('account_id', { count: 'exact', head: true })),
    count(admin.from('member_onboarding').select('account_id', { count: 'exact', head: true }).eq('status', 'active')),
    count(admin.from('member_onboarding').select('account_id', { count: 'exact', head: true }).eq('status', 'completed')),
    count(admin.from('member_onboarding').select('account_id', { count: 'exact', head: true }).eq('status', 'active').not('next_scheduled_at', 'is', null)),
    count(admin.from('onboarding_message_log').select('id', { count: 'exact', head: true }).eq('delivery_status', 'sent')),
    count(admin.from('onboarding_message_log').select('id', { count: 'exact', head: true }).eq('delivery_status', 'failed')),
    count(admin.from('messages').select('id', { count: 'exact', head: true }).eq('automated', true).not('read_at', 'is', null)),
    getAutomation(admin),
    getSetting('social_links').catch(() => null),
    admin.from('member_onboarding').select('account_id, profile_id, status, current_day, next_scheduled_at, sequence_started_at, stop_reason').order('sequence_started_at', { ascending: false }).limit(50),
  ])
  const pids = (recent ?? []).map((r: any) => r.profile_id).filter(Boolean)
  const { data: names } = pids.length ? await admin.from('profiles').select('id, first_name, last_name').in('id', pids) : { data: [] }
  const nm = new Map((names ?? []).map((p: any) => [p.id, [p.first_name, p.last_name].filter(Boolean).join(' ')]))
  return NextResponse.json({
    ok: true, now,
    stats: { enrolled, active, completed, scheduled, sent, delivered, failed },
    automation, instagram: (social?.value as any)?.instagram ?? null,
    messages,
    members: (recent ?? []).map((r: any) => ({ ...r, name: nm.get(r.profile_id) ?? '—' })),
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as any
  const op = body?.op
  const { session, error } = await requireAdminApi(op === 'preview' ? 'view' : 'manage_settings'); if (error) return error
  const admin = await createAdminClient()

  if (op === 'preview') {
    const social = await getSetting('social_links').catch(() => null)
    return NextResponse.json({ ok: true, text: renderMessage(String(body.body ?? ''), { name: 'राहुल', link: absoluteUrl(body.feature_url), instagramUrl: (social?.value as any)?.instagram ?? '' }) })
  }
  if (op === 'save_message') {
    const day = Number(body.day), sort = Number(body.sort_order ?? body.day)
    const title = String(body.title ?? '').trim(), text = String(body.body ?? '').trim()
    const url = body.feature_url ? String(body.feature_url).trim() : null
    if (!Number.isInteger(day) || day < 1 || day > 365 || !Number.isInteger(sort) || !title || !text || text.length > 3500 || title.length > 140) {
      return NextResponse.json({ ok: false, message: 'Day, order, title and message are required (message up to 3,500 characters).' }, { status: 400 })
    }
    if (url && !/^\/[^\s]*$|^https:\/\/[^\s]+$/.test(url)) return NextResponse.json({ ok: false, message: 'The link must start with / or https://' }, { status: 400 })
    const row = { day, sort_order: sort, title, body: text, feature_url: url, enabled: body.enabled !== false, updated_at: new Date().toISOString(), updated_by: session.id }
    const q = body.id ? admin.from('onboarding_messages').update(row).eq('id', body.id) : admin.from('onboarding_messages').insert(row)
    const { error: e } = await q
    if (e) return NextResponse.json({ ok: false, message: e.code === '23505' ? `Day ${day} already exists.` : e.message }, { status: 400 })
    await audit(session.id, body.id ? 'engagement_message_edited' : 'engagement_message_added', { type: 'onboarding_message', id: body.id ?? null }, { day, enabled: row.enabled }, request)
    return NextResponse.json({ ok: true })
  }
  if (op === 'settings') {
    const cur = await getAutomation(admin)
    const next = {
      paused: typeof body.paused === 'boolean' ? body.paused : cur.paused,
      send_hour: Number.isInteger(body.send_hour) && body.send_hour >= 0 && body.send_hour <= 23 ? body.send_hour : cur.send_hour,
      send_minute: Number.isInteger(body.send_minute) && body.send_minute >= 0 && body.send_minute <= 59 ? body.send_minute : cur.send_minute,
    }
    const { error: e } = await admin.from('site_settings').upsert({ key: 'onboarding_automation', value: next, updated_at: new Date().toISOString(), updated_by: session.id }, { onConflict: 'key' })
    if (e) return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
    await audit(session.id, 'engagement_settings', null, next, request)
    return NextResponse.json({ ok: true, automation: next })
  }
  if (op === 'retry') {
    if (typeof body.accountId !== 'string') return NextResponse.json({ ok: false, message: 'accountId required' }, { status: 400 })
    const r = await sendNext(admin, body.accountId, { force: true })
    await audit(session.id, 'engagement_retry', { type: 'account', id: body.accountId }, { result: r.status }, request)
    return NextResponse.json({ ok: r.status === 'sent' || r.status === 'completed' || r.status === 'nothing', result: r })
  }
  if (op === 'run') {
    const r = await runDue(admin, 60)
    return NextResponse.json({ ok: true, result: r })
  }
  return NextResponse.json({ ok: false, message: 'Unknown op' }, { status: 400 })
}
