import { Cormorant_Garamond, Great_Vibes } from 'next/font/google'

/**
 * Faces used only by the Blush Lace Elegance invitation. Not preloaded: the
 * files download only when a lace invitation actually renders these glyphs.
 * Both are Latin-only; Devanagari text keeps the site's Devanagari faces.
 */
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'],
  variable: '--font-cormorant', display: 'swap', preload: false,
})
export const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400', variable: '--font-vibes', display: 'swap', preload: false })
