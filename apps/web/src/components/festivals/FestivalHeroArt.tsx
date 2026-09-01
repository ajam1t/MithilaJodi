import Image from 'next/image'
import type { Festival, MotifKind } from '@/lib/festivals'

/**
 * Madhubani-inspired hero art, drawn as inline SVG so a festival needs no
 * image asset to look finished. If a festival later gets a real photograph
 * (`heroImage`), that is rendered instead via next/image.
 *
 * Server component — no client JS, no animation loops.
 */

function Motif({ kind, accent }: { kind: MotifKind; accent: string }) {
  const stroke = 'rgba(255,250,240,0.85)'
  const faint = 'rgba(255,250,240,0.32)'

  switch (kind) {
    // Chhath — sun over water
    case 'sun':
      return (
        <g>
          <circle cx="200" cy="88" r="34" fill={accent} opacity="0.95" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * 15 * Math.PI) / 180
            return (
              <line
                key={i}
                x1={200 + 44 * Math.cos(a)} y1={88 + 44 * Math.sin(a)}
                x2={200 + 58 * Math.cos(a)} y2={88 + 58 * Math.sin(a)}
                stroke={accent} strokeWidth="2.2" strokeLinecap="round" opacity="0.75"
              />
            )
          })}
          {[112, 126, 140].map((y, i) => (
            <path
              key={y}
              d={`M40 ${y} q 26 -9 52 0 t 52 0 t 52 0 t 52 0 t 52 0`}
              fill="none" stroke={stroke} strokeWidth="1.8" opacity={0.5 - i * 0.12}
            />
          ))}
          {[100, 200, 300].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="150" rx="7" ry="4" fill={accent} opacity="0.5" />
              <path d={`M${x} 146 q 3 -8 0 -13 q -3 5 0 13`} fill={accent} opacity="0.8" />
            </g>
          ))}
        </g>
      )

    // Sama Chakeva — paired birds
    case 'birds':
      return (
        <g>
          {[
            { x: 130, y: 92, s: 1 },
            { x: 268, y: 100, s: -1 },
          ].map((b, i) => (
            <g key={i} transform={`translate(${b.x},${b.y}) scale(${b.s},1)`}>
              <ellipse cx="0" cy="0" rx="30" ry="19" fill={accent} opacity="0.9" />
              <path d="M28 -2 L46 -13 L46 11 Z" fill={accent} opacity="0.9" />
              <circle cx="-14" cy="-5" r="3.4" fill="#5A0E19" />
              <path d="M-30 -3 q -12 -1 -16 4 q 8 3 16 1" fill={accent} opacity="0.7" />
              <path d="M-6 -14 q 14 -16 26 -4" fill="none" stroke={stroke} strokeWidth="1.6" />
              <path d="M-8 6 q 10 12 24 6" fill="none" stroke={stroke} strokeWidth="1.4" opacity="0.7" />
            </g>
          ))}
          {[70, 200, 330].map((x) => (
            <path key={x} d={`M${x} 150 q 8 -14 16 0 q 8 14 16 0`} fill="none" stroke={faint} strokeWidth="1.6" />
          ))}
          {[60, 340].map((x) => (
            <circle key={x} cx={x} cy="60" r="3" fill={stroke} opacity="0.5" />
          ))}
        </g>
      )

    // Vivah Panchami — mandap + paired kalash
    case 'wedding':
      return (
        <g>
          <path d="M112 150 L112 82 M288 150 L288 82" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M100 82 q 100 -34 200 0" fill="none" stroke={accent} strokeWidth="3" />
          {Array.from({ length: 9 }, (_, i) => {
            const x = 112 + i * 22
            const y = 82 - Math.sin((i / 8) * Math.PI) * 26
            return <path key={i} d={`M${x} ${y} l 0 12`} stroke={accent} strokeWidth="1.8" opacity="0.8" />
          })}
          {[152, 248].map((x) => (
            <g key={x}>
              <path d={`M${x - 15} 150 q 0 -26 15 -26 q 15 0 15 26 Z`} fill={accent} opacity="0.9" />
              <ellipse cx={x} cy="122" rx="9" ry="5" fill={stroke} opacity="0.85" />
              <path d={`M${x} 118 q -8 -12 -3 -18 q 5 5 3 18`} fill={stroke} opacity="0.7" />
              <path d={`M${x} 118 q 8 -12 3 -18 q -5 5 -3 18`} fill={stroke} opacity="0.7" />
            </g>
          ))}
          <circle cx="200" cy="118" r="12" fill="none" stroke={accent} strokeWidth="2" />
          <circle cx="200" cy="118" r="5" fill={accent} opacity="0.85" />
        </g>
      )

    // Holi — colour bursts
    case 'colors':
      return (
        <g>
          {[
            { x: 120, y: 96, c: '#E8912A' },
            { x: 200, y: 76, c: '#C4562F' },
            { x: 280, y: 100, c: '#2E7048' },
            { x: 158, y: 132, c: '#E4C572' },
            { x: 246, y: 136, c: '#9B2233' },
          ].map((b, i) => (
            <g key={i} opacity="0.9">
              <circle cx={b.x} cy={b.y} r="15" fill={b.c} />
              {Array.from({ length: 10 }, (_, k) => {
                const a = (k * 36 * Math.PI) / 180
                return (
                  <circle
                    key={k}
                    cx={b.x + (22 + (k % 3) * 7) * Math.cos(a)}
                    cy={b.y + (22 + (k % 3) * 7) * Math.sin(a)}
                    r={2.4 - (k % 3) * 0.5}
                    fill={b.c}
                    opacity="0.75"
                  />
                )
              })}
            </g>
          ))}
          <path d="M40 156 q 40 -12 80 0 t 80 0 t 80 0 t 80 0" fill="none" stroke={faint} strokeWidth="1.8" />
        </g>
      )

    // Durga Puja — trishul + lotus halo
    case 'goddess':
      return (
        <g>
          <circle cx="200" cy="104" r="46" fill="none" stroke={accent} strokeWidth="2" opacity="0.7" />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i * 22.5 * Math.PI) / 180
            return (
              <ellipse
                key={i}
                cx={200 + 46 * Math.cos(a)} cy={104 + 46 * Math.sin(a)}
                rx="5" ry="12" fill={accent} opacity="0.55"
                transform={`rotate(${i * 22.5 + 90} ${200 + 46 * Math.cos(a)} ${104 + 46 * Math.sin(a)})`}
              />
            )
          })}
          <path d="M200 148 L200 74" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M186 74 q 0 -18 -6 -24 q 12 2 14 20" fill={stroke} opacity="0.9" />
          <path d="M214 74 q 0 -18 6 -24 q -12 2 -14 20" fill={stroke} opacity="0.9" />
          <path d="M200 74 q 0 -24 0 -32 q 0 8 0 32" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <circle cx="200" cy="104" r="9" fill={accent} />
          {[120, 280].map((x) => (
            <path key={x} d={`M${x} 150 q -10 -20 0 -30 q 10 10 0 30`} fill={faint} />
          ))}
        </g>
      )

    // Diwali — row of lamps
    case 'lamps':
      return (
        <g>
          {[78, 122, 166, 234, 278, 322].map((x, i) => (
            <g key={x} transform={`translate(${x},${i % 2 === 0 ? 124 : 112})`}>
              <path d="M-17 0 q 0 15 17 15 q 17 0 17 -15 Z" fill={accent} opacity="0.95" />
              <path d="M-17 0 q 17 -6 34 0" fill="none" stroke={stroke} strokeWidth="1.4" opacity="0.8" />
              <path d="M0 -3 q -6 -13 0 -21 q 6 8 0 21" fill="#FFD873" />
              <circle cx="0" cy="-14" r="7" fill="#FFD873" opacity="0.28" />
            </g>
          ))}
          <g transform="translate(200,74)">
            <path d="M-22 0 q 0 19 22 19 q 22 0 22 -19 Z" fill={accent} />
            <path d="M0 -4 q -8 -17 0 -27 q 8 10 0 27" fill="#FFD873" />
            <circle cx="0" cy="-18" r="11" fill="#FFD873" opacity="0.3" />
          </g>
          {/* aripan-style base line */}
          <path d="M40 152 q 20 -10 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0" fill="none" stroke={faint} strokeWidth="1.6" />
        </g>
      )

    // Madhushravani — flowering vine
    case 'vine':
      return (
        <g>
          <path d="M60 150 q 40 -46 100 -30 q 60 16 100 -18 q 30 -26 80 -4" fill="none" stroke={stroke} strokeWidth="2.4" opacity="0.85" />
          {[
            { x: 108, y: 122 }, { x: 160, y: 120 }, { x: 214, y: 112 },
            { x: 266, y: 98 }, { x: 316, y: 96 },
          ].map((p, i) => (
            <g key={i}>
              {Array.from({ length: 6 }, (_, k) => {
                const a = (k * 60 * Math.PI) / 180
                return (
                  <ellipse
                    key={k}
                    cx={p.x + 9 * Math.cos(a)} cy={p.y + 9 * Math.sin(a)}
                    rx="4.5" ry="8" fill={accent} opacity="0.85"
                    transform={`rotate(${k * 60} ${p.x + 9 * Math.cos(a)} ${p.y + 9 * Math.sin(a)})`}
                  />
                )
              })}
              <circle cx={p.x} cy={p.y} r="4" fill={stroke} opacity="0.9" />
            </g>
          ))}
          {[84, 186, 288].map((x, i) => (
            <path key={x} d={`M${x} ${138 - i * 4} q -16 -12 -4 -26 q 14 6 4 26`} fill={faint} />
          ))}
          {/* serpent line — Naag tradition */}
          <path d="M50 162 q 24 -12 48 0 t 48 0 t 48 0 t 48 0 t 48 0" fill="none" stroke={accent} strokeWidth="1.8" opacity="0.5" />
        </g>
      )

    // Kojagara — full moon
    case 'moon':
      return (
        <g>
          <circle cx="200" cy="92" r="40" fill={accent} opacity="0.95" />
          <circle cx="200" cy="92" r="52" fill="none" stroke={accent} strokeWidth="1.6" opacity="0.45" />
          <circle cx="200" cy="92" r="64" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.25" />
          <circle cx="186" cy="82" r="6" fill="rgba(90,14,25,0.16)" />
          <circle cx="212" cy="100" r="8" fill="rgba(90,14,25,0.12)" />
          {Array.from({ length: 18 }, (_, i) => (
            <circle
              key={i}
              cx={44 + i * 18} cy={i % 3 === 0 ? 44 : i % 3 === 1 ? 56 : 34}
              r={i % 4 === 0 ? 2.2 : 1.4} fill={stroke} opacity="0.55"
            />
          ))}
          {/* makhan bowl */}
          <path d="M168 152 q 0 -18 32 -18 q 32 0 32 18 Z" fill={stroke} opacity="0.7" />
          {[180, 196, 212, 188, 204].map((x, i) => (
            <circle key={i} cx={x} cy={i < 3 ? 136 : 130} r="4.4" fill={accent} opacity="0.9" />
          ))}
        </g>
      )
  }
}

