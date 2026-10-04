import type { ThemeId } from './schema'

/**
 * The five premium looks. Each is a palette plus a choice of Mithila motif and
 * how much ornament to use — the layout is shared, so every theme stays legible
 * on a phone and no theme hides content behind decoration.
 */
export type WeddingTheme = {
  id: ThemeId
  name: string
  hi: string
  tagline: string
  /** Page ground, raised surfaces, primary ink, accent, soft text, gold line work. */
  bg: string
  surface: string
  ink: string
  accent: string
  soft: string
  gold: string
  /** The opening screen. */
  heroBg: string
  heroInk: string
  /** Signature motif for the opening and section dividers. */
  motif: 'kohbar' | 'paag' | 'peacock' | 'sun' | 'line'
  /** 0 = almost none (modern) … 2 = rich (kohbar). */
  ornament: 0 | 1 | 2
}

export const WEDDING_THEMES: WeddingTheme[] = [
  {
    id: 'kohbar', name: 'Kohbar', hi: 'कोहबर', tagline: 'Deep maroon and gold, the painted Kohbar of the bridal chamber',
    bg: '#FBF3E3', surface: '#FFFAF0', ink: '#5A0E19', accent: '#8B1235', soft: '#6A5A4E', gold: '#B98A2E',
    heroBg: 'radial-gradient(ellipse 80% 60% at 50% 30%, #8B1235 0%, #5A0E19 60%, #3C0912 100%)', heroInk: '#FFF1C2',
    motif: 'kohbar', ornament: 2,
  },
  {
    id: 'mithila-vivah', name: 'Mithila Vivah', hi: 'मिथिला विवाह', tagline: 'Sindoor red, ivory and the groom’s Paag',
    bg: '#FFF9F1', surface: '#FFFFFF', ink: '#7A1414', accent: '#B3191F', soft: '#6B5048', gold: '#C49A3A',
    heroBg: 'radial-gradient(ellipse 80% 60% at 50% 30%, #C62828 0%, #8E1616 62%, #5E0D0D 100%)', heroInk: '#FFF4D6',
    motif: 'paag', ornament: 1,
  },
  {
    id: 'madhubani-garden', name: 'Madhubani Garden', hi: 'मधुबनी बाग', tagline: 'Leaf green and ivory, peacocks and lotus',
    bg: '#F6F7EE', surface: '#FFFFF8', ink: '#1F4A33', accent: '#2E7048', soft: '#56604F', gold: '#B98A2E',
    heroBg: 'radial-gradient(ellipse 80% 60% at 50% 30%, #2E7048 0%, #1F5133 60%, #133523 100%)', heroInk: '#FBF1D2',
    motif: 'peacock', ornament: 2,
  },
  {
    id: 'royal-mithila', name: 'Royal Mithila', hi: 'राजसी मिथिला', tagline: 'Ceremonial maroon, gold and ivory, with the sun as witness',
    bg: '#FAF4EA', surface: '#FFFCF6', ink: '#4A0D1C', accent: '#7A1220', soft: '#6A5A4E', gold: '#A8802A',
    heroBg: 'linear-gradient(180deg, #2A0710 0%, #4A0D1C 45%, #7A1220 100%)', heroInk: '#F1D58A',
    motif: 'sun', ornament: 1,
  },
  {
    id: 'modern-mithila', name: 'Modern Mithila', hi: 'आधुनिक मिथिला', tagline: 'Clean ivory, fine type and a single Madhubani border',
    bg: '#FCFAF6', surface: '#FFFFFF', ink: '#2B211C', accent: '#8B1235', soft: '#6A5A4E', gold: '#B98A2E',
    heroBg: 'linear-gradient(180deg, #FFFFFF 0%, #F6F0E6 100%)', heroInk: '#2B211C',
    motif: 'line', ornament: 0,
  },
]

export const weddingTheme = (id: ThemeId): WeddingTheme => WEDDING_THEMES.find(t => t.id === id) ?? WEDDING_THEMES[0]
