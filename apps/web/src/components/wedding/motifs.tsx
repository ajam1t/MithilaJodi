/**
 * Mithila motifs for the premium invitation — Madhubani line work drawn as
 * SVG. Each takes the theme's colours, so one drawing serves every theme.
 * Purely decorative: every caller hides them from assistive technology.
 *
 *  Kohbar   — the lotus (purain) flanked by bamboo, with fish, sun and moon:
 *             the painting on the wall of a Maithil bridal chamber.
 *  Matsya   — paired fish, fertility and good fortune.
 *  Mayur    — the peacock, beauty and love.
 *  Surya    — the sun, witness to the vows.
 *  Paag     — the groom's ceremonial headdress, the emblem of Mithila.
 */

type C = { ink: string; gold: string; fill?: string }

export function Lotus({ x = 0, y = 0, r = 30, ink, gold, fill }: C & { x?: number; y?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx="0" cy={-r * 0.55} rx={r * 0.22} ry={r * 0.55} transform={`rotate(${i * 45})`}
          fill={fill ?? 'none'} fillOpacity="0.18" stroke={ink} strokeWidth={r * 0.045} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx="0" cy={-r * 0.33} rx={r * 0.12} ry={r * 0.32} transform={`rotate(${i * 45 + 22.5})`}
          fill="none" stroke={gold} strokeWidth={r * 0.035} />
      ))}
      <circle r={r * 0.16} fill={gold} />
      <circle r={r * 0.95} fill="none" stroke={gold} strokeWidth={r * 0.025} strokeDasharray={`${r * 0.05} ${r * 0.1}`} />
    </g>
  )
}

export function Fish({ x = 0, y = 0, s = 1, flip = false, ink, gold, fill }: C & { x?: number; y?: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M-34 0C-22-20 14-22 30 0 14 22-22 20-34 0Z" fill={fill ?? 'none'} fillOpacity="0.2" stroke={ink} strokeWidth="2" />
      <path d="M30 0 50-14 46 0 50 14Z" fill="none" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="-20" cy="-3" r="3.2" fill={ink} />
      {[-8, 2, 12, 22].map(dx => <path key={dx} d={`M${dx}-11q5 11 0 22`} fill="none" stroke={gold} strokeWidth="1.4" />)}
      <path d="M-6-17q10-10 20 0M-6 17q10 10 20 0" fill="none" stroke={gold} strokeWidth="1.2" />
    </g>
  )
}

/** Two fish facing each other — the matsya pair. */
export function FishPair({ x = 0, y = 0, s = 1, ...c }: C & { x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Fish x={-46} y={0} {...c} flip />
      <Fish x={46} y={0} {...c} />
    </g>
  )
}

export function Bamboo({ x = 0, y = 0, h = 160, ink, gold }: C & { x?: number; y?: number; h?: number }) {
  const nodes = Math.max(3, Math.round(h / 34))
  return (
    <g transform={`translate(${x} ${y})`} fill="none" strokeLinecap="round">
      <path d={`M0 0V${-h}`} stroke={ink} strokeWidth="5" />
      <path d={`M0 0V${-h}`} stroke={gold} strokeWidth="1.2" strokeDasharray="2 5" />
      {Array.from({ length: nodes }, (_, i) => {
        const yy = -((i + 1) * h) / (nodes + 1)
        const d = i % 2 ? -1 : 1
        return (
          <g key={i}>
            <path d={`M-4 ${yy}h8`} stroke={gold} strokeWidth="2" />
            <path d={`M0 ${yy}c${d * 14}-6 ${d * 26}-4 ${d * 34}-16`} stroke={ink} strokeWidth="1.6" />
            <path d={`M${d * 34} ${yy - 16}c${-d * 10} 2 ${-d * 16} 8 ${-d * 22} 10`} stroke={ink} strokeWidth="1.2" />
          </g>
        )
      })}
    </g>
  )
}

