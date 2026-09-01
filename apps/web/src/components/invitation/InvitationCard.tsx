import {
  display, formatWeddingDate, getTemplate, wrapText,
  SAMPLE_INVITATION, type InvitationData, type Palette, type TemplateId,
} from '@/lib/invitation'

/**
 * The invitation card, as pure SVG.
 *
 * This single component renders BOTH the on-screen preview and the downloaded
 * PNG (serialised → canvas → blob), so the two can never drift apart.
 *
 * Mithila Jodi branding is rendered here, inside the card, and is not driven by
 * any user input — so it is present on every template and cannot be removed
 * from a generated card.
 */

export const CARD_W = 1000
export const CARD_H = 1400

// ── Reusable motifs ────────────────────────────────────────────────────────

function Lotus({ x, y, r, stroke, fill, opacity = 1 }: {
  x: number; y: number; r: number; stroke: string; fill?: string; opacity?: number
}) {
  return (
    <g opacity={opacity}>
      {[0, 30, 60, 90, 120, 150].map((a) => (
        <ellipse
          key={a} cx={x} cy={y} rx={r * 0.3} ry={r}
          fill={fill ?? 'none'} fillOpacity={fill ? 0.35 : 0}
          stroke={stroke} strokeWidth={r * 0.07}
          transform={`rotate(${a} ${x} ${y})`}
        />
      ))}
      <circle cx={x} cy={y} r={r * 0.2} fill={stroke} opacity="0.7" />
    </g>
  )
}

function Fish({ x, y, s, stroke, fill, flip = false }: {
  x: number; y: number; s: number; stroke: string; fill: string; flip?: boolean
}) {
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
      <ellipse cx="0" cy="0" rx="34" ry="19" fill={fill} stroke={stroke} strokeWidth="2" />
      <path d="M32 0 L54 -15 L54 15 Z" fill={fill} stroke={stroke} strokeWidth="2" />
      <path d="M-34 0 q -10 -2 -16 3 q 8 4 16 2" fill={fill} stroke={stroke} strokeWidth="1.6" />
      <circle cx="-16" cy="-5" r="3.6" fill={stroke} />
      <path d="M-8 -16 q 14 -12 24 -2" fill="none" stroke={stroke} strokeWidth="1.8" />
      <path d="M-8 14 q 14 10 24 1" fill="none" stroke={stroke} strokeWidth="1.6" />
      {[-6, 6, 18].map((dx) => (
        <path key={dx} d={`M${dx} -12 q 4 12 0 24`} fill="none" stroke={stroke} strokeWidth="1.1" opacity="0.6" />
      ))}
    </g>
  )
}

function PeacockFeather({ x, y, s, angle, gold, accent }: {
  x: number; y: number; s: number; angle: number; gold: string; accent: string
}) {
  return (
    <g transform={`translate(${x},${y}) rotate(${angle}) scale(${s})`}>
      <path d="M0 0 C -4 -46 -14 -74 0 -104 C 14 -74 4 -46 0 0" fill="none" stroke={gold} strokeWidth="2" />
      <ellipse cx="0" cy="-104" rx="17" ry="23" fill={accent} fillOpacity="0.3" stroke={gold} strokeWidth="2" />
      <ellipse cx="0" cy="-106" rx="8.5" ry="12" fill={gold} fillOpacity="0.55" />
      <circle cx="0" cy="-107" r="4" fill={gold} />
      {[-1, 1].map((d) => (
        <path key={d} d={`M0 -60 q ${d * 22} -14 ${d * 12} -34`} fill="none" stroke={gold} strokeWidth="1.2" opacity="0.7" />
      ))}
    </g>
  )
}

/** Repeating Madhubani-style tick / hatch band. */
function TickBand({ y, w, count, color, h = 9 }: {
  y: number; w: number; count: number; color: string; h?: number
}) {
  const step = w / count
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <rect key={i} x={i * step} y={y} width={step * 0.5} height={h} fill={color} opacity={i % 2 ? 0.75 : 0.35} />
      ))}
    </g>
  )
}

// ── Per-template ornament layers ───────────────────────────────────────────

