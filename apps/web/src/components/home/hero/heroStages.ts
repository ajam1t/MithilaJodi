/**
 * Hero cinematic timeline — the single source of truth for the sequence.
 *
 * One ordered table instead of timeouts scattered through the components: the
 * orchestrator schedules exactly one timer per row and clears them all on
 * unmount. The CSS keyframes read the stage off a `data-stage` attribute, so
 * nothing here has to know about individual elements.
 *
 * Every stage's animations END in the final resting position. That matters for
 * two reasons: the global `prefers-reduced-motion` rule in globals.css collapses
 * animation-duration to 0.01ms, which then lands users straight on the finished
 * composition rather than on a half-flown-in mess; and jumping the attribute to
 * 'final' at any point is always safe.
 */

export type HeroStage =
  | 'assembly'   // letters fly in from separate directions
  | 'brand'      // MITHILA JODI assembled, warm pulse
  | 'match'      // brand settles up; two profile cards arrive; score counts up
  | 'thread'     // golden Thread of Destiny draws between the profiles
  | 'connected'  // thread lands, knot forms, score becomes CONNECTED
  | 'final'      // stable, usable hero

/** Milliseconds from sequence start at which each stage begins. */
export const HERO_TIMELINE: ReadonlyArray<{ stage: HeroStage; at: number }> = [
  { stage: 'brand',     at: 2200 },
  { stage: 'match',     at: 3300 },
  { stage: 'thread',    at: 5400 },
  { stage: 'connected', at: 7300 },
  { stage: 'final',     at: 8400 },
]

/** Total run time, ~8.4s — inside the 6–10s the brief asks for. */
export const HERO_SEQUENCE_MS = HERO_TIMELINE[HERO_TIMELINE.length - 1].at

/**
 * Set once the cinematic has played. A second navigation in the same tab opens
 * on the stable hero instead of replaying the whole thing.
 */
export const HERO_SEEN_KEY = 'mj-hero-cinematic-seen'

/** The compatibility read-out ticks through these, ending on the real score. */
export const COMPAT_STEPS = [0, 24, 47, 68, 92] as const

export const COMPAT_SIGNALS = [
  'Cultural Values',
  'Family Preferences',
  'Shared Interests',
  'Lifestyle Compatibility',
] as const

/** Illustrative only — not real members. Mirrored in the aria description. */
export const DEMO_PROFILES = {
  left:  { name: 'Aarav Jha',    age: 28, place: 'Darbhanga' },
  right: { name: 'Swati Mishra', age: 26, place: 'Madhubani' },
} as const

/**
 * MITHILA JODI, one entry per glyph, each with its own entry vector.
 *
 * `x`/`y` are multiples of a distance unit that shrinks on small screens (see
 * --mj-fly in globals.css), so mobile gets the same choreography over a shorter
 * travel rather than a scaled-down copy of the desktop motion.
 *
 * `z` drives the starting scale, which reads as depth — some glyphs arrive from
 * nearer the viewer, some from further away.
 */
export type Glyph = {
  ch: string
  x: number
  y: number
  rot: number
  z: number
  delay: number
  /** true = start of the second word, gets a leading gap */
  gap?: boolean
}

export const HERO_GLYPHS: readonly Glyph[] = [
  { ch: 'M', x: -3.4, y: -0.6, rot: -14, z: 0.72, delay: 0 },
  { ch: 'I', x: -1.5, y:  2.6, rot:  22, z: 1.22, delay: 90 },
  { ch: 'T', x:  0.4, y: -3.1, rot:  10, z: 0.86, delay: 40 },
  { ch: 'H', x:  2.9, y:  1.9, rot: -18, z: 1.14, delay: 150 },
  { ch: 'I', x: -2.2, y: -2.4, rot:  16, z: 0.78, delay: 210 },
  { ch: 'L', x:  3.6, y: -1.2, rot: -11, z: 0.92, delay: 120 },
  { ch: 'A', x:  1.2, y:  3.2, rot:  19, z: 1.18, delay: 260 },
  { ch: 'J', x: -3.1, y:  1.4, rot: -21, z: 1.08, delay: 300, gap: true },
  { ch: 'O', x:  2.4, y: -2.8, rot:  13, z: 0.74, delay: 180 },
  { ch: 'D', x: -0.8, y:  3.0, rot: -16, z: 0.88, delay: 350 },
  { ch: 'I', x:  3.2, y:  0.7, rot:  24, z: 1.16, delay: 240 },
]
