'use client'

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { BiodataData, BiodataLanguage } from '@/lib/biodata'
import { BIODATA_LABELS } from '@/lib/biodata'
import {
  DEFAULT_PHOTO_STYLE, PHOTO_SHAPES, resolveBiodataTemplate,
  type BiodataPalette, type BiodataTemplate, type PhotoShape, type PhotoStyle,
} from '@/lib/biodataTemplates'
import { FrameArt } from './BiodataFrames'
import { SectionIcon, type SectionIconName } from './BiodataIcons'

/**
 * The printed biodata: one or more A4 pages, each with its theme's full
 * Madhubani frame (BiodataFrames) and the text inside the frame's safe area.
 *
 * Pagination is measured, not guessed. Every content block is rendered once,
 * invisibly, at the exact content width; its height decides which page it
 * goes on. A document a little too long for one page is scaled to fit rather
 * than spilling a single section onto a second sheet. The screen preview and
 * the print come from this one component, so the PDF is what the preview
 * shows.
 *
 * Inline styles throughout, because this output is a physical piece of paper
 * and must not depend on a utility class surviving a future Tailwind purge.
 * Shared by the public maker (client-rendered) and the member tool at
 * /biodata/preview/[id] (server-rendered, then measured on hydration).
 */

const PX_PER_MM = 96 / 25.4
const FOOTER_MM = 8
/**
 * A document only slightly too long for one page is eased onto it; anything
 * more goes onto further pages at full size rather than shrinking the text.
 */
const MIN_FIT = 0.93
const BLOCK_GAP = 10

const BODY_FONT = "var(--font-mukta), 'Mukta', 'Nirmala UI', 'Mangal', system-ui, sans-serif"
const LATIN_DISPLAY = "var(--font-marcellus), var(--font-rozha), Georgia, 'Nirmala UI', serif"
const DEVA_DISPLAY = "var(--font-rozha), var(--font-marcellus), 'Nirmala UI', serif"

const DOC_CSS = `
.bd-pages { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.bd-page, .bd-page * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media print {
  @page { size: A4; margin: 0; }
  .bd-measure { display: none !important; }
  .bd-pages { display: block !important; gap: 0 !important; }
  .bd-page { box-shadow: none !important; margin: 0 !important; height: 296.6mm !important; break-after: page; page-break-after: always; }
  .bd-page:last-child { break-after: auto; page-break-after: auto; }
  div:has(> .bd-doc) { padding: 0 !important; }
}
`

// ── Rows ───────────────────────────────────────────────────────────────────

type RowSpec = { label: string; value: string | null | undefined; wide?: boolean }

const hasValue = (v: unknown) => v != null && String(v).trim() !== ''

