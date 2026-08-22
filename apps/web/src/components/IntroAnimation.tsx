'use client'
import { useState, useEffect } from 'react'

const PHASES = [400, 1600, 3000, 4500, 6200] as const
const TOTAL = 7100

function fadeIn(active: boolean, delay = 0): React.CSSProperties {
  return {
    opacity: active ? 1 : 0,
    transform: active ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)',
    transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`,
  }
}

export function IntroAnimation() {
  const [show, setShow]       = useState(false)
  const [phase, setPhase]     = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (sessionStorage.getItem('mj-intro-seen')) return
    } catch { return }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try { sessionStorage.setItem('mj-intro-seen', '1') } catch {}
      return
    }

    setShow(true)
    PHASES.forEach((ms, i) => {
      setTimeout(() => setPhase(i + 1), ms)
    })
    setTimeout(() => {
      setExiting(true)
      setTimeout(() => {
        setShow(false)
        try { sessionStorage.setItem('mj-intro-seen', '1') } catch {}
      }, 900)
    }, TOTAL)
  }, [])

  if (!show) return null

  return (
    <div
      role="presentation"
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#FBF1DD',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        opacity: exiting ? 0 : 1,
        transition: exiting ? 'opacity 0.9s ease' : 'opacity 0.25s ease',
        pointerEvents: exiting ? 'none' : 'all',
      }}
    >
      {/* ── Madhubani border band ─── */}
      <MadhubaniEdge position="top" visible={phase >= 1} />
      <MadhubaniEdge position="bottom" visible={phase >= 1} />
      <MadhubaniEdge position="left" visible={phase >= 1} />
      <MadhubaniEdge position="right" visible={phase >= 1} />

      {/* ── Corner peacocks ── */}
      <div style={{ position: 'absolute', top: 24, left: 24, ...fadeIn(phase >= 2, 0) }}>
        <PeacockSvg size={64} flip={false} />
      </div>
      <div style={{ position: 'absolute', top: 24, right: 24, ...fadeIn(phase >= 2, 80) }}>
        <PeacockSvg size={64} flip={true} />
      </div>

      {/* ── Central illustration ── */}
      <div style={{ ...fadeIn(phase >= 3, 0) }}>
        <CentralIllustration />
      </div>

      {/* ── Logo + tagline ── */}
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginTop: 20,
          ...fadeIn(phase >= 4, 0),
        }}
      >
        {/* The logo is shown only in an animation overlay — next/image not needed here */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Mithila Jodi" style={{ height: 96, width: 'auto', objectFit: 'contain' }} />
        <p
          style={{
            fontFamily: 'var(--font-mukta), sans-serif',
            fontSize: 15,
            color: '#7A1220',
            opacity: 0.8,
            marginTop: 6,
            letterSpacing: '0.02em',
          }}
          lang="hi"
        >
          जहाँ परम्परा मिले, प्रेम से
        </p>
        <p
          style={{
            fontFamily: 'var(--font-marcellus), serif',
            fontSize: 13,
            color: '#5C3D2E',
            opacity: 0.6,
            marginTop: 2,
            fontStyle: 'italic',
          }}
        >
          Where tradition meets love.
        </p>
      </div>

      {/* ── Floating petals ── */}
      {phase >= 2 && <FloatingPetals />}
    </div>
  )
}

/* ── Madhubani border band ────────────────────────────────── */
function MadhubaniEdge({ position, visible }: { position: 'top'|'bottom'|'left'|'right', visible: boolean }) {
  const isHoriz = position === 'top' || position === 'bottom'
  const style: React.CSSProperties = {
    position: 'absolute',
    opacity: visible ? 1 : 0,
    transition: 'opacity 1s ease',
    ...(position === 'top'    ? { top: 0, left: 0, right: 0, height: 14 } : {}),
    ...(position === 'bottom' ? { bottom: 0, left: 0, right: 0, height: 14 } : {}),
    ...(position === 'left'   ? { left: 0, top: 0, bottom: 0, width: 14 } : {}),
    ...(position === 'right'  ? { right: 0, top: 0, bottom: 0, width: 14 } : {}),
  }
  return (
    <div style={style}>
      <svg
        width={isHoriz ? '100%' : 14}
        height={isHoriz ? 14 : '100%'}
        preserveAspectRatio="none"
        viewBox={isHoriz ? '0 0 400 14' : '0 0 14 400'}
        xmlns="http://www.w3.org/2000/svg"
      >
        {isHoriz
          ? Array.from({ length: 40 }, (_, i) => (
              <g key={i} transform={`translate(${i * 10}, 0)`}>
                <rect x={0} y={0} width={10} height={14} fill={i % 2 === 0 ? '#7A1220' : '#9B2233'} />
                <circle cx={5} cy={7} r={2.5} fill="#E4C572" opacity={0.8} />
              </g>
            ))
          : Array.from({ length: 40 }, (_, i) => (
              <g key={i} transform={`translate(0, ${i * 10})`}>
                <rect x={0} y={0} width={14} height={10} fill={i % 2 === 0 ? '#7A1220' : '#9B2233'} />
                <circle cx={7} cy={5} r={2.5} fill="#E4C572" opacity={0.8} />
              </g>
            ))
        }
      </svg>
    </div>
  )
}

/* ── Peacock SVG ──────────────────────────────────────────── */
function PeacockSvg({ size, flip }: { size: number; flip: boolean }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: flip ? 'scaleX(-1)' : undefined, display: 'block' }}
      aria-hidden="true"
    >
      {/* Body */}
      <ellipse cx="30" cy="52" rx="14" ry="10" fill="#7A1220" />
      {/* Neck */}
      <path d="M 30 42 Q 32 30 28 22" stroke="#7A1220" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Head */}
      <circle cx="27" cy="19" r="6" fill="#7A1220" />
      {/* Crest */}
      {[0, -10, 10].map((dx, i) => (
        <g key={i}>
          <line x1={27 + dx * 0.3} y1="13" x2={27 + dx} y2="7" stroke="#B98A2E" strokeWidth="1.2" />
          <circle cx={27 + dx} cy="6" r="2" fill="#E4C572" />
        </g>
      ))}
      {/* Eye */}
      <circle cx="25" cy="18" r="1.5" fill="#E4C572" />
      {/* Tail feathers */}
      {[-30, -20, -10, 0, 10, 20, 30].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const ex = 44 + Math.sin(rad) * 28
        const ey = 52 - Math.cos(rad) * 28
        return (
          <g key={i}>
            <line x1="40" y1="52" x2={ex} y2={ey} stroke={i % 2 === 0 ? '#B98A2E' : '#E4C572'} strokeWidth="1.5" />
            <circle cx={ex} cy={ey} r="3.5" fill={i % 2 === 0 ? '#7A1220' : '#B98A2E'} stroke="#E4C572" strokeWidth="0.8" />
            <circle cx={ex} cy={ey} r="1.2" fill="#E4C572" />
          </g>
        )
      })}
      {/* Legs */}
      <line x1="26" y1="62" x2="22" y2="72" stroke="#7A1220" strokeWidth="2" />
      <line x1="34" y1="62" x2="38" y2="72" stroke="#7A1220" strokeWidth="2" />
    </svg>
  )
}

/* ── Central Illustration ─────────────────────────────────── */
function CentralIllustration() {
  return (
    <svg
      width="320" height="200"
      viewBox="0 0 320 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mithila wedding illustration"
      role="img"
    >
      {/* Mandap arch */}
      <path
        d="M 60 160 Q 60 60 160 50 Q 260 60 260 160"
        fill="none" stroke="#B98A2E" strokeWidth="3"
        strokeDasharray="6 3"
      />
      {/* Garland on arch */}
      {Array.from({ length: 16 }, (_, i) => {
        const t = i / 15
        const angle = Math.PI * t
        const cx = 160 + Math.cos(Math.PI - angle) * 100
        const cy = 105 - Math.sin(angle) * 90
        return <circle key={i} cx={cx} cy={cy} r={3.5} fill={i % 2 === 0 ? '#C4562F' : '#E4C572'} />
      })}

      {/* Diya / sacred fire */}
      <ellipse cx="160" cy="178" rx="10" ry="4" fill="#B98A2E" opacity={0.6} />
      <path d="M 155 178 Q 160 158 165 178" fill="#C4562F" opacity={0.9} />
      <ellipse cx="160" cy="172" rx="3" ry="5" fill="#E4C572" opacity={0.9} />

      {/* Lotus petals at base */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
        const r = (a * Math.PI) / 180
        return (
          <ellipse
            key={i}
            cx={160 + Math.cos(r) * 18}
            cy={190 + Math.sin(r) * 7}
            rx={5} ry={9}
            fill={i % 2 === 0 ? '#C4562F' : '#E4C572'}
            opacity={0.75}
            transform={`rotate(${a} ${160 + Math.cos(r) * 18} ${190 + Math.sin(r) * 7})`}
          />
        )
      })}
      <circle cx="160" cy="190" r="6" fill="#E4C572" />
      <circle cx="160" cy="190" r="3" fill="#7A1220" />

      {/* GROOM — left figure */}
      {/* Dhoti */}
      <path d="M 108 170 Q 100 140 104 120 L 118 120 Q 120 140 114 170 Z" fill="#FFF8EA" stroke="#B98A2E" strokeWidth="1" />
      {/* Kurta */}
      <path d="M 100 120 Q 102 100 111 96 Q 120 100 118 120 Z" fill="#7A1220" />
      {/* Sehra (veil) */}
      <path d="M 105 96 Q 111 88 117 96" fill="none" stroke="#E4C572" strokeWidth="2" />
      {[105, 108, 111, 114, 117].map((x, i) => (
        <line key={i} x1={x} y1="96" x2={x - 2} y2="108" stroke="#E4C572" strokeWidth="1.5" />
      ))}
      {/* Head */}
      <circle cx="111" cy="90" r="10" fill="#C4A882" />
      {/* Pagdi */}
      <path d="M 101 90 Q 104 80 118 84 Q 118 90 101 90 Z" fill="#7A1220" />
      {/* Arms reaching */}
      <path d="M 118 108 Q 130 112 138 118" stroke="#C4A882" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 100 108 Q 92 112 86 118" stroke="#C4A882" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* BRIDE — right figure */}
      {/* Saree */}
      <path d="M 212 170 Q 204 140 206 120 L 220 120 Q 222 140 216 170 Z" fill="#C4562F" stroke="#B98A2E" strokeWidth="1" />
      {/* Blouse */}
      <path d="M 204 120 Q 206 100 213 96 Q 222 100 220 120 Z" fill="#7A1220" />
      {/* Dupatta */}
      <path d="M 200 108 Q 213 114 226 108" fill="none" stroke="#E4C572" strokeWidth="2.5" />
      {/* Head */}
      <circle cx="213" cy="90" r="10" fill="#C4A882" />
      {/* Bindi */}
      <circle cx="213" cy="87" r="1.5" fill="#C4562F" />
      {/* Hair bun */}
      <path d="M 206 86 Q 210 78 220 82" fill="none" stroke="#3D1C0A" strokeWidth="3" strokeLinecap="round" />
      {/* Maang tikka */}
      <line x1="213" y1="80" x2="213" y2="76" stroke="#E4C572" strokeWidth="1.5" />
      <circle cx="213" cy="75" r="2" fill="#E4C572" />
      {/* Arms reaching */}
      <path d="M 206 108 Q 194 112 184 118" stroke="#C4A882" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 220 108 Q 228 112 234 118" stroke="#C4A882" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Varmala garland between them */}
      <path
        d="M 138 118 Q 160 108 184 118"
        fill="none" stroke="#E4C572" strokeWidth="2.5"
        strokeDasharray="4 2"
      />
      {[138, 148, 160, 172, 184].map((x, i) => {
        const y = 118 - Math.sin((i / 4) * Math.PI) * 10
        return <circle key={i} cx={x} cy={y} r={3} fill={i % 2 === 0 ? '#C4562F' : '#E4C572'} />
      })}

      {/* Mithila flowers — scattered */}
      <MithilaFlower cx={70} cy={100} r={8} />
      <MithilaFlower cx={250} cy={100} r={8} />
      <MithilaFlower cx={85} cy={50} r={6} />
      <MithilaFlower cx={235} cy={50} r={6} />
      <MithilaFlower cx={160} cy={30} r={7} />
    </svg>
  )
}

function MithilaFlower({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      {[0, 60, 120, 180, 240, 300].map((a, i) => {
        const rad = (a * Math.PI) / 180
        return (
          <ellipse
            key={i}
            cx={cx + Math.cos(rad) * r}
            cy={cy + Math.sin(rad) * r}
            rx={r * 0.55} ry={r * 0.9}
            fill={i % 2 === 0 ? '#C4562F' : '#E4C572'}
            opacity={0.8}
            transform={`rotate(${a} ${cx + Math.cos(rad) * r} ${cy + Math.sin(rad) * r})`}
          />
        )
      })}
      <circle cx={cx} cy={cy} r={r * 0.4} fill="#7A1220" />
    </g>
  )
}

/* ── Floating petals overlay ──────────────────────────────── */
const PETAL_DATA = [
  { left: '8%',  delay: 0,    dur: 3.5 },
  { left: '18%', delay: 0.4,  dur: 4.2 },
  { left: '30%', delay: 0.9,  dur: 3.8 },
  { left: '45%', delay: 0.2,  dur: 4.6 },
  { left: '55%', delay: 1.1,  dur: 3.2 },
  { left: '68%', delay: 0.6,  dur: 4.0 },
  { left: '78%', delay: 0.1,  dur: 3.6 },
  { left: '88%', delay: 0.8,  dur: 4.4 },
]

function FloatingPetals() {
  return (
    <>
      {PETAL_DATA.map((p, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -20,
            left: p.left,
            width: 9, height: 12,
            background: i % 3 === 0 ? '#FF91A4' : i % 3 === 1 ? '#E4C572' : '#C4562F',
            borderRadius: i % 2 === 0 ? '50% 0 50% 0' : '0 50% 0 50%',
            opacity: 0.6,
            animation: `petalFall ${p.dur}s ease-in ${p.delay}s infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )
}
