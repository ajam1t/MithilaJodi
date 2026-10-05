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
 *   POST  { payload }                         → { slug, editKey }
 *   PATCH { slug, key, payload, rename? }     → { slug }
 */

const Post = z.object({ payload: z.string().min(2).max(8000) })
const Patch = z.object({ slug: z.string().max(140), key: z.string().max(80), payload: z.string().min(2).max(8000), rename: z.boolean().optional() })

const fail = (message: string, status: number) => NextResponse.json({ ok: false, message }, { status })

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'wedding-publish', { limit: 12, windowMs: 60 * 60_000 })
  if (!limited.ok) return fail('Too many invitations from this device. Please try again later.', 429)
  const parsed = Post.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail('Invalid request.', 400)

  const res = await publishInvite(await createAdminClient(), parsed.data.payload)
  if ('error' in res) return fail(res.error, 422)
  return NextResponse.json({ ok: true, slug: res.displaySlug, editKey: res.editKey }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const limited = rateLimit(request, 'wedding-update', { limit: 60, windowMs: 60 * 60_000 })
  if (!limited.ok) return fail('Too many changes. Please try again later.', 429)
  const parsed = Patch.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail('Invalid request.', 400)

  const { slug, key, payload, rename } = parsed.data
  const res = await updateInvite(await createAdminClient(), slug, key, payload, rename)
  if ('error' in res) return fail(res.error, res.status)
  return NextResponse.json({ ok: true, slug: res.displaySlug })
}
