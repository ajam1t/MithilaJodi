'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { BiodataDocument } from '@/components/biodata/BiodataDocument'
import { BIODATA_TEMPLATE_LIST, type BiodataTemplateId, type PhotoShape } from '@/lib/biodataTemplates'
import type { BiodataData, BiodataLanguage } from '@/lib/biodata'

/**
 * The fictional sample from /digital-profile/sample, rendered through the real
 * BiodataDocument at thumbnail size. These are the actual templates, not
 * drawings of them, so they cannot drift out of sync.
 */
const THUMB_DATA: BiodataData = {
  full_name: 'Muskan Jha', age: '26', gender: 'Female', religion: 'Hindu', caste: 'Maithil Brahmin',
  self_gotra: 'Kashyap', mool: 'Saurath', gram: 'Madhubani',
  marital_status: 'Never married', height: `5'3"`, mother_tongue: 'Maithili',
  education: 'B.Tech, Computer Science', profession: 'Software Engineer', current_location: 'Bengaluru',
  father_name: 'Shri Ramesh Jha', mother_name: 'Smt. Sunita Jha',
}
const THUMB_PHOTO = '/sample/muskan-1.webp'

/** The document's real rendered width in CSS px (210 mm). */
const PAGE_WIDTH_PX = 794

function Thumb({ id, shape, language }: { id: BiodataTemplateId; shape: PhotoShape; language: BiodataLanguage }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.2)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => { if (el.clientWidth > 0) setScale(el.clientWidth / PAGE_WIDTH_PX) }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} aria-hidden="true" style={{ width: '100%', aspectRatio: '210 / 297', overflow: 'hidden', position: 'relative' }}>
      <div style={{ width: PAGE_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        <BiodataDocument
          variant="thumb"
          data={THUMB_DATA}
          language={language}
          templateSlug={id}
          photoUrl={THUMB_PHOTO}
          photoStyle={{ shape, zoom: 1.05, x: 50, y: 28 }}
        />
      </div>
    </div>
  )
}

export function BiodataTemplatePicker({
  selected,
  onSelect,
  photoShape = 'round',
  language = 'en',
}: {
  selected: BiodataTemplateId
  onSelect: (id: BiodataTemplateId) => void
  photoShape?: PhotoShape
  language?: BiodataLanguage
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {BIODATA_TEMPLATE_LIST.map(t => {
        const active = selected === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            aria-pressed={active}
            className={`relative text-left rounded-mj border-2 p-2 sm:p-2.5 transition-all bg-white ${
              active ? 'border-gold shadow-mj bg-gold/[0.06]' : 'border-paper-3 hover:border-gold/60 hover:-translate-y-0.5'
            }`}
          >
            <div className="rounded-[4px] overflow-hidden shadow-mj-xs">
              <Thumb id={t.id} shape={photoShape} language={language} />
            </div>
            <p className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className="font-serif text-maroon text-[14.5px] leading-tight">{t.name}</span>
              <span className="font-deva text-[12px] text-gold" lang="hi">{t.deva}</span>
            </p>
            <p className="text-[11.5px] text-ink-soft leading-snug mt-0.5">{t.tag}</p>
            {active && (
              <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gold flex items-center justify-center shadow-mj-xs" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5l2.2 2.2L9.5 3.8" stroke="#5A0E19" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
