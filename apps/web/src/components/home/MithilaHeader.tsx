'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { MithilaBorder } from '@/components/home/MithilaBorder'

/** `mobileLabel` lets the hamburger show a fuller label than the tighter desktop row. */
type NavLink = { href: string; label: string; mobileLabel?: string }

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/#biodata', label: 'Marriage Biodata' },
  { href: '/festivals', label: 'Festivals', mobileLabel: 'Mithila Festivals' },
  { href: '/festival-songs', label: 'Songs', mobileLabel: 'Festival Songs' },
  { href: '/marriage-invitation', label: 'Invitation', mobileLabel: 'Marriage Invitation Card' },
  { href: '/blogs', label: 'Blogs' },
  { href: '/safety', label: 'Safety' },
  { href: '/contact', label: 'Contact' },
  { href: '/help', label: 'Help' },
]

/**
 * Content pages a signed-in member must not lose access to. Previously the
 * header swapped NAV_LINKS out entirely once logged in, which hid Festivals,
 * Songs, the Invitation maker and Blogs from members.
 */
const MEMBER_CONTENT_LINKS: NavLink[] = [
  { href: '/festivals', label: 'Festivals', mobileLabel: 'Mithila Festivals' },
  { href: '/festival-songs', label: 'Songs', mobileLabel: 'Festival Songs' },
  { href: '/marriage-invitation', label: 'Invitation', mobileLabel: 'Marriage Invitation Card' },
  { href: '/blogs', label: 'Blogs' },
  { href: '/help', label: 'Help' },
]

const AUTH_NAV_LINKS = [
  { href: '/search', label: 'Search' },
  { href: '/messages', label: 'Messages' },
  { href: '/interests', label: 'Interests' },
  { href: '/shortlists', label: 'Shortlist' },
  { href: '/biodata', label: 'Biodata' },
  { href: '/profile', label: 'My Profile' },
]

type AuthState = { loggedIn: false } | { loggedIn: true; mobile: string }

