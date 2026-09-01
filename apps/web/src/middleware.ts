import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/constants'

// Full session validity (expiry/revocation) is checked server-side in each
// protected page/route via getSessionAccount(). Middleware only does a fast
// cookie-presence check so the Edge runtime stays lightweight.

const PROTECTED_PATHS = ['/profile', '/search', '/messages', '/biodata', '/interests', '/shortlists', '/settings']
const ADMIN_PATHS = ['/admin']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hasSession = request.cookies.has(SESSION_COOKIE)

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const isAdmin = ADMIN_PATHS.some(p => pathname.startsWith(p))
  if (isAdmin && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
