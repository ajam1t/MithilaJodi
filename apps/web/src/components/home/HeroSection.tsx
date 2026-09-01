import Link from 'next/link'
import Image from 'next/image'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-paper" aria-label="Hero — Mithila matrimonial platform">
      {/* ── Full-bleed hero artwork ── (edge-to-edge, flows straight from the header separator) */}
      <div className="hero-art-enter w-full">
        <Image
          src="/hero-couple.jpg"
          alt="A Mithila bride and groom exchanging wedding garlands, surrounded by family"
          width={1536}
          height={1024}
          priority
          sizes="100vw"
          className="block w-full h-[168px] sm:h-[240px] md:h-[380px] lg:h-[440px] object-cover object-[50%_28%]"
        />
      </div>

      {/* ── Hero text (kept below the artwork) ── */}
      <div className="wrap relative z-10 py-4 md:py-9">
        <div className="hero-text-enter flex flex-col gap-2.5 md:gap-5 text-center items-center max-w-2xl mx-auto">
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5">
            <div className="h-px w-8 bg-gold" />
            <span className="eyebrow">Matrimony • Family • Mithila</span>
            <div className="h-px w-8 bg-gold" />
          </div>

          {/* Headline — "Find Your Life Partner" is the dominant line */}
          <h1 className="font-serif text-maroon">
            <span className="block text-[26px] sm:text-[38px] md:text-[52px] leading-[1.1]">
              Find Your Life Partner,
            </span>
            <span className="block text-[16px] sm:text-[21px] md:text-[26px] text-terra mt-0.5 leading-snug">
              Keep Your Mithila Roots.
            </span>
          </h1>

          {/* Tagline — Hindi + English visually connected */}
          <div className="space-y-0.5">
            <p className="font-deva text-[13px] sm:text-base md:text-lg text-maroon opacity-90" lang="hi">
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
          <div className="flex flex-col sm:flex-row gap-2.5 pt-0.5 w-full sm:w-auto">
            <Link href="/register" className="btn-primary text-[15px] px-6 py-3 justify-center">
              Create Your Profile Free →
            </Link>
            <Link href="#biodata" className="btn-ghost text-[15px] px-6 py-3 justify-center !border-maroon !border-opacity-40">
              Explore Marriage Biodata
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