/** Label : value pairs, two to a line; long values take the full width. */
function Rows({ rows, p, cols = 2 }: { rows: RowSpec[]; p: BiodataPalette; cols?: 1 | 2 }) {
  const shown = rows.filter(r => hasValue(r.value))
  // A full-width row's label lines up with the half-width rows' labels.
  const wideLabel = cols === 2 ? 'calc((100% - 22px) / 2 * 0.42)' : '38%'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols === 2 ? '1fr 1fr' : '1fr', columnGap: 22, rowGap: 2, padding: '6px 8px 0' }}>
      {shown.map(r => {
        const wide = cols === 1 || r.wide || String(r.value).length > 26
        return (
          <div key={r.label} style={{ gridColumn: wide ? '1 / -1' : undefined, display: 'flex', alignItems: 'baseline', gap: 6, lineHeight: 1.4 }}>
            <span style={{ flex: `0 0 ${wide ? wideLabel : '42%'}`, color: p.inkSoft, fontSize: 12.5 }}>{r.label}</span>
            <span style={{ color: p.gold, fontWeight: 700 }}>:</span>
            <span style={{ flex: 1, minWidth: 0, color: p.ink, fontSize: 13.5, fontWeight: 500, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {r.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Headings ───────────────────────────────────────────────────────────────

const WAVE_PATH = `M0 3${' q3 -2.6 6 0 t6 0'.repeat(20)}`

function SectionHeading({ title, icon, t, font }: { title: string; icon: SectionIconName; t: BiodataTemplate; font: string }) {
  const p = t.palette
  const ic = <SectionIcon name={icon} size={13} />
  const text = (color: string, size = 15.5): CSSProperties => ({ fontFamily: font, fontSize: size, color, lineHeight: 1.25, letterSpacing: '0.01em' })

  switch (t.sectionStyle) {
    case 'pill':
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '2px 16px 2px 2px', borderRadius: 999,
          background: `linear-gradient(90deg, ${p.band} 0%, ${p.bandSoft} 72%, rgba(251,235,209,0) 100%)`,
          border: `0.8px solid ${p.gold}66`,
        }}>
          <span style={{ width: 24, height: 24, borderRadius: '50%', background: p.heading, color: p.goldLt, display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: `0 0 0 1.5px ${p.gold}` }}>{ic}</span>
          <span style={text(p.heading)}>{title}</span>
        </div>
      )
    case 'ribbon':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 26px 4px 16px', color: p.goldLt,
            background: `linear-gradient(180deg, ${p.heading} 0%, ${p.headingDeep} 100%)`,
            clipPath: 'polygon(0 0, 100% 0, calc(100% - 11px) 50%, 100% 100%, 0 100%, 9px 50%)',
            boxShadow: `inset 0 1.5px 0 ${p.gold}, inset 0 -1.5px 0 ${p.gold}`,
          }}>
            {ic}<span style={text(p.goldLt, 15)}>{title}</span>
          </span>
          <span style={{ flex: 1, height: 1.5, background: `linear-gradient(90deg, ${p.gold}, rgba(201,154,59,0))` }} />
        </div>
      )
    case 'wave':
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', border: `1.3px solid ${p.heading}`, background: p.bandSoft, color: p.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{ic}</span>
            <span style={text(p.heading, 16)}>{title}</span>
          </div>
          <svg width="100%" height="6" viewBox="0 0 240 6" preserveAspectRatio="none" aria-hidden="true" style={{ display: 'block', marginTop: 3 }}>
            <path d={WAVE_PATH} fill="none" stroke={p.gold} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      )
    case 'zigzag':
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: p.band, color: '#FFF4DC', borderTop: `1.5px solid ${p.ink}` }}>
            {ic}<span style={text('#FFF4DC', 15)}>{title}</span>
          </div>
          <div style={{
            height: 6, backgroundRepeat: 'repeat-x', backgroundSize: '8px 8px',
            backgroundImage: `linear-gradient(135deg, ${p.bandSoft} 50%, transparent 50%), linear-gradient(225deg, ${p.bandSoft} 50%, transparent 50%)`,
          }} />
        </div>
      )
  }
}

/** Gold rules either side of a small lotus — under the title and the hero. */
function Divider({ p, width = 210 }: { p: BiodataPalette; width?: number }) {
  return (
    <svg width={width} height={14} viewBox="0 0 210 14" aria-hidden="true" style={{ display: 'block', margin: '4px auto 0' }}>
      <path d="M10 7H88M122 7H200" stroke={p.gold} strokeWidth={1} />
      <path d="M32 7l3-2.4 3 2.4-3 2.4zM172 7l3-2.4 3 2.4-3 2.4z" fill={p.gold} />
      <circle cx={91.5} cy={7} r={1.5} fill={p.heading} />
      <circle cx={118.5} cy={7} r={1.5} fill={p.heading} />
      <path d="M105 11.5C99.5 10.5 96 7 95 3.8C99.5 4.6 103 7.5 105 11.5ZM105 11.5C110.5 10.5 114 7 115 3.8C110.5 4.6 107 7.5 105 11.5Z" fill={p.gold} />
      <path d="M105 1C108 3.6 108 8.8 105 11.5C102 8.8 102 3.6 105 1Z" fill={p.heading} />
    </svg>
  )
}

