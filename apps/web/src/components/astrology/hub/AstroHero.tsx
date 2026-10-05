import Link from 'next/link'
import { ZodiacWheel } from '../kundli/ZodiacWheel'
import { MithilaCouple } from './MithilaCouple'

// ─── Mithila skyline: palace domes, chhatris and temple shikharas ───────────

const BASE = 112
const block = (x: number, w: number, h: number) => `M${x} ${BASE}V${BASE - h}H${x + w}V${BASE}Z`
const dome = (cx: number, w: number, h: number, on = BASE) =>
  `M${cx - w / 2} ${on}C${cx - w / 2} ${on - h * 0.72} ${cx - w * 0.18} ${on - h} ${cx} ${on - h}C${cx + w * 0.18} ${on - h} ${cx + w / 2} ${on - h * 0.72} ${cx + w / 2} ${on}Z` +
  `M${cx - 0.9} ${on - h}h1.8v${-h * 0.32}h-1.8Z`
const shikhara = (cx: number, w: number, h: number) =>
  `M${cx - w / 2} ${BASE}C${cx - w / 2} ${BASE - h * 0.5} ${cx - w * 0.24} ${BASE - h * 0.9} ${cx} ${BASE - h}C${cx + w * 0.24} ${BASE - h * 0.9} ${cx + w / 2} ${BASE - h * 0.5} ${cx + w / 2} ${BASE}Z` +
  `M${cx - 5} ${BASE - h + 1}a5 2.6 0 1 0 10 0a5 2.6 0 1 0-10 0Z` +
  `M${cx - 0.7} ${BASE - h - 2}v-14h1.4l9 4-9 4v6Z`
const chhatri = (cx: number, w: number, top: number) =>
  `M${cx - w / 2} ${top}h${w}v3h-${w}Z` + dome(cx, w * 0.9, w * 0.7, top)
const tree = (cx: number, r: number) =>
  `M${cx - 1.5} ${BASE}v${-r * 1.2}h3v${r * 1.2}Z` +
  `M${cx} ${BASE - r * 2.6}a${r} ${r} 0 1 0 0.1 0Z` +
  `M${cx - r * 0.9} ${BASE - r * 1.8}a${r * 0.8} ${r * 0.8} 0 1 0 0.1 0ZM${cx + r * 0.9} ${BASE - r * 1.8}a${r * 0.8} ${r * 0.8} 0 1 0 0.1 0Z`

/** Distant palace and temples — the soft back layer. */
const FAR = [
  block(70, 300, 30), block(150, 140, 46), dome(220, 56, 44, BASE - 46), chhatri(160, 16, BASE - 46), chhatri(280, 16, BASE - 46),
  dome(100, 30, 22, BASE - 30), dome(340, 30, 22, BASE - 30), chhatri(80, 12, BASE - 30), chhatri(360, 12, BASE - 30),
  shikhara(520, 40, 70), block(495, 50, 16), shikhara(470, 22, 40), shikhara(570, 22, 40),
  block(860, 220, 26), dome(970, 64, 46, BASE - 26), dome(900, 30, 20, BASE - 26), dome(1040, 30, 20, BASE - 26),
  chhatri(880, 12, BASE - 26), chhatri(1060, 12, BASE - 26), shikhara(1150, 30, 56),
].join('')

/** Nearer ghats, a shrine and trees — the warmer front layer. */
const NEAR = [
  block(0, 120, 14), tree(24, 13), tree(58, 10), shikhara(110, 26, 46), block(96, 28, 10),
  block(380, 90, 10), tree(400, 9), chhatri(450, 18, BASE - 10),
  tree(700, 12), tree(730, 9),
  block(1100, 100, 14), tree(1120, 11), shikhara(1170, 24, 40),
].join('')

