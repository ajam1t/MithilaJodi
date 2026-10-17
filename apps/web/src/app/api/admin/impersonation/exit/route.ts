import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { ACTING_AS_COOKIE, cookieOpts, endImpersonation } from '@/lib/impersonation'

/** POST /api/admin/impersonation/exit — leave "Sign in as this member" and return to the Admin Console. */
export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session?.impersonatedBy) {
    // Already over (expired or ended elsewhere): just clear the banner.
    const res = NextResponse.json({ ok: true, redirect: '/admin/login' })
    res.cookies.set(ACTING_AS_COOKIE, '', cookieOpts(0, false))
    return res
  }
  return endImpersonation(request, session)
}
