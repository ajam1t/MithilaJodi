/**
 * Card illustrations for the astrology hub — inline SVG, no image requests.
 * Each scene sits in a 200 × 140 box and is purely decorative.
 */
import type { ToolSlug } from '../tools'

type ArtSlug = Exclude<ToolSlug, 'kundli-match'>

function Sparkle({ x, y, s = 1, c = '#E8C878' }: { x: number; y: number; s?: number; c?: string }) {
  return <path d={`M${x} ${y - 5 * s}Q${x + 1 * s} ${y - 1 * s} ${x + 5 * s} ${y}Q${x + 1 * s} ${y + 1 * s} ${x} ${y + 5 * s}Q${x - 1 * s} ${y + 1 * s} ${x - 5 * s} ${y}Q${x - 1 * s} ${y - 1 * s} ${x} ${y - 5 * s}Z`} fill={c} />
}

/** Thin Mithila sprigs either side of a scene. */
function Sprigs() {
  return (
    <g fill="none" stroke="#C99532" strokeOpacity="0.45" strokeWidth="0.9" strokeLinecap="round">
      <path d="M16 118C20 96 14 80 22 58" /><path d="M20 100c-6-2-9-7-8-12 5 2 8 6 8 12ZM18 82c6-2 9-7 8-12-5 2-8 6-8 12Z" fill="#E8C878" fillOpacity="0.25" />
      <path d="M184 118c-4-22 2-38-6-60" /><path d="M180 100c6-2 9-7 8-12-5 2-8 6-8 12ZM182 82c-6-2-9-7-8-12 5 2 8 6 8 12Z" fill="#E8C878" fillOpacity="0.25" />
    </g>
  )
}

function Lotus({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-34 4c10-10 22-12 34-4C-12 10-24 10-34 4Z" fill="#7F9B57" />
      <path d="M34 4C24-6 12-8 0 0c12 10 24 10 34 4Z" fill="#6E8B4B" />
      <path d="M0 2C-20 0-30-10-30-22c14 0 26 8 30 24Z" fill="url(#lotusSide)" stroke="#C99532" strokeWidth="0.6" />
      <path d="M0 2C20 0 30-10 30-22 16-22 4-14 0 2Z" fill="url(#lotusSide)" stroke="#C99532" strokeWidth="0.6" />
      <path d="M0 2c-9-8-12-22-8-34 8 4 13 18 8 34Z" fill="url(#lotusMid)" stroke="#C99532" strokeWidth="0.6" />
      <path d="M0 2c9-8 12-22 8-34-8 4-13 18-8 34Z" fill="url(#lotusMid)" stroke="#C99532" strokeWidth="0.6" />
      <path d="M0 2C-5-10-5-26 0-38 5-26 5-10 0 2Z" fill="url(#lotusFront)" stroke="#C99532" strokeWidth="0.7" />
    </g>
  )
}

const LOTUS_DEFS = (
  <>
    <linearGradient id="lotusFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FCE3EA" /><stop offset="1" stopColor="#E98AA6" /></linearGradient>
    <linearGradient id="lotusMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F9D3DE" /><stop offset="1" stopColor="#D9708F" /></linearGradient>
    <linearGradient id="lotusSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4C2D0" /><stop offset="1" stopColor="#C85C7C" /></linearGradient>
  </>
)

function Nakshatra() {
  return (
    <>
      <defs>
        <radialGradient id="nkSky" cx="45%" cy="35%" r="70%"><stop offset="0" stopColor="#2E4580" /><stop offset="1" stopColor="#101A35" /></radialGradient>
        <linearGradient id="nkMoon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF1C2" /><stop offset="1" stopColor="#E0AE4A" /></linearGradient>
        <mask id="nkCrescent"><rect width="200" height="140" fill="#fff" /><circle cx="112" cy="50" r="21" fill="#000" /></mask>
        {LOTUS_DEFS}
      </defs>
      <Sprigs />
      <circle cx="100" cy="62" r="50" fill="url(#nkSky)" stroke="#C99532" strokeWidth="2" />
      <circle cx="100" cy="62" r="45" fill="none" stroke="#E8C878" strokeOpacity="0.35" strokeDasharray="1 3" />
      <circle cx="98" cy="58" r="25" fill="url(#nkMoon)" mask="url(#nkCrescent)" />
      <Sparkle x={124} y={36} s={1.1} /><Sparkle x={130} y={72} s={0.8} /><Sparkle x={72} y={40} s={0.7} /><Sparkle x={118} y={86} s={0.6} />
      <circle cx="80" cy="82" r="1.3" fill="#FFF1C2" /><circle cx="137" cy="55" r="1.1" fill="#FFF1C2" /><circle cx="66" cy="62" r="1" fill="#FFF1C2" />
      <Lotus x={100} y={120} s={0.95} />
    </>
  )
}

