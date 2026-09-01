import Link from 'next/link'
import { FestivalHeroArt } from '@/components/festivals/FestivalHeroArt'
import { FESTIVALS, getFestival, type Festival } from '@/lib/festivals'

/** Compact homepage entry point into the festivals section. */
const HIGHLIGHT_SLUGS = ['chhath-puja', 'sama-chakeva', 'madhushravani', 'kojagara']

export function FestivalStrip() {
  const chhath = getFestival('chhath-puja')
  const highlights = HIGHLIGHT_SLUGS
    .map((s) => getFestival(s))
    .filter((f): f is Festival => Boolean(f))

  return (
    <section className="bg-cream border-y border-paper-3" aria-label="Mithila festivals">
      <div className="wrap py-8 sm:py-10">
        <div className="card overflow-hidden grid sm:grid-cols-[210px_1fr] lg:grid-cols-[280px_1fr]">
          {chhath && (
            <FestivalHeroArt festival={chhath} className="h-28 sm:h-full min-h-[112px]" />
          )}

          <div className="p-5 sm:p-6 flex flex-col justify-center">
            <p className="eyebrow mb-2">Mithila Festivals</p>
            <h2 className="font-serif text-[20px] sm:text-[24px] text-maroon leading-snug">
              Chhath, Sama Chakeva, Madhushravani — the Mithila year
            </h2>
            <p className="text-ink-soft text-[14.5px] leading-relaxed mt-2">
              Stories, rituals and the Maithili songs that belong to each festival.
            </p>

            <div className="flex flex-wrap gap-1.5 mt-3.5">
              {highlights.map((f) => (
                <Link key={f.slug} href={`/festivals/${f.slug}`} className="chip text-[12px] py-1">
                  {f.name.split('—')[0].trim()}
                </Link>
              ))}
            </div>

            <Link
              href="/festivals"
              className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-maroon hover:text-terra transition-colors self-start"
            >
              Explore all {FESTIVALS.length} festivals
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
