import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { findOwnProfileId } from '@/lib/ownProfile'
import { sanitiseFields } from '@/lib/profileShare'

/* eslint-disable @typescript-eslint/no-explicit-any */

const MAX_EXPIRY_DAYS = 730

const PatchSchema = z.object({
  /** Kill the link now. Irreversible — mint a new one instead of un-revoking. */
  revoke: z.boolean().optional(),
  label: z.string().max(80).optional().nullable(),
  fields: z.array(z.string()).optional(),
  expires_in_days: z.number().int().min(1).max(MAX_EXPIRY_DAYS).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 422 })
  }

  const admin = await createAdminClient()
  const myProfileId = await findOwnProfileId(admin, session.id)
  if (!myProfileId) return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 })

  // Ownership is enforced by matching profile_id in the same statement, so a
  // guessed share id from another member cannot be revoked or re-scoped.
  const patch: Record<string, unknown> = {}
  if (parsed.data.revoke) patch.revoked_at = new Date().toISOString()
  if (parsed.data.label !== undefined) patch.label = parsed.data.label?.trim() || null
  if (parsed.data.fields) patch.fields = sanitiseFields(parsed.data.fields)
  if (parsed.data.expires_in_days) {
    patch.expires_at = new Date(Date.now() + parsed.data.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
    // Extending a revoked link would silently bring it back to life; a member
    // who revoked something meant it. Reviving requires a brand-new token.
    if (!parsed.data.revoke) patch.revoked_at = null
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, message: 'Nothing to update' }, { status: 422 })
  }

  // `profile_id` in the same statement is the authorization check: a guessed
  // share id belonging to another member matches no row and returns 404.
  const { data, error } = await admin
    .from('profile_shares')
    .update(patch)
    .eq('id', id)
    .eq('profile_id', myProfileId)
    .select('id, token, label, fields, expires_at, revoked_at, view_count, last_viewed_at, created_at')
    .maybeSingle()

  if (error) {
    console.error('[shares PATCH]', error.message)
    return NextResponse.json({ ok: false, message: 'Could not update the link.' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 })

  const s = data as any
  return NextResponse.json({
    ok: true,
    share: {
      id: s.id,
      token: s.token,
      label: s.label,
      fields: sanitiseFields(s.fields),
      expiresAt: s.expires_at,
      revokedAt: s.revoked_at,
      viewCount: s.view_count ?? 0,
      lastViewedAt: s.last_viewed_at,
      createdAt: s.created_at,
      live: !s.revoked_at && new Date(s.expires_at).getTime() > Date.now(),
    },
  })
}
