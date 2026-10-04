/**
 * Premium wedding invitation — the content model, shared by the builder (client)
 * and the API (server). Everything except the couple's names, the date and the
 * venue is optional, and every Mithila/family field can be switched off.
 */
import { z } from 'zod'

export const THEME_IDS = ['kohbar', 'mithila-vivah', 'madhubani-garden', 'royal-mithila', 'modern-mithila'] as const
export type ThemeId = (typeof THEME_IDS)[number]

const text = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`)
const optText = (max: number) => text(max).optional().default('')
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please choose a date.').or(z.literal('')).optional().default('')
const time = z.string().regex(/^\d{2}:\d{2}$/, 'Please choose a time.').or(z.literal('')).optional().default('')

/** A displayable field the couple can show or hide. */
const toggled = (max: number) => z.object({ value: optText(max), show: z.boolean().default(true) }).default({ value: '', show: true })

export const MAP_URL = /^https:\/\/((www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)\S*$/i

export const eventSchema = z.object({
  id: z.string().min(1).max(40),
  name: text(60).min(1, 'Please name the ceremony.'),
  date,
  time,
  venue: optText(120),
  description: optText(400),
  icon: z.enum(['tilak', 'matkor', 'haldi', 'vivah', 'vidai', 'sindoor', 'baraat', 'reception', 'puja', 'other']).default('other'),
})
export type WeddingEvent = z.infer<typeof eventSchema>

const sideSchema = z.object({
  gram: toggled(80),
  mool: toggled(60),
  gotra: toggled(60),
  matrikGotra: toggled(60),
  jila: toggled(60),
  parivar: toggled(160),
}).default({})

export const contentSchema = z.object({
  couple: z.object({
    brideName: optText(60),
    groomName: optText(60),
    nickname: optText(60),
    brideAbout: optText(240),
    groomAbout: optText(240),
  }).default({}),
  wedding: z.object({
    date,
    time,
    venueName: optText(120),
    venueAddress: optText(300),
    mapUrl: z.string().trim().max(500).refine(v => v === '' || MAP_URL.test(v), 'Please paste a Google Maps link.').optional().default(''),
    dressCode: optText(120),
    note: optText(300),
  }).default({}),
  message: z.object({
    language: z.enum(['mai', 'hi', 'en', 'custom']).default('mai'),
    text: optText(800),
  }).default({}),
  story: z.object({ title: optText(80), text: optText(3000) }).default({}),
  events: z.array(eventSchema).max(20, 'Up to 20 ceremonies.').default([]),
  mithila: z.object({
    enabled: z.boolean().default(false),
    bride: sideSchema,
    groom: sideSchema,
    intro: optText(500),
  }).default({}),
  family: z.object({
    brideParents: optText(160),
    groomParents: optText(160),
    members: optText(500),
    message: optText(500),
  }).default({}),
  /** Guests reply on WhatsApp to this number — nothing is collected or stored by Mithila Jodi. */
  rsvp: z.object({
    enabled: z.boolean().default(true),
    deadline: date,
    phone: z.string().trim().regex(/^$|^[6-9]\d{9}$/, 'Please enter a 10-digit Indian mobile number.').optional().default(''),
    contactName: optText(60),
  }).default({}),
})
export type WeddingContent = z.infer<typeof contentSchema>

/**
 * The whole invitation lives in its link. `v` versions the format so links
 * shared today keep opening after the format changes.
 */
export const inviteSchema = z.object({
  v: z.literal(1),
  t: z.enum(THEME_IDS),
  c: contentSchema,
})
export type Invite = z.infer<typeof inviteSchema>

export const EMPTY_CONTENT: WeddingContent = contentSchema.parse({})

/**
 * Drop everything that equals its default before encoding — empty strings,
 * visible-but-empty fields, unused sections — so links stay short. Decoding
 * runs the schema again, which restores the defaults.
 */
export function compact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(compact)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      const c = compact(v)
      if (c === '' || c === undefined) continue
      if (c && typeof c === 'object' && !Array.isArray(c) && Object.keys(c).length === 0) continue
      if (Array.isArray(c) && c.length === 0) continue
      // A toggled field that is visible (the default) and empty carries nothing.
      if (k === 'show' && c === true) continue
      out[k] = c
    }
    return out
  }
  return value
}

// ─── Presets ───────────────────────────────────────────────────────────────

export const WELCOME_PRESETS: Record<'mai' | 'hi' | 'en', string> = {
  mai:
    'अहाँ सभक स्नेह आ आशीर्वाद हमर नव जीवनक पहिल पूँजी अछि।\n\nएहि शुभ अवसर पर अहाँ सभ सपरिवार पधारि नव दम्पतिके आशीर्वाद देबाक कृपा करी।',
  hi:
    'आपका स्नेह और आशीर्वाद हमारे नए जीवन की पहली पूँजी है।\n\nइस शुभ अवसर पर आप सपरिवार पधारकर नवदम्पति को आशीर्वाद देने की कृपा करें।',
  en:
    'Your love and blessings are the first treasure of our new life together.\n\nWe warmly invite you and your family to join us and bless the couple on this auspicious occasion.',
}

/** Ceremonies many Maithil families hold — offered as one-tap starting points, never assumed. */
export const CEREMONY_PRESETS: Array<{ name: string; icon: WeddingEvent['icon']; hint: string }> = [
  { name: 'तिलक', icon: 'tilak', hint: 'Tilak' },
  { name: 'मटकोर', icon: 'matkor', hint: 'Matkor' },
  { name: 'हल्दी', icon: 'haldi', hint: 'Haldi' },
  { name: 'बरियाती', icon: 'baraat', hint: 'Baraat' },
  { name: 'विवाह', icon: 'vivah', hint: 'Vivah' },
  { name: 'सिन्दूरदान', icon: 'sindoor', hint: 'Sindoordan' },
  { name: 'विदाई', icon: 'vidai', hint: 'Vidai' },
  { name: 'स्वागत समारोह', icon: 'reception', hint: 'Reception' },
]

export const MITHILA_FIELDS: Array<{ key: keyof WeddingContent['mithila']['bride']; label: string; hi: string; placeholder: string }> = [
  { key: 'gram', label: 'Native village', hi: 'गाम', placeholder: 'e.g. Sarisab-Pahi' },
  { key: 'jila', label: 'District', hi: 'जिला', placeholder: 'e.g. Madhubani' },
  { key: 'mool', label: 'Mool', hi: 'मूल', placeholder: 'e.g. Sodarpure' },
  { key: 'gotra', label: 'Gotra', hi: 'गोत्र', placeholder: 'e.g. Shandilya' },
  { key: 'matrikGotra', label: 'Maternal gotra', hi: 'मातृक गोत्र', placeholder: 'Optional' },
  { key: 'parivar', label: 'Family', hi: 'परिवार', placeholder: 'e.g. Shri Ramesh Jha’s family' },
]

/** Fields a guest would see in the Mithila section — only values the couple chose to show. */
export function visibleMithila(side: WeddingContent['mithila']['bride']) {
  return MITHILA_FIELDS.map(f => ({ ...f, value: side[f.key].show ? side[f.key].value.trim() : '' })).filter(f => f.value)
}

export function newEventId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** The minimum for a beautiful invitation: two names, a date and a venue. */
export function readiness(c: WeddingContent): { ready: boolean; missing: string[] } {
  const missing: string[] = []
  if (!c.couple.brideName) missing.push('Bride’s name')
  if (!c.couple.groomName) missing.push('Groom’s name')
  if (!c.wedding.date) missing.push('Wedding date')
  if (!c.wedding.venueName) missing.push('Venue')
  return { ready: missing.length === 0, missing }
}
