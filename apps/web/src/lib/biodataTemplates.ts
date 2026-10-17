/**
 * Biodata document templates — registry only, no rendering here.
 *
 * Four Madhubani themes, each a full A4 artwork frame (components/biodata/
 * BiodataFrames) plus the colours and heading style the content uses inside
 * it. Rendering lives in components/biodata/BiodataDocument, shared by the
 * public maker (/marriage-biodata) and the signed-in member's tool (/biodata),
 * so a template looks identical wherever it is used.
 *
 * All measurements in `safe` are millimetres on an A4 page (210 × 297): the
 * box the text may occupy without running into the artwork.
 */

export type BiodataTemplateId = 'mayur' | 'kamal' | 'matsya' | 'kohbar'

export type BiodataPalette = {
  /** CSS background of the page — a soft paper vignette. */
  paper: string
  ink: string
  inkSoft: string
  heading: string
  headingDeep: string
  gold: string
  goldLt: string
  /** Section-heading fills. */
  band: string
  bandSoft: string
  /** Secondary colour for icons. */
  accent: string
}

export type SafeArea = {
  /** Left and right inset. */
  side: number
  /** Top inset on the first page, where the title sits between corner art. */
  top: number
  /** Top inset on continuation pages, clear of the corner art. */
  contTop: number
  bottom: number
}

export type BiodataTemplate = {
  id: BiodataTemplateId
  name: string
  /** The name in Devanagari, shown under the thumbnail. */
  deva: string
  tag: string
  description: string
  palette: BiodataPalette
  safe: SafeArea
  sectionStyle: 'pill' | 'ribbon' | 'wave' | 'zigzag'
  /** 'side' puts the photo beside the name; 'center' stacks them. */
  hero: 'center' | 'side'
}

export const BIODATA_TEMPLATES: Record<BiodataTemplateId, BiodataTemplate> = {
  mayur: {
    id: 'mayur',
    name: 'Mayur',
    deva: 'मयूर',
    tag: 'Peacocks & flowering vines',
    description: 'Madhubani peacocks perched on a flowering vine border, on warm cream paper.',
    palette: {
      paper: 'radial-gradient(ellipse at 50% 42%, #FFF9EC 0%, #FBF0DA 58%, #F1DCB6 100%)',
      ink: '#2B211C', inkSoft: '#6B5444', heading: '#7A1220', headingDeep: '#5A0E19',
      gold: '#B98A2E', goldLt: '#F3D99A', band: '#F2D2A2', bandSoft: '#FBEBD1', accent: '#1D4F91',
    },
    safe: { side: 24, top: 23, contTop: 50, bottom: 46 },
    sectionStyle: 'pill',
    hero: 'center',
  },
  kamal: {
    id: 'kamal',
    name: 'Royal Kamal',
    deva: 'राजकमल',
    tag: 'Maroon & gold lotus',
    description: 'A royal maroon frame with gold lotus medallions and golden peacocks.',
    palette: {
      paper: 'radial-gradient(ellipse at 50% 45%, #FFFCF4 0%, #FCF3E1 65%, #F3E2C2 100%)',
      ink: '#2B211C', inkSoft: '#6B5444', heading: '#7A1220', headingDeep: '#4E0913',
      gold: '#C99A3B', goldLt: '#F1D58A', band: '#7A1220', bandSoft: '#5A0E19', accent: '#C99A3B',
    },
    safe: { side: 25, top: 24, contTop: 52, bottom: 40 },
    sectionStyle: 'ribbon',
    hero: 'side',
  },
  matsya: {
    id: 'matsya',
    name: 'Matsya',
    deva: 'मत्स्य',
    tag: 'Fish & lotus pond',
    description: 'Paired Mithila fish, lotus leaves and rippling water — the emblem of good fortune.',
    palette: {
      paper: 'radial-gradient(ellipse at 50% 42%, #FFFCF2 0%, #FAF2DF 60%, #EFE0C0 100%)',
      ink: '#2B211C', inkSoft: '#5E5646', heading: '#1F5133', headingDeep: '#143A24',
      gold: '#B98A2E', goldLt: '#F3D99A', band: '#DCEBDD', bandSoft: '#F1F6EC', accent: '#D86A26',
    },
    safe: { side: 26, top: 24, contTop: 31, bottom: 45 },
    sectionStyle: 'wave',
    hero: 'center',
  },
  kohbar: {
    id: 'kohbar',
    name: 'Kohbar',
    deva: 'कोहबर',
    tag: 'Sun, moon & Madhubani bands',
    description: 'Bold kohbar-painting bands — sun and moon, parrots, triangles and flowers.',
    palette: {
      paper: 'radial-gradient(ellipse at 50% 42%, #FFF6E2 0%, #FBEDD2 60%, #F1D9AE 100%)',
      ink: '#2A1A12', inkSoft: '#66503C', heading: '#A3191F', headingDeep: '#7A1015',
      gold: '#C68A1E', goldLt: '#F6E2B0', band: '#B3262E', bandSoft: '#E8A92A', accent: '#2E6B3A',
    },
    safe: { side: 27, top: 27, contTop: 40, bottom: 42 },
    sectionStyle: 'zigzag',
    hero: 'center',
  },
}

export const BIODATA_TEMPLATE_LIST: BiodataTemplate[] = [
  BIODATA_TEMPLATES.mayur,
  BIODATA_TEMPLATES.kamal,
  BIODATA_TEMPLATES.matsya,
  BIODATA_TEMPLATES.kohbar,
]

export function isBiodataTemplateId(v: string): v is BiodataTemplateId {
  return v in BIODATA_TEMPLATES
}

/**
 * Older slugs map onto the nearest current theme: the member tool's
 * biodata_templates rows ('classic', 'elegant', 'mithila') and the first
 * redesign's ids. Anything else, or nothing, gets Mayur.
 */
const ALIASES: Record<string, BiodataTemplateId> = {
  classic: 'mayur', heritage: 'mayur',
  elegant: 'kamal', 'royal-maroon': 'kamal',
  minimal: 'matsya',
  mithila: 'kohbar', contemporary: 'kohbar',
}

export function resolveBiodataTemplate(slug?: string | null): BiodataTemplate {
  if (slug && isBiodataTemplateId(slug)) return BIODATA_TEMPLATES[slug]
  if (slug && ALIASES[slug]) return BIODATA_TEMPLATES[ALIASES[slug]]
  return BIODATA_TEMPLATES.mayur
}

// ── Photo ─────────────────────────────────────────────────────────────────

export type PhotoShape = 'round' | 'arch' | 'classic'

/**
 * How the photo sits in its frame. `x`/`y` are object-position percentages
 * and also the zoom origin, so the same numbers frame the photo identically
 * at any size — the editor's crop box and the printed page agree.
 */
export type PhotoStyle = { shape: PhotoShape; zoom: number; x: number; y: number }

export const DEFAULT_PHOTO_STYLE: PhotoStyle = { shape: 'round', zoom: 1, x: 50, y: 50 }

export const PHOTO_SHAPES: Record<PhotoShape, { label: string; aspect: number; radius: string }> = {
  round: { label: 'Round', aspect: 1, radius: '50%' },
  arch: { label: 'Arch', aspect: 1.25, radius: '50% 50% 6% 6% / 40% 40% 5% 5%' },
  classic: { label: 'Classic', aspect: 1.25, radius: '9%' },
}