function Ornament({ id, p }: { id: TemplateId; p: Palette }) {
  // Shared inner paper panel with a fine gold rule.
  const panel = (inset: number, radius = 0) => (
    <>
      <rect
        x={inset} y={inset} width={CARD_W - inset * 2} height={CARD_H - inset * 2}
        rx={radius} fill={p.panel}
      />
      <rect
        x={inset + 14} y={inset + 14} width={CARD_W - (inset + 14) * 2} height={CARD_H - (inset + 14) * 2}
        rx={radius ? radius * 0.7 : 0} fill="none" stroke={p.gold} strokeWidth="2" opacity="0.55"
      />
    </>
  )

  switch (id) {
    case 'kohbar':
      return (
        <>
          {panel(34)}
          <TickBand y={34} w={CARD_W} count={40} color={p.gold} />
          <TickBand y={CARD_H - 43} w={CARD_W} count={40} color={p.gold} />
          {/* Kohbar lotus row */}
          <g opacity="0.9">
            {[290, 430, 570, 710].map((x) => (
              <Lotus key={x} x={x} y={150} r={40} stroke={p.gold} fill={p.accent} />
            ))}
            <Lotus x={500} y={150} r={0} stroke={p.gold} />
          </g>
          {/* connecting vine */}
          <path d="M120 150 q 60 -34 110 0 M770 150 q 60 -34 110 0" fill="none" stroke={p.gold} strokeWidth="2.4" opacity="0.7" />
          <path d="M100 210 q 200 40 400 0 t 400 0" fill="none" stroke={p.accent} strokeWidth="2" opacity="0.45" />
          {/* side vines */}
          {[86, CARD_W - 86].map((x) => (
            <g key={x}>
              <path d={`M${x} 300 q 18 130 0 260 q -18 130 0 260`} fill="none" stroke={p.gold} strokeWidth="2" opacity="0.5" />
              {[380, 560, 740, 920].map((y) => (
                <ellipse key={y} cx={x} cy={y} rx="7" ry="14" fill={p.accent} opacity="0.4" />
              ))}
            </g>
          ))}
          {/* bottom fish pair + lotus */}
          <Fish x={392} y={1215} s={0.95} stroke={p.gold} fill={p.accent} />
          <Fish x={608} y={1215} s={0.95} stroke={p.gold} fill={p.accent} flip />
          <Lotus x={500} y={1215} r={34} stroke={p.gold} fill={p.accent} />
          <path d="M150 1272 q 175 30 350 0 t 350 0" fill="none" stroke={p.gold} strokeWidth="2" opacity="0.6" />
        </>
      )

    case 'matsya':
      return (
        <>
          {panel(34)}
          <TickBand y={34} w={CARD_W} count={30} color={p.gold} h={7} />
          <TickBand y={CARD_H - 41} w={CARD_W} count={30} color={p.gold} h={7} />
          {/* facing fish */}
          <Fish x={378} y={168} s={1.35} stroke={p.gold} fill={p.accent} />
          <Fish x={622} y={168} s={1.35} stroke={p.gold} fill={p.accent} flip />
          <Lotus x={500} y={168} r={30} stroke={p.gold} fill={p.accent} opacity={0.9} />
          {/* water lines */}
          {[228, 246, 264].map((y, i) => (
            <path
              key={y} d={`M120 ${y} q 47 -14 95 0 t 95 0 t 95 0 t 95 0 t 95 0 t 95 0 t 95 0 t 95 0`}
              fill="none" stroke={p.gold} strokeWidth="2" opacity={0.5 - i * 0.13}
            />
          ))}
          {/* bottom reeds + waves */}
          {[1180, 1202, 1224].map((y, i) => (
            <path
              key={y} d={`M120 ${y} q 47 14 95 0 t 95 0 t 95 0 t 95 0 t 95 0 t 95 0 t 95 0 t 95 0`}
              fill="none" stroke={p.gold} strokeWidth="2" opacity={0.5 - i * 0.13}
            />
          ))}
          {[300, 700].map((x) => (
            <Lotus key={x} x={x} y={1272} r={26} stroke={p.gold} fill={p.accent} opacity={0.8} />
          ))}
          <Lotus x={500} y={1280} r={34} stroke={p.gold} fill={p.accent} />
        </>
      )

    case 'surya':
      return (
        <>
          {panel(34)}
          {/* sunburst arch */}
          <g>
            <circle cx={500} cy={196} r={62} fill={p.accent} opacity="0.9" />
            {Array.from({ length: 32 }, (_, i) => {
              const a = (i * 11.25 * Math.PI) / 180
              const inner = 76, outer = i % 2 ? 108 : 128
              return (
                <line
                  key={i}
                  x1={500 + inner * Math.cos(a)} y1={196 + inner * Math.sin(a)}
                  x2={500 + outer * Math.cos(a)} y2={196 + outer * Math.sin(a)}
                  stroke={p.gold} strokeWidth="3" strokeLinecap="round" opacity="0.8"
                />
              )
            })}
            <circle cx={500} cy={196} r={44} fill={p.gold} opacity="0.35" />
          </g>
          <TickBand y={CARD_H - 41} w={CARD_W} count={44} color={p.gold} h={7} />
          {/* aripan lattice base */}
          <g opacity="0.55">
            {Array.from({ length: 9 }, (_, i) => {
              const x = 180 + i * 80
              return (
                <g key={x}>
                  <path d={`M${x} 1196 L${x + 40} 1236 L${x} 1276 L${x - 40} 1236 Z`} fill="none" stroke={p.gold} strokeWidth="2" />
                  <circle cx={x} cy={1236} r="7" fill={p.accent} />
                </g>
              )
            })}
          </g>
          <path d="M120 1160 q 190 -28 380 0 t 380 0" fill="none" stroke={p.gold} strokeWidth="2.4" opacity="0.6" />
          {[140, CARD_W - 140].map((x) => (
            <Lotus key={x} x={x} y={1300} r={22} stroke={p.gold} fill={p.accent} opacity={0.7} />
          ))}
        </>
      )

    case 'mayur':
      return (
        <>
          {panel(30, 18)}
          {/* peacock feather arch */}
          <g>
            {[-52, -34, -17, 0, 17, 34, 52].map((angle, i) => (
              <PeacockFeather
                key={angle} x={500} y={262} s={0.92 - Math.abs(i - 3) * 0.05}
                angle={angle} gold={p.gold} accent={p.accent}
              />
            ))}
          </g>
          <path d="M150 290 q 175 34 350 0 t 350 0" fill="none" stroke={p.gold} strokeWidth="2.4" opacity="0.65" />
          {/* corner flourishes */}
          {[[92, 92, 0], [908, 92, 90], [908, 1308, 180], [92, 1308, 270]].map(([cx, cy, rot], i) => (
            <g key={i} transform={`translate(${cx},${cy}) rotate(${rot})`} opacity="0.7">
              <path d="M0 46 q 0 -46 46 -46" fill="none" stroke={p.gold} strokeWidth="2.4" />
              <path d="M0 30 q 0 -30 30 -30" fill="none" stroke={p.gold} strokeWidth="1.4" opacity="0.7" />
              <circle cx="16" cy="16" r="4.5" fill={p.gold} />
            </g>
          ))}
          {/* bottom paired peacock silhouettes (simplified) */}
          {[[404, false], [596, true]].map(([x, flip], i) => (
            <g key={i} transform={`translate(${x},1236) scale(${flip ? -1 : 1},1)`}>
              <path d="M0 0 q -22 -14 -14 -40 q 8 -24 30 -20 q 16 3 14 20 q -2 14 -14 14" fill="none" stroke={p.gold} strokeWidth="2.4" />
              <circle cx="26" cy="-44" r="4" fill={p.gold} />
              <path d="M30 -46 l 14 -4 l -12 8 Z" fill={p.accent} />
              <path d="M-10 -6 q -34 22 -50 6" fill="none" stroke={p.gold} strokeWidth="2" opacity="0.8" />
            </g>
          ))}
          <Lotus x={500} y={1230} r={30} stroke={p.gold} fill={p.accent} />
        </>
      )

    case 'modern':
      return (
        <>
          {panel(26, 10)}
          {/* hairline frame */}
          <rect x={62} y={62} width={CARD_W - 124} height={CARD_H - 124} fill="none" stroke={p.gold} strokeWidth="1.2" opacity="0.6" />
          <Lotus x={500} y={168} r={44} stroke={p.gold} opacity={0.9} />
          <line x1={330} y1={244} x2={670} y2={244} stroke={p.gold} strokeWidth="1.2" opacity="0.7" />
          <line x1={330} y1={1214} x2={670} y2={1214} stroke={p.gold} strokeWidth="1.2" opacity="0.7" />
          <Lotus x={500} y={1272} r={26} stroke={p.gold} opacity={0.8} />
        </>
      )
  }
}

