import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminApi, audit } from '@/lib/adminAuth'
import { approveAccount, rejectAccount } from '@/lib/approval'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET  ?status=pending|approved|rejected   accounts with that approval status, newest first
 * POST { accountId, action: 'approve'|'reject', reason? }   (reason required to reject)
 */
export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi('moderate'); if (error) return error
  const status = request.nextUrl.searchParams.get('status') ?? 'pending'
  if (!['pending', 'approved', 'rejected'].includes(status)) return NextResponse.json({ ok: false, message: 'Bad status' }, { status: 400 })
  const admin = await createAdminClient()
  const { data: accts, error: qErr } = await admin.from('accounts')
    .select('id, mobile, created_at, account_status, approval_status, approval_updated_at')
    .eq('approval_status', status).is('deleted_at', null).neq('mobile', '0000000000')
    .order(status === 'pending' ? 'created_at' : 'approval_updated_at', { ascending: status === 'pending' }).limit(100)
  if (qErr) return NextResponse.json({ ok: false, message: qErr.code === '42703' ? 'Run migration 20261112000001 first.' : qErr.message }, { status: 503 })
  const ids = (accts ?? []).map((a: any) => a.id)
  const [{ data: profiles }, { data: history }] = await Promise.all([
    ids.length ? admin.from('profiles').select('id, account_id, first_name, last_name, gender, dob, profile_for, current_loc_id, self_gotra, mool, gram, about_me, profile_status, profile_complete, created_at').in('account_id', ids).is('deleted_at', null) : { data: [] },
    ids.length ? admin.from('account_approvals').select('account_id, from_status, to_status, reason, created_at').in('account_id', ids).order('created_at', { ascending: false }) : { data: [] },
  ])
  const pids = (profiles ?? []).map((p: any) => p.id)
  const { data: photos } = pids.length ? await admin.from('profile_photos').select('profile_id, status').in('profile_id', pids).neq('status', 'deleted') : { data: [] }
  const rows = (accts ?? []).map((a: any) => {
    const p = (profiles ?? []).find((x: any) => x.account_id === a.id) ?? null
    const ph = (photos ?? []).filter((x: any) => p && x.profile_id === p.id)
    return {
      ...a,
      mobile: a.mobile ? a.mobile.slice(0, 2) + '••••' + a.mobile.slice(-4) : null,
      profile: p,
      photos: { total: ph.length, approved: ph.filter((x: any) => x.status === 'approved').length, pending: ph.filter((x: any) => x.status === 'pending_moderation').length },
      history: (history ?? []).filter((h: any) => h.account_id === a.id),
    }
  })
  return NextResponse.json({ ok: true, rows })
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAdminApi('moderate'); if (error) return error
  const body = await request.json().catch(() => null) as any
  const accountId = typeof body?.accountId === 'string' ? body.accountId : ''
  const action = body?.action
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : ''
  if (!accountId || !['approve', 'reject'].includes(action)) return NextResponse.json({ ok: false, message: 'accountId and action are required' }, { status: 400 })
  if (action === 'reject' && !reason) return NextResponse.json({ ok: false, message: 'Please give a reason for rejecting.' }, { status: 400 })
  const admin = await createAdminClient()
  const r = action === 'approve' ? await approveAccount(admin, accountId, session.id, reason || null) : await rejectAccount(admin, accountId, session.id, reason)
  if (!r.ok) return NextResponse.json({ ok: false, message: r.message }, { status: r.status })
  await audit(session.id, action === 'approve' ? 'account_approved' : 'account_rejected', { type: 'account', id: accountId }, { reason: reason || null }, request)
  return NextResponse.json({ ok: true, ...('journey' in r ? { journey: r.journey } : {}) })
}
