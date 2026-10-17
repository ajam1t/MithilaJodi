import { memo } from 'react'
import type { BiodataTemplateId } from '@/lib/biodataTemplates'
import {
  Branch, DotRow, EdgeVine, Fish, Flower, FlowerRow, LilyPad, LotusRosette, LotusSide, MoonFace,
  Parrot, Peacock, SunFace, TriangleBand, Waves,
  type FishPalette, type LotusPalette, type ParrotPalette, type PeacockPalette, type VinePalette,
} from './BiodataArt'

/**
 * The full-page artwork for each theme, drawn on a 210 × 297 mm canvas. Each
 * page of a biodata draws its own frame, so continuation pages are framed
 * exactly like the first. The art never depends on the biodata's content,
 * which is why it is memoised: typing in the form re-renders the text only.
 *
 * Every frame leaves the template's `safe` area (lib/biodataTemplates) clear
 * for content; the first-page title sits between the top corner pieces.
 */

const INK = '#3A2216'

// ── Mayur ──────────────────────────────────────────────────────────────────

const MAYUR_PEACOCK: PeacockPalette = {
  body: '#1D4F91', wing: '#2E7D4F', wingEdge: '#E3B341', tail: '#3F7D3A',
  eyeOuter: '#E3B341', eyeMid: '#2E7D4F', eyeInner: '#173E73',
  beak: '#D9772B', crest: '#E3B341', outline: INK, dots: '#BFD8F2',
}
const MAYUR_VINE: VinePalette = {
  stem: '#5B7A2E', leaf: '#4C8A3E', leafAlt: '#86A84C',
  flowerA: '#C2303A', flowerB: '#E3A72F', center: '#F6D47A', outline: INK, berry: '#C2303A',
}
const PARROT: ParrotPalette = {
  body: '#4C9A3E', wing: '#2E6B2F', tail: '#3F8A3A', tip: '#E3A72F',
  beak: '#C2303A', collar: '#C2303A', outline: INK, legs: '#D9772B',
}
const PINK_LOTUS: LotusPalette = { dark: '#C9425A', mid: '#E5708A', light: '#F4A9B8', sepal: '#4C8A3E', outline: '#5A1A22' }

function MayurFrame() {
  const maroon = '#7A1220', gold = '#B98A2E', leaf = '#4C8A3E'
  return (
    <>
      <rect x={4.5} y={4.5} width={201} height={288} fill="none" stroke={maroon} strokeWidth={0.9} />
      <rect x={6.1} y={6.1} width={197.8} height={284.8} fill="none" stroke={gold} strokeWidth={0.35} />
      <rect x={18.4} y={18.4} width={173.2} height={260.2} fill="none" stroke={gold} strokeWidth={0.35} />
      <rect x={19.8} y={19.8} width={170.4} height={257.4} fill="none" stroke={maroon} strokeWidth={0.7} />

      <EdgeVine x1={52} y1={12.3} x2={158} y2={12.3} c={MAYUR_VINE} />
      <EdgeVine x1={12.3} y1={54} x2={12.3} y2={252} c={MAYUR_VINE} />
      <EdgeVine x1={197.7} y1={54} x2={197.7} y2={252} c={MAYUR_VINE} />
      <EdgeVine x1={50} y1={284.7} x2={80} y2={284.7} c={MAYUR_VINE} />
      <EdgeVine x1={130} y1={284.7} x2={160} y2={284.7} c={MAYUR_VINE} />

      {/* Top centre medallion on the vine */}
      <circle cx={105} cy={12.3} r={5.2} fill="#FBF0DA" stroke={maroon} strokeWidth={0.5} />
      <Flower x={105} y={12.3} r={4.2} petals={8} petal="#C2303A" center="#F6D47A" stroke={INK} />

      {/* Lotuses at the middle of each side */}
      <LotusSide x={9.6} y={153} s={0.3} rotate={90} p={PINK_LOTUS} />
      <LotusSide x={200.4} y={153} s={0.3} rotate={-90} p={PINK_LOTUS} />

      {/* Top corners: peacocks perched on branches */}
      <Branch d="M3 46Q22 38 50 44" stem="#5B7A2E" leaf={leaf} outline={INK}
        leaves={[[12, 42.5, -125], [22, 40.5, -60], [40, 41.5, -115], [46, 43.5, 35]]} />
      <Peacock x={31} y={42} s={0.5} p={MAYUR_PEACOCK} />
      <Branch d="M207 46Q188 38 160 44" stem="#5B7A2E" leaf={leaf} outline={INK}
        leaves={[[198, 42.5, -55], [188, 40.5, -120], [170, 41.5, -65], [164, 43.5, 145]]} />
      <Peacock x={179} y={42} s={0.5} flip p={MAYUR_PEACOCK} />

      {/* Bottom corners: parrots */}
      <Branch d="M6 276Q24 268 52 272" stem="#5B7A2E" leaf={leaf} outline={INK}
        leaves={[[14, 272.5, 120], [46, 270.5, -40], [50, 271.5, 40]]} />
      <Parrot x={34} y={270} s={0.6} p={PARROT} />
      <Branch d="M204 276Q186 268 158 272" stem="#5B7A2E" leaf={leaf} outline={INK}
        leaves={[[196, 272.5, 60], [164, 270.5, -140], [160, 271.5, 140]]} />
      <Parrot x={176} y={270} s={0.6} flip p={PARROT} />

      {/* Bottom centre: lotus pond */}
      <LilyPad x={86} y={287.5} rx={8} ry={3} fill="#5E9A48" outline={INK} />
      <LilyPad x={124} y={287.5} rx={8} ry={3} fill="#5E9A48" outline={INK} />
      <LotusSide x={92} y={285} s={0.3} rotate={-28} p={PINK_LOTUS} />
      <LotusSide x={118} y={285} s={0.3} rotate={28} p={PINK_LOTUS} />
      <LotusSide x={105} y={287} s={0.72} p={PINK_LOTUS} />
    </>
  )
}

