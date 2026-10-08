'use client'

import Link from 'next/link'

import { usePathname } from 'next/navigation'
import { useAuthState } from '@/lib/hooks/useAuthState'
import { AuthBottomNav } from '@/components/AuthBottomNav'

export function MobileBottomNav() {
  const { auth, authLoaded } = useAuthState()
  const loggedIn = auth.loggedIn
  const pathname = usePathname()

  // Signed in: the member nav (Home · Digital Profile · Search · Inbox ·
  // Profile), the same component the member pages use.
  if (authLoaded && loggedIn) return <AuthBottomNav />

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    // Join / Login covers the whole sign-in group, not just /register.
    if (href === '/register') return ['/register', '/login', '/forgot-password'].some(p => pathname.startsWith(p))
    // A shared profile (/p/…) is a Digital Profile.
    if (href === '/digital-profile') return pathname.startsWith('/digital-profile') || pathname.startsWith('/p/')
    return pathname.startsWith(href)
  }

  function navCls(href: string, isCta = false) {
    if (isCta) {
      // The CTA is always maroon; when it is the current page it deepens and
      // gains the gold rule, the same signal the brand uses for "selected".
      return [
        'relative flex-[1.3] flex flex-col items-center justify-center gap-0.5 py-2 text-gold-lt hover:bg-maroon-deep active:bg-maroon-deep transition-colors',
        isActive(href) ? 'bg-maroon-deep shadow-[inset_0_2px_0_#E4C572]' : 'bg-maroon',
      ].join(' ')
    }
    const active = isActive(href)
    return [
      'flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors',
      active
        ? 'text-maroon'
        : 'text-ink-soft hover:text-terra active:text-terra',
    ].join(' ')
  }

  return (
    <nav
      className="mj-bottom-nav fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-cream border-t-2 border-gold border-opacity-40 shadow-[0_-4px_16px_-4px_rgba(58,20,12,0.18)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile quick navigation"
    >
      {/* Top Madhubani accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-cream via-gold to-cream" />

      {
        /* Public / not-yet-loaded bottom nav — Home · Digital Profile · Join / Login · Search · Astrology */
        <div className="flex items-stretch">
          {/* Home */}
          <Link href="/" className={navCls('/')}>
            {isActive('/') ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            )}
            <span className={`text-[10px] font-medium tracking-wide leading-tight text-center ${isActive('/') ? 'font-semibold' : ''}`}>Home</span>
          </Link>

          {/* Digital Profile — the flagship. The biodata maker it replaced here is
              still one tap away in the hamburger menu. */}
          <Link href="/digital-profile" className={navCls('/digital-profile')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="2.5" width="14" height="19" rx="2.5" />
              <circle cx="12" cy="9.5" r="2.8" />
              <path d="M8 17c.6-2.2 2.1-3.3 4-3.3s3.4 1.1 4 3.3" />
            </svg>
            <span className={`text-[10px] font-medium tracking-wide leading-tight text-center ${isActive('/digital-profile') ? 'font-semibold' : ''}`}>Digital Profile</span>
          </Link>

          {/* Join / Login — primary CTA centre */}
          <Link href="/register" className={navCls('/register', true)} aria-current={isActive('/register') ? 'page' : undefined}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="8" r="4" />
              <path d="M3 20c0-3.6 2.7-6 6-6" />
              <line x1="18" y1="11" x2="18" y2="17" />
              <line x1="15" y1="14" x2="21" y2="14" />
            </svg>
            <span className="text-[10px] font-semibold tracking-wide leading-tight text-center">Join / Login</span>
          </Link>

          {/* Search Profiles (public, non-member browsing) */}
          <Link href="/explore" className={navCls('/explore')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className={`text-[10px] font-medium tracking-wide leading-tight text-center ${isActive('/explore') ? 'font-semibold' : ''}`}>Search</span>
          </Link>

          {/* Astrology — replaces Blog in the public bottom nav.
              Blog remains in the hamburger via NAV_LINKS, so it is not lost. */}
          <Link href="/astrology" className={navCls('/astrology')}>
            {isActive('/astrology') ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            )}
            <span className={`text-[10px] font-medium tracking-wide leading-tight text-center ${isActive('/astrology') ? 'font-semibold' : ''}`}>Astrology</span>
          </Link>
        </div>
      }
    </nav>
  )
}