function Manglik() {
  return (
    <>
      <defs>
        <radialGradient id="mgMars" cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#F2905A" /><stop offset="0.55" stopColor="#C2461F" /><stop offset="1" stopColor="#6B1A0C" /></radialGradient>
        <radialGradient id="mgGlow" cx="50%" cy="50%" r="50%"><stop offset="0.6" stopColor="#E8912A" stopOpacity="0.25" /><stop offset="1" stopColor="#E8912A" stopOpacity="0" /></radialGradient>
      </defs>
      <Sprigs />
      <circle cx="100" cy="66" r="62" fill="url(#mgGlow)" />
      <circle cx="100" cy="66" r="56" fill="none" stroke="#C99532" strokeOpacity="0.7" />
      <circle cx="100" cy="66" r="48" fill="none" stroke="#C99532" strokeOpacity="0.4" strokeDasharray="2 3" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6
        return <path key={i} d={`M${100 + 48 * Math.cos(a)} ${66 + 48 * Math.sin(a)}L${100 + 56 * Math.cos(a)} ${66 + 56 * Math.sin(a)}`} stroke="#C99532" strokeOpacity="0.7" />
      })}
      <circle cx="100" cy="66" r="36" fill="url(#mgMars)" />
      <ellipse cx="88" cy="58" rx="7" ry="4" fill="#7E2410" opacity="0.35" /><ellipse cx="112" cy="78" rx="9" ry="5" fill="#7E2410" opacity="0.3" />
      <ellipse cx="108" cy="52" rx="4" ry="2.5" fill="#7E2410" opacity="0.3" /><ellipse cx="86" cy="80" rx="5" ry="3" fill="#7E2410" opacity="0.25" />
      <path d="M71 50c6-12 18-18 30-18" stroke="#FFD9B0" strokeOpacity="0.55" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <g stroke="#FCE7B4" strokeWidth="3" strokeLinecap="round" fill="none"><circle cx="97" cy="71" r="9" /><path d="M103.5 64.5 114 54M107 54h7v7" /></g>
      <Sparkle x={150} y={28} /><Sparkle x={48} y={36} s={0.8} /><Sparkle x={154} y={104} s={0.7} />
    </>
  )
}

function JanamKundli() {
  return (
    <>
      <defs>
        <linearGradient id="jkPaper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FBEBC4" /><stop offset="1" stopColor="#E6C88A" /></linearGradient>
        <linearGradient id="jkRoll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9C887" /><stop offset="0.5" stopColor="#FBEBC4" /><stop offset="1" stopColor="#C99A4E" /></linearGradient>
        <linearGradient id="jkQuill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9B2233" /><stop offset="1" stopColor="#4A0E16" /></linearGradient>
      </defs>
      <Sprigs />
      <rect x="54" y="18" width="92" height="98" fill="url(#jkPaper)" stroke="#B98A2E" strokeWidth="1" />
      <rect x="48" y="12" width="104" height="10" rx="5" fill="url(#jkRoll)" stroke="#A97A2E" strokeWidth="0.8" />
      <rect x="48" y="112" width="104" height="10" rx="5" fill="url(#jkRoll)" stroke="#A97A2E" strokeWidth="0.8" />
      <g fill="none" stroke="#8B1235" strokeWidth="1.4">
        <rect x="66" y="32" width="68" height="68" />
        <path d="M66 32l68 68M134 32l-68 68M100 32l34 34-34 34-34-34Z" />
      </g>
      <text x="100" y="52" textAnchor="middle" fontSize="13" fill="#8B1235" fontFamily="'Rozha One', serif">ॐ</text>
      <g fontSize="7" fill="#9B2233" fontFamily="'Rozha One', serif" textAnchor="middle">
        <text x="84" y="44">सू</text><text x="116" y="44">चं</text><text x="76" y="68">मं</text><text x="124" y="68">गु</text><text x="100" y="86">शु</text><text x="84" y="96">श</text><text x="116" y="96">बु</text>
      </g>
      <path d="M150 104c4-26 16-52 34-74-2 20-12 46-30 72Z" fill="url(#jkQuill)" />
      <path d="M150 104 180 34" stroke="#E8C878" strokeWidth="0.8" />
      <path d="M150 104l-3 10" stroke="#3A2730" strokeWidth="1.6" strokeLinecap="round" />
      <Sparkle x={40} y={30} s={0.8} /><Sparkle x={168} y={118} s={0.6} />
    </>
  )
}

