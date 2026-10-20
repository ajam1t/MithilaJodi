/**
 * The weight of each Ashtakoota koota, drawn as a blueprint: eight spokes whose
 * length is the koota's maximum points (Varna 1 … Nadi 8, 36 in all), on a
 * fine grid with dimension rings. It explains the scoring before anyone enters
 * a birth detail — it shows no one's result and invents nothing; the values
 * are the standard maxima listed in the table beside it.
 *
 * Server-rendered SVG. The lines draw in once when RevealOnScroll marks the
 * block .mj-in (globals.css); without motion, or before the script runs, the
 * drawing is simply complete.
 */
const KOOTAS: Array<[string, number]> = [
  ['Varna', 1], ['Vashya', 2], ['Tara', 3], ['Yoni', 4], ['Graha Maitri', 5], ['Gana', 6], ['Bhakoot', 7], ['Nadi', 8],
]
const C = 160, UNIT = 15 // px per point
const r2 = (n: number) => Math.round(n * 10) / 10
const at = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [r2(C + r * Math.cos(a)), r2(C + r * Math.sin(a))] as const
}

export function KootaBlueprint() {
  return (
    <figure data-mj-reveal className="mj-bp card overflow-hidden p-0">
      <div className="mj-bp-grid relative">
        <svg viewBox="-46 -4 412 330" className="mx-auto block w-full max-w-[460px]" role="img" aria-labelledby="bp-title bp-desc">
          <title id="bp-title">The eight kootas by weight</title>
          <desc id="bp-desc">Varna 1, Vashya 2, Tara 3, Yoni 4, Graha Maitri 5, Gana 6, Bhakoot 7 and Nadi 8 points — 36 in total.</desc>
          {/* dimension rings every 2 points */}
          {[2, 4, 6, 8].map(p => (
            <g key={p}>
              <circle cx={C} cy={C} r={p * UNIT} fill="none" stroke="#2E3A6E" strokeOpacity="0.22" strokeWidth="0.8" strokeDasharray={p === 8 ? undefined : '2 3'} />
              {/* labelled between Varna and Vashya, clear of every spoke */}
              <text x={at(p * UNIT, 22.5)[0] + 2} y={at(p * UNIT, 22.5)[1] - 2} fontSize="7.5" fill="#2E3A6E" fillOpacity="0.55" fontFamily="ui-monospace, monospace">{p}</text>
            </g>
          ))}
          {/* crosshair */}
          <path d={`M${C - 132} ${C}H${C + 132}M${C} ${C - 132}V${C + 132}`} stroke="#2E3A6E" strokeOpacity="0.12" strokeWidth="0.8" />
          {KOOTAS.map(([name, pts], i) => {
            const deg = i * 45
            const [x, y] = at(pts * UNIT, deg)
            const [lx, ly] = at(8 * UNIT + 20, deg)
            const anchor = Math.abs(lx - C) < 4 ? 'middle' : lx > C ? 'start' : 'end'
            const len = r2(pts * UNIT)
            return (
              <g key={name}>
                <path className="mj-bp-draw" d={`M${C} ${C}L${x} ${y}`} stroke="#7A1220" strokeWidth="2.2" strokeLinecap="round" style={{ ['--len' as string]: len, animationDelay: `${0.15 + i * 0.09}s` }} />
                <circle cx={x} cy={y} r="3.6" fill="#FFFAF0" stroke="#B98A2E" strokeWidth="1.6" />
                <path d={`M${x} ${y}L${lx} ${ly}`} stroke="#2E3A6E" strokeOpacity="0.25" strokeWidth="0.6" strokeDasharray="1.5 2.5" />
                <text x={lx} y={ly - 1} textAnchor={anchor} fontSize="11" fill="#7A1220" fontFamily="var(--font-marcellus), Georgia, serif">{name}</text>
                <text x={lx} y={ly + 10} textAnchor={anchor} fontSize="8.5" fill="#2E3A6E" fillOpacity="0.75" fontFamily="ui-monospace, monospace">{pts} pt{pts > 1 ? 's' : ''}</text>
              </g>
            )
          })}
          <circle cx={C} cy={C} r="15" fill="#7A1220" />
          <text x={C} y={C + 3.5} textAnchor="middle" fontSize="10" fontWeight="600" fill="#FBF1DD">36</text>
        </svg>
      </div>
      <figcaption className="border-t border-gold/20 px-4 py-3 text-center text-[12.5px] text-ink-soft">
        Each spoke is a koota’s maximum points. The heavier the koota, the more it moves the 36-point total.
      </figcaption>
    </figure>
  )
}