export function FestivalHeroArt({
  festival,
  className = '',
  priority = false,
}: {
  festival: Festival
  className?: string
  priority?: boolean
}) {
  const { palette, motif, name, heroImage } = festival

  if (heroImage) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={heroImage}
          alt={`${name} celebrated in Mithila`}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 1180px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep/70 via-maroon-deep/20 to-transparent" />
      </div>
    )
  }

  const gid = `fg-${festival.slug}`

  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <svg viewBox="0 0 400 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.from} />
            <stop offset="100%" stopColor={palette.to} />
          </linearGradient>
          <radialGradient id={`${gid}-glow`} cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor={palette.accent} stopOpacity="0.42" />
            <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="180" fill={`url(#${gid})`} />
        <rect width="400" height="180" fill={`url(#${gid}-glow)`} />

        <Motif kind={motif} accent={palette.accent} />

        {/* Madhubani-style tick border */}
        {Array.from({ length: 40 }, (_, i) => (
          <rect key={`t${i}`} x={i * 10} y="0" width="5" height="4" fill={palette.accent} opacity={i % 2 ? 0.5 : 0.22} />
        ))}
        {Array.from({ length: 40 }, (_, i) => (
          <rect key={`b${i}`} x={i * 10} y="176" width="5" height="4" fill={palette.accent} opacity={i % 2 ? 0.5 : 0.22} />
        ))}
      </svg>
    </div>
  )
}
