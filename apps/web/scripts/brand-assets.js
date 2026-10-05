/**
 * Regenerate every Mithila Jodi brand asset in /public from the master logo.
 *
 *   node scripts/brand-assets.js            (from apps/web)
 *
 * Master: <repo>/Logo/Logo.jpg — the official logo, never edited. The only
 * processing is (1) lifting the white paper background to transparency, so
 * the logo sits on the site's ivory without a white box, and (2) cropping:
 *
 *   logo.png              the full lockup (symbol, wordmark, tagline, ornament)
 *   logo-mark.png         the central M-J couple symbol alone, for small sizes
 *                         where the wordmark would be unreadable
 *   favicon.ico / favicon*.png / apple-touch-icon / icon-maskable-512
 *                         the mark, sized for each slot
 *   og-card.png           1200×630 social card: the full lockup on ivory
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '..')
const MASTER = path.resolve(ROOT, '..', '..', 'Logo', 'Logo.jpg')
const OUT = path.join(ROOT, 'public')
const IVORY = { r: 255, g: 250, b: 240, alpha: 1 } // cream, #FFFAF0 — the site's ground

/** Rows of the master where the symbol ends and the wordmark begins (measured). */
const MARK_BOTTOM = 495

/** White → transparent ("colour to alpha"): exact on white, clean on any ground. */
async function transparent(input) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const out = Buffer.alloc(info.width * info.height * 4)
  for (let p = 0, q = 0; p < data.length; p += 3, q += 4) {
    const r = data[p], g = data[p + 1], b = data[p + 2]
    let a = Math.max(255 - r, 255 - g, 255 - b) / 255
    if (a < 0.05) a = 0 // JPEG noise on the paper
    if (a === 0) { out[q + 3] = 0; continue }
    const un = c => Math.max(0, Math.min(255, Math.round((c - 255 * (1 - a)) / a)))
    out[q] = un(r); out[q + 1] = un(g); out[q + 2] = un(b); out[q + 3] = Math.round(a * 255)
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
}

async function trimmed(img, pad) {
  const buf = await img.png().toBuffer()
  const t = await sharp(buf).trim({ threshold: 1 }).png().toBuffer()
  return sharp(t).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
}

/** The mark centred on a square, filling `fill` of it, on `bg` (transparent if null). */
async function square(mark, size, fill, bg) {
  const inner = Math.round(size * fill)
  const m = await sharp(mark).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: m, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

/** A .ico holding PNG images (supported by every current browser). */
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length)
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4)
  let offset = head.length
  pngs.forEach(({ size, buf }, i) => {
    const e = 6 + i * 16
    head.writeUInt8(size >= 256 ? 0 : size, e); head.writeUInt8(size >= 256 ? 0 : size, e + 1)
    head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3)
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6)
    head.writeUInt32LE(buf.length, e + 8); head.writeUInt32LE(offset, e + 12)
    offset += buf.length
  })
  return Buffer.concat([head, ...pngs.map(p => p.buf)])
}

;(async () => {
  const meta = await sharp(MASTER).metadata()
  const clear = await (await transparent(MASTER)).png().toBuffer()

  // Full lockup.
  const full = await trimmed(sharp(clear), 12)
  fs.writeFileSync(path.join(OUT, 'logo.png'), await sharp(full).png({ compressionLevel: 9 }).toBuffer())

  // The symbol alone: everything above the wordmark.
  const top = await sharp(clear).extract({ left: 0, top: 0, width: meta.width, height: MARK_BOTTOM }).png().toBuffer()
  const mark = await trimmed(sharp(top), 6)
  fs.writeFileSync(path.join(OUT, 'logo-mark.png'), await sharp(mark).png({ compressionLevel: 9 }).toBuffer())

  // Browser favicons: the mark on a rounded ivory tile — maroon on a bare
  // transparent square all but disappears in a dark-mode tab strip.
  const fav = async s => {
    const tile = await square(mark, s, 0.9, IVORY)
    const r = Math.max(2, Math.round(s * 0.2))
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" rx="${r}" fill="#fff"/></svg>`)
    return sharp(tile).composite([{ input: mask, blend: 'dest-in' }]).png({ compressionLevel: 9 }).toBuffer()
  }
  fs.writeFileSync(path.join(OUT, 'favicon.png'), await fav(48))
  fs.writeFileSync(path.join(OUT, 'favicon-96.png'), await fav(96))
  fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico(await Promise.all([16, 32, 48].map(async s => ({ size: s, buf: await fav(s) })))))

  // App / organisation icons: opaque ivory squares (home screens, Google's logo slot, the official avatar).
  fs.writeFileSync(path.join(OUT, 'favicon-192.png'), await square(mark, 192, 0.84, IVORY))
  fs.writeFileSync(path.join(OUT, 'favicon-512.png'), await square(mark, 512, 0.84, IVORY))
  fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), await sharp(await square(mark, 180, 0.82, IVORY)).flatten({ background: IVORY }).png().toBuffer())
  // Maskable: launchers may crop to a circle — keep the mark inside the 80% safe zone.
  fs.writeFileSync(path.join(OUT, 'icon-maskable-512.png'), await square(mark, 512, 0.66, IVORY))

  // Social card: the full lockup on ivory with a fine gold frame.
  const lockup = await sharp(full).resize({ height: 560, fit: 'inside' }).png().toBuffer()
  const frame = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">' +
    '<rect x="18" y="18" width="1164" height="594" rx="14" fill="none" stroke="#C89B45" stroke-width="2"/>' +
    '<rect x="28" y="28" width="1144" height="574" rx="10" fill="none" stroke="#C89B45" stroke-opacity="0.45" stroke-width="1"/>' +
    '</svg>')
  const og = await sharp({ create: { width: 1200, height: 630, channels: 4, background: IVORY } })
    .composite([{ input: frame }, { input: lockup, gravity: 'center' }])
    .flatten({ background: IVORY })
    .png({ compressionLevel: 9 })
    .toBuffer()
  fs.writeFileSync(path.join(OUT, 'og-card.png'), og)

  for (const f of ['logo.png', 'logo-mark.png', 'favicon.ico', 'favicon.png', 'favicon-96.png', 'favicon-192.png', 'favicon-512.png', 'apple-touch-icon.png', 'icon-maskable-512.png', 'og-card.png']) {
    const m = await sharp(path.join(OUT, f)).metadata().catch(() => ({}))
    console.log(f.padEnd(22), m.width ? `${m.width}×${m.height}` : '(ico)', `${Math.round(fs.statSync(path.join(OUT, f)).size / 1024)} KB`)
  }
})().catch(e => { console.error(e); process.exit(1) })
