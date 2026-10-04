import { toolInfo, type ToolSlug } from './tools'

const GOLD = '#F1D58A'

/** Each tool's glyph, drawn in gold line-art on a 64 × 64 grid. */
function Glyph({ slug }: { slug: ToolSlug }) {
  const line = { fill: 'none', stroke: GOLD, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (slug) {
    case 'kundli-match':
      return (
        <g {...line}>
          <path d="M24 21 35 32 24 43 13 32Z" />
          <path d="M40 21 51 32 40 43 29 32Z" />
          <path d="M18.5 26.5 29.5 37.5M34.5 26.5 45.5 37.5" strokeOpacity={0.55} strokeWidth={1.2} />
          <path d="M19 16.5Q32 9 45 16.5" strokeOpacity={0.8} />
          <circle cx="32" cy="32" r="2.6" fill={GOLD} stroke="none" />
        </g>
      )
    case 'compatibility':
      return (
        <g {...line}>
          <circle cx="26.5" cy="35" r="10" />
          <circle cx="37.5" cy="35" r="10" />
          <path d="M32 14.5l1.6 3.7 3.9.4-3 2.6.9 3.9L32 23l-3.4 2.1.9-3.9-3-2.6 3.9-.4z" fill={GOLD} stroke="none" />
        </g>
      )
    case 'janam-kundli':
      return (
        <g {...line}>
          <rect x="17" y="17" width="30" height="30" rx="1.5" />
          <path d="M17 17 47 47M47 17 17 47" strokeOpacity={0.7} strokeWidth={1.3} />
          <path d="M32 17 47 32 32 47 17 32Z" />
          <circle cx="32" cy="24.5" r="1.6" fill={GOLD} stroke="none" />
        </g>
      )
    case 'nakshatra':
      return (
        <g {...line}>
          <path d="M33 16a16 16 0 1 0 13 25 13 13 0 1 1-13-25Z" fill={GOLD} fillOpacity={0.18} />
          <path d="M40 19 46 24 43 31" strokeOpacity={0.6} strokeWidth={1.1} strokeDasharray="1.5 2" />
          <circle cx="40" cy="19" r="1.7" fill={GOLD} stroke="none" />
          <circle cx="46" cy="24" r="1.3" fill={GOLD} stroke="none" />
          <circle cx="43" cy="31" r="1.5" fill={GOLD} stroke="none" />
        </g>
      )
    case 'rashi':
      return (
        <g {...line}>
          <circle cx="32" cy="32" r="16" strokeOpacity={0.85} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6
            return <path key={i} d={`M${32 + 13 * Math.cos(a)} ${32 + 13 * Math.sin(a)} L${32 + 16 * Math.cos(a)} ${32 + 16 * Math.sin(a)}`} strokeWidth={1.2} />
          })}
          <circle cx="32" cy="32" r="7.5" fill={GOLD} fillOpacity={0.9} stroke="none" />
          <circle cx="34.5" cy="30" r="1.3" fill="#164846" fillOpacity={0.35} stroke="none" />
          <circle cx="29.5" cy="34" r="1" fill="#164846" fillOpacity={0.3} stroke="none" />
        </g>
      )
    case 'manglik':
      return (
        <g {...line}>
          <circle cx="28.5" cy="35.5" r="9.5" fill={GOLD} fillOpacity={0.16} />
          <path d="M35.2 28.8 45 19M37.5 19H45v7.5" />
          <ellipse cx="28.5" cy="35.5" rx="15" ry="4.2" transform="rotate(-18 28.5 35.5)" strokeOpacity={0.55} strokeWidth={1.1} />
        </g>
      )
    case 'vivah-muhurat':
      return (
        <g {...line}>
          <path d="M22 37c0 7 4.5 10 10 10s10-3 10-10c0-5-4.5-8-10-8s-10 3-10 8Z" fill={GOLD} fillOpacity={0.16} />
          <path d="M26.5 29h11M27.5 26.5h9" />
          <circle cx="32" cy="20.5" r="4" />
          <path d="M28 25c-4-1.5-7.5-4.5-9-8 4 .2 7.6 2.6 9 8ZM36 25c4-1.5 7.5-4.5 9-8-4 .2-7.6 2.6-9 8Z" fill={GOLD} fillOpacity={0.35} strokeWidth={1.3} />
          <path d="M29 38.5h6M32 35.5v6" strokeWidth={1.4} />
        </g>
      )
    case 'baby-names':
      return (
        <g {...line}>
          <text x="32" y="30.5" fill={GOLD} stroke="none" fontSize="17" textAnchor="middle" dominantBaseline="central" fontFamily="'Rozha One', 'Tiro Devanagari Hindi', serif">अ</text>
          <path d="M32 48c-3-3.5-3-7 0-10 3 3 3 6.5 0 10ZM32 48c-5.5-.5-9-3.5-10-7.5 4.5 0 8 2.5 10 7.5ZM32 48c5.5-.5 9-3.5 10-7.5-4.5 0-8 2.5-10 7.5Z" fill={GOLD} fillOpacity={0.3} strokeWidth={1.3} />
        </g>
      )
  }
}

/**
 * A tool's emblem: its glyph in gold on a jewel-toned medallion with a fine
 * double gold ring — the identity mark used on the hub and each tool page.
 */
export function ToolEmblem({ tool, size = 56, className = '' }: { tool: ToolSlug; size?: number; className?: string }) {
  const { tone } = toolInfo(tool)
  const id = `te-${tool}`
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={tone[0]} />
          <stop offset="100%" stopColor={tone[1]} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill="#FFFAF0" stroke="#D6A83C" strokeWidth="1" />
      <circle cx="32" cy="32" r="28" fill={`url(#${id})`} />
      <circle cx="32" cy="32" r="25.5" fill="none" stroke={GOLD} strokeOpacity="0.45" strokeWidth="0.8" strokeDasharray="1 2.2" />
      <Glyph slug={tool} />
    </svg>
  )
}
