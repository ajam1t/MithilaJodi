import { HERO_GLYPHS, type HeroStage } from './heroStages'

/**
 * Stage 1 + 2 — MITHILA JODI assembling out of separate pieces, then settling.
 *
 * Each glyph is a span carrying its own entry vector as CSS custom properties;
 * a single shared keyframe reads those properties, so eleven letters cost one
 * animation definition and no JavaScript per frame. Transform/opacity/filter
 * only, so the whole thing composites on the GPU.
 *
 * `aria-hidden` on the decorative layer: the brand name is already the site
 * header's accessible text, and the real <h1> sits below this in HeroSection.
 * Screen readers should not have to wade through eleven separate letter spans.
 */
export function LetterAssembly({ stage }: { stage: HeroStage }) {
  const settled = stage !== 'assembly' && stage !== 'brand'

  return (
    <div
      className="mj-hero-brand absolute inset-x-0 top-0 z-20 flex items-center justify-center"
      data-settled={settled ? 'true' : 'false'}
      aria-hidden="true"
    >
      {/* Warm energy pulse + ripple that peaks as the glyphs converge. */}
      <span className="mj-hero-pulse" />
      <span className="mj-hero-ripple" />

      <span className="mj-hero-word font-serif text-maroon">
        {HERO_GLYPHS.map((g, i) => (
          <span
            key={`${g.ch}-${i}`}
            className={`mj-hero-glyph${g.gap ? ' mj-hero-glyph--gap' : ''}`}
            style={{
              '--gx': g.x,
              '--gy': g.y,
              '--gr': `${g.rot}deg`,
              '--gz': g.z,
              '--gd': `${g.delay}ms`,
            } as React.CSSProperties}
          >
            {g.ch}
          </span>
        ))}
      </span>
    </div>
  )
}
