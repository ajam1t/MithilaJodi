/**
 * Identify an uploaded image by its first bytes, not by the type the browser
 * claims. Returns the real MIME type for the formats we accept, or null.
 * (A file renamed to .jpg — or an HTML/SVG/script payload labelled image/jpeg —
 * is refused, and what we store is always what the bytes actually are.)
 */
export type SniffedImage = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif'

const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs'])
const HEIF_BRANDS = new Set(['mif1', 'msf1', 'heif'])

export function sniffImage(buf: ArrayBuffer): SniffedImage | null {
  const b = new Uint8Array(buf.slice(0, 32))
  if (b.length < 12) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png'
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12)
    if (HEIC_BRANDS.has(brand)) return 'image/heic'
    if (HEIF_BRANDS.has(brand)) return 'image/heif'
  }
  return null
}
