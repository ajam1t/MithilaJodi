'use client'

import Link from 'next/link'
import { inboxCount, usePendingCounts } from '@/lib/hooks/usePendingCounts'

/**
 * The desktop "Inbox" link with the same count as the mobile Inbox tab:
 * interests and WhatsApp requests to answer, and unread messages. A client
 * component only for the live count, so the member layout stays a server one.
 */
export function InboxNavLink() {
  const total = inboxCount(usePendingCounts())
  return (
    <Link
      href="/inbox"
      className="relative px-2 xl:px-3 py-1.5 text-sm font-medium text-ink hover:text-maroon hover:bg-paper rounded-mj-sm transition-colors"
    >
      Inbox
      {total > 0 && (
        <>
          <span
            aria-hidden="true"
            className="ml-1.5 inline-grid place-items-center min-w-[18px] h-[18px] px-1 align-middle
                       rounded-full bg-maroon text-cream text-[10.5px] font-semibold leading-none"
          >
            {total > 9 ? '9+' : total}
          </span>
          <span className="sr-only">{`, ${total} waiting for you`}</span>
        </>
      )}
    </Link>
  )
}
