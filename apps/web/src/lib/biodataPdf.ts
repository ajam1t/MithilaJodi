/**
 * Builds the biodata PDF in the browser from the page images that
 * renderBiodataImages produces — one JPEG per A4 page, each filling its sheet.
 *
 * Printing to PDF was left to the browser before, and iPhone Safari adds its
 * own page margins to every print: each full-height A4 page then overflowed
 * onto an extra, nearly blank sheet, doubling the page count. A file built
 * here has exactly one sheet per page on every device.
 *
 * The PDF is written by hand (it is only a few objects: a catalog, the page
 * tree, and a page, image and content stream per sheet), so no library joins
 * the bundle.
 */

const A4 = { w: 595.28, h: 841.89 }

/** Width and height from a JPEG's start-of-frame marker. */
function jpegSize(bytes: Uint8Array): { w: number; h: number } {
  let i = 2
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) { i++; continue }
    const marker = bytes[i + 1]
    const len = (bytes[i + 2] << 8) | bytes[i + 3]
    // SOF0–SOF15, except DHT (C4), JPG (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: (bytes[i + 5] << 8) | bytes[i + 6], w: (bytes[i + 7] << 8) | bytes[i + 8] }
    }
    i += 2 + len
  }
  throw new Error('Could not read the page image.')
}

export async function buildBiodataPdf(pages: Blob[], title: string): Promise<Blob> {
  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  const offsets: number[] = []
  let size = 0
  const push = (chunk: string | Uint8Array) => {
    const b = typeof chunk === 'string' ? enc.encode(chunk) : chunk
    parts.push(b)
    size += b.length
  }
  const object = (n: number, body: () => void) => {
    offsets[n] = size
    push(`${n} 0 obj\n`)
    body()
    push('\nendobj\n')
  }

  const images = await Promise.all(pages.map(async p => new Uint8Array(await p.arrayBuffer())))
  // 1 catalog, 2 page tree, 3 info; then page, image, content for each sheet.
  const pageObj = (k: number) => 4 + k * 3
  const safeTitle = title.replace(/[^\x20-\x7E]/g, '').replace(/[()\\]/g, '')

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  object(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'))
  object(2, () => push(`<< /Type /Pages /Count ${images.length} /Kids [${images.map((_, k) => `${pageObj(k)} 0 R`).join(' ')}] >>`))
  object(3, () => push(`<< /Title (${safeTitle}) /Producer (Mithila Jodi) >>`))
  images.forEach((img, k) => {
    const { w, h } = jpegSize(img)
    const [pg, im, ct] = [pageObj(k), pageObj(k) + 1, pageObj(k) + 2]
    const draw = `q ${A4.w} 0 0 ${A4.h} 0 0 cm /Im0 Do Q`
    object(pg, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.w} ${A4.h}] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${ct} 0 R >>`))
    object(im, () => {
      push(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`)
      push(img)
      push('\nendstream')
    })
    object(ct, () => push(`<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`))
  })

  const count = 4 + images.length * 3
  const xref = size
  push(`xref\n0 ${count}\n0000000000 65535 f \n`)
  for (let n = 1; n < count; n++) push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size ${count} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`)
  return new Blob(parts as BlobPart[], { type: 'application/pdf' })
}