/* Subtle Mithila-inspired floral line-art for the header edges (mobile). */
function FloralEdge({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 opacity-40 ${
        side === 'left' ? 'left-1' : 'right-1 scale-x-[-1]'
      }`}
    >
      <svg width="24" height="46" viewBox="0 0 24 46" fill="none" stroke="#B98A2E" strokeWidth="1" strokeLinecap="round">
        <path d="M12 2 C12 12, 6 16, 8 24 C10 32, 15 34, 12 44" />
        <path d="M8 12 C3 10, 1 13, 4 16 C7 18, 10 15, 8 12 Z" fill="#E4C572" fillOpacity="0.5" />
        <path d="M15 22 C20 20, 22 23, 19 26 C16 28, 13 25, 15 22 Z" fill="#E4C572" fillOpacity="0.5" />
        <path d="M8 34 C3 32, 1 35, 4 38 C7 40, 10 37, 8 34 Z" fill="#E4C572" fillOpacity="0.5" />
      </svg>
    </div>
  )
}

export function MithilaHeader() {
  const [open, setOpen] = useState(false)
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false })
  const [authLoaded, setAuthLoaded] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }
  const deskLink = (href: string) =>
    cn(
      'text-[13px] tracking-wide whitespace-nowrap transition-colors pb-1 border-b-2',
      isActive(href)
        ? 'text-maroon font-semibold border-marigold'
        : 'text-ink hover:text-terra border-transparent'
    )
  const mobileLink = (href: string) =>
    cn('text-sm py-1 transition-colors', isActive(href) ? 'text-maroon font-semibold' : 'text-ink hover:text-terra')

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((data: { ok: boolean; account?: { mobile: string } } | null) => {
        if (data?.ok && data?.account) {
          setAuth({ loggedIn: true, mobile: data.account.mobile })
        }
        setAuthLoaded(true)
      })
      .catch(() => setAuthLoaded(true))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/'
  }

  const Brand = (
    <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Mithila Jodi — home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" className="h-10 sm:h-11 w-auto object-contain shrink-0" />
      <span className="flex flex-col leading-none min-w-0">
        <span className="font-serif font-bold text-[19px] sm:text-[21px] text-maroon leading-tight">Mithila Jodi</span>
        <span className="font-deva text-[10px] sm:text-[11px] text-maroon opacity-80 leading-tight mt-0.5" lang="hi">
          जहाँ परम्परा मिले, प्रेम से
        </span>
        <span className="text-[9px] sm:text-[10px] text-ink-soft italic leading-tight">
          Where tradition meets love.
        </span>
      </span>
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-gold border-opacity-30 shadow-mj-xs">
      {/* Thin top accent */}
      <div className="h-[3px] w-full bg-gradient-to-r from-cream via-gold to-cream" />

      {/* ── Mobile: centered brand ── */}
      <div className="lg:hidden relative px-12 py-3">
        <FloralEdge side="left" />
        <FloralEdge side="right" />

        {/* Hamburger — corner, never overlaps the centered brand */}
        <button
          onClick={() => setOpen(v => !v)}
          className="absolute top-2 right-1.5 text-maroon p-2 rounded"
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="18" y2="18" /><line x1="18" y1="4" x2="4" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="7" x2="19" y2="7" /><line x1="3" y1="12" x2="19" y2="12" /><line x1="3" y1="17" x2="19" y2="17" />
            </svg>
          )}
        </button>

        <Link href="/" className="flex flex-col items-center text-center" aria-label="Mithila Jodi — home">
          <span className="font-serif font-bold text-[28px] sm:text-[34px] text-maroon leading-none tracking-tight">
            Mithila Jodi
          </span>
          <span className="font-deva text-[11px] sm:text-[12px] text-maroon opacity-80 mt-1.5" lang="hi">
            जहाँ परम्परा मिले, प्रेम से
          </span>
          <span className="font-serif italic text-[10px] sm:text-[11px] text-ink-soft mt-0.5">
            Where tradition meets love.
          </span>
        </Link>

        {/* Thin gold divider */}
        <div className="mx-auto mt-2 h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent" />
      </div>

      {/* ── Desktop: brand + nav row ── */}
      <div className="hidden lg:flex wrap items-center justify-between h-16">
        {/* Brand */}
        {Brand}

        {/* Desktop nav */}
        <nav className="flex items-center gap-6" aria-label="Main navigation">
          {auth.loggedIn ? (
            <>
              {AUTH_NAV_LINKS.map(({ href, label }) => (
                <Link key={label} href={href} className={deskLink(href)} aria-current={isActive(href) ? 'page' : undefined}>
                  {label}
                </Link>
              ))}
              <div className="h-4 w-px bg-gold opacity-40" />
              {MEMBER_CONTENT_LINKS.filter(l => l.href !== '/help').map(({ href, label }) => (
                <Link key={label} href={href} className={deskLink(href)} aria-current={isActive(href) ? 'page' : undefined}>
                  {label}
                </Link>
              ))}
              <div className="h-4 w-px bg-gold opacity-40" />
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
                  <Link href="/login" className="text-[13px] text-maroon hover:text-terra transition-colors tracking-wide font-medium whitespace-nowrap">
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="btn bg-maroon text-gold-lt text-[13px] py-2 px-5 font-semibold hover:bg-maroon-deep hover:-translate-y-px transition-all whitespace-nowrap rounded-mj-sm"
                  >
                    Create Free Account
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-paper border-t border-gold border-opacity-20">
          <div className="wrap py-4 flex flex-col gap-4">
            {auth.loggedIn ? (
              <>
                {AUTH_NAV_LINKS.map(({ href, label }) => (
                  <Link key={label} href={href} onClick={() => setOpen(false)} className={mobileLink(href)} aria-current={isActive(href) ? 'page' : undefined}>{label}</Link>
                ))}
                <div className="h-px bg-gold opacity-20" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-terra font-semibold">Explore</p>
                {MEMBER_CONTENT_LINKS.map(({ href, label, mobileLabel }) => (
                  <Link key={label} href={href} onClick={() => setOpen(false)} className={mobileLink(href)} aria-current={isActive(href) ? 'page' : undefined}>{mobileLabel ?? label}</Link>
                ))}
                <div className="h-px bg-gold opacity-20" />
                <button
                  onClick={() => { setOpen(false); handleLogout() }}
                  className="text-maroon text-sm py-1 font-medium text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {NAV_LINKS.map(({ href, label, mobileLabel }) => (
                  <Link key={label} href={href} onClick={() => setOpen(false)} className={mobileLink(href)} aria-current={isActive(href) ? 'page' : undefined}>{mobileLabel ?? label}</Link>
                ))}
                <div className="h-px bg-gold opacity-20" />
                {authLoaded && (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="text-maroon text-sm py-1 font-medium">Login</Link>
                    <Link href="/register" onClick={() => setOpen(false)} className="btn bg-maroon text-gold-lt w-full text-center text-sm py-2.5 rounded-mj-sm">
                      Create Free Account
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Decorative Mithila border — part of the sticky header so it never scrolls away */}
      <MithilaBorder variant="bottom" className="h-6 sm:h-9 overflow-hidden" />
    </header>
  )
}
