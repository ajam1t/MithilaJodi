'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePendingCounts } from '@/lib/hooks/usePendingCounts'

type Tab = {
  href: string
  label: string
  icon: (active: boolean) => React.ReactNode
  matchPaths?: string[]
}

const tabs: Tab[] = [
  {
    href: '/search',
    label: 'Search',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    href: '/interests',
    label: 'Matches',
    matchPaths: ['/interests', '/shortlists'],
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: '/messages',
    label: 'Messages',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    // Notifications replaced Biodata here (2026-10-07). The biodata maker is
    // still at /biodata, linked from the member's Profile page and the desktop
    // nav.
    href: '/notifications',
    label: 'Notifications',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor"
        strokeWidth={active ? 1.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5" />
        <path d="M10.3 20.5a1.9 1.9 0 0 0 3.4 0" fill="none" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export function AuthBottomNav() {
  const pathname = usePathname()
  const pending = usePendingCounts()

  function isActive(tab: Tab) {
    const paths = tab.matchPaths ?? [tab.href]
    return paths.some(p => pathname === p || pathname.startsWith(p + '/'))
  }

  // Interests and WhatsApp requests are both answered on /interests, so they
  // share one badge. Without it a request could sit unanswered forever — the
  // approve buttons are on a page nothing tells you to open.
  const badgeFor = (tab: Tab) =>
    tab.href === '/interests' ? pending.interests + pending.whatsapp
      : tab.href === '/notifications' ? pending.notifications
      : 0

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-cream border-t border-ink/10 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-stretch h-14">
        {tabs.map(tab => {
          const active = isActive(tab)
          const badge = badgeFor(tab)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors
                ${active ? 'text-maroon' : 'text-ink-soft hover:text-ink'}`}
            >
              <span className="relative">
                {tab.icon(active)}
                {badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 grid place-items-center
                               rounded-full bg-maroon text-cream text-[10px] font-semibold leading-none"
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] leading-tight font-medium ${active ? 'text-maroon' : 'text-ink-soft'}`}>
                {tab.label}
              </span>
              {badge > 0 && (
                <span className="sr-only">
                  {tab.href === '/notifications' ? `${badge} unread` : `${badge} waiting for your response`}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
