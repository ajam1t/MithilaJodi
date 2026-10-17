/**
 * Optional bride and groom photos for the premium invitation.
 *
 * A photo is prepared in the browser — cropped to the portrait frame's 4:5
 * shape and re-encoded at 480×600 — before it ever leaves the device, which
 * strips camera metadata (location, device) and keeps it small. It is sent as
 * a data URL, validated again on the server, and stored beside the
 * invitation's short link (wedding_invites.photos) until that link is deleted.
 */

export const PHOTO_SIDES = ['bride', 'groom'] as const
export type PhotoSide = (typeof PHOTO_SIDES)[number]

/** Data URLs in the builder; image URLs (from /api/wedding/photo) on the public page. */
export type CouplePhotos = Partial<Record<PhotoSide, string | null>>

export const PHOTO_W = 480
export const PHOTO_H = 600
/** After preparation; the API refuses anything larger. */
export const MAX_PHOTO_BYTES = 150 * 1024
/** What a guest's camera roll might hand us, before we shrink it. */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const PHOTO_DATA_URL = /^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('unreadable'))
    img.src = src
  })
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Crop to 4:5 and shrink. Horizontally centred; vertically a little above
 * centre, where faces usually are, so tall photos keep the head.
 * Throws an Error whose message can be shown to the user.
 */
export async function preparePhoto(file: File): Promise<string> {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    throw new Error('Please choose a JPG, PNG or WebP photo.')
  }
  if (file.size > MAX_SOURCE_BYTES) throw new Error('That photo is over 15 MB. Please choose a smaller one.')

  const src = URL.createObjectURL(file)
  try {
    let img: HTMLImageElement
    try { img = await loadImage(src) } catch { throw new Error('That file could not be opened as a photo. Please try another.') }
    const w = img.naturalWidth, h = img.naturalHeight
    if (!w || !h) throw new Error('That file could not be opened as a photo. Please try another.')

    const scale = Math.max(PHOTO_W / w, PHOTO_H / h)
    const sw = PHOTO_W / scale, sh = PHOTO_H / scale
    const sx = (w - sw) / 2, sy = (h - sh) * 0.4

    const canvas = document.createElement('canvas')
    canvas.width = PHOTO_W
    canvas.height = PHOTO_H
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('This browser could not prepare the photo.')
    ctx.fillStyle = '#FFF8EC' // a transparent PNG gets the invitation's paper, not black
    ctx.fillRect(0, 0, PHOTO_W, PHOTO_H)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, PHOTO_W, PHOTO_H)

    // WebP where the browser can encode it (Safari cannot, and quietly returns PNG).
    for (const [type, quality] of [['image/webp', 0.8], ['image/jpeg', 0.84], ['image/jpeg', 0.7]] as const) {
      const blob = await toBlob(canvas, type, quality)
      if (blob && blob.type === type && blob.size <= MAX_PHOTO_BYTES) return await blobToDataUrl(blob)
    }
    throw new Error('That photo could not be made small enough. Please try another.')
  } finally {
    URL.revokeObjectURL(src)
  }
}
