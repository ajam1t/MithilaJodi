import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { decodeInvite } from './codec.server'
import { MAX_LINK_PAYLOAD } from './codec'
import { baseSlug, isSlug } from './slug'
import type { Invite } from './schema'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Short links for invitations (table wedding_invites). The invitation is
 * still its compact code; a row only files that code under a slug. Every
 * payload is decoded and validated before it is stored, so the table can only
 * ever hold real invitations.
 */

const sha = (s: string) => createHash('sha256').update(s).digest('hex')

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
export async function publishInvite(admin: any, raw: unknown): Promise<Published | { error: string }> {
  const v = validate(raw)
  if (!v) return { error: 'This invitation could not be saved. Please check the names and the wedding date.' }

  // Rows past their date go as new ones arrive — no scheduler needed.
  await admin.from('wedding_invites').delete().lt('delete_after', today())

  const editKey = randomBytes(18).toString('base64url')
  const base = baseSlug(v.invite.c.couple.brideName, v.invite.c.couple.groomName, v.invite.c.wedding.date)
  for (let attempt = 0; attempt < 4; attempt++) {
    const display = await freeSlug(admin, base)
    const { error } = await admin.from('wedding_invites').insert({
      slug: display.toLowerCase(),
      display_slug: display,
      payload: v.payload,
      payload_hash: sha(v.payload),
      edit_key_hash: sha(editKey),
      wedding_date: v.invite.c.wedding.date,
      delete_after: deleteAfter(),
    })
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
  admin: any, slug: string, key: string, raw: unknown, rename = false,
): Promise<{ displaySlug: string } | { error: string; status: number }> {
  const row = await ownedRow(admin, slug, key)
  if (!row) return { error: 'This edit link is not valid any more. Create a new invitation link instead.', status: 404 }
  const v = validate(raw)
  if (!v) return { error: 'Please check the names and the wedding date.', status: 422 }

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
  const { error } = await admin.from('wedding_invites').update(patch).eq('id', row.id)
  if (error) {
    console.error('[wedding update]', error.message)
    return { error: error.code === '23505' ? 'That link was just taken. Please try again.' : 'Could not save your changes.', status: 500 }
  }
  return { displaySlug: (patch.display_slug as string) ?? row.display_slug }
}

/** For the private edit link: the invitation, if the key is right. */
export async function loadForEdit(admin: any, slug: string, key: string): Promise<{ payload: string; displaySlug: string } | null> {
  const row = await ownedRow(admin, slug, key)
  return row ? { payload: row.payload, displaySlug: row.display_slug } : null
}

/** The public lookup. Case-insensitive; rows past their date are treated as gone. */
export async function loadBySlug(admin: any, slug: string): Promise<{ payload: string; displaySlug: string } | null> {
  if (!isSlug(slug)) return null
  const { data } = await admin
    .from('wedding_invites')
    .select('display_slug, payload')
    .eq('slug', slug.toLowerCase())
    .gte('delete_after', today())
    .maybeSingle()
  return data ? { payload: data.payload, displaySlug: data.display_slug } : null
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
