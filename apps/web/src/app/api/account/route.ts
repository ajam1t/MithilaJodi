import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { SESSION_COOKIE } from '@/lib/constants'
import { cookies } from 'next/headers'
import { refreshPublicShowcase } from '@/lib/showcaseCache'

// DELETE /api/account — soft-deactivate the authenticated user's account
export async function DELETE(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorised' }, { status: 401 })

  let body: { confirm?: unknown }
  try { body = await request.json() } catch { body = {} }

  if (body.confirm !== true) {
    return NextResponse.json({ ok: false, message: 'Confirmation required. Send { "confirm": true }.' }, { status: 400 })
  }

  const supabase = await createAdminClient()

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
    payload: { mobile: session.mobile },
  })

  // Clear session cookie
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)

  refreshPublicShowcase()
  return NextResponse.json({ ok: true, message: 'Your account has been deactivated. Your data is retained per our Privacy Policy.' })
}
