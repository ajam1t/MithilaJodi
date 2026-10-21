import 'server-only'
import sharp from 'sharp'

/*
 * Web-sized copies of profile photographs.
 *
 * Members upload phone photos (often 2–5 MB); pages draw them at a few
 * hundred pixels. Each original in the private `profile-photos` bucket gets a
 * copy at the same path in the private `profile-photos-web` bucket: at most
 * 720 × 960, WebP — typically 40–120 KB. Pages sign the copy and fall back to
 * the original when there is none (a photo from before this existed and not
 * yet backfilled), so nothing ever goes missing — except a stored HEIC
 * original, which is never signed here (see signPhotos).
 *
 * New originals are themselves re-encoded on upload (toStoredOriginal), so
 * what is stored carries no EXIF/GPS or camera metadata either.
 *
 * This changes only the bytes sent, never who may see a photo: callers keep
 * every access check and call these helpers exactly where they used to sign
 * the original. Deleting an original must delete its copy (removeWebCopies).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const WEB_BUCKET = 'profile-photos-web'
const TTL = 3600

let bucketReady: Promise<void> | null = null
/** Create the private bucket on first use (idempotent). */
function ensureBucket(admin: any): Promise<void> {
  bucketReady ??= admin.storage
    .createBucket(WEB_BUCKET, { public: false, fileSizeLimit: 2 * 1024 * 1024, allowedMimeTypes: ['image/webp'] })
    .then(({ error }: { error: { message: string } | null }) => {
      if (error && !/exist/i.test(error.message)) { bucketReady = null; throw new Error(error.message) }
    })
  return bucketReady!
}

/** Resize + re-encode. Rotates by EXIF first and drops all metadata (GPS included). */
export async function toWebCopy(bytes: ArrayBuffer | Buffer): Promise<Buffer> {
  return sharp(Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes), { failOn: 'none' })
    .rotate()
    .resize({ width: 720, height: 960, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toBuffer()
}

/**
 * What an upload is stored as: rotated by EXIF, long edge at most 2000 px,
 * JPEG, and no metadata at all (sharp writes none unless asked to), so a
 * phone photo's GPS position and camera details never reach Storage.
 * Returns null when sharp cannot decode the bytes — typically iPhone HEIC
 * (HEVC), which stock sharp cannot read; callers refuse such an upload.
 */
export async function toStoredOriginal(bytes: ArrayBuffer | Buffer): Promise<Buffer | null> {
  try {
    return await sharp(Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes), { failOn: 'none' })
      .rotate()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer()
  } catch {
    return null
  }
}

/** True for a stored HEIC/HEIF original (uploaded before toStoredOriginal existed). */
export function isHeicPath(path: string): boolean {
  return /\.(heic|heif)$/i.test(path)
}

/**
 * Make (or remake) the web copy of one original. Never throws: on any failure
 * the page keeps serving the original. Pass the bytes when you already have
 * them (an upload); otherwise the original is downloaded.
 */
export async function makeWebCopy(admin: any, path: string, bytes?: ArrayBuffer | Buffer): Promise<boolean> {
  try {
    await ensureBucket(admin)
    let src = bytes
    if (!src) {
      const { data, error } = await admin.storage.from('profile-photos').download(path)
      if (error || !data) return false
      src = await (data as Blob).arrayBuffer()
    }
    const out = await toWebCopy(src)
    const { error } = await admin.storage.from(WEB_BUCKET).upload(path, out, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' })
    if (error) { console.error('[photoWeb] upload failed:', error.message); return false }
    return true
  } catch (err) {
    console.error('[photoWeb] could not make a web copy of', path, (err as Error).message)
    return false
  }
}

export async function removeWebCopies(admin: any, paths: string[]): Promise<void> {
  if (paths.length === 0) return
  try { await admin.storage.from(WEB_BUCKET).remove(paths) } catch { /* nothing to remove */ }
}

/*
 * Signed URLs are reused within a warm server for most of their hour, so a
 * returning visitor's browser can serve the photo from its cache instead of
 * downloading it again under a fresh token. Expiry is unchanged (one hour).
 */
const cache = new Map<string, { url: string; exp: number }>()
// Reused only while 45+ minutes remain, so a page cached for 15 minutes
// (homepage, /explore) never carries a link close to expiry.
const REUSE_MS = 15 * 60 * 1000

function cached(key: string): string | null {
  const hit = cache.get(key)
  if (hit && hit.exp - Date.now() > TTL * 1000 - REUSE_MS) return hit.url
  if (hit) cache.delete(key)
  return null
}
function remember(key: string, url: string) {
  if (cache.size > 5000) cache.clear()
  cache.set(key, { url, exp: Date.now() + TTL * 1000 })
}

type Signed = { path: string; signedUrl: string | null; error: string | null }

/**
 * Drop-in for `storage.from('profile-photos').createSignedUrls(paths, 3600)`:
 * same `{ data, error }` shape, same order — but each URL points at the web
 * copy when one exists, else at the original (never a HEIC original).
 */
export async function signPhotos(admin: any, paths: string[]): Promise<{ data: Signed[] | null; error: { message: string } | null }> {
  const out: Signed[] = paths.map(p => ({ path: p, signedUrl: null, error: null }))
  const need = new Map<string, number[]>()
  paths.forEach((p, i) => {
    const hit = cached(`w:${p}`) ?? cached(`o:${p}`)
    if (hit) out[i].signedUrl = hit
    else need.set(p, [...(need.get(p) ?? []), i])
  })
  if (need.size === 0) return { data: out, error: null }

  const want = [...need.keys()]
  const missing: string[] = []
  const { data: web, error: webErr } = await admin.storage.from(WEB_BUCKET).createSignedUrls(want, TTL)
  want.forEach((p, k) => {
    const url = !webErr ? (web?.[k]?.signedUrl as string | undefined) : undefined
    if (url) { remember(`w:${p}`, url); for (const i of need.get(p)!) out[i].signedUrl = url }
    // A HEIC original is never signed: its bytes still carry the camera's EXIF
    // (GPS included). It stays null and the page shows the placeholder.
    else if (isHeicPath(p)) for (const i of need.get(p)!) out[i].error = 'no web copy'
    else missing.push(p)
  })
  if (missing.length === 0) return { data: out, error: null }

  const { data: orig, error } = await admin.storage.from('profile-photos').createSignedUrls(missing, TTL)
  if (error) return { data: out.some(o => o.signedUrl) ? out : null, error }
  missing.forEach((p, k) => {
    const url = orig?.[k]?.signedUrl as string | undefined
    if (url) remember(`o:${p}`, url)
    for (const i of need.get(p)!) { out[i].signedUrl = url ?? null; out[i].error = url ? null : (orig?.[k]?.error ?? 'not found') }
  })
  return { data: out, error: null }
}

/** Drop-in for `createSignedUrl(path, 3600)`. */
export async function signPhoto(admin: any, path: string): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }> {
  const { data, error } = await signPhotos(admin, [path])
  const url = data?.[0]?.signedUrl
  return url ? { data: { signedUrl: url }, error: null } : { data: null, error: error ?? { message: 'not found' } }
}