// ── Photo ──────────────────────────────────────────────────────────────────

function PhotoRing({ shape, W, H, pad, p }: { shape: PhotoShape; W: number; H: number; pad: number; p: BiodataPalette }) {
  const OW = W + pad * 2, OH = H + pad * 2
  const svg = (children: ReactNode) => (
    <svg width={OW} height={OH} viewBox={`0 0 ${OW} ${OH}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {children}
    </svg>
  )

  if (shape === 'round') {
    const c = OW / 2, R = W / 2
    return svg(
      <>
        <circle cx={c} cy={c} r={R + 2.2} fill="none" stroke={p.gold} strokeWidth={3.4} />
        <circle cx={c} cy={c} r={R + 5.6} fill="none" stroke={p.heading} strokeWidth={1.4} />
        {Array.from({ length: 32 }, (_, i) => {
          const a = (i * Math.PI * 2) / 32
          return <circle key={i} cx={c + Math.cos(a) * (R + 9.4)} cy={c + Math.sin(a) * (R + 9.4)} r={i % 2 ? 1.5 : 2} fill={i % 2 ? p.heading : p.gold} />
        })}
      </>,
    )
  }

  const outline = (d: number) => {
    const x0 = pad - d, y0 = pad - d, w = W + 2 * d, h = H + 2 * d
    if (shape === 'arch') {
      const ry = H * 0.4 + d, br = W * 0.06 + d
      return `M${x0} ${y0 + h - br}L${x0} ${y0 + ry}A${w / 2} ${ry} 0 0 1 ${x0 + w} ${y0 + ry}L${x0 + w} ${y0 + h - br}Q${x0 + w} ${y0 + h} ${x0 + w - br} ${y0 + h}L${x0 + br} ${y0 + h}Q${x0} ${y0 + h} ${x0} ${y0 + h - br}Z`
    }
    const r = W * 0.09 + d
    return `M${x0 + r} ${y0}H${x0 + w - r}Q${x0 + w} ${y0} ${x0 + w} ${y0 + r}V${y0 + h - r}Q${x0 + w} ${y0 + h} ${x0 + w - r} ${y0 + h}H${x0 + r}Q${x0} ${y0 + h} ${x0} ${y0 + h - r}V${y0 + r}Q${x0} ${y0} ${x0 + r} ${y0}Z`
  }
  const cx = OW / 2
  return svg(
    <>
      <path d={outline(2.2)} fill="none" stroke={p.gold} strokeWidth={3.4} />
      <path d={outline(5.6)} fill="none" stroke={p.heading} strokeWidth={1.4} />
      {shape === 'arch' ? (
        <path d={`M${cx} ${pad - 13}C${cx + 3.6} ${pad - 10} ${cx + 3.6} ${pad - 7.6} ${cx} ${pad - 5}C${cx - 3.6} ${pad - 7.6} ${cx - 3.6} ${pad - 10} ${cx} ${pad - 13}Z`} fill={p.gold} stroke={p.heading} strokeWidth={0.8} />
      ) : (
        [[pad - 5.6, pad - 5.6], [OW - pad + 5.6, pad - 5.6], [pad - 5.6, OH - pad + 5.6], [OW - pad + 5.6, OH - pad + 5.6]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.6} fill={p.gold} stroke={p.heading} strokeWidth={0.8} />
        ))
      )}
      {shape === 'arch' && [[pad - 5.6, OH - pad + 5.6], [OW - pad + 5.6, OH - pad + 5.6]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.4} fill={p.gold} stroke={p.heading} strokeWidth={0.8} />
      ))}
    </>,
  )
}

function PhotoFrame({ url, alt, style, p, width }: { url: string; alt: string; style: PhotoStyle; p: BiodataPalette; width: number }) {
  const shape = PHOTO_SHAPES[style.shape]
  const W = width, H = Math.round(width * shape.aspect), pad = 14
  return (
    <div style={{ position: 'relative', width: W + pad * 2, height: H + pad * 2, flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: pad, top: pad, width: W, height: H, borderRadius: shape.radius, overflow: 'hidden', background: p.bandSoft }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          style={{
            width: '100%', height: '100%', display: 'block', objectFit: 'cover',
            objectPosition: `${style.x}% ${style.y}%`,
            transform: `scale(${style.zoom})`, transformOrigin: `${style.x}% ${style.y}%`,
          }}
        />
      </div>
      <PhotoRing shape={style.shape} W={W} H={H} pad={pad} p={p} />
    </div>
  )
}

// ── Pagination ─────────────────────────────────────────────────────────────

type Plan = { scale: number; pages: number[][] }

function paginate(hs: number[], cap1: number, capN: number, forced: number): Plan {
  const total = hs.reduce((a, b) => a + b, 0)
  const all = hs.map((_, i) => i)
  if (total <= cap1) return { scale: 1, pages: [all] }
  if (total * MIN_FIT <= cap1) return { scale: Math.floor((cap1 / total) * 1000) / 1000, pages: [all] }
  const pages: number[][] = [[]]
  let used = 0, cap = cap1
  hs.forEach((h, i) => {
    const page = pages[pages.length - 1]
    if (i >= forced && page.length > 0 && used + h > cap) {
      pages.push([i]); used = h; cap = capN
    } else {
      page.push(i); used += h
    }
  })
  return { scale: 1, pages }
}

const samePlan = (a: Plan, b: Plan) => a.scale === b.scale && JSON.stringify(a.pages) === JSON.stringify(b.pages)

// ── Document ───────────────────────────────────────────────────────────────

export function BiodataDocument({
  data,
  language = 'en',
  photoUrl = null,
  photoStyle,
  templateSlug,
  variant = 'full',
}: {
  data: BiodataData
  language?: BiodataLanguage
  /** Either a signed profile-photo URL or a local object URL from a file input. */
  photoUrl?: string | null
  photoStyle?: PhotoStyle
  templateSlug?: string | null
  /** 'thumb' renders the first page only, unmeasured — for the design picker. */
  variant?: 'full' | 'thumb'
}) {
  const t = resolveBiodataTemplate(templateSlug)
  const p = t.palette
  const L = BIODATA_LABELS[language] ?? BIODATA_LABELS.en
  const titleFont = language === 'en' ? LATIN_DISPLAY : DEVA_DISPLAY
  const photo = photoStyle ?? DEFAULT_PHOTO_STYLE

  // ── Blocks, in reading order ──
  const blocks: Array<{ key: string; node: ReactNode }> = []

  blocks.push({
    key: 'header',
    node: (
      <div style={{ textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="Mithila Jodi" style={{ width: 40, height: 37, objectFit: 'contain', display: 'block', margin: '0 auto 2px' }} />
        {/* Not an <h1>: this document is embedded in /marriage-biodata, whose
            own heading is the page's H1. */}
        <p style={{ margin: 0, fontFamily: titleFont, fontSize: 29, lineHeight: 1.2, color: p.heading }}>{L.title}</p>
        <Divider p={p} />
      </div>
    ),
  })

  const facts = [data.age ? `${data.age} ${L.years}` : null, data.gender, data.religion, data.caste].filter(hasValue) as string[]
  const side = t.hero === 'side' && !!photoUrl
  const photoNode = photoUrl ? (
    <PhotoFrame url={photoUrl} alt={data.full_name ?? ''} style={photo} p={p} width={side ? (photo.shape === 'round' ? 132 : 118) : (photo.shape === 'round' ? 136 : 120)} />
  ) : null
  const nameNode = hasValue(data.full_name) ? (
    <p style={{ margin: 0, fontFamily: LATIN_DISPLAY, fontSize: 28, lineHeight: 1.2, color: p.heading }}>{data.full_name}</p>
  ) : null

  if (photoNode || nameNode || facts.length) {
    blocks.push({
      key: 'hero',
      node: side ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '0 6px' }}>
          {photoNode}
          <div style={{ flex: 1, minWidth: 0 }}>
            {nameNode}
            <div style={{ height: 1.5, margin: '7px 0 0', background: `linear-gradient(90deg, ${p.gold}, rgba(201,154,59,0))` }} />
            <Rows p={p} cols={1} rows={[
              { label: L.age, value: data.age ? `${data.age} ${L.years}` : null },
              { label: L.gender, value: data.gender },
              { label: L.religion, value: data.religion },
              { label: L.caste, value: data.caste },
            ]} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {photoNode}
          {nameNode && <div style={{ marginTop: photoNode ? 4 : 0 }}>{nameNode}</div>}
          {facts.length > 0 && (
            <div style={{ marginTop: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 10, rowGap: 2, fontSize: 13.5, color: p.ink }}>
              {facts.map((x, i) => (
                <Fragment key={i}>
                  {i > 0 && <span aria-hidden="true" style={{ width: 5, height: 5, background: p.gold, transform: 'rotate(45deg)', display: 'inline-block' }} />}
                  <span>{x}</span>
                </Fragment>
              ))}
            </div>
          )}
        </div>
      ),
    })
  }

  const sections: Array<{ key: string; icon: SectionIconName; title: string; rows?: RowSpec[]; text?: string | null }> = [
    {
      key: 'community', icon: 'diya', title: L.community, rows: [
        { label: L.sub_caste, value: data.sub_caste }, { label: L.self_gotra, value: data.self_gotra },
        { label: L.maternal_gotra, value: data.maternal_gotra }, { label: L.mool, value: data.mool },
        { label: L.gram, value: data.gram },
      ],
    },
    {
      key: 'personal', icon: 'person', title: L.personal, rows: [
        { label: L.marital_status, value: data.marital_status }, { label: L.mother_tongue, value: data.mother_tongue },
        { label: L.dob, value: data.dob }, { label: L.height, value: data.height },
        { label: L.complexion, value: data.complexion },
        { label: L.diet, value: data.diet }, { label: L.smoking, value: data.smoking }, { label: L.drinking, value: data.drinking },
      ],
    },
    {
      key: 'career', icon: 'career', title: L.career, rows: [
        { label: L.education, value: data.education, wide: true }, { label: L.profession, value: data.profession },
        { label: L.employer, value: data.employer }, { label: L.income, value: data.income },
      ],
    },
    {
      key: 'location', icon: 'location', title: L.location, rows: [
        { label: L.current_location, value: data.current_location }, { label: L.native_place, value: data.native_place },
      ],
    },
    { key: 'about', icon: 'heart', title: L.about, text: data.about_me },
    {
      key: 'family', icon: 'family', title: L.family, rows: [
        { label: L.father_name, value: data.father_name }, { label: L.mother_name, value: data.mother_name },
        { label: L.family_type, value: data.family_type }, { label: L.managed_by, value: data.managed_by },
        { label: L.family_values, value: data.family_values },
        { label: L.parents, value: data.parents, wide: true }, { label: L.siblings, value: data.siblings, wide: true },
        { label: L.expectations, value: data.expectations, wide: true }, { label: L.family, value: data.family_about, wide: true },
        { label: L.family_introduction, value: data.family_introduction, wide: true },
      ],
    },
    {
      key: 'astrology', icon: 'sun', title: L.astrology, rows: [
        { label: L.rashi, value: data.rashi }, { label: L.nakshatra, value: data.nakshatra },
        { label: L.mangalik, value: data.mangalik }, { label: L.birth_time, value: data.birth_time },
        { label: L.birth_place, value: data.birth_place }, { label: L.kundli, value: data.kundli, wide: true },
      ],
    },
    {
      key: 'contact', icon: 'phone', title: L.contact, rows: [
        { label: L.mobile, value: data.mobile }, { label: L.email, value: data.email },
        { label: L.address, value: data.address, wide: true },
      ],
    },
  ]

  const visible = new Map(
    sections.filter(s => (s.rows ? s.rows.some(r => hasValue(r.value)) : hasValue(s.text))).map(s => [s.key, s]),
  )
  const renderSection = (s: (typeof sections)[number], cols: 1 | 2) => (
    <div>
      <SectionHeading title={s.title} icon={s.icon} t={t} font={titleFont} />
      {s.rows
        ? <Rows rows={s.rows} p={p} cols={cols} />
        : <p style={{ margin: 0, padding: '6px 8px 0', fontSize: 13.5, lineHeight: 1.55, color: p.ink, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{s.text}</p>}
    </div>
  )

  /**
   * A full-width section as one or more blocks, so long writing can continue
   * on the next page instead of being cut off at the bottom of this one: About
   * Me breaks between paragraphs, and family descriptions row by row. The
   * heading always stays with the first part.
   */
  const splitSection = (s: (typeof sections)[number]): Array<{ key: string; node: ReactNode }> => {
    const textStyle: CSSProperties = { margin: 0, padding: '6px 8px 0', fontSize: 13.5, lineHeight: 1.55, color: p.ink, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }
    if (!s.rows) {
      const paras = String(s.text ?? '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean)
      if (paras.length < 2) return [{ key: s.key, node: renderSection(s, 2) }]
      return paras.map((para, i) => ({
        key: `${s.key}-${i}`,
        node: i === 0
          ? <div><SectionHeading title={s.title} icon={s.icon} t={t} font={titleFont} /><p style={textStyle}>{para}</p></div>
          : <p style={{ ...textStyle, paddingTop: 0 }}>{para}</p>,
      }))
    }
    const filled = s.rows.filter(r => hasValue(r.value))
    const long = filled.filter(r => String(r.value).length > 160)
    if (long.length < 2) return [{ key: s.key, node: renderSection(s, 2) }]
    const first = filled.filter(r => !long.includes(r)).concat(long[0])
    return [
      { key: s.key, node: renderSection({ ...s, rows: first }, 2) },
      ...long.slice(1).map((r, i) => ({ key: `${s.key}-${i + 1}`, node: <Rows rows={[r]} p={p} cols={2} /> })),
    ]
  }

  // Short sections sit side by side, A4 is wide enough; long ones span the page.
  // Gotra, mool and gram stay near the top, as the public page promises.
  const LAYOUT: Array<{ left: string[]; right?: string[] }> = [
    { left: ['personal'], right: ['community', 'location'] },
    { left: ['career'], right: ['astrology'] },
    { left: ['about'] },
    { left: ['family'] },
    { left: ['contact'] },
  ]
  for (const row of LAYOUT) {
    const left = row.left.map(k => visible.get(k)).filter(Boolean) as Array<(typeof sections)[number]>
    const right = (row.right ?? []).map(k => visible.get(k)).filter(Boolean) as Array<(typeof sections)[number]>
    if (left.length && right.length) {
      const column = (list: typeof left) => (
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: BLOCK_GAP }}>
          {list.map(s => <Fragment key={s.key}>{renderSection(s, 1)}</Fragment>)}
        </div>
      )
      blocks.push({
        key: [...left, ...right].map(s => s.key).join('+'),
        node: <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>{column(left)}{column(right)}</div>,
      })
    } else {
      for (const s of [...left, ...right]) blocks.push(...splitSection(s))
    }
  }

  // ── Measure and paginate ──
  const forced = blocks.filter(b => b.key === 'header' || b.key === 'hero').length
  const contentW = (210 - 2 * t.safe.side) * PX_PER_MM
  const cap1 = (297 - t.safe.top - t.safe.bottom - FOOTER_MM) * PX_PER_MM
  const capN = (297 - t.safe.contTop - t.safe.bottom - FOOTER_MM) * PX_PER_MM
  const measureRef = useRef<HTMLDivElement>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const signature = `${t.id}|${language}|${photoUrl ? photo.shape : '-'}|${JSON.stringify(data)}`

  const measure = useCallback(() => {
    const el = measureRef.current
    if (!el) return
    // offsetHeight is layout size, unaffected by the preview's scale transform.
    const hs = Array.from(el.children).map(c => (c as HTMLElement).offsetHeight)
    if (!hs.length || hs.every(h => h === 0)) return
    const next = paginate(hs, cap1, capN, forced)
    setPlan(prev => (prev && samePlan(prev, next) ? prev : next))
  }, [cap1, capN, forced])

  useLayoutEffect(() => {
    if (variant === 'full') measure()
  }, [variant, measure, signature])

  // Web fonts change line heights once they arrive; measure again then.
  useEffect(() => {
    if (variant !== 'full' || typeof document === 'undefined' || !document.fonts) return
    let alive = true
    document.fonts.ready.then(() => { if (alive) measure() })
    const onDone = () => measure()
    document.fonts.addEventListener('loadingdone', onDone)
    return () => { alive = false; document.fonts.removeEventListener('loadingdone', onDone) }
  }, [variant, measure, signature])

  const planFits = variant === 'full' && plan && plan.pages.flat().length === blocks.length
  const pages = planFits ? plan.pages : [blocks.map((_, i) => i)]
  const scale = planFits ? plan.scale : 1
  const shown = variant === 'thumb' ? pages.slice(0, 1) : pages

  return (
    <div className="bd-doc" data-template={t.id} style={{ position: 'relative' }}>
      <style>{DOC_CSS}</style>

      {variant === 'full' && (
        <div
          ref={measureRef}
          className="bd-measure"
          aria-hidden="true"
          style={{ position: 'absolute', left: 0, top: 0, width: contentW, height: 0, overflow: 'hidden', visibility: 'hidden', pointerEvents: 'none', fontFamily: BODY_FONT, color: p.ink }}
        >
          {blocks.map(b => <div key={b.key} style={{ paddingBottom: BLOCK_GAP }}>{b.node}</div>)}
        </div>
      )}

      <div className="bd-pages">
        {shown.map((idxs, pi) => (
          <div
            key={pi}
            className="bd-page"
            style={{
              position: 'relative', width: '210mm', height: '297mm', overflow: 'hidden', flexShrink: 0,
              background: p.paper, fontFamily: BODY_FONT, color: p.ink,
              boxShadow: variant === 'full' ? '0 2px 22px rgba(60,30,10,0.18)' : 'none',
            }}
          >
            <FrameArt id={t.id} />
            <div style={{ position: 'absolute', left: `${t.safe.side}mm`, right: `${t.safe.side}mm`, top: `${pi === 0 ? t.safe.top : t.safe.contTop}mm`, bottom: `${t.safe.bottom}mm` }}>
              <div style={pi === 0 && scale < 1 ? { width: contentW / scale, transform: `scale(${scale})`, transformOrigin: 'top left' } : undefined}>
                {idxs.map(i => <div key={blocks[i].key} style={{ paddingBottom: BLOCK_GAP }}>{blocks[i].node}</div>)}
              </div>
              <p style={{ position: 'absolute', left: 0, right: 0, bottom: 0, margin: 0, textAlign: 'center', fontSize: 10.5, letterSpacing: '0.03em', color: p.heading }}>
                Created with <strong style={{ fontWeight: 600 }}>Mithila Jodi</strong>
                <span style={{ color: p.inkSoft }}> · mithilajodi.com</span>
                {shown.length > 1 && <span style={{ color: p.inkSoft }}> · {pi + 1} / {shown.length}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BiodataDocument
