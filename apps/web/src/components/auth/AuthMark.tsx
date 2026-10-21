/**
 * The small aripan medallion that crowns every sign-in card — the same gold
 * line as the entrance's aripan (AuthWelcome), drawn in once. Decorative.
 */
const C = 40
const at = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [Math.round((C + r * Math.cos(a)) * 100) / 100, Math.round((C + r * Math.sin(a)) * 100) / 100] as const
}
function petal(r0: number, r1: number, deg: number, w: number) {
  const [x0, y0] = at(r0, deg), [x1, y1] = at(r1, deg)
  const m = (r0 + r1) / 2
  const [lx, ly] = at(m, deg - w), [rx, ry] = at(m, deg + w)
  return `M${x0} ${y0}Q${lx} ${ly} ${x1} ${y1}Q${rx} ${ry} ${x0} ${y0}Z`
}
const ring = (r: number) => `M${C} ${C - r}A${r} ${r} 0 1 1 ${C} ${C + r}A${r} ${r} 0 1 1 ${C} ${C - r}Z`
const PETALS = Array.from({ length: 8 }, (_, i) => petal(11, 30, i * 45, 16))
const DOTS = Array.from({ length: 16 }, (_, i) => at(34, i * 22.5 + 11.25))

export function AuthMark() {
  return (
    <span className="mj-auth-mark" aria-hidden="true">
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <path d={ring(38)} className="mj-entry-draw" pathLength={1} stroke="#B98A2E" strokeWidth="1" fill="#FFFAF0" />
        {PETALS.map((d, i) => (
          <path key={i} d={d} className="mj-entry-draw" pathLength={1} stroke="#B98A2E" strokeWidth="1.1" fill={i % 2 ? '#B98A2E' : '#9B2233'} fillOpacity=".14" style={{ animationDelay: `${120 + i * 50}ms` }} />
        ))}
        {DOTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill="#B98A2E" className="mj-entry-fade" style={{ animationDelay: `${500 + i * 15}ms` }} />)}
        <g className="mj-entry-fade" style={{ animationDelay: '650ms' }}>
          <path d="M40 31c3 3 3.6 6.6 0 10-3.6-3.4-3-7 0-10Z" fill="#9B2233" />
          <path d="M40 41c-3.6-.6-6.6-3-7.2-6.6 3.6 0 6 2.4 7.2 6.6Zm0 0c3.6-.6 6.6-3 7.2-6.6-3.6 0-6 2.4-7.2 6.6Z" fill="#B8323F" />
          <path d="M31.6 46c2.4-1.8 5.4-1.8 7.2 0-1.8 1.8-4.8 1.8-7.2 0Zm16.8 0c-2.4-1.8-5.4-1.8-7.2 0 1.8 1.8 4.8 1.8 7.2 0Z" fill="none" stroke="#B98A2E" strokeWidth="1" />
        </g>
      </svg>
    </span>
  )
}