// ── Royal Kamal ────────────────────────────────────────────────────────────

const GOLD_PEACOCK: PeacockPalette = {
  body: '#D9AE4F', wing: '#EBCB7E', wingEdge: '#7A1220', tail: '#C9973A',
  eyeOuter: '#F1D58A', eyeMid: '#7A1220', eyeInner: '#4E0913',
  beak: '#B76E2A', crest: '#7A1220', outline: '#6B4410', dots: '#FFF4D6',
}
const ROYAL_LOTUS: LotusPalette = { dark: '#C9425A', mid: '#E5708A', light: '#F4A9B8', sepal: '#C99A3B', outline: '#7A1220' }

function KamalFrame() {
  const frame = '#6E0F1C', deep = '#4E0913', gold = '#D4A845', goldLt = '#F1D58A'
  const along = (from: number, to: number, step: number) => {
    const out: number[] = []
    for (let v = from; v <= to + 0.01; v += step) out.push(Math.round(v * 100) / 100)
    return out
  }
  const topXs = along(30, 180, 15).filter(x => Math.abs(x - 105) > 10)
  const sideYs = along(32, 265, 15.53)
  const rosette = (x: number, y: number, r: number, k: string) => (
    <LotusRosette key={k} x={x} y={y} r={r} outer={goldLt} inner={gold} center={frame} outline={deep} sw={0.22} />
  )
  const diamond = (x: number, y: number, k: string) => (
    <path key={k} d={`M${x} ${y - 1.3}L${x + 1.3} ${y}L${x} ${y + 1.3}L${x - 1.3} ${y}Z`} fill={goldLt} />
  )
  return (
    <>
      <path d="M0 0H210V297H0Z M16 16V281H194V16Z" fill={frame} fillRule="evenodd" />
      <rect x={2.4} y={2.4} width={205.2} height={292.2} fill="none" stroke={goldLt} strokeWidth={0.5} />
      <rect x={13.6} y={13.6} width={182.8} height={269.8} fill="none" stroke={goldLt} strokeWidth={0.5} />
      <rect x={16} y={16} width={178} height={265} fill="none" stroke={gold} strokeWidth={1} />
      <rect x={18} y={18} width={174} height={261} fill="none" stroke={gold} strokeWidth={0.35} />

      {topXs.map(x => rosette(x, 8, 3.5, `t${x}`))}
      {along(30, 180, 15).map(x => rosette(x, 289, 3.5, `b${x}`))}
      {sideYs.map(y => rosette(8, y, 3.5, `l${y}`))}
      {sideYs.map(y => rosette(202, y, 3.5, `r${y}`))}
      {along(37.5, 172.5, 15).filter(x => Math.abs(x - 105) > 12).map(x => diamond(x, 8, `td${x}`))}
      {along(37.5, 172.5, 15).map(x => diamond(x, 289, `bd${x}`))}
      {sideYs.slice(0, -1).map(y => diamond(8, y + 7.76, `ld${y}`))}
      {sideYs.slice(0, -1).map(y => diamond(202, y + 7.76, `rd${y}`))}

      {/* Corner medallions */}
      {[[8, 8], [202, 8], [8, 289], [202, 289]].map(([x, y]) => (
        <g key={`c${x}${y}`}>
          <circle cx={x} cy={y} r={8.6} fill={deep} stroke={goldLt} strokeWidth={0.6} />
          <circle cx={x} cy={y} r={7.4} fill="none" stroke={gold} strokeWidth={0.3} />
          <LotusRosette x={x} y={y} r={6.4} outer={goldLt} inner={gold} center={frame} outline={deep} sw={0.22} />
        </g>
      ))}

      {/* Top centre crest hanging from the band */}
      <path d="M93 16A12 6.6 0 0 0 117 16Z" fill={frame} stroke={goldLt} strokeWidth={0.7} />
      <circle cx={105} cy={8} r={6.6} fill={deep} stroke={goldLt} strokeWidth={0.6} />
      <LotusRosette x={105} y={8} r={5.6} outer={goldLt} inner={gold} center={frame} outline={deep} sw={0.22} />
      <circle cx={105} cy={18.6} r={1.5} fill={goldLt} />

      {/* Golden peacocks in the top corners of the panel */}
      <Branch d="M17 52Q34 45 58 50" stem={gold} leaf="#E2BE68" outline="#6B4410"
        leaves={[[24, 49.5, -120], [34, 47, -60], [50, 48.2, -110], [56, 49.5, 30]]} />
      <Peacock x={39} y={48.5} s={0.46} p={GOLD_PEACOCK} />
      <Branch d="M193 52Q176 45 152 50" stem={gold} leaf="#E2BE68" outline="#6B4410"
        leaves={[[186, 49.5, -60], [176, 47, -120], [160, 48.2, -70], [154, 49.5, 150]]} />
      <Peacock x={171} y={48.5} s={0.46} flip p={GOLD_PEACOCK} />

      {/* Bottom: gold flourishes and a lotus */}
      {[[19, 278, 0], [191, 278, 90]].map(([x, y, r]) => (
        <g key={`f${x}`} transform={`translate(${x} ${y}) rotate(${r === 0 ? -90 : 180})`} fill="none" stroke={gold}>
          <path d="M0 18C0 8 8 0 18 0" strokeWidth={0.8} />
          <path d="M0 12C0 5.5 5.5 0 12 0" strokeWidth={0.45} />
          <circle cx={5} cy={5} r={1.4} fill={gold} stroke="none" />
        </g>
      ))}
      <path d="M66 279Q84 268 96 278M144 279Q126 268 114 278" fill="none" stroke={gold} strokeWidth={0.7} />
      <LotusRosette x={62} y={278} r={3} outer={goldLt} inner={gold} center={frame} outline={deep} sw={0.2} />
      <LotusRosette x={148} y={278} r={3} outer={goldLt} inner={gold} center={frame} outline={deep} sw={0.2} />
      <LotusSide x={105} y={280} s={0.62} p={ROYAL_LOTUS} />
    </>
  )
}

