import Link from 'next/link'
import { ToolEmblem } from './ToolEmblem'
import { TOOLS, type ToolSlug } from './tools'

/** The other seven tools, as emblem tiles — the cross-link strip at the foot of every tool page. */
export function MoreTools({ current }: { current: ToolSlug }) {
  return (
    <section className="bg-cream py-12 sm:py-14 border-t border-gold/20" aria-labelledby="more-tools">
      <div className="wrap max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="eyebrow mb-1">Jyotish toolkit</p>
            <h2 id="more-tools" className="section-heading text-[24px] sm:text-[28px]">Explore more tools</h2>
          </div>
          <Link href="/astrology" className="text-[14px] text-maroon underline underline-offset-4 decoration-gold/50 hover:text-terra">All astrology tools</Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {TOOLS.filter(t => t.slug !== current).map(t => (
            <li key={t.slug}>
              <Link
                href={t.href}
                className="group flex h-full flex-col items-center rounded-mj border border-gold/25 bg-paper px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-mj-sm"
              >
                <ToolEmblem tool={t.slug} size={52} className="transition-transform duration-500 group-hover:rotate-[-6deg]" />
                <span className="mt-2 font-serif text-[16px] text-maroon leading-tight">{t.label}</span>
                <span className="mt-0.5 text-[12px] text-ink-soft leading-snug">{t.tagline}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
