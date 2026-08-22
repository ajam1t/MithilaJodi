import Link from 'next/link'
import { VarmalaScene } from '@/components/home/VarmalaScene'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-paper" aria-label="Hero — Mithila matrimonial platform">
      {/* Textured background */}
      <div className="absolute inset-0 bg-paper-texture opacity-60 pointer-events-none" aria-hidden="true" />

      <div className="wrap relative z-10 py-6 md:py-12 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10 items-center">
        {/* Left — text */}
        <div className="hero-text-enter order-2 md:order-1 flex flex-col gap-3.5 md:gap-5 text-center md:text-left items-center md:items-start">
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5">
            <div className="h-px w-8 bg-gold" />
            <span className="eyebrow">Matrimony • Family • Mithila</span>
            <div className="h-px w-8 bg-gold md:hidden" />
          </div>

          {/* Matrimonial headline — the dominant message */}
          <h1 className="font-serif text-display-lg text-maroon leading-[1.06]">
            Find Your Life Partner,
            <br />
            <span className="text-terra">Keep Your Mithila Roots.</span>
          </h1>

          {/* Hindi accent — supports, does not compete */}
          <p className="font-deva text-base md:text-lg text-maroon opacity-80 italic -mt-1" lang="hi">
            जहाँ परम्परा मिले, प्रेम से
          </p>

          {/* Concise subheading */}
          <p className="font-sans text-[15px] md:text-[16px] text-ink-soft leading-relaxed max-w-[440px]">
            A trusted matrimonial platform for the Mithila community.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1 w-full sm:w-auto">
            <Link href="/register" className="btn-primary text-base px-7 py-3.5 justify-center">
              Create Your Profile Free →
            </Link>
            <Link href="#biodata" className="btn-ghost text-base px-7 py-3.5 justify-center">
              Explore Marriage Biodata
            </Link>
          </div>

          {/* Honest trust row (no fabricated counts) */}
          <div className="grid grid-cols-3 gap-3 pt-3.5 mt-0.5 border-t border-paper-3 w-full max-w-[440px] text-center md:text-left">
            {[
              { t: '100%', d: 'Mithila Focused' },
              { t: 'Family', d: 'First, always' },
              { t: 'Free', d: 'Profile to create' },
            ].map(({ t, d }) => (
              <div key={t}>
                <p className="font-serif text-lg md:text-xl text-maroon leading-tight">{t}</p>
                <p className="text-[11px] text-ink-soft leading-tight">{d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — matrimonial illustration */}
        <div className="hero-art-enter order-1 md:order-2 w-full max-w-[300px] sm:max-w-[380px] md:max-w-[560px] mx-auto md:mx-0">
          <div className="relative rounded-mj overflow-hidden border-2 border-gold shadow-mj">
            <VarmalaScene />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-paper to-transparent pointer-events-none" aria-hidden="true" />
    </section>
  )
}