// ── Matsya ─────────────────────────────────────────────────────────────────

const MATSYA_FISH: FishPalette = { body: '#E07B2E', fin: '#1F6F6A', scale: '#7A3A12', outline: '#2B2A1E' }
const MATSYA_FISH_ALT: FishPalette = { body: '#1F8A84', fin: '#E3A72F', scale: '#134E4A', outline: '#2B2A1E' }
const MATSYA_VINE: VinePalette = {
  stem: '#2F6B3A', leaf: '#4C8A3E', leafAlt: '#7FA34A',
  flowerA: '#E5708A', flowerB: '#F4A9B8', center: '#E3B341', outline: '#2B2A1E',
}
const MATSYA_LOTUS: LotusPalette = { dark: '#D24F6A', mid: '#E97E95', light: '#F6B4C1', sepal: '#3F7D3A', outline: '#5A1A22' }

function MatsyaFrame() {
  const green = '#1F5133', gold = '#B98A2E', water = '#2F7C8C'
  return (
    <>
      <rect x={4.5} y={4.5} width={201} height={288} fill="none" stroke={green} strokeWidth={0.9} />
      <rect x={6.1} y={6.1} width={197.8} height={284.8} fill="none" stroke={gold} strokeWidth={0.35} />
      <rect x={18.4} y={18.4} width={173.2} height={260.2} fill="none" stroke={gold} strokeWidth={0.35} />
      <rect x={19.8} y={19.8} width={170.4} height={257.4} fill="none" stroke={green} strokeWidth={0.7} />

      {/* Top band: water with fish */}
      {[9.6, 12.3, 15].map((y, i) => (
        <Waves key={`tw${y}`} x1={30} x2={180} y={y} w={7} h={1} color={water} sw={0.55} opacity={0.95 - i * 0.25} />
      ))}
      <Fish x={58} y={12.3} s={0.14} p={MATSYA_FISH} />
      <Fish x={80} y={12.3} s={0.12} flip p={MATSYA_FISH_ALT} />
      <Fish x={130} y={12.3} s={0.12} p={MATSYA_FISH_ALT} />
      <Fish x={152} y={12.3} s={0.14} flip p={MATSYA_FISH} />
      <circle cx={105} cy={12.3} r={5.6} fill="#FFF8E7" stroke={green} strokeWidth={0.5} />
      <LotusRosette x={105} y={12.3} r={4.6} outer="#E97E95" inner="#F6B4C1" center="#E3B341" outline="#5A1A22" sw={0.22} />

      {/* Sides: lotus-bud vines */}
      <EdgeVine x1={12.3} y1={30} x2={12.3} y2={267} c={MATSYA_VINE} flowerR={2} />
      <EdgeVine x1={197.7} y1={30} x2={197.7} y2={267} c={MATSYA_VINE} flowerR={2} />

      {/* Bottom band: water */}
      {[282.3, 285, 287.7].map((y, i) => (
        <Waves key={`bw${y}`} x1={30} x2={180} y={y} w={7} h={1} color={water} sw={0.55} opacity={0.95 - i * 0.25} />
      ))}

      {/* Corner medallions: a pair of fish */}
      {[[14, 14], [196, 14], [14, 283], [196, 283]].map(([x, y]) => (
        <g key={`m${x}${y}`}>
          <circle cx={x} cy={y} r={10.4} fill="#FFF8E7" stroke={green} strokeWidth={0.8} />
          <circle cx={x} cy={y} r={8.8} fill="none" stroke={gold} strokeWidth={0.35} />
          <Fish x={x} y={y - 3.4} s={0.165} p={MATSYA_FISH} />
          <Fish x={x} y={y + 3.4} s={0.165} flip p={MATSYA_FISH_ALT} />
        </g>
      ))}

      {/* Bottom centre: two fish greet a lotus */}
      <LilyPad x={90} y={284} rx={8} ry={3} fill="#5E9A48" outline="#2B2A1E" />
      <LilyPad x={120} y={284} rx={8} ry={3} fill="#5E9A48" outline="#2B2A1E" />
      <Fish x={78} y={272} s={0.4} p={MATSYA_FISH} />
      <Fish x={132} y={272} s={0.4} flip p={MATSYA_FISH_ALT} />
      <LotusSide x={105} y={281} s={0.52} p={MATSYA_LOTUS} />
    </>
  )
}

