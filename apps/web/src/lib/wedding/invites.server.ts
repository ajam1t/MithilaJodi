import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { decodeInvite } from './codec.server'
import { MAX_LINK_PAYLOAD } from './codec'
import { baseSlug, isSlug } from './slug'
import type { Invite } from './schema'
import { MAX_PHOTO_BYTES, PHOTO_DATA_URL, PHOTO_SIDES, type PhotoSide } from './photos'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Short links for invitations (table wedding_invites). The invitation is
 * still its compact code; a row only files that code under a slug. Every
 * payload is decoded and validated before it is stored, so the table can only
 * ever hold real invitations.
 */

const sha = (s: string) => createHash('sha256').update(s).digest('hex')

// ─── Photos ─────────────────────────────────────────────────────────────────

/** Stored as { bride?: dataUrl, groom?: dataUrl }, or null when there are none. */
export type StoredPhotos = Partial<Record<PhotoSide, string>>

/** A decoded, checked photo: real WebP or JPEG bytes within the size limit. */
export function decodePhoto(dataUrl: unknown): { type: 'webp' | 'jpeg'; bytes: Buffer } | null {
  if (typeof dataUrl !== 'string' || !PHOTO_DATA_URL.test(dataUrl)) return null
  const type = dataUrl.startsWith('data:image/webp') ? 'webp' : 'jpeg'
  const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
  if (bytes.length < 100 || bytes.length > MAX_PHOTO_BYTES) return null
  const isWebp = bytes.toString('latin1', 0, 4) === 'RIFF' && bytes.toString('latin1', 8, 12) === 'WEBP'
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  return (type === 'webp' ? isWebp : isJpeg) ? { type, bytes } : null
}

/**
 * The photos to store, from what the builder sent. `undefined` means "not
 * sent" (leave the stored ones alone); otherwise every side is replaced, so a
 * photo removed in the builder is removed here.
 */
function photoPatch(raw: unknown, consent: unknown): { photos: StoredPhotos | null } | { error: string } | undefined {
  if (raw === undefined) return undefined
  if (raw === null) return { photos: null }
  if (typeof raw !== 'object') return { error: 'The photos could not be read. Please add them again.' }
  const out: StoredPhotos = {}
  for (const side of PHOTO_SIDES) {
    const v = (raw as Record<string, unknown>)[side]
    if (v == null || v === '') continue
    if (!decodePhoto(v)) return { error: 'A photo could not be used. Please remove it and add it again.' }
    out[side] = v as string
  }
  if (!Object.keys(out).length) return { photos: null }
  if (consent !== true) return { error: 'Please confirm that the photos may be shown on the invitation.' }
  return { photos: out }
}

/** A short version of a photo, so its public URL changes when the photo does. */
export const photoVersion = (dataUrl: string) => sha(dataUrl).slice(0, 12)

/**
 * Until migration 20261017000001 has run, the photo columns do not exist.
 * Code deploys before a migration is pasted in, so every query that touches
 * them retries without them rather than breaking existing invitations.
 */
const missingColumn = (error: any) => error?.code === '42703' || error?.code === 'PGRST204'
async function photoAware<T>(withPhotos: () => PromiseLike<T>, without: () => PromiseLike<T>): Promise<T> {
  const r = await withPhotos()
  return missingColumn((r as any)?.error) ? without() : r
}
const photoColumns = (photos: StoredPhotos | null) => ({ photos, photos_consent_at: photos ? new Date().toISOString() : null })

/** A short link lasts 180 days from the day it was created; edits do not extend it. */
export const LINK_LIFETIME_DAYS = 180
const deleteAfter = () => new Date(Date.now() + LINK_LIFETIME_DAYS * 864e5).toISOString().slice(0, 10)

const today = () => new Date().toISOString().slice(0, 10)

export type Published = { displaySlug: string; editKey: string; expiresOn: string }

function validate(payload: unknown): { payload: string; invite: Invite } | null {
  if (typeof payload !== 'string' || payload.length > MAX_LINK_PAYLOAD) return null
  const invite = decodeInvite(payload)
  if (!invite || !invite.c.couple.brideName || !invite.c.couple.groomName || !invite.c.wedding.date) return null
  return { payload, invite }
}

