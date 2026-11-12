import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAccount, refuseWhileImpersonating } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { SESSION_COOKIE } from '@/lib/constants'
import { cookies } from 'next/headers'
import { refreshPublicShowcase } from '@/lib/showcaseCache'
import { isDeactivationReason } from '@/lib/deactivation'
import { stopJourney } from '@/lib/engagement/journey'

// DELETE /api/account — soft-deactivate the authenticated user's account
export async function DELETE(request: NextRequest) {
  const session = await getSessionAccount()
  const blocked = refuseWhileImpersonating(session)
  if (blocked) return blocked
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorised' }, { status: 401 })

  let body: { confirm?: unknown; reason?: unknown; other_reason?: unknown; feedback?: unknown }
  try { body = await request.json() } catch { body = {} }

  if (body.confirm !== true) {
    return NextResponse.json({ ok: false, message: 'Confirmation required. Send { "confirm": true }.' }, { status: 400 })
  }
  // The questionnaire is mandatory: a reason, the text when it is "other", optional feedback.
  if (!isDeactivationReason(body.reason)) {
    return NextResponse.json({ ok: false, message: 'Please choose a reason for deactivating.' }, { status: 400 })
  }
  const otherReason = typeof body.other_reason === 'string' ? body.other_reason.trim().slice(0, 500) : ''
  if (body.reason === 'other' && !otherReason) {
    return NextResponse.json({ ok: false, message: 'Please tell us the reason.' }, { status: 400 })
  }
  const feedback = typeof body.feedback === 'string' ? body.feedback.trim().slice(0, 2000) : ''

  const supabase = await createAdminClient()

  // Record why, with the status the account had, before anything changes.
  const [{ data: before }, { data: prof }] = await Promise.all([
    supabase.from('accounts').select('account_status').eq('id', session.id).maybeSingle(),
    supabase.from('profiles').select('id').eq('account_id', session.id).is('deleted_at', null).limit(1).maybeSingle(),
  ])
  const { error: feedbackErr } = await supabase.from('account_deactivations').insert({
    account_id: session.id,
    profile_id: prof?.id ?? null,
    reason: body.reason,
    other_reason: body.reason === 'other' ? otherReason : null,
    feedback: feedback || null,
    previous_status: before?.account_status ?? null,
  })
  if (feedbackErr && feedbackErr.code !== '42P01') {
    console.error('[account DELETE] feedback insert error:', feedbackErr.message)
    return NextResponse.json({ ok: false, message: 'Could not deactivate your account right now. Please try again.' }, { status: 500 })
  }

  // Deactivate account
  const { error: accountErr } = await supabase
    .from('accounts')
    .update({ account_status: 'deactivated', deleted_at: new Date().toISOString() })
    .eq('id', session.id)

  if (accountErr) {
    console.error('[account DELETE] update error:', accountErr.message)
    return NextResponse.json({ ok: false, message: 'Could not deactivate your account right now. Please try again.' }, { status: 500 })
  }

  // Deactivate profile (if exists)
  await supabase
    .from('profiles')
    .update({ profile_status: 'deactivated' })
    .eq('account_id', session.id)

  // No more journey messages.
  await stopJourney(supabase, session.id, 'deactivated').catch(() => {})

  // Expire all sessions for this account
  await supabase
    .from('account_sessions')
    .delete()
    .eq('account_id', session.id)

  // Audit log
  await supabase.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'account_self_deactivated',
    target_type: 'account',
    target_id: session.id,
    payload: { mobile: session.mobile, reason: body.reason },
  })

  // Clear session cookie
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)

  refreshPublicShowcase()
  return NextResponse.json({ ok: true, message: 'Your account has been deactivated. Your data is retained per our Privacy Policy.' })
}
