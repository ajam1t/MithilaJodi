import Link from 'next/link'
import { ToolEmblem } from './ToolEmblem'
import { TOOLS, type ToolSlug } from './tools'
import { PointerGlow } from '@/components/motion/PointerGlow'

/**
 * The other seven tools — the cross-link strip at the foot of every tool page,
 * set as the same night observatory as the hub's tool grid (styles/kundli.css
 * .mj-observatory / .mj-obs-*), so moving between tools feels like one place.
 */
export function MoreTools({ current }: { current: ToolSlug }) {
  return (
    <section className="mj-observatory py-12 sm:py-14" aria-labelledby="more-tools">
      <div className="wrap relative z-[1] max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-lt">The observatory</p>
            <h2 id="more-tools" className="mt-1 font-serif text-[24px] text-cream sm:text-[28px]">Explore more tools</h2>
          </div>
          <Link href="/astrology" className="text-[14px] text-gold-lt underline decoration-gold/50 underline-offset-4 hover:text-cream">All astrology tools</Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {TOOLS.filter(t => t.slug !== current).map(t => (
            <li key={t.slug} className="flex">
              <Link href={t.href} className="mj-obs-card mj-glow-host group relative flex w-full flex-col items-center overflow-hidden rounded-[16px] px-3 pb-4 pt-4 text-center">
                <PointerGlow />
                <span className="mj-obs-window relative grid h-[70px] w-[70px] place-items-center rounded-full">
                  <ToolEmblem tool={t.slug} size={50} className="transition-transform duration-500 group-hover:rotate-[-6deg]" />
                  <svg viewBox="0 0 80 80" className="mj-obs-orbits pointer-events-none absolute -inset-[7px] h-[84px] w-[84px]" aria-hidden="true" focusable="false">
                    <ellipse cx="40" cy="40" rx="39" ry="16" fill="none" stroke="#C9A24B" strokeOpacity="0.5" strokeWidth="0.7" strokeDasharray="1.5 2.5" transform="rotate(-20 40 40)" />
                    <circle cx="76" cy="30" r="1.8" fill="#E4C572" />
                  </svg>
                </span>
                <span className="mt-3 font-serif text-[16px] leading-tight text-cream">{t.label}</span>
                <span className="mt-0.5 font-deva text-[12.5px] text-gold-lt/90" lang="hi">{t.hi}</span>
                <span className="mt-1 text-[11.5px] leading-snug text-[#BFB6CF]">{t.tagline}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
