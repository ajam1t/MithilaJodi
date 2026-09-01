import Link from 'next/link'
import type { Festival } from '@/lib/festivals'
import { FestivalHeroArt } from './FestivalHeroArt'

/**
 * Visually rich festival card for the /festivals grid.
 * Whole card is one large touch target — mobile-first.
 */
export function FestivalCard({ festival, priority = false }: { festival: Festival; priority?: boolean }) {
  return (
    <Link
      href={`/festivals/${festival.slug}`}
      className="group card card-hover overflow-hidden flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <div className="relative">
        <FestivalHeroArt festival={festival} className="h-40 sm:h-44" priority={priority} />

        {/* Devanagari name sits on the art */}
        <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-maroon-deep/80 to-transparent">
          <p className="font-deva text-[19px] leading-none text-gold-lt" lang="hi">
            {festival.nameDeva}
          </p>
        </div>

        {festival.uniquelyMithila && (
          <span className="badge badge-gold absolute top-3 right-3 shadow-mj-xs">Only in Mithila</span>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="font-serif text-[19px] sm:text-[21px] text-maroon leading-snug group-hover:text-terra transition-colors">
          {festival.name}
        </h3>

        <p className="text-[12.5px] text-terra mt-1 font-medium">{festival.season}</p>

        <p className="text-[14px] text-ink-soft leading-relaxed mt-2.5 line-clamp-3 flex-1">
          {festival.intro}
        </p>

        <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-maroon group-hover:gap-2.5 transition-all">
          Explore {festival.name.split('—')[0].trim()}
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  )
}
