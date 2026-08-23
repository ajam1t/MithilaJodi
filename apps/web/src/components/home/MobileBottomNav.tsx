'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function MobileBottomNav() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [authLoaded, setAuthLoaded] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((data: { ok: boolean } | null) => {
        if (data?.ok) setLoggedIn(true)
        setAuthLoaded(true)
      })
      .catch(() => setAuthLoaded(true))
  }, [])

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  function navCls(href: string, isCta = false) {
    if (isCta) {
      return 'flex-[1.3] flex flex-col items-center justify-center gap-0.5 py-2 bg-maroon text-gold-lt hover:bg-maroon-deep active:bg-maroon-deep transition-colors'
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
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-cream border-t-2 border-gold border-opacity-40 shadow-[0_-4px_16px_-4px_rgba(58,20,12,0.18)]"
      aria-label="Mobile quick navigation"
    >
      {/* Top Madhubani accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-cream via-gold to-cream" />

      {authLoaded && loggedIn ? (
        /* Authenticated bottom nav */
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
            <span className={`text-[10px] font-medium tracking-wide leading-none ${isActive('/') ? 'font-semibold' : ''}`}>Home</span>
          </Link>

          {/* Search */}
          <Link href="/search" className={navCls('/search')}>
            {isActive('/search') ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
            <span className={`text-[10px] font-medium tracking-wide leading-none ${isActive('/search') ? 'font-semibold' : ''}`}>Search</span>
          </Link>

          {/* Messages — primary CTA centre */}
          <Link href="/messages" className={navCls('/messages', true)}>
            {/* Polished chat-bubble SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-[10px] font-semibold tracking-wide leading-none">Messages</span>
          </Link>

          {/* Interests */}
          <Link href="/interests" className={navCls('/interests')}>
            {isActive('/interests') ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
            <span className={`text-[10px] font-medium tracking-wide leading-none ${isActive('/interests') ? 'font-semibold' : ''}`}>Interests</span>
          </Link>

          {/* Profile */}
          <Link href="/profile" className={navCls('/profile')}>
            {isActive('/profile') ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 12c2.7 0 4-1.3 4-4s-1.3-4-4-4-4 1.3-4 4 1.3 4 4 4zm0 2c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
            <span className={`text-[10px] font-medium tracking-wide leading-none ${isActive('/profile') ? 'font-semibold' : ''}`}>Profile</span>
          </Link>
        </div>
      ) : (
        /* Public / not-yet-loaded bottom nav — Home · Create Biodata · Join / Login · Search Profiles · Blog */
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

          {/* Create Biodata */}
          <Link href="/biodata" className={navCls('/biodata')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
            <span className={`text-[10px] font-medium tracking-wide leading-tight text-center ${isActive('/biodata') ? 'font-semibold' : ''}`}>Create Biodata</span>
          </Link>

          {/* Join / Login — primary CTA centre */}
          <Link href="/register" className={navCls('/register', true)}>
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
            <span className={`text-[10px] font-medium tracking-wide leading-tight text-center ${isActive('/explore') ? 'font-semibold' : ''}`}>Search Profiles</span>
          </Link>

          {/* Blog */}
          <Link href="/blogs" className={navCls('/blogs')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 4h9a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z" />
              <path d="M16 8h2a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2" />
              <line x1="8" y1="8" x2="12" y2="8" />
              <line x1="8" y1="12" x2="12" y2="12" />
            </svg>
            <span className={`text-[10px] font-medium tracking-wide leading-tight text-center ${isActive('/blogs') ? 'font-semibold' : ''}`}>Blog</span>
          </Link>
        </div>
      )}
    </nav>
  )
}
