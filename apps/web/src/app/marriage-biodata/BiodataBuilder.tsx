'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import Link from 'next/link'
import { BiodataDocument } from '@/components/biodata/BiodataDocument'
import { BiodataTemplatePicker } from '@/components/biodata/BiodataTemplatePicker'
import {
  BIODATA_TEMPLATES, DEFAULT_PHOTO_STYLE, PHOTO_SHAPES,
  type BiodataTemplateId, type PhotoShape, type PhotoStyle,
} from '@/lib/biodataTemplates'
import { track } from '@/lib/track'
import {
  BIODATA_LANGUAGES, biodataFileName, computeAge,
  type BiodataData, type BiodataLanguage,
} from '@/lib/biodata'

/**
 * Public biodata maker.
 *
 * Everything happens in the browser. Nothing typed here is sent to a server —
 * no draft rows, no analytics payload, no photo upload — and the page says so
 * where a visitor can see it before they start typing.
 *
 * That is a deliberate constraint, not an implementation shortcut. This page is
 * open to anyone, and people will fill it with a full name, mobile number,
 * home address, date and time of birth, and their parents' names. Accepting
 * that from someone who has not created an account and has agreed to nothing
 * would be collecting personal data with no lawful basis, no consent record and
 * no retention policy — and the Privacy Policy does not cover it. Keeping it
 * client-side removes the question entirely.
 *
 * The one thing a visitor loses is that closing the tab loses the draft, which
 * is what the "create a free account" prompt is for.
 *
 * Flow: Step 1 picks a design (BiodataTemplatePicker); step 2 combines "add
 * your details" and "preview and download" into one screen, since the live
 * preview beside the form already shows the exact document that downloads —
 * a separate preview-only step would just be the same screen with the form
 * hidden.
 */

type FieldSpec = {
  key: keyof BiodataData
  label: string
  placeholder?: string
  type?: 'text' | 'date' | 'tel' | 'email' | 'textarea'
  half?: boolean
}

type CategoryId = 'personal' | 'family' | 'cultural' | 'contact'

type GroupSpec = {
  id: string
  category: CategoryId
  title: string
  hint?: string
  fields: FieldSpec[]
}

const CATEGORIES: { id: CategoryId; title: string; hint?: string }[] = [
  { id: 'personal', title: 'Personal Information' },
  { id: 'family', title: 'Family Information' },
  { id: 'cultural', title: 'Mithila Cultural Details', hint: 'Gotra, mool and gram, plus horoscope — the fields Maithil families ask for first.' },
  { id: 'contact', title: 'Contact Details', hint: 'Only add what you are comfortable sharing with the families who receive this.' },
]