export function Sun({ x = 0, y = 0, r = 26, ink, gold, fill }: C & { x?: number; y?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M0 ${-r * 1.08}L${r * 0.13} ${-r * 1.5}L${-r * 0.13} ${-r * 1.5}Z`} transform={`rotate(${i * 22.5})`}
          fill={i % 2 ? gold : ink} />
      ))}
      <circle r={r} fill={fill ?? 'none'} fillOpacity="0.3" stroke={ink} strokeWidth={r * 0.08} />
      <circle r={r * 0.72} fill="none" stroke={gold} strokeWidth={r * 0.05} strokeDasharray={`${r * 0.08} ${r * 0.1}`} />
      {/* the Madhubani sun has a face */}
      <path d={`M${-r * 0.36} ${-r * 0.12}q${r * 0.12}-${r * 0.12} ${r * 0.24} 0M${r * 0.12} ${-r * 0.12}q${r * 0.12}-${r * 0.12} ${r * 0.24} 0`} fill="none" stroke={ink} strokeWidth={r * 0.06} strokeLinecap="round" />
      <path d={`M${-r * 0.22} ${r * 0.24}q${r * 0.22} ${r * 0.18} ${r * 0.44} 0`} fill="none" stroke={ink} strokeWidth={r * 0.06} strokeLinecap="round" />
    </g>
  )
}

export function Moon({ x = 0, y = 0, r = 18, ink, gold }: C & { x?: number; y?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M${r * 0.3} ${-r}A${r} ${r} 0 1 0 ${r * 0.3} ${r}A${r * 0.78} ${r * 0.78} 0 1 1 ${r * 0.3} ${-r}Z`} fill={gold} fillOpacity="0.35" stroke={ink} strokeWidth={r * 0.09} />
    </g>
  )
}

export function Peacock({ x = 0, y = 0, s = 1, flip = false, ink, gold, fill }: C & { x?: number; y?: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} strokeLinecap="round" strokeLinejoin="round">
      {/* tail feathers fanned behind */}
      {[-50, -30, -10, 10].map((a, i) => (
        <g key={a} transform={`rotate(${a} -18 10)`}>
          <path d="M-18 10C-40 8-62 2-80 -6" fill="none" stroke={ink} strokeWidth="1.4" />
          <ellipse cx="-84" cy="-8" rx="9" ry="6" fill={fill ?? 'none'} fillOpacity="0.25" stroke={ink} strokeWidth="1.5" />
          <circle cx="-85" cy="-8" r="2.6" fill={i % 2 ? gold : ink} />
        </g>
      ))}
      {/* body and neck */}
      <path d="M-24 14C-22-6 0-12 10-4c6 6 4 18-8 22-10 4-22 2-26-4Z" fill={fill ?? 'none'} fillOpacity="0.25" stroke={ink} strokeWidth="2" />
      <path d="M6-4C8-18 6-30 14-38c6-5 13-3 14 3" fill="none" stroke={ink} strokeWidth="2.4" />
      <path d="M28-35l7 2-7 3" fill={gold} stroke={ink} strokeWidth="1.2" />
      <circle cx="21" cy="-36" r="1.8" fill={ink} />
      {/* crest */}
      {[-6, 0, 6].map(d => <path key={d} d={`M18-40l${d * 0.7}-9`} stroke={ink} strokeWidth="1.2" />)}
      {[-6, 0, 6].map(d => <circle key={d} cx={18 + d * 0.7} cy="-50" r="1.7" fill={gold} />)}
      {/* feather marks on the body */}
      {[[-14, 6], [-6, 2], [-8, 12], [0, 8]].map(([cx, cy]) => <path key={`${cx}${cy}`} d={`M${cx - 3} ${cy}q3-4 6 0`} fill="none" stroke={gold} strokeWidth="1.3" />)}
      <path d="M-6 18l-3 12M2 18l2 12" stroke={ink} strokeWidth="1.6" />
    </g>
  )
}