function Skyline() {
  return (
    <svg viewBox="0 0 1200 132" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[84px] sm:h-[112px] lg:h-[132px] w-full" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="adFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9BFA6" /><stop offset="1" stopColor="#E3B39B" /></linearGradient>
        <linearGradient id="adNear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CE927C" /><stop offset="1" stopColor="#B97A66" /></linearGradient>
        <linearGradient id="adRiver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F3C9A8" /><stop offset="0.5" stopColor="#F6DCC6" /><stop offset="1" stopColor="#FFF4E6" /></linearGradient>
        {[['lotusA', '#F4BFCB', '#D9708F']].map(([id, a, b]) => (
          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
        ))}
      </defs>
      <path d={FAR} fill="url(#adFar)" opacity="0.75" />
      <path d={NEAR} fill="url(#adNear)" opacity="0.8" />
      {/* the river, catching the sunrise */}
      <rect x="0" y={BASE} width="1200" height={132 - BASE} fill="url(#adRiver)" />
      <g stroke="#FFFDF7" strokeLinecap="round" opacity="0.9">
        {[[90, 118, 40], [260, 124, 60], [430, 119, 34], [640, 126, 52], [820, 120, 44], [1010, 125, 58], [1130, 118, 30]].map(([x, y, w]) => (
          <path key={x} d={`M${x} ${y}h${w}`} strokeWidth="1.4" />
        ))}
      </g>
      {/* floating lotus */}
      {[[180, 124, 1], [1050, 122, 0.85]].map(([x, y, s]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M-14 2c4-4 9-5 14-2-5 4-10 4-14 2Z" fill="#8FA86A" />
          <path d="M14 2C10-2 5-3 0 0c5 4 10 4 14 2Z" fill="#7E9A5C" />
          <path d="M0 1c-4-3-5-8-3-12 3 2 5 7 3 12Z" fill="url(#lotusA)" />
          <path d="M0 1c4-3 5-8 3-12-3 2-5 7-3 12Z" fill="url(#lotusA)" />
          <path d="M0 1C-2-4-2-9 0-13c2 4 2 9 0 14Z" fill="#FBDDE5" />
        </g>
      ))}
    </svg>
  )
}

/** The golden zodiac mandala, the sun, and the couple standing on the ghat. */
function Stage() {
  return (
    <div className="astro-stage pointer-events-none absolute bottom-[10px] right-[-36px] w-[214px] h-[250px] sm:bottom-[14px] sm:right-0 sm:w-[300px] sm:h-[330px] lg:right-[6%] lg:w-[380px] lg:h-[380px]" aria-hidden="true">
      {/* sunrise glow */}
      <div className="absolute left-1/2 top-[30%] aspect-square w-[96%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,224,170,0.95)_0%,rgba(250,196,146,0.6)_32%,rgba(247,216,194,0)_68%)]" />
      <div className="absolute left-1/2 top-[30%] aspect-square w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#FFF8E6_0%,#FFE7B5_45%,rgba(255,226,168,0)_72%)]" />
      {/* zodiac mandala, champagne gold, turning slowly */}
      <div className="absolute left-1/2 top-[30%] w-[92%] -translate-x-1/2 -translate-y-1/2 opacity-[0.55]">
        <div className="kd-wheel-spin"><ZodiacWheel size={380} decorative theme="light" /></div>
      </div>
      <svg viewBox="-100 -100 200 200" className="absolute left-1/2 top-[30%] w-[104%] -translate-x-1/2 -translate-y-1/2 opacity-60">
        <circle r="96" fill="none" stroke="#D8B76A" strokeWidth="0.6" strokeDasharray="0.6 3.2" />
        {Array.from({ length: 24 }, (_, i) => (
          <ellipse key={i} cx="0" cy="-92" rx="1.6" ry="4" fill="#D8B76A" opacity="0.7" transform={`rotate(${i * 15})`} />
        ))}
      </svg>
      {/* the couple */}
      <MithilaCouple className="absolute bottom-0 left-1/2 w-[64%] -translate-x-1/2 drop-shadow-[0_6px_10px_rgba(90,58,50,0.25)]" />
    </div>
  )
}

