/**
 * The Mithila Heritage collection on Jhayra, Mithila Jodi's sister brand.
 *
 * Only this collection is promoted from Mithila Jodi — never Jhayra's home
 * page, its shop or any other collection. Names and product URLs are exactly
 * those on https://www.jhayra.com/shop/mithila (checked 2026-11-13); the
 * images are that collection's own photographs, resized and served from
 * /public/heritage. No prices or stock are shown here: those live on Jhayra.
 */
export const JHAYRA_MITHILA_URL = 'https://www.jhayra.com/shop/mithila'

export type HeritageArtwork = { id: string; name: string; url: string; w: number; h: number }

export const HERITAGE_ARTWORKS: HeritageArtwork[] = [
  { id: 'p051', name: 'Mithila Goddess with Lotus', url: 'https://www.jhayra.com/product/p051', w: 400, h: 531 },
  { id: 'p052', name: 'Mithila Shiva and Nandi', url: 'https://www.jhayra.com/product/p052', w: 400, h: 606 },
  { id: 'p053', name: 'Mithila Woman in Profile', url: 'https://www.jhayra.com/product/p053', w: 400, h: 603 },
  { id: 'p054', name: 'Mithila Many-Armed Deity', url: 'https://www.jhayra.com/product/p054', w: 400, h: 525 },
  { id: 'p055', name: 'Mithila Devotional Figure', url: 'https://www.jhayra.com/product/p055', w: 400, h: 605 },
  { id: 'p056', name: 'Mithila Mother and Children', url: 'https://www.jhayra.com/product/p056', w: 400, h: 456 },
]

export const heritageSrc = (id: string, w: 400 | 800 = 400) => `/heritage/${id}-${w}.webp`
