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

/**
 * WebKit often paints a foreignObject's images only on a later render.
 *
 * That is every browser on iPhone and iPad — Chrome there ("CriOS"), Firefox
 * ("FxiOS") and Edge all run on WebKit — plus Safari on the Mac. Matching
 * "Safari" while excluding those names missed Chrome on iPhone, whose PDFs
 * then came out with an empty photo frame and no logo.
 */
function isWebKit(): boolean {
  const ua = navigator.userAgent
  const iOS = /iP(hone|od|ad)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  return iOS || (/AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|Android/.test(ua))
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

/**
 * Swaps each image's address for an inline data URL and waits for it to
 * decode, so the copy html-to-image draws never has to fetch anything — a
 * blob: or same-origin URL fetched mid-render is what WebKit drops.
 * Returns a function that puts the original addresses back.
 */
async function inlineImages(root: HTMLElement): Promise<() => void> {
  const restore: Array<() => void> = []
  await Promise.all(Array.from(root.querySelectorAll('img')).map(async img => {
    const src = img.getAttribute('src')
    if (!src || src.startsWith('data:')) return
    try {
      const blob = await (await fetch(img.currentSrc || src)).blob()
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = () => reject(r.error)
        r.readAsDataURL(blob)
      })
      img.src = data
      restore.push(() => { img.src = src })
      await img.decode().catch(() => {})
    } catch { /* leave it as it is; html-to-image tries its own fetch */ }
  }))
  return () => restore.forEach(f => f())
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

  const restore = await inlineImages(root)
  const webkit = isWebKit()
  const blobs: Blob[] = []
  try {
    for (const page of pages) {
      // Warm-up renders let WebKit decode the images it will paint on the last one.
      if (webkit) {
        for (let n = 0; n < 2; n++) { await toCanvas(page, options); await wait(120) }
      }
      const canvas = await toCanvas(page, options)
      blobs.push(await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not create the image.'))), 'image/jpeg', JPEG_QUALITY)
      }))
    }
  } finally {
    restore()
  }
  return blobs
}

/** A link on a page, as fractions of the page's width and height from its top left. */
export type PageLink = { href: string; x: number; y: number; w: number; h: number }

/** The links (data-pdf-link) on each page, so the PDF can keep them clickable. */
export function pageLinks(root: HTMLElement): PageLink[][] {
  return Array.from(root.querySelectorAll<HTMLElement>('.bd-page')).map(page => {
    const box = page.getBoundingClientRect()
    if (!box.width || !box.height) return []
    return Array.from(page.querySelectorAll<HTMLElement>('[data-pdf-link]')).map(el => {
      const r = el.getBoundingClientRect()
      return {
        href: el.dataset.pdfLink ?? '',
        x: (r.left - box.left) / box.width, y: (r.top - box.top) / box.height,
        w: r.width / box.width, h: r.height / box.height,
      }
    }).filter(l => /^https?:\/\//i.test(l.href) && l.w > 0 && l.h > 0)
  })
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
