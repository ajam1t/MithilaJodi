'use client'

import Link from 'next/link'
import { usePendingCounts } from '@/lib/hooks/usePendingCounts'

/**
 * The desktop "Matches" nav link, with a count of everything waiting on you.
 *
 * A separate client component only so the member layout can stay a server
 * component — this is the one item in that nav that needs live state.
 *
 * Interests and WhatsApp requests are summed because both are answered on the
 * same page. Before this there was no signal anywhere that a WhatsApp request
 * had arrived, so the only way to find one was to open /interests on a hunch.
 */
export function MatchesNavLink() {
  const { interests, whatsapp } = usePendingCounts()
  const total = interests + whatsapp

  return (
    <Link
      href="/interests"
      className="relative px-3 py-1.5 text-sm font-medium text-ink hover:text-maroon hover:bg-paper rounded-mj-sm transition-colors"
    >
      Matches
      {total > 0 && (
        <>
          <span
            aria-hidden="true"
            className="ml-1.5 inline-grid place-items-center min-w-[18px] h-[18px] px-1 align-middle
                       rounded-full bg-maroon text-cream text-[10.5px] font-semibold leading-none"
          >
            {total > 9 ? '9+' : total}
          </span>
          <span className="sr-only">
            {`, ${total} waiting for your response`}
          </span>
        </>
      )}
    </Link>
  )
}

export default MatchesNavLink
