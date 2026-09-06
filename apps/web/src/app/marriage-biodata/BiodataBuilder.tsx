'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { BiodataDocument } from '@/components/biodata/BiodataDocument'
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
 */

type FieldSpec = {
  key: keyof BiodataData
  label: string
  placeholder?: string
  type?: 'text' | 'date' | 'tel' | 'email' | 'textarea'
  half?: boolean
}

type GroupSpec = {
  id: string
  title: string
  hint?: string
  fields: FieldSpec[]
}

const GROUPS: GroupSpec[] = [
  {
    id: 'basic',
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
    title: 'Community & roots',
    hint: 'The fields Maithil families actually ask for first.',
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
    title: 'Location',
    fields: [
      { key: 'current_location', label: 'Currently living in', placeholder: 'Mumbai', half: true },
      { key: 'native_place', label: 'Native place', placeholder: 'Madhubani', half: true },
    ],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    fields: [
      { key: 'diet', label: 'Diet', placeholder: 'Vegetarian', half: true },
      { key: 'smoking', label: 'Smoking', placeholder: 'No', half: true },
      { key: 'drinking', label: 'Drinking', placeholder: 'No', half: true },
    ],
  },
  {
    id: 'family',
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
    title: 'About you',
    fields: [
      { key: 'about_me', label: 'A few lines about yourself', type: 'textarea', placeholder: 'What you enjoy, what you are looking for in a partner.' },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    hint: 'Only add what you are comfortable sharing with the families who receive this.',
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
 * Deliberately NOT a ResizeObserver. The document's height changes for exactly
 * three reasons — the window resized, the form data changed, or the language
 * changed — and all three are already state here, so `revision` can drive the
 * measurement directly. That is both cheaper and easier to reason about than
 * observing an element whose size this component is itself setting.
 *
 * Print is unaffected: the print rules reset the transform, so the PDF is
 * always full size regardless of what the preview is doing.
 */
function ScaledPreview({ revision, children }: { revision: unknown; children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState<number | null>(null)

  // Layout effect, not effect: measuring after paint would show one frame at the
  // wrong size every time the document grows.
  useLayoutEffect(() => {
    const measure = () => {
      const outer = outerRef.current
      const inner = innerRef.current
      if (!outer || !inner) return

      const available = outer.clientWidth
      // A container that measures zero is not a container that is zero wide — it
      // is a page that has not been laid out yet, or one rendering in a hidden
      // or offscreen context. Scaling to nothing there makes the preview vanish,
      // so keep the last good scale and wait for a real measurement.
      if (available <= 0) return

      const next = Math.min(1, available / PAGE_WIDTH_PX)
      setScale(next)
      setHeight(inner.offsetHeight * next)
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [revision])

  return (
    <div id="biodata-print" ref={outerRef} style={{ height: height ?? undefined }}>
      <div
        ref={innerRef}
        className="biodata-scaler"
        style={{
          width: PAGE_WIDTH_PX,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Photos are only ever read locally; this cap keeps a huge file from stalling the tab. */
const MAX_PHOTO_BYTES = 8 * 1024 * 1024

export function BiodataBuilder() {
  const [data, setData] = useState<BiodataData>(EMPTY)
  const [language, setLanguage] = useState<BiodataLanguage>('en')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [openGroup, setOpenGroup] = useState<string>('basic')
  const fileRef = useRef<HTMLInputElement>(null)

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
  }

  function clearPhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null)
    if (fileRef.current) fileRef.current.value = ''
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

  function print() {
    // The document title becomes the default filename in the browser's
    // "Save as PDF" dialog, so set it to something the member would keep.
    const previous = document.title
    document.title = biodataFileName(data.full_name)
    window.print()
    // Restoring immediately is safe: print() blocks until the dialog is dismissed
    // in every browser that supports it, and the title is only read on open.
    document.title = previous
  }

  return (
    <div className="wrap py-6">
      {/* Print rules: the whole page collapses to the document alone. */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          #biodata-print, #biodata-print * { visibility: visible !important; }
          #biodata-print {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: 100% !important; height: auto !important;
            margin: 0 !important; padding: 0 !important;
          }
          /* Undo the on-screen fit-to-column scaling — the PDF is always full size. */
          #biodata-print .biodata-scaler {
            transform: none !important; width: 100% !important;
          }
          #biodata-print .biodata-page {
            box-shadow: none !important; margin: 0 !important;
            width: 100% !important; max-width: 100% !important;
            padding: 14mm 16mm !important;
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>

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

            <div className="mt-3">
              <span className="field-label">Photo (optional)</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={e => pickPhoto(e.target.files?.[0])}
                  className="text-[12.5px] text-ink-soft file:mr-2 file:rounded-mj-sm file:border file:border-gold/40 file:bg-cream file:px-3 file:py-1.5 file:text-[12.5px] file:text-maroon"
                />
                {photoUrl && (
                  <button type="button" onClick={clearPhoto} className="text-[12px] text-maroon hover:underline shrink-0">
                    Remove
                  </button>
                )}
              </div>
              {photoError
                ? <p className="text-[11.5px] text-terra mt-1">{photoError}</p>
                : <p className="text-[11.5px] text-ink-soft mt-1">Stays on your device — it is never uploaded.</p>}
            </div>
          </div>

          {GROUPS.map(group => {
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

          <ScaledPreview revision={`${language}|${photoUrl ?? ''}|${JSON.stringify(documentData)}`}>
            <BiodataDocument data={documentData} language={language} photoUrl={photoUrl} />
          </ScaledPreview>
        </div>
      </div>
    </div>
  )
}

export default BiodataBuilder
