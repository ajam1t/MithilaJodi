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
    href: '/biodata',
    label: 'Biodata',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
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
    tab.href === '/interests' ? pending.interests + pending.whatsapp : 0

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
                <span className="sr-only">{badge} waiting for your response</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
