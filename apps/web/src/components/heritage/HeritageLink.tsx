'use client'

import { track } from '@/lib/track'

/**
 * An outbound link to the Jhayra Mithila Heritage collection: new tab, no
 * opener, and one anonymous analytics event (heritage_outbound, k = where on
 * the page it was clicked). Only Jhayra's Mithila collection and its product
 * pages may be passed here.
 */
export function HeritageLink({ href, place, className, children, ariaLabel }: { href: string; place: string; className?: string; children: React.ReactNode; ariaLabel?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={ariaLabel}
      onClick={() => track('heritage_outbound', { k: place })}>
      {children}
    </a>
  )
}