function Rashi() {
  return (
    <>
      <defs>
        <radialGradient id="rsSky" cx="50%" cy="38%" r="70%"><stop offset="0" stopColor="#2B4A86" /><stop offset="1" stopColor="#101A35" /></radialGradient>
        <linearGradient id="rsMoon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF4CF" /><stop offset="1" stopColor="#E3B453" /></linearGradient>
        <mask id="rsCrescent"><rect width="200" height="140" fill="#fff" /><circle cx="88" cy="52" r="22" fill="#000" /></mask>
      </defs>
      <Sprigs />
      <circle cx="100" cy="60" r="50" fill="url(#rsSky)" stroke="#C99532" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6 - Math.PI / 2
        return <circle key={i} cx={100 + 44 * Math.cos(a)} cy={60 + 44 * Math.sin(a)} r="1.6" fill="#E8C878" />
      })}
      <circle cx="100" cy="60" r="44" fill="none" stroke="#E8C878" strokeOpacity="0.3" />
      <circle cx="104" cy="58" r="26" fill="url(#rsMoon)" mask="url(#rsCrescent)" />
      <path d="M116 62q3 3 6 0" stroke="#A9772A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Sparkle x={78} y={36} s={0.9} /><Sparkle x={72} y={74} s={0.6} /><Sparkle x={130} y={34} s={0.6} />
      <g fill="#FFFCF6" stroke="#E6D6BC" strokeWidth="0.8">
        <path d="M58 116c-12 0-14-14-2-15 1-9 14-11 18-3 9-5 19 2 16 10 8 1 8 8 0 8Z" />
        <path d="M108 118c-10 0-11-11-1-12 2-9 15-10 18-2 10-4 19 3 15 10 9 1 8 8 0 8Z" />
      </g>
    </>
  )
}

function VivahMuhurat() {
  return (
    <>
      <defs>
        <linearGradient id="vmPot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#A9661E" /><stop offset="0.45" stopColor="#F2C46A" /><stop offset="1" stopColor="#9A5B13" /></linearGradient>
        <radialGradient id="vmCoco" cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#C2461F" /><stop offset="1" stopColor="#7A1220" /></radialGradient>
        <radialGradient id="vmMari" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFC24A" /><stop offset="1" stopColor="#E8742A" /></radialGradient>
      </defs>
      <Sprigs />
      <g fill="#4E7A3A" stroke="#2F5427" strokeWidth="0.6">
        <path d="M100 44C84 40 66 30 56 18c18 0 34 10 44 26Z" /><path d="M100 44c16-4 34-14 44-26-18 0-34 10-44 26Z" />
        <path d="M100 42C88 32 80 18 80 4c12 8 20 22 20 38Z" fill="#5E8C45" /><path d="M100 42c12-10 20-24 20-38-12 8-20 22-20 38Z" fill="#5E8C45" />
      </g>
      <ellipse cx="100" cy="34" rx="15" ry="17" fill="url(#vmCoco)" />
      <path d="M90 26q10-8 20 0" stroke="#E8C878" strokeWidth="1.5" fill="none" />
      <path d="M78 52h44l-4 8H82Z" fill="url(#vmPot)" stroke="#8A5410" strokeWidth="0.8" />
      <path d="M70 84c0-16 12-26 30-26s30 10 30 26-12 30-30 30-30-14-30-30Z" fill="url(#vmPot)" stroke="#8A5410" strokeWidth="0.8" />
      <path d="M72 80h56" stroke="#9B2233" strokeWidth="5" />
      <path d="M72 80h56" stroke="#E8C878" strokeWidth="1" strokeDasharray="2 3" />
      <circle cx="100" cy="94" r="6" fill="none" stroke="#9B2233" strokeWidth="1.5" /><circle cx="100" cy="94" r="2" fill="#9B2233" />
      {[[62, 116], [80, 122], [120, 122], [138, 116], [100, 126]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === 4 ? 7 : 8} fill="url(#vmMari)" />
          <circle cx={x} cy={y} r={i === 4 ? 7 : 8} fill="none" stroke="#C0561A" strokeDasharray="2 1.5" strokeWidth="1.2" />
          <circle cx={x} cy={y} r="2.2" fill="#B34A24" />
        </g>
      ))}
      <path d="M52 112c-6-4-8-10-6-14 5 2 7 8 6 14ZM148 112c6-4 8-10 6-14-5 2-7 8-6 14Z" fill="#4E7A3A" />
      <Sparkle x={46} y={40} s={0.9} /><Sparkle x={154} y={46} s={0.8} /><Sparkle x={150} y={84} s={0.5} />
    </>
  )
}