const GROUPS: GroupSpec[] = [
  {
    id: 'basic',
    category: 'personal',
    title: 'Basic details',
    fields: [
      { key: 'full_name', label: 'Full name', placeholder: 'Priya Jha' },
      { key: 'dob', label: 'Date of birth', type: 'date', half: true },
      { key: 'gender', label: 'Gender', placeholder: 'Female', half: true },
      { key: 'height', label: 'Height', placeholder: `5'4" (162 cm)`, half: true },
      { key: 'marital_status', label: 'Marital status', placeholder: 'Never married', half: true },
      { key: 'complexion', label: 'Complexion', placeholder: 'Fair', half: true },
      { key: 'blood_group', label: 'Blood group', placeholder: 'B+', half: true },
    ],
  },
  {
    id: 'community',
    category: 'cultural',
    title: 'Community & roots',
    fields: [
      { key: 'religion', label: 'Religion', placeholder: 'Hindu', half: true },
      { key: 'caste', label: 'Caste', placeholder: 'Maithil Brahmin', half: true },
      { key: 'sub_caste', label: 'Sub-caste', placeholder: 'Shrotriya', half: true },
      { key: 'mother_tongue', label: 'Mother tongue', placeholder: 'Maithili', half: true },
      { key: 'self_gotra', label: 'Gotra', placeholder: 'Kashyap', half: true },
      { key: 'maternal_gotra', label: 'Maternal gotra', placeholder: 'Vatsa', half: true },
      { key: 'mool', label: 'Mool', placeholder: 'Saurath', half: true },
      { key: 'gram', label: 'Gram (ancestral village)', placeholder: 'Rajnagar', half: true },
    ],
  },
  {
    id: 'career',
    category: 'personal',
    title: 'Education & career',
    fields: [
      { key: 'education', label: 'Education', placeholder: 'B.Tech, Computer Science — NIT Patna' },
      { key: 'profession', label: 'Profession', placeholder: 'Software Engineer' },
      { key: 'employer', label: 'Employer', placeholder: 'Tata Consultancy Services', half: true },
      { key: 'income', label: 'Annual income', placeholder: '₹12 LPA', half: true },
    ],
  },
  {
    id: 'location',
    category: 'personal',
    title: 'Location',
    fields: [
      { key: 'current_location', label: 'Currently living in', placeholder: 'Mumbai', half: true },
      { key: 'native_place', label: 'Native place', placeholder: 'Madhubani', half: true },
    ],
  },
  {
    id: 'lifestyle',
    category: 'personal',
    title: 'Lifestyle',
    fields: [
      { key: 'diet', label: 'Diet', placeholder: 'Vegetarian', half: true },
      { key: 'smoking', label: 'Smoking', placeholder: 'No', half: true },
      { key: 'drinking', label: 'Drinking', placeholder: 'No', half: true },
    ],
  },
  {
    id: 'family',
    category: 'family',
    title: 'Family',
    fields: [
      { key: 'father_name', label: "Father's name", placeholder: 'Shri Ramesh Jha', half: true },
      { key: 'mother_name', label: "Mother's name", placeholder: 'Smt. Sunita Devi', half: true },
      { key: 'family_type', label: 'Family type', placeholder: 'Nuclear', half: true },
      { key: 'family_values', label: 'Family values', placeholder: 'Traditional', half: true },
      { key: 'siblings', label: 'Siblings', placeholder: 'One younger brother, studying' },
      { key: 'family_about', label: 'About the family', type: 'textarea', placeholder: 'A short introduction to the family.' },
    ],
  },
  {
    id: 'astrology',
    category: 'cultural',
    title: 'Horoscope',
    hint: 'Optional. Leave blank and the section is left out of the document.',
    fields: [
      { key: 'rashi', label: 'Rashi', placeholder: 'Vrishabha', half: true },
      { key: 'nakshatra', label: 'Nakshatra', placeholder: 'Rohini', half: true },
      { key: 'mangalik', label: 'Manglik', placeholder: 'No', half: true },
      { key: 'birth_time', label: 'Birth time', placeholder: '6:20 AM', half: true },
      { key: 'birth_place', label: 'Birth place', placeholder: 'Darbhanga', half: true },
    ],
  },
  {
    id: 'about',
    category: 'personal',
    title: 'About you',
    fields: [
      { key: 'about_me', label: 'A few lines about yourself', type: 'textarea', placeholder: 'What you enjoy, what you are looking for in a partner.' },
    ],
  },
  {
    id: 'contact',
    category: 'contact',
    title: 'Contact',
    fields: [
      { key: 'mobile', label: 'Mobile', type: 'tel', placeholder: '+91 98765 43210', half: true },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'name@example.com', half: true },
      { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Optional.' },
    ],
  },
]

const EMPTY: BiodataData = {}

/** The document is a fixed 210 mm wide; below this the preview has to shrink. */
const PAGE_WIDTH_PX = 794

/**
 * Shrinks the A4 preview to fit the column it is given.
 *
 * A plain `transform: scale()` is not enough on its own — a scaled element keeps
 * its original footprint in layout, so a 0.4-scaled A4 page would leave roughly
 * a screen and a half of blank space beneath it. The wrapper's height has to be
 * measured and scaled to match.
 *
 * A ResizeObserver, because the document's height now changes on its own: it
 * paginates itself after measuring, and again once web fonts arrive.
 */
