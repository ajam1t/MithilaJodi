import { COMPAT_SIGNALS, DEMO_PROFILES, type HeroStage } from './heroStages'

/**
 * Stage 2 — the two demo profiles and the compatibility read-out.
 *
 * Built from the site's own primitives (`.card`, rounded-mj, shadow tokens,
 * Marcellus for names, Mukta for meta) so it reads as a Mithila Jodi interface
 * component rather than a dating-app card. The avatars use the same
 * initial-on-paper fallback the real profile lists use, which also keeps this
 * honest: these are illustrative, not photographs of members.
 */

function Avatar({ initial }: { initial: string }) {
  return (
    <span
      className="grid place-items-center rounded-full bg-paper-2 border border-gold/40
                 h-9 w-9 sm:h-11 sm:w-11 shrink-0"
      aria-hidden="true"
    >
      <span className="font-serif text-maroon text-[15px] sm:text-[18px] leading-none">{initial}</span>
    </span>
  )
}

function ProfileCard({
  side, name, age, place,
}: { side: 'left' | 'right'; name: string; age: number; place: string }) {
  return (
    <div className={`mj-hero-card mj-hero-card--${side} card px-3 py-2.5 sm:px-4 sm:py-3`}>
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Avatar initial={name.charAt(0)} />
        <span className="flex flex-col min-w-0">
          <span className="font-serif text-maroon text-[13px] sm:text-[15px] leading-tight truncate">
            {name}
          </span>
          <span className="font-sans text-ink-soft text-[10.5px] sm:text-[12px] leading-tight">
            {age} • {place}
          </span>
        </span>
      </div>
    </div>
  )
}

export function ProfileMatchDemo({ stage, score }: { stage: HeroStage; score: number }) {
  const connected = stage === 'connected' || stage === 'final'
  const { left, right } = DEMO_PROFILES

  return (
    <div
      className="mj-hero-match absolute inset-0 z-20"
      data-connected={connected ? 'true' : 'false'}
      // One concise description instead of exposing every animated fragment.
      role="img"
      aria-label={
        'Illustration: two example Mithila Jodi profiles — ' +
        `${left.name}, ${left.age}, ${left.place} and ${right.name}, ${right.age}, ${right.place} — ` +
        'shown with a 92 percent compatibility match and connected by a golden thread.'
      }
    >
      <ProfileCard side="left" {...left} />
      <ProfileCard side="right" {...right} />

      {/* Compatibility read-out, centred between the two cards. */}
      <div className="mj-hero-compat" aria-hidden="true">
        <span className="mj-hero-compat-badge">
          {connected ? (
            <span className="mj-hero-connected font-serif text-[12px] sm:text-[15px] tracking-[0.18em] uppercase">
              Connected
            </span>
          ) : (
            <span className="font-serif text-[22px] sm:text-[30px] leading-none tabular-nums">
              {score}
              <span className="text-[13px] sm:text-[17px] align-top">%</span>
            </span>
          )}
        </span>

        <span className="mj-hero-compat-label eyebrow hidden sm:block">
          {connected ? 'Thread of Destiny' : 'Compatibility Match'}
        </span>
      </div>

      {/* Compatibility signals — desktop only; on mobile the badge carries the
          story and extra rows would crowd a 168–240px tall stage. */}
      <ul className="mj-hero-signals hidden lg:flex" aria-hidden="true">
        {COMPAT_SIGNALS.map((s, i) => (
          <li
            key={s}
            className="mj-hero-signal font-sans text-[11px] text-ink-soft"
            style={{ '--sd': `${i * 140}ms` } as React.CSSProperties}
          >
            <span className="mj-hero-tick text-green" aria-hidden="true">✓</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}
