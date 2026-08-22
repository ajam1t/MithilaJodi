import Link from 'next/link'

/* Small corner bracket for the premium artwork frame */
function CornerAccent({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base = 'absolute w-4 h-4 border-gold pointer-events-none'
  const map = {
    tl: '-top-1 -left-1 border-t-2 border-l-2 rounded-tl-sm',
    tr: '-top-1 -right-1 border-t-2 border-r-2 rounded-tr-sm',
    bl: '-bottom-1 -left-1 border-b-2 border-l-2 rounded-bl-sm',
    br: '-bottom-1 -right-1 border-b-2 border-r-2 rounded-br-sm',
  }
  return <span aria-hidden="true" className={`${base} ${map[position]}`} />
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-paper" aria-label="Hero — Mithila matrimonial platform">
      {/* Textured background */}
      <div className="absolute inset-0 bg-paper-texture opacity-60 pointer-events-none" aria-hidden="true" />

      <div className="wrap relative z-10 py-6 md:py-12 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10 items-center">
        {/* ── Artwork ── (top on mobile, right on desktop) */}
        <div className="hero-art-enter order-1 md:order-2 w-full max-w-[320px] sm:max-w-[380px] md:max-w-[560px] mx-auto md:mx-0">
          <div className="relative">
            <div className="relative rounded-mj overflow-hidden border-2 border-gold shadow-mj ring-1 ring-maroon/10">
              <div className="h-1.5 bg-gradient-to-r from-maroon via-gold to-maroon" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-couple.jpg"
                alt="A Mithila bride and groom exchanging wedding garlands, surrounded by family"
                className="w-full h-auto block"
              />
              <div className="h-1.5 bg-gradient-to-r from-maroon via-gold to-maroon" aria-hidden="true" />
            </div>
            <CornerAccent position="tl" />
            <CornerAccent position="tr" />
            <CornerAccent position="bl" />
            <CornerAccent position="br" />
          </div>
        </div>

        {/* ── Text ── */}
        <div className="hero-text-enter order-2 md:order-1 flex flex-col gap-3.5 md:gap-5 text-center md:text-left items-center md:items-start">
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5">
            <div className="h-px w-8 bg-gold" />
            <span className="eyebrow">Matrimony • Family • Mithila</span>
            <div className="h-px w-8 bg-gold md:hidden" />
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
            <p className="font-deva text-base md:text-lg text-maroon opacity-90" lang="hi">
              जहाँ परम्परा मिले, प्रेम से
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

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-paper to-transparent pointer-events-none" aria-hidden="true" />
    </section>
  )
}