/** Find the first free slug: Base, Base-2, Base-3… */
async function freeSlug(admin: any, base: string, exceptId?: string): Promise<string> {
  const lower = base.toLowerCase()
  const { data } = await admin.from('wedding_invites').select('id, slug').like('slug', `${lower}%`)
  const taken = new Set<string>((data ?? []).filter((r: any) => r.id !== exceptId).map((r: any) => r.slug))
  if (!taken.has(lower)) return base
  for (let n = 2; n < 1000; n++) if (!taken.has(`${lower}-${n}`)) return `${base}-${n}`
  return `${base}-${randomBytes(3).toString('hex')}`
}

/** Store a new invitation under its own slug. */
export async function publishInvite(admin: any, raw: unknown, rawPhotos?: unknown, photoConsent?: unknown): Promise<Published | { error: string }> {
  const v = validate(raw)
  if (!v) return { error: 'This invitation could not be saved. Please check the names and the wedding date.' }
  const pp = photoPatch(rawPhotos, photoConsent)
  if (pp && 'error' in pp) return { error: pp.error }
  const photos = pp?.photos ?? null

  // Rows past their date go as new ones arrive — no scheduler needed.
  await admin.from('wedding_invites').delete().lt('delete_after', today())

  const editKey = randomBytes(18).toString('base64url')
  const base = baseSlug(v.invite.c.couple.brideName, v.invite.c.couple.groomName, v.invite.c.wedding.date)
  for (let attempt = 0; attempt < 4; attempt++) {
    const display = await freeSlug(admin, base)
    const row = {
      slug: display.toLowerCase(),
      display_slug: display,
      payload: v.payload,
      payload_hash: sha(v.payload),
      edit_key_hash: sha(editKey),
      wedding_date: v.invite.c.wedding.date,
      delete_after: deleteAfter(),
    }
    // Without photos, the insert never names the photo columns at all.
    const { error } = photos
      ? await photoAware(
          () => admin.from('wedding_invites').insert({ ...row, ...photoColumns(photos) }),
          () => Promise.resolve({ error: { code: 'PHOTOS_UNAVAILABLE' } }),
        )
      : await admin.from('wedding_invites').insert(row)
    if (error?.code === 'PHOTOS_UNAVAILABLE') return { error: 'Photos cannot be saved just yet. Please remove them for now, or try again later.' }
    if (!error) return { displaySlug: display, editKey, expiresOn: deleteAfter() }
    // 23505 = another couple took this slug a moment ago; try the next one.
    if (error.code !== '23505') {
      console.error('[wedding publish]', error.message)
      break
    }
  }
  return { error: 'Could not create the link. Please try again.' }
}

async function ownedRow(admin: any, slug: string, key: string) {
  if (!isSlug(slug) || typeof key !== 'string' || key.length < 16 || key.length > 64) return null
  const { data } = await admin
    .from('wedding_invites')
    .select('id, display_slug, payload, edit_key_hash, delete_after')
    .eq('slug', slug.toLowerCase())
    .maybeSingle()
  if (!data) return null
  const a = Buffer.from(sha(key)), b = Buffer.from(data.edit_key_hash)
  return a.length === b.length && timingSafeEqual(a, b) ? data : null
}

/**
 * Replace an invitation's content. The slug stays as it is — it may already be
 * on a hundred phones — unless the couple explicitly asks for a new one
 * (`rename`), in which case the old address stops working.
 */
