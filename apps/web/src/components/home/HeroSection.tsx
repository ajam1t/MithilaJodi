import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-paper" aria-label="Hero — Mithila matrimonial platform">
      {/* ── Full-bleed hero artwork ── (edge-to-edge, flows straight from the header separator) */}
      <div className="hero-art-enter w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-couple.jpg"
          alt="A Mithila bride and groom exchanging wedding garlands, surrounded by family"
          width={1536}
          height={1024}
          fetchPriority="high"
          decoding="async"
          className="block w-full h-auto md:h-[420px] lg:h-[500px] md:object-cover md:object-[50%_25%]"
        />
      </div>

      {/* ── Hero text (kept below the artwork) ── */}
      <div className="wrap relative z-10 py-6 md:py-10">
        <div className="hero-text-enter flex flex-col gap-3.5 md:gap-5 text-center items-center max-w-2xl mx-auto">
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5">
            <div className="h-px w-8 bg-gold" />
            <span className="eyebrow">Matrimony • Family • Mithila</span>
            <div className="h-px w-8 bg-gold" />
          </div>

          {/* Headline — "Find Your Life Partner" is the dominant line */}
          <h1 className="font-serif text-maroon">
            <span className="block text-[30px] sm:text-[40px] md:text-[52px] leading-[1.08]">
              Find Your Life Partner,
            </span>
            <span className="block text-[19px] sm:text-[22px] md:text-[26px] text-terra mt-1 leading-snug">
              Keep Your Mithila Roots.
            </span>
          </h1>

          {/* Tagline — Hindi + English visually connected */}
          <div className="space-y-0.5">
            <p className="font-deva text-[3vw] sm:text-base md:text-lg text-maroon opacity-90 whitespace-nowrap" lang="hi">
              मिथिला जोड़ी — जहाँ परम्परा मिले, प्रेम से
            </p>
            <p className="font-serif text-[14px] text-ink-soft italic">
              Where tradition meets love.
            </p>
          </div>

          {/* Supporting sentence */}
          <p className="font-sans text-[15px] md:text-[16px] text-ink-soft leading-relaxed max-w-[440px]">
            A trusted matrimonial platform for the Mithila community.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1 w-full sm:w-auto">
            <Link href="/register" className="btn-primary text-base px-7 py-3.5 justify-center">
              Create Your Profile Free →
            </Link>
            <Link href="#biodata" className="btn-ghost text-base px-7 py-3.5 justify-center !border-maroon !border-opacity-40">
              Explore Marriage Biodata
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