// ── Kohbar ─────────────────────────────────────────────────────────────────

const KOHBAR_LOTUS: LotusPalette = { dark: '#C0282D', mid: '#E5708A', light: '#F4A9B8', sepal: '#3F7D3A', outline: '#2A1A12' }
const KOHBAR_FISH: FishPalette = { body: '#E8A92A', fin: '#C0282D', scale: '#7A3A12', outline: '#2A1A12' }

function KohbarFrame() {
  const red = '#C0282D', yellow = '#E8A92A', black = '#2A1A12', green = '#3F7D3A', cream = '#FBEDD2'
  const edges = (inset: number) => {
    const a = inset, b = 210 - inset, c = 297 - inset
    return [[a, a, b, a], [b, a, b, c], [b, c, a, c], [a, c, a, a]] as const
  }
  return (
    <>
      {edges(3.5).map(([x1, y1, x2, y2], i) => (
        <TriangleBand key={`t${i}`} x1={x1} y1={y1} x2={x2} y2={y2} depth={5.6} size={6} a={red} b={yellow} outline={black} />
      ))}
      <rect x={10.3} y={10.3} width={189.4} height={276.4} fill="none" stroke={black} strokeWidth={0.4} />
      <rect x={12.9} y={12.9} width={184.2} height={271.2} fill="none" stroke={black} strokeWidth={0.4} />
      {edges(11.6).map(([x1, y1, x2, y2], i) => (
        <DotRow key={`d${i}`} x1={x1} y1={y1} x2={x2} y2={y2} gap={3} r={0.55} a={red} b={green} outline={black} />
      ))}
      {edges(16.6).map(([x1, y1, x2, y2], i) => (
        <FlowerRow key={`f${i}`} x1={x1} y1={y1} x2={x2} y2={y2} gap={8} r={1.9}
          a={red} b={yellow} leaf={green} center={yellow} outline={black} />
      ))}
      <rect x={20.4} y={20.4} width={169.2} height={256.2} fill="none" stroke={black} strokeWidth={0.55} />
      <rect x={21.3} y={21.3} width={167.4} height={254.4} fill="none" stroke={red} strokeWidth={0.35} />

      {/* Sun and moon in the top corners */}
      <circle cx={19} cy={19} r={17.4} fill={cream} stroke={black} strokeWidth={0.5} />
      <SunFace x={19} y={19} s={0.98} p={{ disc: yellow, rayA: red, rayB: '#F3C54B', lips: red, outline: black }} />
      <circle cx={191} cy={19} r={17.4} fill={cream} stroke={black} strokeWidth={0.5} />
      <MoonFace x={191} y={19} s={0.95} fill="#F6E7B8" star={yellow} outline={black} />

      {/* Bottom corners: parrots on branches */}
      <Branch d="M22 279Q40 272 60 277" stem={green} leaf="#4C8A3E" outline={black}
        leaves={[[28, 276, 120], [54, 274.8, -40], [58, 276, 35]]} />
      <Parrot x={40} y={275} s={0.55} p={PARROT} />
      <Branch d="M188 279Q170 272 150 277" stem={green} leaf="#4C8A3E" outline={black}
        leaves={[[182, 276, 60], [156, 274.8, -140], [152, 276, 145]]} />
      <Parrot x={170} y={275} s={0.55} flip p={PARROT} />

      {/* Bottom centre: lotus with two fish */}
      <Fish x={86} y={271} s={0.24} p={KOHBAR_FISH} />
      <Fish x={124} y={271} s={0.24} flip p={KOHBAR_FISH} />
      <LotusSide x={105} y={275} s={0.55} p={KOHBAR_LOTUS} />
    </>
  )
}

// ── Frame ──────────────────────────────────────────────────────────────────

export const FrameArt = memo(function FrameArt({ id }: { id: BiodataTemplateId }) {
  return (
    <svg
      viewBox="0 0 210 297"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
    >
      {id === 'mayur' && <MayurFrame />}
      {id === 'kamal' && <KamalFrame />}
      {id === 'matsya' && <MatsyaFrame />}
      {id === 'kohbar' && <KohbarFrame />}
    </svg>
  )
})
