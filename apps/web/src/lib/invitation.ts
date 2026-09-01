/**
 * Marriage Invitation Card Maker — types, template registry and text helpers.
 *
 * Cards are rendered as pure SVG (see components/invitation/InvitationCard.tsx)
 * so the same markup drives the live preview and the PNG download — no
 * html-to-image dependency, and no preview/download drift.
 *
 * Fonts: SVG rasterised into a canvas cannot load web fonts, so templates use
 * widely available system stacks. Preview and download therefore match exactly.
 */

export type TemplateId = 'kohbar' | 'matsya' | 'mayur' | 'surya' | 'modern'

export type InvitationData = {
  brideName: string
  groomName: string
  /** YYYY-MM-DD */
  date: string
  time: string
  venue: string
  city: string
  message: string
}

export type Palette = {
  /** Card background. */
  bg: string
  /** Inner panel / paper. */
  panel: string
  /** Primary text. */
  ink: string
  /** Names + headings. */
  heading: string
  /** Metallic / ornament colour. */
  gold: string
  /** Secondary accent used in motifs. */
  accent: string
  /** Muted text. */
  muted: string
}

export type Template = {
  id: TemplateId
  name: string
  /** Short label shown under the swatch in the picker. */
  tag: string
  description: string
  palette: Palette
  /** Serif stack for names/headings. */
  headingFont: string
  /** Sans stack for details. */
  bodyFont: string
}

/** Font stacks that exist on virtually all devices — safe for SVG rasterisation. */
const SERIF = "Georgia, 'Times New Roman', 'Nirmala UI', serif"
const SANS = "'Segoe UI', Roboto, 'Helvetica Neue', 'Nirmala UI', Arial, sans-serif"

export const TEMPLATES: Template[] = [
  {
    id: 'kohbar',
    name: 'Kohbar',
    tag: 'Madhubani',
    description: 'Madhubani kohbar art — lotus, fish and dense line work in maroon and gold.',
    palette: {
      bg: '#7A1220', panel: '#FCF5E7', ink: '#2B211C', heading: '#7A1220',
      gold: '#B98A2E', accent: '#C4562F', muted: '#6A5A4E',
    },
    headingFont: SERIF, bodyFont: SANS,
  },
  {
    id: 'matsya',
    name: 'Matsya',
    tag: 'Mithila · Fish',
    description: 'Paired fish and flowing water lines — Mithila’s emblem of good fortune.',
    palette: {
      bg: '#1F5133', panel: '#FFFAF0', ink: '#2B211C', heading: '#1F5133',
      gold: '#B98A2E', accent: '#2E7048', muted: '#6A5A4E',
    },
    headingFont: SERIF, bodyFont: SANS,
  },
  {
    id: 'surya',
    name: 'Surya',
    tag: 'Mithila · Sun',
    description: 'A rising-sun arch over aripan geometry, in terracotta and marigold.',
    palette: {
      bg: '#C4562F', panel: '#FCF5E7', ink: '#2B211C', heading: '#9B2233',
      gold: '#B98A2E', accent: '#E8912A', muted: '#6A5A4E',
    },
    headingFont: SERIF, bodyFont: SANS,
  },
  {
    id: 'mayur',
    name: 'Mayur',
    tag: 'Traditional',
    description: 'A classic peacock arch in deep indigo and gold — traditional Indian wedding.',
    palette: {
      bg: '#2E3A6E', panel: '#FFFAF0', ink: '#2B211C', heading: '#2E3A6E',
      gold: '#B98A2E', accent: '#E4C572', muted: '#6A5A4E',
    },
    headingFont: SERIF, bodyFont: SANS,
  },
  {
    id: 'modern',
    name: 'Ivory',
    tag: 'Modern',
    description: 'Minimal ivory and gold with a single lotus mark — quiet and contemporary.',
    palette: {
      bg: '#ECDCC0', panel: '#FFFDF8', ink: '#3A322C', heading: '#5A0E19',
      gold: '#B98A2E', accent: '#D6A83C', muted: '#7A6E62',
    },
    headingFont: SERIF, bodyFont: SANS,
  },
]

export function getTemplate(id: TemplateId): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}

export const EMPTY_INVITATION: InvitationData = {
  brideName: '',
  groomName: '',
  date: '',
  time: '',
  venue: '',
  city: '',
  message: '',
}

/** Placeholder values so the preview always looks like a finished card. */
export const SAMPLE_INVITATION: InvitationData = {
  brideName: 'Janaki',
  groomName: 'Aditya',
  date: '',
  time: '7:00 PM onwards',
  venue: 'Thakur Vivah Bhawan',
  city: 'Darbhanga, Bihar',
  message: 'Together with our families, we request the honour of your presence.',
}

/** Field value, falling back to the sample so the card never looks broken. */
export function display(value: string, fallback: string): string {
  const v = value.trim()
  return v.length > 0 ? v : fallback
}

/** "2026-12-07" → "Monday, 7 December 2026". Returns '' for empty/invalid. */
export function formatWeddingDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

/**
 * Greedy word wrap for SVG <text>, which does not wrap on its own.
 * Returns at most `maxLines` lines, ellipsising the last if it overflows.
 */
export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const clean = text.trim().replace(/\s+/g, ' ')
  if (!clean) return []
  const words = clean.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
      if (lines.length === maxLines) break
    }
  }
  if (current && lines.length < maxLines) lines.push(current)

  if (lines.length === maxLines) {
    // If content remains beyond the last line, mark it as truncated.
    const used = lines.join(' ').length
    if (used < clean.length) {
      const last = lines[maxLines - 1]
      lines[maxLines - 1] = last.length > maxChars - 1 ? `${last.slice(0, maxChars - 1)}…` : `${last}…`
    }
  }
  return lines
}

/** Filename for the downloaded card. */
export function invitationFileName(data: InvitationData): string {
  const part = [data.brideName, data.groomName]
    .map((s) => s.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, ''))
    .filter(Boolean)
    .join('-weds-')
  const base = part || 'mithila-jodi-invitation'
  return `${base.toLowerCase()}-invitation.png`
}
