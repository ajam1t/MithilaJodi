import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { SESSION_COOKIE } from '@/lib/constants'
import { audit, isAdminRole } from '@/lib/adminAuth'

/** Signs the current admin out: revokes this session, clears the cookie, audits it. */
export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (session) {
    const admin = await createAdminClient()
    await admin.from('account_sessions').update({ revoked_at: new Date().toISOString() }).eq('id', session.session_id)
    if (isAdminRole(session.role)) await audit(session.id, 'admin_logout', { type: 'account', id: session.id }, {}, request)
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' })
  return response
}
