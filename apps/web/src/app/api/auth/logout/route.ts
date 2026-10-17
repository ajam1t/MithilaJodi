import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { hashSessionToken } from '@/lib/session'
import { SESSION_COOKIE } from '@/lib/constants'
import { getSessionAccount } from '@/lib/auth'
import { endImpersonation } from '@/lib/impersonation'

export async function POST(request: NextRequest) {
  // Logging out while signed in as a member ends that, back to the console.
  const session = await getSessionAccount()
  if (session?.impersonatedBy) return endImpersonation(request, session)

  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token) {
    const tokenHash = hashSessionToken(token)
    const admin = await createAdminClient()
    await admin
      .from('account_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
