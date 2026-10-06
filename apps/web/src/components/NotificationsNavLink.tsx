'use client'

import Link from 'next/link'
import { usePendingCounts } from '@/lib/hooks/usePendingCounts'

/**
 * The desktop "Notifications" nav link with its unread count. A client
 * component only for the live count, like MatchesNavLink beside it.
 */
export function NotificationsNavLink() {
  const { notifications } = usePendingCounts()
  return (
    <Link
      href="/notifications"
      className="relative px-2 xl:px-3 py-1.5 text-sm font-medium text-ink hover:text-maroon hover:bg-paper rounded-mj-sm transition-colors"
    >
      Notifications
      {notifications > 0 && (
        <>
          <span
            aria-hidden="true"
            className="ml-1.5 inline-grid place-items-center min-w-[18px] h-[18px] px-1 align-middle
                       rounded-full bg-maroon text-cream text-[10.5px] font-semibold leading-none"
          >
            {notifications > 9 ? '9+' : notifications}
          </span>
          <span className="sr-only">{`, ${notifications} unread`}</span>
        </>
      )}
    </Link>
  )
}
