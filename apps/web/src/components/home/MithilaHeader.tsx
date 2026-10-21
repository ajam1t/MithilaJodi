'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { useAuthState, resetAuthState } from '@/lib/hooks/useAuthState'
import { MenuDrawer } from './MenuDrawer'

type NavLink = { href: string; label: string }

/**
 * The desktop row only. Below lg the hamburger opens MenuDrawer, which carries
 * the complete, locked site navigation.
 */
const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/digital-profile', label: 'Digital Profile' },
  { href: '/festivals', label: 'Festivals' },
  { href: '/festival-songs', label: 'Songs' },
  { href: '/marriage-invitation', label: 'Invitation' },
  { href: '/astrology', label: 'Astrology' },
  { href: '/blogs', label: 'Blogs' },
  { href: '/contact', label: 'Contact' },
  { href: '/help', label: 'Help' },
]

/**
 * Content pages a signed-in member must not lose access to. Previously the
 * header swapped NAV_LINKS out entirely once logged in, which hid Festivals,
 * Songs, the Invitation maker and Blogs from members.
 */
const MEMBER_CONTENT_LINKS: NavLink[] = [
  { href: '/festivals', label: 'Festivals' },
  { href: '/festival-songs', label: 'Songs' },
  { href: '/marriage-invitation', label: 'Invitation' },
  { href: '/astrology', label: 'Astrology' },
  { href: '/blogs', label: 'Blogs' },
]

// Signed in: the member bottom nav's destinations, plus Search (on Feed on mobile).
const AUTH_NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/home', label: 'Feed' },
  { href: '/digital-profile', label: 'Digital Profile' },
  { href: '/search', label: 'Search' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/profile', label: 'Profile' },
]

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
    </svg>
  )
}

export function MithilaHeader() {
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeMenu = useCallback(() => setOpen(false), [])
  // Shared across header + bottom nav: one /api/auth/me per page load.
  const { auth, authLoaded } = useAuthState()
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false
    if (href === '/') return pathname === '/'
    // '/marriage-invitation#premium' is active on that page and the invitations under it.
    const path = href.split('#')[0]
    return pathname === path || pathname.startsWith(path + '/')
  }
  const deskLink = (href: string) =>
    cn(
      'text-[13px] tracking-wide whitespace-nowrap transition-colors pb-1 border-b-2',
      isActive(href)
        ? 'text-maroon font-semibold border-marigold'
        : 'text-ink hover:text-terra border-transparent'
    )

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    resetAuthState()
    window.location.href = '/'
  }

  const Brand = (
    <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Mithila Jodi — home">
      {/* The symbol from the official logo; the full lockup's wordmark is
          unreadable at header height, so the name is typeset beside it. */}
      <Image
        src="/logo-mark-128.webp"
        alt=""
        width={52}
        height={48}
        priority
        className="h-11 w-auto object-contain shrink-0"
      />
      <span className="flex flex-col leading-none min-w-0">
        <span className="font-serif font-bold text-[19px] sm:text-[21px] text-maroon leading-tight">Mithila Jodi</span>
        <span className="font-deva text-[10px] sm:text-[11px] text-maroon opacity-80 leading-tight mt-0.5" lang="hi">
          जहाँ परंपरा मिले, प्रेम से
        </span>
        <span className="text-[9px] sm:text-[10px] text-ink-soft italic leading-tight">
          Where tradition meets love.
        </span>
      </span>
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 bg-cream shadow-mj-xs">
      {/* ── Mobile: centered brand ── */}
      <div className="lg:hidden relative px-12 py-2">
        {/* Search — members search, visitors browse profiles */}
        <Link
          href={auth.loggedIn ? '/search' : '/explore'}
          className="absolute top-2 left-1.5 text-maroon p-2 rounded"
          aria-label={auth.loggedIn ? 'Search profiles' : 'Browse profiles'}
        >
          <SearchIcon />
        </Link>

        {/* Hamburger — corner, never overlaps the centered brand */}
        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen(true)}
          className="absolute top-2 right-1.5 text-maroon p-2 rounded"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-haspopup="dialog"
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="7" x2="19" y2="7" /><line x1="3" y1="12" x2="19" y2="12" /><line x1="3" y1="17" x2="19" y2="17" />
          </svg>
        </button>

        <Link href="/" className="flex flex-col items-center text-center" aria-label="Mithila Jodi — home">
          <span className="flex items-center gap-2">
            <Image src="/logo-mark-128.webp" alt="" width={40} height={37} priority className="h-[34px] w-auto object-contain shrink-0 sm:h-10" />
            <span className="font-serif font-bold text-[24px] sm:text-[28px] text-maroon leading-none tracking-tight">
              Mithila Jodi
            </span>
          </span>
          <span className="font-deva text-[11px] sm:text-[12px] text-maroon opacity-80 mt-1" lang="hi">
            जहाँ परंपरा मिले, प्रेम से
          </span>
          <span className="font-serif italic text-[10px] sm:text-[11px] text-ink-soft mt-0.5">
            Where tradition meets love.
          </span>
        </Link>
      </div>

      {/* ── Desktop: brand + nav row ── */}
      <div className="hidden lg:flex wrap items-center justify-between gap-6 h-16">
        {/* Brand */}
        {Brand}

        {/* Desktop nav */}
        <nav className="flex items-center gap-[14px] xl:gap-5" aria-label="Main navigation">
          {auth.loggedIn ? (
            <>
              {AUTH_NAV_LINKS.map(({ href, label }) => (
                <Link key={label} href={href} className={deskLink(href)} aria-current={isActive(href) ? 'page' : undefined}>
                  {label}
                </Link>
              ))}
              <div className="h-4 w-px bg-line" />
              {MEMBER_CONTENT_LINKS.map(({ href, label }) => (
                <Link key={label} href={href} className={deskLink(href)} aria-current={isActive(href) ? 'page' : undefined}>
                  {label}
                </Link>
              ))}
              <div className="h-4 w-px bg-line" />
              <button
                onClick={handleLogout}
                className="text-[13px] text-maroon hover:text-terra transition-colors tracking-wide font-medium whitespace-nowrap"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={label} href={href} className={deskLink(href)} aria-current={isActive(href) ? 'page' : undefined}>
                  {label}
                </Link>
              ))}
              {/* Only show Login/Register once we know the user is not logged in */}
              {authLoaded && (
                <>
                  <Link href="/explore" className="text-ink hover:text-terra transition-colors p-1 -mx-1" aria-label="Browse profiles">
                    <SearchIcon />
                  </Link>
                  <div className="h-4 w-px bg-line" />
                  <Link href="/login" className="text-[13px] text-maroon hover:text-terra transition-colors tracking-wide font-medium whitespace-nowrap">
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="btn bg-maroon text-gold-lt text-[13px] py-2 px-4 xl:px-5 font-semibold hover:bg-maroon-deep hover:-translate-y-px transition-all whitespace-nowrap rounded-mj-sm"
                  >
                    <span className="xl:hidden">Join Free</span>
                    <span className="hidden xl:inline">Create Free Account</span>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>

      {/* One thin, still gold rule under the branding. Inside the sticky
          <header>, so it stays with the brand at every scroll position. */}
      <div className="h-px w-full bg-gradient-to-r from-cream via-gold/70 to-cream" aria-hidden="true" />

      <MenuDrawer
        open={open}
        onClose={closeMenu}
        loggedIn={auth.loggedIn}
        authLoaded={authLoaded}
        isActive={isActive}
        onLogout={handleLogout}
        returnFocusTo={menuButton}
      />
    </header>
  )
}