export async function updateInvite(
  admin: any, slug: string, key: string, raw: unknown, rename = false, rawPhotos?: unknown, photoConsent?: unknown,
): Promise<{ displaySlug: string } | { error: string; status: number }> {
  const row = await ownedRow(admin, slug, key)
  if (!row) return { error: 'This edit link is not valid any more. Create a new invitation link instead.', status: 404 }
  const v = validate(raw)
  if (!v) return { error: 'Please check the names and the wedding date.', status: 422 }
  const pp = photoPatch(rawPhotos, photoConsent)
  if (pp && 'error' in pp) return { error: pp.error, status: 422 }

  const patch: Record<string, unknown> = {
    payload: v.payload,
    payload_hash: sha(v.payload),
    wedding_date: v.invite.c.wedding.date,
  }
  if (rename) {
    const display = await freeSlug(admin, baseSlug(v.invite.c.couple.brideName, v.invite.c.couple.groomName, v.invite.c.wedding.date), row.id)
    patch.slug = display.toLowerCase()
    patch.display_slug = display
  }
  const { error } = pp
    ? await photoAware(
        () => admin.from('wedding_invites').update({ ...patch, ...photoColumns(pp.photos) }).eq('id', row.id),
        // Before the migration: save the text, and only refuse when photos were actually added.
        () => (pp.photos ? Promise.resolve({ error: { code: 'PHOTOS_UNAVAILABLE' } }) : admin.from('wedding_invites').update(patch).eq('id', row.id)),
      )
    : await admin.from('wedding_invites').update(patch).eq('id', row.id)
  if (error?.code === 'PHOTOS_UNAVAILABLE') return { error: 'Photos cannot be saved just yet. Please remove them for now, or try again later.', status: 503 }
  if (error) {
    console.error('[wedding update]', error.message)
    return { error: error.code === '23505' ? 'That link was just taken. Please try again.' : 'Could not save your changes.', status: 500 }
  }
  return { displaySlug: (patch.display_slug as string) ?? row.display_slug }
}

async function storedPhotos(admin: any, id: string): Promise<StoredPhotos | null> {
  const { data, error } = await admin.from('wedding_invites').select('photos').eq('id', id).maybeSingle()
  return error || !data?.photos ? null : (data.photos as StoredPhotos)
}

/** For the private edit link: the invitation and its photos, if the key is right. */
export async function loadForEdit(admin: any, slug: string, key: string): Promise<{ payload: string; displaySlug: string; photos: StoredPhotos | null } | null> {
  const row = await ownedRow(admin, slug, key)
  return row ? { payload: row.payload, displaySlug: row.display_slug, photos: await storedPhotos(admin, row.id) } : null
}

/**
 * The public lookup. Case-insensitive; rows past their date are treated as
 * gone. `photos` holds a version per side, for /api/wedding/photo URLs — the
 * images themselves are not loaded into the page.
 */
export async function loadBySlug(admin: any, slug: string): Promise<{ payload: string; displaySlug: string; photoVersions: Partial<Record<PhotoSide, string>> } | null> {
  if (!isSlug(slug)) return null
  const query = (cols: string) => admin
    .from('wedding_invites')
    .select(cols)
    .eq('slug', slug.toLowerCase())
    .gte('delete_after', today())
    .maybeSingle()
  const { data } = await photoAware<{ data: any }>(() => query('id, display_slug, payload, photos'), () => query('id, display_slug, payload'))
  if (!data) return null
  const photoVersions: Partial<Record<PhotoSide, string>> = {}
  for (const side of PHOTO_SIDES) if (data.photos?.[side]) photoVersions[side] = photoVersion(data.photos[side])
  return { payload: data.payload, displaySlug: data.display_slug, photoVersions }
}

/** One photo of a live invitation, for /api/wedding/photo. */
export async function loadPhoto(admin: any, slug: string, side: PhotoSide): Promise<{ type: 'webp' | 'jpeg'; bytes: Buffer; version: string } | null> {
  if (!isSlug(slug)) return null
  const { data, error } = await admin
    .from('wedding_invites')
    .select('photos')
    .eq('slug', slug.toLowerCase())
    .gte('delete_after', today())
    .maybeSingle()
  const url = error ? null : data?.photos?.[side]
  const photo = url ? decodePhoto(url) : null
  return photo ? { ...photo, version: photoVersion(url) } : null
}

/** An old long link whose exact invitation now has a short link. */
export async function slugForPayload(admin: any, payload: string): Promise<string | null> {
  if (!payload || payload.length > MAX_LINK_PAYLOAD) return null
  const { data } = await admin
    .from('wedding_invites')
    .select('display_slug')
    .eq('payload_hash', sha(payload))
    .gte('delete_after', today())
    .order('created_at', { ascending: true })
    .limit(1)
  return data?.[0]?.display_slug ?? null
}