// ── Card ──────────────────────────────────────────────────────────────────

export function InvitationCard({
  data,
  templateId,
  className,
}: {
  data: InvitationData
  templateId: TemplateId
  className?: string
}) {
  const t = getTemplate(templateId)
  const p = t.palette

  const bride = display(data.brideName, SAMPLE_INVITATION.brideName)
  const groom = display(data.groomName, SAMPLE_INVITATION.groomName)
  const dateText = formatWeddingDate(data.date)
  const time = data.time.trim()
  const venue = display(data.venue, SAMPLE_INVITATION.venue)
  const city = display(data.city, SAMPLE_INVITATION.city)

  const venueLines = wrapText(venue, 34, 2)
  const messageLines = wrapText(data.message, 52, 3)

  // Long names step down a size so they never overflow the card.
  const nameSize = (n: string) => (n.length > 16 ? 62 : n.length > 12 ? 74 : 86)

  return (
    <svg
      viewBox={`0 0 ${CARD_W} ${CARD_H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Wedding invitation for ${bride} and ${groom}`}
    >
      <rect width={CARD_W} height={CARD_H} fill={p.bg} />
      <Ornament id={t.id} p={p} />

      {/* ── Eyebrow ── */}
      <text
        x={500} y={352} textAnchor="middle" fill={p.gold}
        fontFamily={t.bodyFont} fontSize="25" letterSpacing="9"
      >
        SHUBH VIVAH
      </text>
      <text
        x={500} y={392} textAnchor="middle" fill={p.muted}
        fontFamily={t.bodyFont} fontSize="21" letterSpacing="2"
      >
        We joyfully invite you to the wedding of
      </text>

      {/* ── Names ── */}
      <text
        x={500} y={492} textAnchor="middle" fill={p.heading}
        fontFamily={t.headingFont} fontSize={nameSize(bride)}
      >
        {bride}
      </text>

      <g>
        <line x1={392} y1={534} x2={456} y2={534} stroke={p.gold} strokeWidth="1.6" opacity="0.8" />
        <text
          x={500} y={543} textAnchor="middle" fill={p.gold}
          fontFamily={t.headingFont} fontSize="34" fontStyle="italic"
        >
          weds
        </text>
        <line x1={544} y1={534} x2={608} y2={534} stroke={p.gold} strokeWidth="1.6" opacity="0.8" />
      </g>

      <text
        x={500} y={634} textAnchor="middle" fill={p.heading}
        fontFamily={t.headingFont} fontSize={nameSize(groom)}
      >
        {groom}
      </text>

      {/* ── Divider ── */}
      <g opacity="0.85">
        <line x1={300} y1={690} x2={470} y2={690} stroke={p.gold} strokeWidth="1.4" />
        <line x1={530} y1={690} x2={700} y2={690} stroke={p.gold} strokeWidth="1.4" />
        <path d="M500 678 L512 690 L500 702 L488 690 Z" fill={p.gold} />
      </g>

      {/* ── Date & time ── */}
      {dateText && (
        <text
          x={500} y={762} textAnchor="middle" fill={p.ink}
          fontFamily={t.headingFont} fontSize="40"
        >
          {dateText}
        </text>
      )}
      {time && (
        <text
          x={500} y={dateText ? 812 : 772} textAnchor="middle" fill={p.muted}
          fontFamily={t.bodyFont} fontSize="27" letterSpacing="1.5"
        >
          {time}
        </text>
      )}

      {/* ── Venue ── */}
      <g>
        {venueLines.map((line, i) => (
          <text
            key={i} x={500} y={896 + i * 42} textAnchor="middle" fill={p.ink}
            fontFamily={t.bodyFont} fontSize="30"
          >
            {line}
          </text>
        ))}
        <text
          x={500} y={896 + venueLines.length * 42 + 8} textAnchor="middle" fill={p.muted}
          fontFamily={t.bodyFont} fontSize="26" letterSpacing="2"
        >
          {city}
        </text>
      </g>

      {/* ── Family message ── */}
      {messageLines.length > 0 && (
        <g>
          {messageLines.map((line, i) => (
            <text
              key={i} x={500} y={1046 + i * 36} textAnchor="middle" fill={p.muted}
              fontFamily={t.headingFont} fontSize="25" fontStyle="italic"
            >
              {line}
            </text>
          ))}
        </g>
      )}

      {/*
        ── Mithila Jodi branding ──
        Rendered unconditionally, from no user input. Present on every template
        and included in every download/share.
      */}
      <g opacity="0.9">
        {/* x positions are pre-computed so the group reads as centred on 500 */}
        <text
          x={342} y={1344} textAnchor="start" fill={p.gold}
          fontFamily={t.bodyFont} fontSize="19" letterSpacing="2.5"
        >
          Made with
        </text>
        <path
          d="M0 0 c -3.4 -3.8 -9 -1.4 -9 3 c 0 4.2 5 7.4 9 11 c 4 -3.6 9 -6.8 9 -11 c 0 -4.4 -5.6 -6.8 -9 -3 z"
          transform="translate(466,1331) scale(0.95)"
          fill={p.accent}
        />
        <text
          x={485} y={1344} textAnchor="start" fill={p.gold}
          fontFamily={t.bodyFont} fontSize="19" letterSpacing="2.5"
        >
          on Mithila Jodi
        </text>
      </g>
    </svg>
  )
}
