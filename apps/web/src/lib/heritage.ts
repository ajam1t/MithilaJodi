/**
 * The Mithila Heritage collection on Jhayra, Mithila Jodi's sister brand.
 *
 * Only this collection is promoted from Mithila Jodi — never Jhayra's home
 * page, its shop or any other collection. Names and product URLs are exactly
 * those on https://www.jhayra.com/shop/mithila (updated 2026-11-13 to the new collection p079–p086); the
 * images are that collection's own photographs, resized and served from
 * /public/heritage. No prices or stock are shown here: those live on Jhayra.
 */
export const JHAYRA_MITHILA_URL = 'https://www.jhayra.com/shop/mithila'

export type HeritageArtwork = { id: string; name: string; url: string; w: number; h: number }

export const HERITAGE_ARTWORKS: HeritageArtwork[] = [
  { id: 'p079', name: 'Tree of Life', url: 'https://www.jhayra.com/product/p079', w: 400, h: 566 },
  { id: 'p080', name: 'The Peacock of Mithila', url: 'https://www.jhayra.com/product/p080', w: 400, h: 566 },
  { id: 'p081', name: 'Kohbar Ghar', url: 'https://www.jhayra.com/product/p081', w: 400, h: 566 },
  { id: 'p082', name: 'Siya Ram of Mithila', url: 'https://www.jhayra.com/product/p082', w: 400, h: 566 },
  { id: 'p083', name: 'Aripan Art', url: 'https://www.jhayra.com/product/p083', w: 400, h: 566 },
  { id: 'p084', name: 'My Mithila, My Village', url: 'https://www.jhayra.com/product/p084', w: 400, h: 566 },
  { id: 'p085', name: 'Janakpur Royal Heritage', url: 'https://www.jhayra.com/product/p085', w: 400, h: 566 },
  { id: 'p086', name: 'Chhath', url: 'https://www.jhayra.com/product/p086', w: 400, h: 566 },
]

/** By id, for the hero and the homepage card. */
export const artwork = (id: string) => HERITAGE_ARTWORKS.find(a => a.id === id) ?? HERITAGE_ARTWORKS[0]

export const heritageSrc = (id: string, w: 400 | 800 = 400) => `/heritage/${id}-${w}.webp`
