import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { audit, requireAdminApi } from '@/lib/adminAuth'

/**
 * Set the signed-in admin's own email, so they can sign in to the console with
 * it. Only ever changes the caller's own account (id from the session).
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi('view')
  if (guard.error) return guard.error
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, message: 'Invalid request.' }, { status: 400 }) }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) {
    return NextResponse.json({ ok: false, message: 'Enter a valid email address.' }, { status: 400 })
  }
  const admin = await createAdminClient()
  const { data: taken } = await admin.from('accounts').select('id').ilike('email', email).neq('id', guard.session.id).maybeSingle()
  if (taken) return NextResponse.json({ ok: false, message: 'That email is already used by another account.' }, { status: 409 })
  const { error } = await admin.from('accounts').update({ email, email_verified: false }).eq('id', guard.session.id)
  if (error) return NextResponse.json({ ok: false, message: 'Could not save the email. Nothing was changed.' }, { status: 500 })
  await audit(guard.session.id, 'setting_admin_email', { type: 'account', id: guard.session.id }, {}, request)
  return NextResponse.json({ ok: true })
}
