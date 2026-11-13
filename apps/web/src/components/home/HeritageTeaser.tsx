import Image from 'next/image'
import Link from 'next/link'
import { artwork, heritageSrc } from '@/lib/heritage'

/** A small homepage card pointing to /mithila-heritage. Kept to one row so it does not crowd the page. */
export function HeritageTeaser() {
  const art = artwork('p081') // Kohbar Ghar
  return (
    <section aria-labelledby="home-heritage" className="wrap py-8 sm:py-12">
      <Link href="/mithila-heritage" className="group mx-auto flex max-w-3xl items-center gap-4 rounded-mj-lg border border-gold/40 bg-cream p-3 shadow-mj-xs transition-all hover:border-gold hover:shadow-mj focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon sm:gap-6 sm:p-4">
        <div className="w-[92px] shrink-0 rounded-[4px] border-[3px] border-[#E7C77A] bg-[#E7C77A] sm:w-[120px]">
          <Image src={heritageSrc(art.id)} alt="" width={art.w} height={art.h} loading="lazy" sizes="120px" className="block aspect-[4/5] h-auto w-full rounded-[2px] object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-terra">Art &amp; culture</p>
          <h2 id="home-heritage" className="mt-1 font-serif text-[20px] leading-tight text-maroon sm:text-[24px]">Mithila Heritage</h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft sm:text-[14.5px]">Madhubani painting, its motifs and meanings — and a curated collection of Mithila art.</p>
          <span className="mt-2 inline-flex items-center text-[13.5px] font-semibold text-maroon group-hover:underline">Explore →</span>
        </div>
      </Link>
    </section>
  )
}
