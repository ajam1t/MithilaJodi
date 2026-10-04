import type { KootaResult } from '@/lib/astrology/types'
import { points, tone } from './format'

type Props = {
  kootas: KootaResult[]
  /** The number shown in the centre — the running total during the reveal. */
  displayTotal: number
  /** How many koota nodes are lit, in order. */
  litCount: number
  bandLabel?: string
  size?: number
}

/**
 * The 36-Guna centrepiece: a ring of 36 ticks (one per Guna), an arc for the
 * total, and the eight koota nodes. Readable at rest with no animation — the
 * reveal only changes `displayTotal` and `litCount`.
 */
export function ScoreRing({ kootas, displayTotal, litCount, bandLabel, size = 260 }: Props) {
  const c = size / 2
  const r = size * 0.4
  const circ = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, displayTotal / 36))
  // Clears the tick ring for nodes at 3 and 9 o'clock (half a node width = 56px).
  const orbit = Math.round(size * 0.72)

  return (
    <div className="kd-ring-wrap kd-ring-orbit mx-auto" style={{ maxWidth: orbit * 2 + 120 }}>
      <div className="relative mx-auto sm:my-[96px]" style={{ width: size, maxWidth: '100%' }}>
        <div className="relative">
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" aria-hidden="true">
          <defs>
            <linearGradient id="kd-arc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D6A83C" />
              <stop offset="55%" stopColor="#B98A2E" />
              <stop offset="100%" stopColor="#9B2233" />
            </linearGradient>
            <radialGradient id="kd-core">
              <stop offset="0%" stopColor="rgba(232,145,42,0.22)" />
              <stop offset="100%" stopColor="rgba(232,145,42,0)" />
            </radialGradient>
          </defs>
          <circle className="kd-score-glow" cx={c} cy={c} r={r * 0.98} fill="url(#kd-core)" />
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * Math.PI * 2 - Math.PI / 2
            const lit = i < Math.floor(displayTotal)
            const r1 = r + size * 0.055
            const r2 = r + size * (lit ? 0.085 : 0.075)
            return (
              <line
                key={i}
                x1={c + r1 * Math.cos(a)} y1={c + r1 * Math.sin(a)}
                x2={c + r2 * Math.cos(a)} y2={c + r2 * Math.sin(a)}
                stroke={lit ? '#B98A2E' : 'rgba(185,138,46,0.25)'}
                strokeWidth={lit ? 2 : 1.2}
                strokeLinecap="round"
              />
            )
          })}
          <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(185,138,46,0.16)" strokeWidth={size * 0.035} />
          <circle
            className="kd-ring-arc"
            cx={c} cy={c} r={r}
            fill="none"
            stroke="url(#kd-arc)"
            strokeWidth={size * 0.035}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - frac)}
            transform={`rotate(-90 ${c} ${c})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-serif text-maroon leading-none" style={{ fontSize: size * 0.24 }}>
            {points(displayTotal)}
          </span>
          <span className="mt-1 text-[12px] sm:text-[13px] uppercase tracking-[0.24em] text-terra">of 36 Guna</span>
          {bandLabel && <span className="mt-2 px-3 text-[12px] leading-snug text-ink-soft max-w-[70%]">{bandLabel}</span>}
        </div>
        </div>

        {/* Phones: a 2×4 grid below the ring. sm and up: an orbit around it. */}
        <ul className="mt-6 grid grid-cols-2 gap-2 sm:mt-0 sm:block sm:absolute sm:inset-0" aria-label="Koota scores">
          {kootas.map((k, i) => {
            const lit = i < litCount
            return (
              <li
                key={k.key}
                className="kd-node-slot"
                style={{ '--a': `${i * 45}deg`, '--r': `${orbit}px` } as React.CSSProperties}
              >
                <div
                  className="kd-node rounded-mj-sm border px-2.5 py-1.5 text-center bg-white/90 backdrop-blur-sm"
                  data-lit={lit}
                  data-tone={tone(k.score, k.maxScore)}
                  style={{ borderColor: lit ? (k.score >= k.maxScore ? 'rgba(185,138,46,0.8)' : k.score > 0 ? 'rgba(185,138,46,0.4)' : 'rgba(155,34,51,0.7)') : 'rgba(185,138,46,0.2)' }}
                >
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-ink-soft">{k.name}</span>
                  <span className={`block font-serif text-[17px] leading-tight ${k.score >= k.maxScore ? 'text-success-fg' : k.score > 0 ? 'text-maroon' : 'text-error-fg'}`}>
                    {lit ? points(k.score) : '–'}
                    <span className="text-[12px] text-ink-soft"> / {k.maxScore}</span>
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
