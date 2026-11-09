import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/constants'
import { checkLimit, isCrossSiteWrite, ruleFor, sharedLimit } from '@/lib/edgeGuards'

// Full session validity (expiry/revocation) is checked server-side in each
// protected page/route via getSessionAccount(). Middleware only does a fast
// cookie-presence check so the Edge runtime stays lightweight.

const PROTECTED_PATHS = ['/home', '/inbox', '/notifications', '/profile', '/search', '/messages', '/biodata', '/interests', '/shortlists', '/settings', '/welcome']
const ADMIN_PATHS = ['/admin']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Short invitation links live at /Invitation/<slug>. Routes are case-sensitive,
  // so /invitation/…, /INVITATION/… etc. are sent to the one canonical prefix;
  // the page itself then fixes the slug's capitalisation.
  if (/^\/invitation\//i.test(pathname) && !pathname.startsWith('/Invitation/')) {
    const url = request.nextUrl.clone()
    url.pathname = `/Invitation/${pathname.slice('/invitation/'.length)}`
    return NextResponse.redirect(url, 308)
  }

  // API routes: refuse cross-site writes and runaway clients before any route
  // code runs (see lib/edgeGuards). Each route still checks its own session.
  if (pathname.startsWith('/api/')) {
    const method = request.method
    if (isCrossSiteWrite(method, request.headers.get('origin'), request.headers.get('x-forwarded-host') ?? request.headers.get('host'))) {
      return NextResponse.json({ ok: false, message: 'This request did not come from Mithila Jodi.' }, { status: 403 })
    }
    const client =
      request.cookies.get(SESSION_COOKIE)?.value ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown'
    const limited = checkLimit(method, pathname, client)
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, message: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
      )
    }
    // Sensitive writes are also counted across all server instances.
    const rule = ruleFor(method, pathname)
    if (rule?.shared && !(await sharedLimit(rule, client, { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY }))) {
      return NextResponse.json(
        { ok: false, message: 'Too many requests. Please wait a while and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.round(rule.windowMs / 1000)) } },
      )
    }
    return NextResponse.next()
  }

  const hasSession = request.cookies.has(SESSION_COOKIE)

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  if (isProtected && !hasSession) {
    // The return path keeps the query (?tab=interests and the like), and the
    // redirect carries nothing else; /login checks it with getSafeNextPath.
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // The console has its own sign-in (no member registration on it). This is
  // only the fast cookie check; the role is verified server-side on every
  // console page and admin API.
  const isAdmin = ADMIN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isAdmin && pathname !== '/admin/login' && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