function ScaledPreview({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState<number | null>(null)

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    const measure = () => {
      // Zero width means not laid out yet (or hidden) — keep the last good scale.
      const available = outer.clientWidth
      if (available <= 0) return
      const next = Math.min(1, available / PAGE_WIDTH_PX)
      setScale(next)
      setHeight(inner.offsetHeight * next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(outer)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={outerRef} style={{ height: height ?? undefined }}>
      <div ref={innerRef} style={{ width: PAGE_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  )
}

/** Photos are only ever read locally; this cap keeps a huge file from stalling the tab. */
const MAX_PHOTO_BYTES = 8 * 1024 * 1024

const clampPct = (v: number) => Math.min(100, Math.max(0, v))

/**
 * Frame shape, zoom and drag-to-position for the photo. The crop box uses the
 * same CSS as the printed frame (border-radius, object-position, transform
 * origin), so the percentages it produces frame the photo identically at the
 * document's size.
 */
function PhotoEditor({ url, style, onChange }: { url: string; style: PhotoStyle; onChange: (s: PhotoStyle) => void }) {
  const shape = PHOTO_SHAPES[style.shape]
  const boxW = 148, boxH = Math.round(boxW * shape.aspect)
  const imgRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null)

  /** How far the zoomed image overhangs the box — the distance 0→100% pans across. */
  function overhang() {
    const img = imgRef.current
    if (!img || !img.naturalWidth) return { ox: 0, oy: 0 }
    const cover = Math.max(boxW / img.naturalWidth, boxH / img.naturalHeight)
    return { ox: img.naturalWidth * cover * style.zoom - boxW, oy: img.naturalHeight * cover * style.zoom - boxH }
  }

  function moveBy(dx: number, dy: number, from: { x: number; y: number }) {
    const { ox, oy } = overhang()
    onChange({
      ...style,
      x: ox > 0.5 ? clampPct(from.x - (dx / ox) * 100) : style.x,
      y: oy > 0.5 ? clampPct(from.y - (dy / oy) * 100) : style.y,
    })
  }

  return (
    <div className="mt-3 flex flex-wrap gap-4 items-start">
      <div
        role="group"
        tabIndex={0}
        aria-label="Photo position. Drag the photo, or use the arrow keys, to centre the face."
        onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { px: e.clientX, py: e.clientY, x: style.x, y: style.y }
        }}
        onPointerMove={e => {
          const d = drag.current
          if (d) moveBy(e.clientX - d.px, e.clientY - d.py, d)
        }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
        onKeyDown={e => {
          const step = 6
          const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
          const m = moves[e.key]
          if (!m) return
          e.preventDefault()
          moveBy(m[0], m[1], style)
        }}
        className="relative shrink-0 cursor-grab active:cursor-grabbing select-none outline-none focus-visible:ring-2 focus-visible:ring-maroon/50 rounded-mj-sm"
        style={{ width: boxW, height: boxH, touchAction: 'none' }}
      >
        <div style={{ position: 'absolute', inset: 0, borderRadius: shape.radius, overflow: 'hidden', background: '#F7EBD3', boxShadow: '0 0 0 2px #B98A2E, 0 0 0 4px #FFFAF0, 0 0 0 5px #7A1220' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={url}
            alt=""
            draggable={false}
            style={{
              width: '100%', height: '100%', display: 'block', objectFit: 'cover', pointerEvents: 'none',
              objectPosition: `${style.x}% ${style.y}%`,
              transform: `scale(${style.zoom})`, transformOrigin: `${style.x}% ${style.y}%`,
            }}
          />
        </div>
      </div>

      <div className="flex-1 min-w-[150px] space-y-3">
        <div>
          <span className="field-label">Frame</span>
          <div className="flex gap-1.5 mt-1" role="radiogroup" aria-label="Photo frame shape">
            {(Object.keys(PHOTO_SHAPES) as PhotoShape[]).map(k => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={style.shape === k}
                onClick={() => onChange({ ...style, shape: k })}
                className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-mj-sm border text-[11.5px] font-medium transition-colors ${
                  style.shape === k ? 'bg-maroon text-cream border-maroon' : 'bg-cream text-maroon border-gold/40 hover:border-gold'
                }`}
              >
                <span aria-hidden="true" style={{
                  width: 14, height: Math.round(14 * PHOTO_SHAPES[k].aspect), borderRadius: PHOTO_SHAPES[k].radius,
                  border: '1.5px solid currentColor', display: 'block',
                }} />
                {PHOTO_SHAPES[k].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="bd-photo-zoom">Zoom</label>
          <input
            id="bd-photo-zoom"
            type="range" min={1} max={3} step={0.01}
            value={style.zoom}
            onChange={e => onChange({ ...style, zoom: Number(e.target.value) })}
            className="w-full accent-maroon mt-1"
          />
        </div>
        <p className="text-[11.5px] text-ink-soft leading-snug">Drag the photo to centre the face.</p>
        <button
          type="button"
          onClick={() => onChange({ ...style, zoom: 1, x: 50, y: 50 })}
          className="text-[12px] text-maroon hover:underline"
        >
          Reset position
        </button>
      </div>
    </div>
  )
}

function PhotoCard({
  photoUrl, photoError, photoStyle, fileRef, onPick, onClear, onStyle,
}: {
  photoUrl: string | null
  photoError: string
  photoStyle: PhotoStyle
  fileRef: React.RefObject<HTMLInputElement | null>
  onPick: (file: File | undefined) => void
  onClear: () => void
  onStyle: (s: PhotoStyle) => void
}) {
  return (
    <section className="card p-4">
      <h3 className="font-semibold text-ink text-[14.5px] leading-tight">Photograph</h3>
      <p className="text-[11.5px] text-ink-soft leading-snug mt-0.5">Optional. Stays on your device — it is never uploaded.</p>
      <div className="flex items-center gap-2 mt-2.5">
        <input
          ref={fileRef}
          type="file"
          aria-label="Choose a photo for the biodata (optional)"
          accept="image/*"
          onChange={e => onPick(e.target.files?.[0])}
          className="text-[12.5px] text-ink-soft file:mr-2 file:rounded-mj-sm file:border file:border-gold/40 file:bg-cream file:px-3 file:py-1.5 file:text-[12.5px] file:text-maroon"
        />
        {photoUrl && (
          <button type="button" onClick={onClear} className="text-[12px] text-maroon hover:underline shrink-0">
            Remove
          </button>
        )}
      </div>
      {photoError && <p className="text-[11.5px] text-terra mt-1">{photoError}</p>}
      {photoUrl && <PhotoEditor url={photoUrl} style={photoStyle} onChange={onStyle} />}
    </section>
  )
}

/**
 * Printing goes through a separate copy of the document mounted directly on
 * <body>. The print CSS then hides every other child of <body> with
 * display:none — hiding the rest with `visibility` keeps its height, which
 * printed blank sheets after the biodata.
 */
const PRINT_CSS = `
#bd-print-root { position: absolute; left: -12000px; top: 0; width: 210mm; }
@media print {
  html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
  body:has(#bd-print-root) > *:not(#bd-print-root) { display: none !important; }
  #bd-print-root { position: static !important; left: auto !important; width: auto !important; }
}
`

const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()))

export function BiodataBuilder() {
  const [step, setStep] = useState<'design' | 'details'>('design')
  const [template, setTemplate] = useState<BiodataTemplateId>('mayur')
  const [data, setData] = useState<BiodataData>(EMPTY)
  const [language, setLanguage] = useState<BiodataLanguage>('en')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoStyle, setPhotoStyle] = useState<PhotoStyle>(DEFAULT_PHOTO_STYLE)
  const [photoError, setPhotoError] = useState('')
  const [openGroup, setOpenGroup] = useState<string>('basic')
  const [printMounted, setPrintMounted] = useState(false)
  const pendingPrint = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Ctrl+P / the browser menu skip the button; mount the print copy synchronously then too.
  useEffect(() => {
    const onBeforePrint = () => flushSync(() => setPrintMounted(true))
    window.addEventListener('beforeprint', onBeforePrint)
    return () => window.removeEventListener('beforeprint', onBeforePrint)
  }, [])

  // Object URLs are per-file and must be revoked, or every re-pick leaks one.
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }, [photoUrl])

  function set(key: keyof BiodataData, value: string) {
    setData(d => ({ ...d, [key]: value }))
  }

  function pickPhoto(file: File | undefined) {
    setPhotoError('')
    if (!file) return
    if (!file.type.startsWith('image/')) { setPhotoError('That file is not an image.'); return }
    if (file.size > MAX_PHOTO_BYTES) { setPhotoError('Please choose an image under 8 MB.'); return }
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(URL.createObjectURL(file))
    setPhotoStyle(s => ({ ...s, zoom: 1, x: 50, y: 50 }))
  }

  function clearPhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function chooseTemplate(id: BiodataTemplateId) {
    setTemplate(id)
    track('biodata_template_selected', { k: id })
  }

  // `age` is derived rather than typed — a biodata that says "28" next to a date
  // of birth that disagrees is worse than one that says nothing.
  const documentData: BiodataData = useMemo(() => {
    const age = data.dob ? computeAge(data.dob) : null
    return {
      ...data,
      age: age != null && age > 0 && age < 120 ? String(age) : null,
      dob: data.dob ? new Date(data.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null,
    }
  }, [data])

  const filledCount = Object.values(data).filter(v => v != null && String(v).trim() !== '').length

  async function runPrint() {
    // Wait for the print copy's fonts and images, or the PDF can catch the
    // photo before it has decoded and print an empty frame.
    const root = document.getElementById('bd-print-root')
    await document.fonts?.ready
    await Promise.all(Array.from(root?.querySelectorAll('img') ?? []).map(img => img.decode().catch(() => {})))
    await nextFrame()
    await nextFrame()
    // The document title becomes the default filename in "Save as PDF".
    const previous = document.title
    document.title = biodataFileName(data.full_name)
    window.print()
    track('biodata_downloaded', { k: template })
    // print() blocks until the dialog closes, and the title is only read on open.
    document.title = previous
  }

  function print() {
    if (printMounted) { void runPrint(); return }
    pendingPrint.current = true
    setPrintMounted(true)
  }

  useEffect(() => {
    if (printMounted && pendingPrint.current) {
      pendingPrint.current = false
      void runPrint()
    }
  })

  if (step === 'design') {
    return (
      <div className="wrap py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-5">
            <p className="eyebrow mb-1">Step 1 of 2</p>
            <h2 className="font-serif text-maroon text-[20px] sm:text-[23px]">Choose a design</h2>
            <p className="text-ink-soft text-[13.5px] mt-1.5 max-w-lg mx-auto">
              Every design holds the same fields — pick the one that feels right. You can change it
              any time from the next screen.
            </p>
          </div>
          <BiodataTemplatePicker selected={template} onSelect={chooseTemplate} photoShape={photoStyle.shape} language={language} />
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="btn-primary px-7 py-2.5 text-[14.5px]"
            >
              Continue with {BIODATA_TEMPLATES[template].name} →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap py-6">
      <style>{PRINT_CSS}</style>
      {printMounted && createPortal(
        <div id="bd-print-root" aria-hidden="true">
          <BiodataDocument data={documentData} language={language} photoUrl={photoUrl} photoStyle={photoStyle} templateSlug={template} />
        </div>,
        document.body,
      )}

      {/* ── Step bar: design in use + language ── */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 mb-4 card px-4 py-2.5">
        <p className="text-[13px] text-ink">
          <span className="text-ink-soft">Step 2 of 2 · Design:</span>{' '}
          <span className="font-semibold text-maroon">{BIODATA_TEMPLATES[template].name}</span>
        </p>
        <button type="button" onClick={() => setStep('design')} className="text-[12.5px] font-medium text-maroon hover:underline">
          Change design
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-6 items-start">
        {/* ── Form ── */}
        <div className="no-print space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          <div className="card p-4">
            <h2 className="font-serif text-maroon text-[17px]">Your details</h2>
            <p className="text-[12.5px] text-ink-soft mt-1 leading-snug">
              Fill in as much or as little as you like — empty sections are left out of the document.
              Everything stays in this browser; nothing is uploaded or saved.
            </p>

            <div className="mt-3">
              <span className="field-label">Language of the document</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {BIODATA_LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLanguage(l.code)}
                    aria-pressed={language === l.code}
                    className={`px-3 py-1.5 rounded-pill text-[13px] font-medium border transition-colors ${
                      language === l.code
                        ? 'bg-maroon text-cream border-maroon'
                        : 'bg-cream text-maroon border-gold/40 hover:border-gold'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="text-[11.5px] text-ink-soft mt-1.5">
                Changes the printed headings. What you type is kept exactly as written, so you can
                type names and places in Devanagari too.
              </p>
            </div>
          </div>

          {CATEGORIES.map(cat => (
            <div key={cat.id} className="space-y-3">
              <div className="pt-1 px-0.5">
                <h2 className="font-serif text-maroon text-[15.5px] leading-tight">{cat.title}</h2>
                {cat.hint && <p className="text-[11.5px] text-ink-soft leading-snug mt-0.5">{cat.hint}</p>}
              </div>

              {cat.id === 'personal' && (
                <PhotoCard
                  photoUrl={photoUrl} photoError={photoError} photoStyle={photoStyle} fileRef={fileRef}
                  onPick={pickPhoto} onClear={clearPhoto} onStyle={setPhotoStyle}
                />
              )}

              {GROUPS.filter(g => g.category === cat.id).map(group => {
                const open = openGroup === group.id
                const filled = group.fields.filter(f => String(data[f.key] ?? '').trim() !== '').length
                return (
                  <section key={group.id} className="card overflow-hidden">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenGroup(open ? '' : group.id)}
                        aria-expanded={open}
                        aria-controls={`group-${group.id}`}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-paper-2/60 transition-colors"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold text-ink text-[14.5px] leading-tight">{group.title}</span>
                          {group.hint && <span className="block text-[11.5px] text-ink-soft leading-snug mt-0.5">{group.hint}</span>}
                        </span>
                        <span className={`text-[11px] font-semibold rounded-pill px-2 py-0.5 border whitespace-nowrap ${
                          filled > 0 ? 'bg-green/[0.08] border-green/30 text-green' : 'bg-paper-2 border-paper-3 text-ink-soft'
                        }`}>
                          {filled} of {group.fields.length}
                        </span>
                        <svg
                          width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"
                          className={`shrink-0 text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </h3>
                    {open && (
                      <div id={`group-${group.id}`} className="px-4 pb-4 pt-1 border-t border-paper-3 grid grid-cols-2 gap-3">
                        {group.fields.map(f => (
                          <div key={f.key} className={f.half ? 'col-span-1' : 'col-span-2'}>
                            <label className="field-label" htmlFor={`bd-${f.key}`}>{f.label}</label>
                            {f.type === 'textarea' ? (
                              <textarea
                                id={`bd-${f.key}`}
                                rows={3}
                                value={String(data[f.key] ?? '')}
                                placeholder={f.placeholder}
                                onChange={e => set(f.key, e.target.value)}
                                className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon resize-none bg-white"
                              />
                            ) : (
                              <input
                                id={`bd-${f.key}`}
                                type={f.type ?? 'text'}
                                value={String(data[f.key] ?? '')}
                                placeholder={f.placeholder}
                                onChange={e => set(f.key, e.target.value)}
                                className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-maroon bg-white"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          ))}

          <div className="card p-4 bg-cream">
            <p className="text-[13px] text-ink leading-snug">
              Closing this tab clears everything — there is nowhere for it to be saved.
            </p>
            <p className="text-[12.5px] text-ink-soft leading-snug mt-1">
              A free account keeps your biodata, updates it as your details change, and puts you in
              front of Mithila families looking for a match.
            </p>
            <Link href="/register" className="btn-primary w-full justify-center mt-3 text-sm py-2">
              Create a free account
            </Link>
          </div>
        </div>

        {/* ── Live preview ── */}
        <div className="min-w-0">
          <div className="no-print flex flex-wrap items-center gap-2 mb-3">
            <button type="button" onClick={print} className="btn-primary text-sm px-5 py-2">
              Download PDF / Print
            </button>
            <span className="text-[12.5px] text-ink-soft">
              {filledCount === 0
                ? 'Start filling the form — the preview updates as you type.'
                : `${filledCount} ${filledCount === 1 ? 'detail' : 'details'} added`}
            </span>
          </div>

          <ScaledPreview>
            <BiodataDocument data={documentData} language={language} photoUrl={photoUrl} photoStyle={photoStyle} templateSlug={template} />
          </ScaledPreview>
          <p className="no-print text-[11.5px] text-ink-soft mt-3 leading-snug">
            In the print dialog choose <strong className="text-ink">Save as PDF</strong> and paper size A4. Longer
            biodatas continue on a second framed page automatically.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BiodataBuilder
