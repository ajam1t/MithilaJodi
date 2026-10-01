import Link from 'next/link'

type RelatedLink = { href: string; label: string }

type ComingSoonProps = {
  tool: string
  tagline: string
  description: string
  /** Each string is rendered as a bullet point explaining what the tool will do. */
  whatItDoes: string[]
  relatedLinks?: RelatedLink[]
}

/**
 * Shared "Coming Soon" shell for unbuilt astrology tools.
 *
 * Contains real explanatory prose — what the tool is, how it works,
 * why it exists within Mithila tradition. No calculator UI, no inputs,
 * no scores. Linked to relevant blog posts where available.
 */
export function ComingSoon({ tool, tagline, description, whatItDoes, relatedLinks }: ComingSoonProps) {
  return (
    <div className="min-h-[60vh] flex flex-col">

      {/* Cosmic header */}
      <div className="bg-cosmic-deep border-b border-gold/20 py-16 sm:py-24">
        <div className="wrap max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-gold/10 border border-gold/30 text-gold-lt text-[11px] font-semibold tracking-[0.15em] uppercase mb-6">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <polygon points="6 0 7.6 4.2 12 4.6 8.8 7.4 9.8 12 6 9.6 2.2 12 3.2 7.4 0 4.6 4.4 4.2 6 0" />
            </svg>
            Coming Soon
          </span>

          <h1 className="font-serif text-cream text-3xl sm:text-4xl mb-4 leading-snug">{tool}</h1>

          <p className="font-serif italic text-gold-lt text-[17px] mb-6 leading-relaxed">{tagline}</p>

          {/* Gold ornament line */}
          <div className="mx-auto w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mb-6" aria-hidden="true" />

          <p className="text-paper-3/80 text-[15px] sm:text-[16px] leading-relaxed max-w-xl mx-auto">{description}</p>
        </div>
      </div>

      {/* What it will do */}
      <div className="bg-paper flex-1 py-12 sm:py-16">
        <div className="wrap max-w-2xl">

          <h2 className="font-serif text-maroon text-2xl mb-2 leading-snug">What this tool will offer</h2>
          <div className="w-8 h-px bg-gold mb-6" aria-hidden="true" />

          <ul className="space-y-4 mb-10" role="list">
            {whatItDoes.map((point, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold shrink-0" aria-hidden="true" />
                <p className="text-ink-soft text-[15px] leading-relaxed">{point}</p>
              </li>
            ))}
          </ul>

          {relatedLinks && relatedLinks.length > 0 && (
            <div className="pt-8 border-t border-gold/20 mb-10">
              <p className="text-[11px] uppercase tracking-[0.15em] text-terra font-semibold mb-4">
                Understand the concepts
              </p>
              <ul className="flex flex-col gap-2" role="list">
                {relatedLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-maroon text-[15px] hover:text-terra transition-colors underline underline-offset-4 decoration-gold/40 hover:decoration-terra inline-flex items-center gap-1.5"
                    >
                      {label}
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 8h10M8 3l5 5-5 5" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/astrology" className="btn-ghost inline-flex items-center gap-2 self-start">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M13 8H3M8 3L3 8l5 5" />
              </svg>
              Back to Astrology Tools
            </Link>
            <Link href="/astrology/kundli-match" className="btn-primary inline-flex items-center gap-2 self-start">
              Try Kundli Match
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