/** The Mithila paag — the groom's headdress, drawn front-on with its bands of work. */
export function Paag({ x = 0, y = 0, s = 1, ink, gold, fill }: C & { x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
      <path d="M-40 18C-44-6-34-30-14-40 0-46 14-46 24-38 40-26 46-4 40 18Z" fill={fill ?? 'none'} fillOpacity="0.85" stroke={ink} strokeWidth="2.4" />
      {/* the raised front crest that makes a paag a paag */}
      <path d="M-10-40C-8-58 8-62 14-46" fill="none" stroke={ink} strokeWidth="2.4" />
      <path d="M-40 18H40" stroke={ink} strokeWidth="3" />
      <path d="M-38 8H38M-34-6H34M-26-20H28" fill="none" stroke={gold} strokeWidth="1.6" strokeDasharray="3 4" />
      {[-24, -8, 8, 24].map(cx => <circle key={cx} cx={cx} cy="1" r="2.4" fill={gold} />)}
      <circle cx="2" cy="-30" r="4" fill={gold} stroke={ink} strokeWidth="1.2" />
    </g>
  )
}

/** The Kohbar: the painted wall of the Maithil bridal chamber, simplified to its essentials. */
export function Kohbar({ ink, gold, fill, w = 320 }: C & { w?: number }) {
  return (
    <svg viewBox="0 0 320 300" width={w} className="max-w-full h-auto" aria-hidden="true" focusable="false">
      <rect x="6" y="6" width="308" height="288" rx="6" fill="none" stroke={gold} strokeWidth="1.4" />
      <rect x="14" y="14" width="292" height="272" rx="4" fill="none" stroke={ink} strokeWidth="1" strokeDasharray="2 4" />
      <Sun x={56} y={58} r={20} ink={ink} gold={gold} fill={fill} />
      <Moon x={262} y={58} r={18} ink={ink} gold={gold} />
      <Bamboo x={44} y={268} h={150} ink={ink} gold={gold} />
      <Bamboo x={276} y={268} h={150} ink={ink} gold={gold} />
      <Lotus x={160} y={140} r={62} ink={ink} gold={gold} fill={fill} />
      <FishPair x={160} y={246} s={0.62} ink={ink} gold={gold} fill={fill} />
    </svg>
  )
}

/** A Madhubani border band: double rule with a row of triangles and dots. */
export function Border({ ink, gold, className = '' }: C & { className?: string }) {
  return (
    <svg viewBox="0 0 240 16" preserveAspectRatio="none" className={`block w-full h-4 ${className}`} aria-hidden="true" focusable="false">
      <path d="M0 1.5H240M0 14.5H240" stroke={ink} strokeWidth="1.2" />
      {Array.from({ length: 20 }, (_, i) => (
        <g key={i}>
          <path d={`M${i * 12} 13L${i * 12 + 6} 3L${i * 12 + 12} 13Z`} fill={i % 2 ? gold : 'none'} fillOpacity="0.55" stroke={ink} strokeWidth="0.8" />
        </g>
      ))}
    </svg>
  )
}

/** Section divider: fine rules either side of a small motif. */
export function Divider({ ink, gold, motif = 'lotus' }: C & { motif?: 'lotus' | 'fish' | 'sun' | 'paag' | 'peacock' | 'dot' }) {
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden="true">
      <span className="h-px w-16 sm:w-24" style={{ background: `linear-gradient(90deg, transparent, ${gold})` }} />
      <svg viewBox="-30 -30 60 60" width="34" height="34">
        {motif === 'lotus' && <Lotus r={22} ink={ink} gold={gold} />}
        {motif === 'fish' && <FishPair s={0.28} ink={ink} gold={gold} />}
        {motif === 'sun' && <Sun r={12} ink={ink} gold={gold} />}
        {motif === 'paag' && <Paag s={0.5} ink={ink} gold={gold} />}
        {motif === 'peacock' && <Peacock s={0.32} ink={ink} gold={gold} />}
        {motif === 'dot' && <circle r="4" fill={gold} />}
      </svg>
      <span className="h-px w-16 sm:w-24" style={{ background: `linear-gradient(270deg, transparent, ${gold})` }} />
    </div>
  )
}
