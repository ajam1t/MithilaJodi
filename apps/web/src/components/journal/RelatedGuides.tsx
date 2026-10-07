import Link from 'next/link'
import { JOURNAL_GUIDES, guideHref, type GuideSlug } from '@/lib/journal'

/**
 * "From the Mithila Jodi Journal" — a short reading list for a product or
 * festival page, plus optional next steps on the site. Server-rendered plain
 * links, so crawlers and readers both see how the page connects to the guides.
 */
export function RelatedGuides({
  guides, also = [], title = 'From the Mithila Jodi Journal', intro, className = '',
}: {
  guides: GuideSlug[]
  /** Other pages on the site that are the natural next step. */
  also?: Array<{ href: string; label: string }>
  title?: string
  intro?: string
  className?: string
}) {
  if (guides.length === 0 && also.length === 0) return null
  return (
    <aside aria-label={title} className={`rounded-mj border border-gold/40 bg-cream p-5 sm:p-6 ${className}`}>
      <p className="eyebrow">Read more</p>
      <h2 className="mt-1 font-serif text-[22px] leading-snug text-maroon">{title}</h2>
      {intro && <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{intro}</p>}
      {guides.length > 0 && (
        <ul className="mt-3 divide-y divide-paper-3">
          {guides.map(slug => (
            <li key={slug}>
              <Link href={guideHref(slug)} className="group flex items-center justify-between gap-3 py-2.5">
                <span className="font-serif text-[16px] leading-snug text-maroon group-hover:underline underline-offset-2">{JOURNAL_GUIDES[slug].title}</span>
                <span className="shrink-0 text-maroon/60 transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {also.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-paper-3 pt-3 text-[14px]">
          {also.map(a => (
            <li key={a.href}>
              <Link href={a.href} className="font-semibold text-maroon underline-offset-4 hover:underline">{a.label} →</Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
