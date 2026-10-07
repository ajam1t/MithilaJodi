'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { inboxCount, usePendingCounts } from '@/lib/hooks/usePendingCounts'

/*
 * The signed-in mobile bottom nav — LOCKED by the owner (2026-10-07):
 *   Home · Digital Profile · Search · Inbox · Profile
 * Do not bring back separate Messages / Interests tabs or Biodata here:
 * Inbox is the umbrella for messages, interests and matches, and Biodata
 * lives with the tools on the Profile page.
 *
 * Rendered on member pages by the (main) layout, and on public pages by
 * MobileBottomNav whenever the visitor is signed in — one component, so a
 * member never sees two different bars.
 */

type Tab = {
  href: string
  label: string
  icon: (active: boolean) => React.ReactNode
  matchPaths: string[]
}

const stroke = (active: boolean) => ({
  fill: 'none', stroke: 'currentColor', strokeWidth: active ? 2.1 : 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
})

const tabs: Tab[] = [
  {
    href: '/home',
    label: 'Home',
    matchPaths: ['/home', '/notifications'],
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke(active)} fill={active ? 'currentColor' : 'none'}>
        <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    // A person on a card with a link — "my profile, to share", not a document.
    href: '/digital-profile',
    label: 'Digital Profile',
    matchPaths: ['/digital-profile'],
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke(active)}>
        <rect x="3" y="4" width="12.5" height="16" rx="2.2" />
        <circle cx="9.25" cy="10" r="2.4" />
        <path d="M5.8 16.4c.6-1.7 1.9-2.6 3.45-2.6s2.85.9 3.45 2.6" />
        <path d="M17.6 9.2a2.3 2.3 0 0 1 3.25 3.25l-1.4 1.4a2.3 2.3 0 0 1-3.25 0" />
        <path d="M19.1 15.6a2.3 2.3 0 0 1-3.25-3.25" />
      </svg>
    ),
  },
  {
    href: '/search',
    label: 'Search',
    matchPaths: ['/search'],
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke(active)}>
        <circle cx="11" cy="11" r="7.5" />
        <path d="m20.5 20.5-4.2-4.2" />
      </svg>
    ),
  },
  {
    href: '/inbox',
    label: 'Inbox',
    matchPaths: ['/inbox', '/messages', '/interests', '/shortlists'],
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke(active)} fill={active ? 'currentColor' : 'none'}>
        <path d="M21 14.5a2 2 0 0 1-2 2H8l-4.5 4V5.5a2 2 0 0 1 2-2H19a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    matchPaths: ['/profile', '/settings', '/biodata'],
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" {...stroke(active)}>
        <path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21" />
        <circle cx="12" cy="7.5" r="4" fill={active ? 'currentColor' : 'none'} />
      </svg>
    ),
  },
]

export function AuthBottomNav() {
  const pathname = usePathname()
  const pending = usePendingCounts()

  const isActive = (tab: Tab) => tab.matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Inbox carries everything waiting on the member: interests and WhatsApp
  // requests to answer, and messages not yet read.
  const badgeFor = (tab: Tab) => (tab.href === '/inbox' ? inboxCount(pending) : 0)

  return (
    <nav
      aria-label="Member navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gold/30 bg-cream shadow-[0_-4px_16px_-6px_rgba(58,20,12,0.18)] lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="h-[2px] w-full bg-gradient-to-r from-cream via-gold to-cream" aria-hidden="true" />
      <div className="flex h-14 items-stretch">
        {tabs.map(tab => {
          const active = isActive(tab)
          const badge = badgeFor(tab)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition-colors
                ${active ? 'text-maroon' : 'text-ink-soft hover:text-ink'}`}
            >
              {/* Gold rule over the current tab — the brand's "selected" mark. */}
              {active && <span className="absolute inset-x-3 top-0 h-[2.5px] rounded-b-full bg-gold" aria-hidden="true" />}
              <span className="relative">
                {tab.icon(active)}
                {badge > 0 && (
                  <span
                    className="absolute -right-2 -top-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-maroon px-1
                               text-[10px] font-semibold leading-none text-cream ring-2 ring-cream"
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className={`max-w-full truncate px-0.5 text-[10px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {badge > 0 && <span className="sr-only">, {badge} waiting for you</span>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
