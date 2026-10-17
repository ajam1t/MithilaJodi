import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/astrology/server/rateLimit'
import { publishInvite, updateInvite } from '@/lib/wedding/invites.server'

/**
 * Short invitation links. No login: whoever publishes gets an edit key, and
 * that key — never the slug — is what lets them change it later.
 *
 *   POST  { payload, photos?, photoConsent? }                      → { slug, editKey }
 *   PATCH { slug, key, payload, rename?, photos?, photoConsent? }  → { slug }
 *
 * `photos` ({ bride?, groom? } data URLs, prepared in the browser) replaces
 * the stored photos entirely; omit it to leave them as they are. Photos are
 * only stored with `photoConsent: true` — see lib/wedding/invites.server.
 */

// A prepared photo is ≤150 KB, so ≤ ~205,000 characters as base64.
const photo = z.string().max(210_000).nullable().optional()
const photos = z.object({ bride: photo, groom: photo }).nullable().optional()

const Post = z.object({ payload: z.string().min(2).max(8000), photos, photoConsent: z.boolean().optional() })
const Patch = z.object({
  slug: z.string().max(140), key: z.string().max(80), payload: z.string().min(2).max(8000), rename: z.boolean().optional(),
  photos, photoConsent: z.boolean().optional(),
})

const fail = (message: string, status: number) => NextResponse.json({ ok: false, message }, { status })

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'wedding-publish', { limit: 12, windowMs: 60 * 60_000 })
  if (!limited.ok) return fail('Too many invitations from this device. Please try again later.', 429)
  const parsed = Post.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail('Invalid request.', 400)

  const res = await publishInvite(await createAdminClient(), parsed.data.payload, parsed.data.photos, parsed.data.photoConsent)
  if ('error' in res) return fail(res.error, 422)
  return NextResponse.json({ ok: true, slug: res.displaySlug, editKey: res.editKey }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const limited = rateLimit(request, 'wedding-update', { limit: 60, windowMs: 60 * 60_000 })
  if (!limited.ok) return fail('Too many changes. Please try again later.', 429)
  const parsed = Patch.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail('Invalid request.', 400)

  const { slug, key, payload, rename, photos: sentPhotos, photoConsent } = parsed.data
  const res = await updateInvite(await createAdminClient(), slug, key, payload, rename, sentPhotos, photoConsent)
  if ('error' in res) return fail(res.error, res.status)
  return NextResponse.json({ ok: true, slug: res.displaySlug })
}
