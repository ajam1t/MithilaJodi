/**
 * Biodata document templates — registry only, no rendering here.
 *
 * Mirrors the shape of lib/invitation.ts's TEMPLATES (id, name, tag,
 * description, palette) so the two "maker" tools stay consistent for anyone
 * reading both. Rendering lives in components/biodata/BiodataDocument, which
 * is shared by the public maker (/marriage-biodata) and the signed-in
 * member's tool (/biodata) — both read this same registry, so a template
 * looks identical wherever it is used.
 */

export type BiodataTemplateId = 'heritage' | 'royal-maroon' | 'minimal' | 'contemporary'

export type BiodataPalette = {
  /** Page background behind the document, on screen only — never printed. */
  pageBg: string
  /** The document's own paper/content colour. */
  paper: string
  /** Body text. */
  ink: string
  /** Muted labels. */
  inkSoft: string
  /** Headings and the person's name. */
  heading: string
  /** Gold line work and accents. */
  gold: string
  /** The outer frame/border colour. */
  frame: string
}

export type BiodataTemplate = {
  id: BiodataTemplateId
  name: string
  tag: string
  description: string
  palette: BiodataPalette
  /** How the outer border reads. */
  frameStyle: 'ornate' | 'wrap' | 'hairline' | 'band'
  /** How a section heading reads. */
  sectionStyle: 'band' | 'rule' | 'underline' | 'tab'
  /** How much corner motif a template carries. */
  motif: 'bold' | 'soft' | 'minimal' | 'single'
  /** Only 'contemporary' moves the photo into a sidebar beside the identity block. */
  layout: 'classic' | 'sidebar'
}

export const BIODATA_TEMPLATES: Record<BiodataTemplateId, BiodataTemplate> = {
  heritage: {
    id: 'heritage',
    name: 'Mithila Heritage',
    tag: 'Madhubani borders',
    description: 'Cream paper, Madhubani-inspired corner motifs, maroon headings and gold detailing.',
    palette: {
      pageBg: '#F0ECE4', paper: '#FFFBF2', ink: '#2B211C', inkSoft: '#6A5A4E',
      heading: '#7A1220', gold: '#B98A2E', frame: '#7A1220',
    },
    frameStyle: 'ornate', sectionStyle: 'band', motif: 'bold', layout: 'classic',
  },
  'royal-maroon': {
    id: 'royal-maroon',
    name: 'Royal Maroon',
    tag: 'Gold-framed',
    description: 'An elegant maroon frame with gold ornament, opening onto an ivory content area.',
    palette: {
      pageBg: '#F0ECE4', paper: '#FFFDF8', ink: '#2B211C', inkSoft: '#6A5A4E',
      heading: '#7A1220', gold: '#D8B45A', frame: '#5A0E19',
    },
    frameStyle: 'wrap', sectionStyle: 'rule', motif: 'soft', layout: 'classic',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Elegance',
    tag: 'Clean & spacious',
    description: 'Clean ivory background, subtle traditional corners and generous whitespace.',
    palette: {
      pageBg: '#F0ECE4', paper: '#FFFFFF', ink: '#2B211C', inkSoft: '#6A5A4E',
      heading: '#7A1220', gold: '#C9A227', frame: '#D8B45A',
    },
    frameStyle: 'hairline', sectionStyle: 'underline', motif: 'minimal', layout: 'classic',
  },
  contemporary: {
    id: 'contemporary',
    name: 'Contemporary Mithila',
    tag: 'Modern layout',
    description: 'A modern, editorial information layout with refined traditional accents.',
    palette: {
      pageBg: '#F0ECE4', paper: '#FFFFFF', ink: '#2B211C', inkSoft: '#6A5A4E',
      heading: '#7A1220', gold: '#B98A2E', frame: '#B98A2E',
    },
    frameStyle: 'band', sectionStyle: 'tab', motif: 'single', layout: 'sidebar',
  },
}

export const BIODATA_TEMPLATE_LIST: BiodataTemplate[] = [
  BIODATA_TEMPLATES.heritage,
  BIODATA_TEMPLATES['royal-maroon'],
  BIODATA_TEMPLATES.minimal,
  BIODATA_TEMPLATES.contemporary,
]

export function isBiodataTemplateId(v: string): v is BiodataTemplateId {
  return v in BIODATA_TEMPLATES
}

/**
 * Unknown or legacy slugs — 'classic', 'elegant', 'mithila' from the
 * signed-in member's /biodata tool (biodata_templates table), or none at all
 * — resolve to Heritage, the closest match to what that tool already looked
 * like. That tool is out of scope here; this keeps it rendering unchanged in
 * shape while it quietly inherits the same quality pass.
 */
export function resolveBiodataTemplate(slug?: string | null): BiodataTemplate {
  if (slug && isBiodataTemplateId(slug)) return BIODATA_TEMPLATES[slug]
  return BIODATA_TEMPLATES.heritage
}
