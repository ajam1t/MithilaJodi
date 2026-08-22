import Link from 'next/link'
import { VarmalaScene } from '@/components/home/VarmalaScene'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-paper" aria-label="Hero — Mithila wedding platform introduction">
      {/* Textured background */}
      <div className="absolute inset-0 bg-paper-texture opacity-60 pointer-events-none" aria-hidden="true" />

      <div className="wrap relative z-10 py-10 md:py-14 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left — text */}
        <div className="hero-text-enter order-2 md:order-1 flex flex-col gap-6">
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-gold" />
            <span className="eyebrow">People • Families • Culture • Together</span>
          </div>

          {/* Main heading */}
          <h1 className="font-serif text-display-lg text-maroon leading-[1.05]">
            Mithila Jodi
          </h1>
          <p className="font-deva text-xl text-maroon leading-relaxed opacity-90 italic" lang="hi">
            जहाँ परम्परा मिले, प्रेम से
          </p>
          <p className="font-serif text-[15px] text-ink-soft italic leading-snug -mt-3">
            Where tradition meets love.
          </p>

          {/* Sub heading */}
          <p className="font-sans text-[17px] text-ink-soft leading-relaxed max-w-[460px]">
            A trusted matrimonial platform for the Mithila community — create a marriage
            biodata in your language and connect Maithili families across India.
          </p>

          {/* Culture chips */}
          <div className="flex flex-wrap gap-2">
            {['Madhubani Art', 'Maithili Language', 'Pag Phere Ceremony', 'Kothghar Tradition'].map(tag => (
              <span
                key={tag}
                className="text-[12px] bg-maroon text-gold-lt rounded-full px-4 py-1.5 font-medium tracking-wide border border-gold border-opacity-30"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/register" className="btn-primary text-base px-8 py-4">
              Create Your Profile Free →
            </Link>
            <Link href="#biodata" className="btn-ghost text-base px-8 py-4">
              Explore Marriage Biodata
            </Link>
          </div>

          {/* Honest value pillars (no fabricated stats) */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 pt-4 border-t border-paper-3">
            {[
              { t: 'India Focused', d: 'Built for Mithila' },
              { t: 'Family First', d: 'Milap, not just matches' },
              { t: 'Your Language', d: 'मैथिली · हिन्दी · English' },
            ].map(({ t, d }) => (
              <div key={t}>
                <p className="font-serif text-lg text-maroon leading-tight">{t}</p>
                <p className="text-[12px] text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — illustration */}
        <div className="hero-art-enter order-1 md:order-2 w-full max-w-[560px] mx-auto md:mx-0">
          {/* Card frame */}
          <div className="relative rounded-mj overflow-hidden border-2 border-gold shadow-mj">
            <VarmalaScene />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-paper to-transparent pointer-events-none" aria-hidden="true" />
    </section>
  )
}