function BabyNames() {
  return (
    <>
      <defs>
        {LOTUS_DEFS}
        <radialGradient id="bnHalo" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFF4D6" /><stop offset="1" stopColor="#FFF4D6" stopOpacity="0" /></radialGradient>
        <linearGradient id="bnFeather" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#2F7A6E" /><stop offset="1" stopColor="#6FB59A" /></linearGradient>
      </defs>
      <Sprigs />
      <circle cx="100" cy="66" r="52" fill="url(#bnHalo)" />
      <circle cx="100" cy="66" r="46" fill="none" stroke="#C99532" strokeOpacity="0.45" strokeDasharray="1 3" />
      {/* peacock feather */}
      <path d="M150 104C146 80 140 56 148 22" stroke="#7A5A1E" strokeWidth="1.4" fill="none" />
      <path d="M148 22c-14 8-18 26-10 40 6 10 16 4 18-6 4-14 2-26-8-34Z" fill="url(#bnFeather)" />
      <ellipse cx="148" cy="44" rx="9" ry="12" fill="#1F5F8F" /><ellipse cx="148" cy="46" rx="6" ry="8" fill="#2B8C7E" />
      <ellipse cx="148" cy="47" rx="3.5" ry="5" fill="#173A6E" /><ellipse cx="148" cy="47" rx="9" ry="12" fill="none" stroke="#E8C878" strokeWidth="1" />
      {/* swaddled baby */}
      <path d="M66 84c0-12 14-20 34-20s36 6 36 16-14 18-34 18-36-4-36-14Z" fill="#FBE3EA" stroke="#E2A6B8" strokeWidth="1" />
      <path d="M84 74c10 6 30 6 44 2" stroke="#E2A6B8" strokeWidth="1" fill="none" />
      <circle cx="78" cy="72" r="13" fill="#F3C9A6" stroke="#D9A57E" strokeWidth="0.8" />
      <path d="M68 66c4-8 14-10 20-4-6-2-12 0-14 4" fill="#5A3A2A" />
      <path d="M72 74q2 2 4 0M80 74q2 2 4 0" stroke="#7A4A35" strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="78" cy="79" r="1.2" fill="#D98C8C" />
      <Lotus x={100} y={122} s={0.9} />
      <circle cx="48" cy="40" r="11" fill="#FFFCF6" stroke="#C99532" />
      <text x="48" y="41" textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#8B1235" fontFamily="'Rozha One', serif">अ</text>
      <Sparkle x={62} y={22} s={0.7} /><Sparkle x={126} y={20} s={0.8} />
    </>
  )
}

function Compatibility() {
  return (
    <>
      <defs>
        <radialGradient id="cpDisc" cx="45%" cy="35%" r="70%"><stop offset="0" stopColor="#B12A45" /><stop offset="1" stopColor="#5A0E19" /></radialGradient>
        <linearGradient id="cpGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE7A6" /><stop offset="0.5" stopColor="#E0AE4A" /><stop offset="1" stopColor="#A97A2E" /></linearGradient>
        <radialGradient id="cpPlanet" cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#8A4A50" /><stop offset="1" stopColor="#2C0E14" /></radialGradient>
      </defs>
      <Sprigs />
      <circle cx="100" cy="62" r="50" fill="url(#cpDisc)" stroke="#C99532" strokeWidth="2" />
      <g stroke="#F1D58A" strokeOpacity="0.5" strokeWidth="0.7"><path d="M68 34 82 28 96 34M118 26l14 6 6 12M64 88l10 8" fill="none" /></g>
      {[[68, 34], [82, 28], [96, 34], [118, 26], [132, 32], [138, 44], [64, 88], [74, 96]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" fill="#FFE7A6" />)}
      <g fill="none" stroke="url(#cpGold)" strokeWidth="5" strokeLinejoin="round">
        <path d="M88 92C70 78 64 68 64 60c0-9 7-15 14-15 6 0 9 3 10 6 1-3 4-6 10-6 7 0 14 6 14 15 0 8-6 18-24 32Z" />
        <path d="M112 96C94 82 88 72 88 64c0-9 7-15 14-15 6 0 9 3 10 6 1-3 4-6 10-6 7 0 14 6 14 15 0 8-6 18-24 32Z" />
      </g>
      <circle cx="40" cy="76" r="12" fill="url(#cpPlanet)" /><circle cx="164" cy="52" r="10" fill="url(#cpPlanet)" />
      <Sparkle x={150} y={98} s={0.8} /><Sparkle x={52} y={30} s={0.7} />
    </>
  )
}

const SCENES: Record<ArtSlug, () => React.ReactElement> = {
  nakshatra: Nakshatra, manglik: Manglik, 'janam-kundli': JanamKundli, rashi: Rashi,
  'vivah-muhurat': VivahMuhurat, 'baby-names': BabyNames, compatibility: Compatibility,
}

export function ToolArt({ tool, className = '' }: { tool: ArtSlug; className?: string }) {
  const Scene = SCENES[tool]
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden="true" focusable="false">
      <Scene />
    </svg>
  )
}