const TRUST = [
  { label: 'Authentic Vedic Methods', icon: 'M12 3c2 3 2 6 0 9-2-3-2-6 0-9Zm-7 5c3 0 6 2 7 5-3 0-6-2-7-5Zm14 0c-1 3-4 5-7 5 1-3 4-5 7-5ZM4 16h16' },
  { label: 'Simple & Easy to Use', icon: 'M5 12l4 4 10-10' },
  { label: '100% Private & Secure', icon: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z' },
]

/**
 * The hub hero: a Mithila sunrise — ivory sky warming to peach, a palace and
 * temples by the river, a faint golden zodiac around the sun, and a Maithil
 * couple on the ghat. Compact, so the eight tools follow at once.
 */
export function AstroHero() {
  return (
    <section className="astro-dawn relative overflow-hidden" aria-labelledby="astro-title">
      {/* soft clouds and the faintest stars */}
      <div className="astro-dawn-stars" aria-hidden="true" />
      <div className="astro-cloud left-[8%] top-[18%] w-[220px] h-[46px]" aria-hidden="true" />
      <div className="astro-cloud left-[42%] top-[10%] w-[180px] h-[38px] opacity-70" aria-hidden="true" />
      <div className="astro-cloud right-[4%] top-[26%] w-[200px] h-[40px] hidden sm:block" aria-hidden="true" />

      <Skyline />

      <div className="wrap relative h-[340px] sm:h-[380px] lg:h-[400px]">
        <Stage />

        <div className="relative z-10 pt-6 sm:pt-10 lg:pt-12 max-w-[64%] sm:max-w-[56%] lg:max-w-[50%]">
          <nav aria-label="Breadcrumb" className="hidden sm:block mb-3">
            <ol className="flex items-center gap-2 text-[12px] text-[#5A3A32]/75">
              <li><Link href="/" className="hover:text-maroon transition-colors">Home</Link></li>
              <li aria-hidden="true" className="text-[#C89B45]">›</li>
              <li className="text-[#8B1235]" aria-current="page">Astrology</li>
            </ol>
          </nav>
          <h1 id="astro-title" className="astro-maroon-text font-serif text-[31px] sm:text-[46px] lg:text-[58px] leading-[1.04]">
            Astrology &amp; Kundli
          </h1>
          {/* gold ornamental divider with a lotus */}
          <div className="mt-2.5 flex items-center gap-2" aria-hidden="true">
            <span className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-[#C89B45]" />
            <svg width="22" height="14" viewBox="0 0 22 14" fill="#C89B45"><path d="M11 0c2 3 2 7 0 10-2-3-2-7 0-10ZM4 5c3 0 6 2 7 5-3 0-6-2-7-5Zm14 0c-1 3-4 5-7 5 1-3 4-5 7-5ZM2 11h18v1H2Z" /></svg>
            <span className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-[#C89B45]" />
          </div>
          <p className="mt-2.5 font-serif text-[16px] sm:text-[21px] lg:text-[24px] text-[#681027] leading-snug">
            Traditional Mithila Jyotish, for a brighter tomorrow
          </p>
          <p className="mt-2 hidden sm:block text-[14px] lg:text-[16px] text-[#5A3A32] leading-relaxed max-w-[460px]">
            Explore powerful astrology tools based on authentic Vedic tradition.
          </p>
          <ul className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-x-5 gap-y-1.5 text-[12px] sm:text-[13px] text-[#5A3A32]">
            {TRUST.map(t => (
              <li key={t.label} className="flex items-center gap-2">
                <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full border border-[#D8B76A]/70 bg-[#FFFDF7]/80">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B1235" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={t.icon} /></svg>
                </span>
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* a fine gold border where the hero meets the tools */}
      <div className="relative h-[6px] bg-[linear-gradient(90deg,transparent,#D8B76A_20%,#C89B45_50%,#D8B76A_80%,transparent)] opacity-70" aria-hidden="true" />
    </section>
  )
}
