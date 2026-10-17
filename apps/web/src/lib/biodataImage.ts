/**
 * Turns the rendered biodata pages into JPEG images for WhatsApp.
 *
 * Captures the full-size print copy (#bd-print-root), one image per A4 page,
 * so the image is the same document the PDF prints. html-to-image is loaded
 * only when someone asks for an image, keeping it out of the page bundle.
 *
 * 2× pixel ratio gives a 1588 × 2246 px page — sharp in WhatsApp's HD mode,
 * still well under a couple of MB as JPEG.
 */

const PIXEL_RATIO = 2
const JPEG_QUALITY = 0.94

/** WebKit often paints a foreignObject's images only on the second render. */
function isWebKit(): boolean {
  return /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent)
}

/** The next/font variables the document's inline styles refer to. */
const FONT_VARS = ['--font-mukta', '--font-rozha', '--font-marcellus']

/**
 * html-to-image decides which @font-face rules to embed from each element's
 * inline font-family — and ours read `var(--font-…)`, which matches no rule,
 * so Marcellus and Rozha were left out and the image fell back to system
 * fonts (wider, so headings wrapped). A throwaway probe carrying the resolved
 * family names makes it embed exactly the fonts the document uses.
 */
function fontProbe(host: HTMLElement): HTMLElement {
  const css = getComputedStyle(document.documentElement)
  const probe = document.createElement('div')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
  for (const v of FONT_VARS) {
    const family = css.getPropertyValue(v).trim()
    if (!family) continue
    const span = document.createElement('span')
    span.style.fontFamily = family
    probe.appendChild(span)
  }
  host.appendChild(probe)
  return probe
}

export async function renderBiodataImages(root: HTMLElement): Promise<Blob[]> {
  const { toCanvas, getFontEmbedCSS } = await import('html-to-image')
  const pages = Array.from(root.querySelectorAll<HTMLElement>('.bd-page'))
  if (!pages.length) throw new Error('The biodata is not ready yet. Please try again.')

  // Embedding the web fonts is the slow part; do it once for every page.
  const probe = fontProbe(root)
  let fontEmbedCSS: string
  try {
    fontEmbedCSS = await getFontEmbedCSS(probe)
  } finally {
    probe.remove()
  }
  const options = {
    pixelRatio: PIXEL_RATIO,
    fontEmbedCSS,
    backgroundColor: '#FFFFFF',
    style: { boxShadow: 'none', margin: '0' },
  }

  const blobs: Blob[] = []
  for (const page of pages) {
    if (isWebKit()) await toCanvas(page, options)
    const canvas = await toCanvas(page, options)
    blobs.push(await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not create the image.'))), 'image/jpeg', JPEG_QUALITY)
    }))
  }
  return blobs
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoking at once can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
