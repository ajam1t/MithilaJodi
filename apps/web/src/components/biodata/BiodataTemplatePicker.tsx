import { BiodataDocument } from '@/components/biodata/BiodataDocument'
import { BIODATA_TEMPLATE_LIST, type BiodataTemplateId } from '@/lib/biodataTemplates'
import type { BiodataData } from '@/lib/biodata'

/**
 * A fictional sample — just enough fields to show a template's character —
 * rendered through the real BiodataDocument at a fraction of its size.
 * These thumbnails are the actual template, not a separate drawing of it, so
 * there is nothing for them to drift out of sync with.
 */
const THUMB_DATA: BiodataData = {
  full_name: 'Anuradha Jha', age: '26', gender: 'Female', religion: 'Hindu', caste: 'Maithil Brahmin',
  self_gotra: 'Kashyap', mool: 'Saurath', gram: 'Darbhanga',
  education: 'B.Tech, Computer Science', profession: 'Software Engineer',
  current_location: 'Bengaluru', native_place: 'Darbhanga, Bihar',
}

/** Must match BiodataBuilder's PAGE_WIDTH_PX — the document's real rendered width. */
const PAGE_WIDTH_PX = 794
const THUMB_WIDTH = 148

function TemplateThumb({ id }: { id: BiodataTemplateId }) {
  const scale = THUMB_WIDTH / PAGE_WIDTH_PX
  return (
    <div
      aria-hidden="true"
      style={{ width: THUMB_WIDTH, aspectRatio: '210 / 297', overflow: 'hidden', borderRadius: 3 }}
    >
      <div style={{ width: PAGE_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        <BiodataDocument data={THUMB_DATA} language="en" templateSlug={id} />
      </div>
    </div>
  )
}

export function BiodataTemplatePicker({
  selected,
  onSelect,
}: {
  selected: BiodataTemplateId
  onSelect: (id: BiodataTemplateId) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {BIODATA_TEMPLATE_LIST.map(t => {
        const active = selected === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            aria-pressed={active}
            className={`relative text-left rounded-mj border-2 p-2.5 transition-all bg-white ${
              active ? 'border-gold shadow-mj-xs bg-gold/[0.06]' : 'border-paper-3 hover:border-gold/50'
            }`}
          >
            <div className="flex justify-center rounded-[3px] overflow-hidden border border-paper-3 shadow-mj-xs">
              <TemplateThumb id={t.id} />
            </div>
            <p className="mt-2.5 font-serif text-maroon text-[13.5px] leading-tight">{t.name}</p>
            <p className="text-[11px] text-ink-soft leading-snug mt-0.5">{t.tag}</p>
            {active && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold flex items-center justify-center" aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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
