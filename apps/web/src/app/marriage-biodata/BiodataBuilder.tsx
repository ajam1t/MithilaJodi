'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import Link from 'next/link'
import { BiodataDocument } from '@/components/biodata/BiodataDocument'
import { BiodataTemplatePicker } from '@/components/biodata/BiodataTemplatePicker'
import { WhatsAppIcon } from '@/components/whatsapp/JoinCommunity'
import { downloadBlob, renderBiodataImages } from '@/lib/biodataImage'
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
 * A signed-in member's form starts filled from their own Digital Profile
 * (GET /api/biodata/me, which reads only the session's profile). That is a
 * read: edits still stay in the browser and are never written back.
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
      { key: 'parents', label: 'Parents', type: 'textarea', placeholder: 'Father: retired teacher. Mother: homemaker.' },
      { key: 'siblings', label: 'Siblings', placeholder: 'One younger brother, studying' },
      { key: 'family_about', label: 'About the family', type: 'textarea', placeholder: 'A short introduction to the family.' },
      { key: 'expectations', label: 'Family expectations', type: 'textarea', placeholder: 'What the family hopes for in a match.' },
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

/** Every key the form can edit — profile data outside this set is ignored. */
const FORM_KEYS = new Set<string>(GROUPS.flatMap(g => g.fields.map(f => f.key)))

/**
 * Where the Digital Profile prefill stands. A guest gets a 401 and sees the
 * manual form exactly as before; a member's details are filled in once.
 */
type Prefill =
  | { kind: 'checking' }
  | { kind: 'guest' }
  | { kind: 'loaded'; count: number }
  | { kind: 'no_profile' }
  | { kind: 'error' }

type ProfileFetch =
  | { kind: 'guest' | 'no_profile' }
  | { kind: 'loaded'; data: BiodataData; photo: Blob | null }

/**
 * Reads the signed-in member's own profile (the session decides whose — no id
 * is sent), plus their approved primary photo when they have one. A photo that
 * fails to load is simply left out; the details still prefill.
 */
async function fetchOwnProfile(signal: AbortSignal): Promise<ProfileFetch> {
  const res = await fetch('/api/biodata/me', { signal, cache: 'no-store', credentials: 'same-origin' })
  if (res.status === 401) return { kind: 'guest' }
  if (res.status === 404) return { kind: 'no_profile' }
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.ok) throw new Error('profile unavailable')
  const data = Object.fromEntries(
    Object.entries((json.data ?? {}) as Record<string, unknown>)
      .filter(([k, v]) => FORM_KEYS.has(k) && typeof v === 'string' && v.trim() !== ''),
  ) as BiodataData
  let photo: Blob | null = null
  if (json.hasPhoto) {
    try {
      const r = await fetch('/api/biodata/me/photo', { signal, cache: 'no-store', credentials: 'same-origin' })
      const b = r.ok ? await r.blob() : null
      if (b && b.size > 0 && b.type.startsWith('image/')) photo = b
    } catch (err) {
      if (signal.aborted) throw err
    }
  }
  return { kind: 'loaded', data, photo }
}

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
  photoUrl, photoError, photoStyle, fileRef, fromProfile, onUseProfile, onPick, onClear, onStyle,
}: {
  photoUrl: string | null
  photoError: string
  photoStyle: PhotoStyle
  fileRef: React.RefObject<HTMLInputElement | null>
  /** The photo shown is the member's Digital Profile photo. */
  fromProfile: boolean
  /** Offered when a profile photo exists but another (or none) is in use. */
  onUseProfile: (() => void) | null
  onPick: (file: File | undefined) => void
  onClear: () => void
  onStyle: (s: PhotoStyle) => void
}) {
  return (
    <section className="card p-4">
      <h3 className="font-semibold text-ink text-[14.5px] leading-tight">Photograph</h3>
      <p className="text-[11.5px] text-ink-soft leading-snug mt-0.5">
        {fromProfile
          ? 'Your Digital Profile photo. Choose another, or remove it, for this biodata only.'
          : 'Optional. Stays on your device — it is never uploaded.'}
      </p>
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
      {onUseProfile && (
        <button type="button" onClick={onUseProfile} className="mt-2 text-[12px] font-medium text-maroon hover:underline">
          Use my profile photo
        </button>
      )}
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

/** One frame — or 60 ms when the tab is in the background and frames are paused. */
const nextFrame = () => new Promise<void>(r => {
  requestAnimationFrame(() => r())
  setTimeout(r, 60)
})

type ImageState =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'ready'; files: File[]; preview: string }
  | { kind: 'saved'; count: number }
  | { kind: 'error'; message: string }

/** The member's prefill status, above the form. Guests see nothing here. */
function PrefillNotice({
  prefill, slow, refreshing, refreshError, onRefresh, onRetry,
}: {
  prefill: Prefill
  slow: boolean
  refreshing: boolean
  refreshError: boolean
  onRefresh: () => void
  onRetry: () => void
}) {
  if (prefill.kind === 'guest') return null
  if (prefill.kind === 'checking') {
    return slow ? (
      <p className="card px-4 py-3 text-[13px] text-ink-soft flex items-center gap-2" role="status">
        <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-gold border-t-transparent motion-safe:animate-spin" aria-hidden="true" />
        Looking for your Mithila Jodi profile…
      </p>
    ) : null
  }
  if (prefill.kind === 'error') {
    return (
      <div className="card px-4 py-3 border-terra/30 bg-terra/[0.04]" role="status">
        <p className="text-[13px] text-ink leading-snug">
          We couldn’t load your Digital Profile details just now. You can fill in the form yourself.
        </p>
        <button type="button" onClick={onRetry} className="mt-1.5 text-[12.5px] font-medium text-maroon hover:underline">
          Try again
        </button>
      </div>
    )
  }
  if (prefill.kind === 'no_profile') {
    return (
      <div className="card px-4 py-3 bg-cream" role="status">
        <p className="text-[13px] text-ink leading-snug">
          You’re signed in, but there is no Digital Profile to fill this from yet. Fill in the form below, or{' '}
          <Link href="/profile/edit" className="font-medium text-maroon underline underline-offset-2">complete your profile</Link> first.
        </p>
      </div>
    )
  }
  return (
    <div className="card px-4 py-3 border-gold/50 bg-[#FFFAF0]" role="status">
      <p className="text-[13px] text-ink leading-snug flex gap-2">
        <span className="text-gold shrink-0" aria-hidden="true">✦</span>
        <span>
          {prefill.count > 0
            ? 'Your Digital Profile information has been prefilled. Review and edit your details before generating your biodata.'
            : 'Your Digital Profile has no details to fill in yet — add them below.'}
        </span>
      </p>
      <p className="text-[11.5px] text-ink-soft leading-snug mt-1 pl-5">
        Changes here are for this biodata only; your Digital Profile stays as it is.
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pl-5">
        <button type="button" onClick={onRefresh} disabled={refreshing} className="text-[12.5px] font-medium text-maroon hover:underline disabled:opacity-60">
          {refreshing ? 'Refreshing…' : 'Refresh from Profile'}
        </button>
        <Link href="/profile/edit" className="text-[12.5px] font-medium text-maroon hover:underline">
          Edit Digital Profile
        </Link>
      </div>
      {refreshError && (
        <p className="text-[11.5px] text-terra mt-1.5 pl-5" role="alert">Could not refresh just now — your form is unchanged.</p>
      )}
    </div>
  )
}

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
  const [image, setImage] = useState<ImageState>({ kind: 'idle' })
  const fileRef = useRef<HTMLInputElement>(null)

  const [prefill, setPrefill] = useState<Prefill>({ kind: 'checking' })
  const [prefillSlow, setPrefillSlow] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState(false)
  const [photoFromProfile, setPhotoFromProfile] = useState(false)
  const [hasProfilePhoto, setHasProfilePhoto] = useState(false)
  /** Fields the member has typed in — a profile response never overwrites these. */
  const touched = useRef(new Set<string>())
  /** Set once the member picks or removes a photo themselves. */
  const photoTouched = useRef(false)
  const profilePhoto = useRef<Blob | null>(null)
  /** Only the latest request may apply its result. */
  const loadSeq = useRef(0)

  // Ctrl+P / the browser menu skip the button; mount the print copy synchronously then too.
  useEffect(() => {
    const onBeforePrint = () => flushSync(() => setPrintMounted(true))
    window.addEventListener('beforeprint', onBeforePrint)
    return () => window.removeEventListener('beforeprint', onBeforePrint)
  }, [])

  // Object URLs are per-file and must be revoked, or every re-pick leaks one.
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }, [photoUrl])

  function set(key: keyof BiodataData, value: string) {
    touched.current.add(key)
    setData(d => ({ ...d, [key]: value }))
  }

  function showPhoto(blob: Blob, fromProfile: boolean) {
    setPhotoUrl(URL.createObjectURL(blob))
    setPhotoFromProfile(fromProfile)
    setPhotoStyle(s => ({ ...s, zoom: 1, x: 50, y: 50 }))
  }

  /**
   * Fills the form from the Digital Profile. The first load only fills fields
   * that are still empty and untouched, so typing before it arrives is safe;
   * "Refresh from Profile" (after a confirm) replaces the profile's fields.
   * Nothing here writes to the profile.
   */
  async function loadProfile(mode: 'initial' | 'refresh', signal: AbortSignal) {
    const seq = ++loadSeq.current
    try {
      const result = await fetchOwnProfile(signal)
      if (seq !== loadSeq.current || signal.aborted) return
      if (result.kind !== 'loaded') { setPrefill({ kind: result.kind }); return }
      const entries = Object.entries(result.data) as Array<[keyof BiodataData, string]>
      if (mode === 'refresh') {
        entries.forEach(([k]) => touched.current.delete(k))
        setData(d => ({ ...d, ...result.data }))
      } else {
        setData(d => {
          const next = { ...d }
          for (const [k, v] of entries) if (!touched.current.has(k) && !String(d[k] ?? '').trim()) next[k] = v
          return next
        })
      }
      profilePhoto.current = result.photo
      setHasProfilePhoto(!!result.photo)
      if (result.photo && (mode === 'refresh' || !photoTouched.current)) {
        photoTouched.current = false
        showPhoto(result.photo, true)
      }
      setPrefill({ kind: 'loaded', count: entries.length })
    } catch {
      if (seq !== loadSeq.current || signal.aborted) return
      // A failed refresh keeps the form as it is; a failed first load falls back to manual entry.
      if (mode === 'refresh') setRefreshError(true)
      else setPrefill({ kind: 'error' })
    }
  }

  // One request when the maker opens — never per keystroke or preview update.
  useEffect(() => {
    const ctrl = new AbortController()
    void loadProfile('initial', ctrl.signal)
    const slow = setTimeout(() => setPrefillSlow(true), 600)
    return () => { ctrl.abort(); clearTimeout(slow) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshFromProfile() {
    const ok = window.confirm(
      'Replace the details in this form with the ones saved in your Digital Profile? Changes you made here to those fields will be lost.',
    )
    if (!ok) return
    setRefreshing(true)
    setRefreshError(false)
    await loadProfile('refresh', new AbortController().signal)
    setRefreshing(false)
  }

  async function retryProfile() {
    setPrefill({ kind: 'checking' })
    setPrefillSlow(true)
    await loadProfile('initial', new AbortController().signal)
  }

  function pickPhoto(file: File | undefined) {
    setPhotoError('')
    if (!file) return
    if (!file.type.startsWith('image/')) { setPhotoError('That file is not an image.'); return }
    if (file.size > MAX_PHOTO_BYTES) { setPhotoError('Please choose an image under 8 MB.'); return }
    photoTouched.current = true
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    showPhoto(file, false)
  }

  function clearPhoto() {
    photoTouched.current = true
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null)
    setPhotoFromProfile(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function restoreProfilePhoto() {
    if (!profilePhoto.current) return
    photoTouched.current = true
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    if (fileRef.current) fileRef.current.value = ''
    showPhoto(profilePhoto.current, true)
  }

  const isMember = prefill.kind === 'loaded' || prefill.kind === 'no_profile'

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

  /**
   * Mounts the full-size print copy if needed and waits for its fonts and
   * images — otherwise a PDF or image can catch the photo before it has
   * decoded and show an empty frame. Both downloads read from this copy.
   */
  async function preparePrintRoot(): Promise<HTMLElement> {
    if (!document.getElementById('bd-print-root')) flushSync(() => setPrintMounted(true))
    const root = document.getElementById('bd-print-root')
    if (!root) throw new Error('The biodata is not ready yet. Please try again.')
    await document.fonts?.ready
    await Promise.all(Array.from(root.querySelectorAll('img')).map(img => img.decode().catch(() => {})))
    await nextFrame()
    await nextFrame()
    return root
  }

  async function print() {
    await preparePrintRoot()
    // The document title becomes the default filename in "Save as PDF".
    const previous = document.title
    document.title = biodataFileName(data.full_name)
    window.print()
    track('biodata_downloaded', { k: template })
    // print() blocks until the dialog closes, and the title is only read on open.
    document.title = previous
  }

  // A prepared image goes stale as soon as the biodata changes.
  useEffect(() => {
    setImage(s => (s.kind === 'idle' || s.kind === 'working' ? s : { kind: 'idle' }))
  }, [documentData, template, language, photoUrl, photoStyle])

  useEffect(() => () => { if (image.kind === 'ready') URL.revokeObjectURL(image.preview) }, [image])

  function saveImages(files: File[]) {
    files.forEach(f => downloadBlob(f, f.name))
    track('biodata_image_made', { k: 'download' })
  }

  async function makeImage() {
    setImage({ kind: 'working' })
    try {
      const blobs = await renderBiodataImages(await preparePrintRoot())
      const base = biodataFileName(data.full_name)
      const files = blobs.map((b, i) => new File([b], blobs.length > 1 ? `${base}-${i + 1}.jpg` : `${base}.jpg`, { type: 'image/jpeg' }))
      // Where the device can share files, offer the share sheet as a separate
      // tap: iOS only allows share() straight after a tap, and rendering takes
      // longer than that allowance.
      if (navigator.canShare?.({ files })) {
        setImage({ kind: 'ready', files, preview: URL.createObjectURL(files[0]) })
      } else {
        saveImages(files)
        setImage({ kind: 'saved', count: files.length })
      }
    } catch (err) {
      setImage({ kind: 'error', message: err instanceof Error ? err.message : 'Could not create the image.' })
    }
  }

  async function shareImages(files: File[]) {
    try {
      await navigator.share({ files, title: 'Marriage biodata' })
      track('biodata_image_made', { k: 'share' })
    } catch (err) {
      // Closing the share sheet throws AbortError; that is not a failure.
      if (err instanceof Error && err.name === 'AbortError') return
      saveImages(files)
      setImage({ kind: 'saved', count: files.length })
    }
  }

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
            {prefill.kind === 'loaded' && prefill.count > 0 && (
              <p className="text-[12.5px] text-maroon mt-2" role="status">
                <span className="text-gold" aria-hidden="true">✦ </span>
                Your Digital Profile details are ready — they are filled in on the next step.
              </p>
            )}
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
          <PrefillNotice
            prefill={prefill} slow={prefillSlow} refreshing={refreshing} refreshError={refreshError}
            onRefresh={() => void refreshFromProfile()} onRetry={() => void retryProfile()}
          />
          <div className="card p-4">
            <h2 className="font-serif text-maroon text-[17px]">Your details</h2>
            <p className="text-[12.5px] text-ink-soft mt-1 leading-snug">
              Fill in as much or as little as you like — empty sections are left out of the document.
              {isMember
                ? ' What you change here stays in this browser and is never saved to your profile.'
                : ' Everything stays in this browser; nothing is uploaded or saved.'}
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
                  fromProfile={photoFromProfile && !!photoUrl}
                  onUseProfile={hasProfilePhoto && !(photoFromProfile && photoUrl) ? restoreProfilePhoto : null}
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

          {isMember ? (
            <div className="card p-4 bg-cream">
              <p className="text-[13px] text-ink leading-snug">
                Edits made here are not saved — closing this tab clears them. Your Digital Profile is unchanged.
              </p>
              <p className="text-[12.5px] text-ink-soft leading-snug mt-1">
                To change what families see on Mithila Jodi, and what fills in here next time, update your profile.
              </p>
              <Link href="/profile/edit" className="btn-primary w-full justify-center mt-3 text-sm py-2">
                Update your Digital Profile
              </Link>
            </div>
          ) : (
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
          )}
        </div>

        {/* ── Live preview ── */}
        <div className="min-w-0">
          <div className="no-print flex flex-wrap items-center gap-2 mb-3">
            <button type="button" onClick={() => void print()} className="btn-primary text-sm px-5 py-2">
              Download PDF / Print
            </button>
            <button
              type="button"
              onClick={() => void makeImage()}
              disabled={image.kind === 'working'}
              className="btn text-sm px-4 py-2 inline-flex items-center gap-1.5 bg-[#128C7E] border-[#128C7E] text-white hover:bg-[#0F766B] disabled:opacity-70 disabled:cursor-wait"
            >
              <WhatsAppIcon size={16} />
              {image.kind === 'working' ? 'Preparing image…' : 'Image for WhatsApp'}
            </button>
            <span className="text-[12.5px] text-ink-soft">
              {filledCount === 0
                ? 'Start filling the form — the preview updates as you type.'
                : `${filledCount} ${filledCount === 1 ? 'detail' : 'details'} added`}
            </span>
          </div>

          <div className="no-print" aria-live="polite">
            {image.kind === 'ready' && (
              <div className="card p-3 mb-3 flex flex-wrap items-center gap-3 border-[#128C7E]/30 bg-[#128C7E]/[0.05]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.preview} alt="" className="w-12 h-auto rounded-[3px] border border-paper-3 shadow-mj-xs" />
                <p className="flex-1 min-w-[160px] text-[13px] text-ink leading-snug">
                  Your image is ready{image.files.length > 1 ? ` — ${image.files.length} pages` : ''}. Share it straight to
                  WhatsApp, or save it to your phone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void shareImages(image.files)}
                    className="btn text-sm px-4 py-2 inline-flex items-center gap-1.5 bg-[#128C7E] border-[#128C7E] text-white hover:bg-[#0F766B]"
                  >
                    <WhatsAppIcon size={16} /> Share
                  </button>
                  <button type="button" onClick={() => saveImages(image.files)} className="btn-ghost text-sm px-4 py-2">
                    Download
                  </button>
                </div>
              </div>
            )}
            {image.kind === 'saved' && (
              <p className="mb-3 text-[12.5px] text-green">
                {image.count > 1 ? `${image.count} images saved` : 'Image saved'} to your Downloads — attach it in WhatsApp.
              </p>
            )}
            {image.kind === 'error' && <p className="mb-3 text-[12.5px] text-terra" role="alert">{image.message}</p>}
          </div>

          <ScaledPreview>
            <BiodataDocument data={documentData} language={language} photoUrl={photoUrl} photoStyle={photoStyle} templateSlug={template} />
          </ScaledPreview>
          <p className="no-print text-[11.5px] text-ink-soft mt-3 leading-snug">
            For the PDF, choose <strong className="text-ink">Save as PDF</strong> and paper size A4 in the print
            dialog. The WhatsApp image is a high-resolution JPEG of the same page. Longer biodatas continue on a
            second framed page automatically.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BiodataBuilder
