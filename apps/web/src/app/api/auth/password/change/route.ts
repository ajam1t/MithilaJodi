import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { isPasswordValid } from '@/lib/password'

export async function POST(request: NextRequest) {
  const account = await getSessionAccount()
  if (!account) {
    return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  const { current_password, new_password } = (body ?? {}) as Record<string, unknown>

  if (typeof current_password !== 'string' || !current_password) {
    return NextResponse.json({ ok: false, message: 'Current password required' }, { status: 400 })
  }
  if (typeof new_password !== 'string' || !new_password) {
    return NextResponse.json({ ok: false, message: 'New password required' }, { status: 400 })
  }
  if (!isPasswordValid(new_password)) {
    return NextResponse.json(
      { ok: false, message: 'New password must be at least 8 characters with uppercase, lowercase, and a number.' },
      { status: 400 },
    )
  }

  try {
    const admin = await createAdminClient()

    const { data: row } = await admin
      .from('accounts')
      .select('password_hash')
      .eq('id', account.id)
      .single()

    if (!row?.password_hash) {
      return NextResponse.json(
        { ok: false, message: 'No password is set for this account. Use "Forgot Password" to set one.' },
        { status: 400 },
      )
    }

    const valid = await bcrypt.compare(current_password, row.password_hash as string)
    if (!valid) {
      return NextResponse.json({ ok: false, message: 'Current password is incorrect.' }, { status: 401 })
    }

    const newHash = await bcrypt.hash(new_password, 12)

    const { error } = await admin
      .from('accounts')
      .update({ password_hash: newHash })
      .eq('id', account.id)

    if (error) {
      console.error('[password/change] update error:', error.message)
      return NextResponse.json({ ok: false, message: 'Could not update password. Please try again.' }, { status: 500 })
    }

    // Keep this device signed in; sign out every other one.
    await admin.from('account_sessions').update({ revoked_at: new Date().toISOString() })
      .eq('account_id', account.id).is('revoked_at', null).neq('id', account.session_id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[password/change] error:', err)
    return NextResponse.json({ ok: false, message: 'Server error. Please try again.' }, { status: 500 })
  }
}
