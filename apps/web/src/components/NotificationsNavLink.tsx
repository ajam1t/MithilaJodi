'use client'

import Link from 'next/link'
import { usePendingCounts } from '@/lib/hooks/usePendingCounts'

/**
 * The bell in the member header, with the unread notification count.
 * Notifications are not a bottom-nav tab (that nav is locked to Home ·
 * Digital Profile · Search · Inbox · Profile); this is their way in.
 */
export function NotificationBell() {
  const { notifications } = usePendingCounts()
  return (
    <Link
      href="/notifications"
      className="relative grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:text-maroon"
      aria-label={notifications > 0 ? `Notifications, ${notifications} unread` : 'Notifications'}
    >
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5" />
        <path d="M10.3 20.5a1.9 1.9 0 0 0 3.4 0" />
      </svg>
      {notifications > 0 && (
        <span aria-hidden="true" className="absolute right-1 top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-maroon px-1 text-[10px] font-semibold leading-none text-cream ring-2 ring-cream">
          {notifications > 9 ? '9+' : notifications}
        </span>
      )}
    </Link>
  )
}
