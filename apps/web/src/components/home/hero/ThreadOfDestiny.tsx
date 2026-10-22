import type { HeroStage } from './heroStages'

/**
 * Stage 3 — the Thread of Destiny.
 *
 * SVG stroke-dashoffset rather than Canvas or WebGL, as the brief prefers: two
 * declarative CSS animations, no per-frame JavaScript, and it scales with the
 * viewBox instead of needing a device-pixel-ratio dance.
 *
 * `preserveAspectRatio="none"` is deliberate. It makes viewBox units map
 * linearly onto the stage at every size — 840 units across is always 100% wide —
 * so the thread's endpoints stay locked to the percentage-positioned profile
 * cards on any viewport. The only cost is mild anisotropic stretch on the
 * decorative motifs, which sit at 0.09 opacity where it is imperceptible.
 *
 * There are two paths because mobile stacks the cards vertically: the same
 * choreography needs a genuinely different route, not a squashed copy of the
 * desktop one. CSS shows exactly one of them per breakpoint.
 *
 * Colours are the brand golds (#B98A2E / #E4C572) — never a bright yellow.
 */

/** Wide layout: cards flank the centre, so the thread wanders horizontally. */
const THREAD_WIDE =
  'M 178 150 C 258 100, 316 200, 396 160 C 476 120, 512 92, 566 132 ' +
  'C 616 168, 632 168, 664 150'

/**
 * Narrow layout: card A sits top-left, card B bottom-right, so the thread leaves
 * A, drops through the open column to the left of B, then sweeps right along the
 * corridor between the two cards (passing behind the badge) and into B. Routed
 * this way so most of its length lands in visible space rather than disappearing
 * under the two opaque cards.
 */
const THREAD_TALL =
  'M 200 100 C 120 130, 90 150, 130 168 C 200 192, 300 150, 420 152 ' +
  'C 540 154, 622 176, 660 202'

export function ThreadOfDestiny({ stage }: { stage: HeroStage }) {
  const drawing = stage === 'thread' || stage === 'connected' || stage === 'final'
  const connected = stage === 'connected' || stage === 'final'

  const strokeProps = {
    pathLength: 1,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
  }

  return (
    <>
      <svg
        className="mj-hero-thread absolute inset-0 h-full w-full z-10"
        viewBox="0 0 840 300"
        preserveAspectRatio="none"
        data-drawing={drawing ? 'true' : 'false'}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="mjThreadGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#B98A2E" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#E4C572" />
            <stop offset="100%" stopColor="#B98A2E" stopOpacity="0.55" />
          </linearGradient>
          <filter id="mjThreadGlow" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* ── Cultural detail, background texture only ──────────────────────
            A lotus outline and two Mithila fish motifs. Faint enough to read as
            paper texture rather than illustration — the hero stays SaaS-first. */}
        <g className="mj-hero-motifs" stroke="#B98A2E" fill="none" strokeWidth="1.4">
          <g transform="translate(420 240) scale(1.5 0.9)">
            {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => (
              <ellipse key={a} cx="0" cy="-16" rx="7" ry="17" transform={`rotate(${a})`} />
            ))}
            <circle cx="0" cy="0" r="4.5" />
          </g>
          {[[150, 68], [700, 236]].map(([fx, fy], i) => (
            <g key={i} transform={`translate(${fx} ${fy}) scale(${i ? -1.5 : 1.5} 0.9)`}>
              <ellipse cx="0" cy="0" rx="20" ry="11" />
              <path d="M 20 0 L 33 -8 L 33 8 Z" />
              <circle cx="-7" cy="-3" r="2" />
            </g>
          ))}
        </g>

        {/* Each breakpoint gets its own route; CSS reveals one. Halo first, so
            the thread and its leading spark sit on top of the glow. */}
        {([['wide', THREAD_WIDE], ['tall', THREAD_TALL]] as const).map(([variant, d]) => (
          <g key={variant} className={`mj-hero-route mj-hero-route--${variant}`}>
            <path
              className="mj-hero-thread-glow"
              d={d}
              stroke="#E4C572"
              strokeWidth="8"
              filter="url(#mjThreadGlow)"
              {...strokeProps}
            />
            <path
              className="mj-hero-thread-line"
              d={d}
              stroke="url(#mjThreadGrad)"
              strokeWidth="2.5"
              {...strokeProps}
            />
            {/* Leading-edge highlight: a short bright dash riding the same path,
                done in CSS rather than SMIL animateMotion (which would need a
                JS beginElement() trigger). */}
            <path
              className="mj-hero-spark"
              d={d}
              stroke="#FFFAF0"
              strokeWidth="3.5"
              {...strokeProps}
            />
          </g>
        ))}
      </svg>

      {/* ── The knot ──────────────────────────────────────────────────────────
          Its own SVG with a fixed aspect ratio and a pixel width, rather than
          living in the stretched viewBox above. That keeps it geometrically
          correct AND reliably wider than the compatibility badge it sits behind
          at every breakpoint — inside the stretched viewBox it would have been
          hidden on one size or the other.

          A lemniscate: two mirrored loops. Deliberately not a heart — the thread
          is meant to become the Mithila Jodi signature. */}
      <svg
        className="mj-hero-knot-wrap absolute left-1/2 top-1/2 z-10 w-[168px] sm:w-[212px]"
        viewBox="0 0 200 72"
        data-connected={connected ? 'true' : 'false'}
        aria-hidden="true"
        focusable="false"
      >
        <path
          className="mj-hero-knot"
          d="M 100 36 C 66 6, 12 6, 12 36 S 66 66, 100 36 C 134 6, 188 6, 188 36 S 134 66, 100 36 Z"
          pathLength={1}
          fill="none"
          stroke="#E4C572"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </>
  )
}
