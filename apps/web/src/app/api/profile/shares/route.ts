import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { findOwnProfileId } from '@/lib/ownProfile'
import { generateShareToken, sanitiseFields, DEFAULT_SHARE_FIELDS } from '@/lib/profileShare'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** A member may hold this many live links at once. */
const MAX_ACTIVE_SHARES = 20

/** Guard rail on expiry: far enough for a long search, not "forever". */
const MAX_EXPIRY_DAYS = 730

const CreateSchema = z.object({
  label: z.string().max(80).optional().nullable(),
  fields: z.array(z.string()).optional(),
  /** Days from now. Defaults to a year. */
  expires_in_days: z.number().int().min(1).max(MAX_EXPIRY_DAYS).optional(),
})

// ── GET: my links ───────────────────────────────────────────────────────────
export async function GET() {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const myProfileId = await findOwnProfileId(admin, session.id)
  if (!myProfileId) return NextResponse.json({ ok: true, shares: [] })

  const { data } = await admin
    .from('profile_shares')
    .select('id, token, label, fields, expires_at, revoked_at, view_count, last_viewed_at, created_at')
    .eq('profile_id', myProfileId)
    .order('created_at', { ascending: false })

  const now = Date.now()
  return NextResponse.json({
    ok: true,
    shares: (data ?? []).map((s: any) => ({
      id: s.id,
      token: s.token,
      label: s.label,
      fields: sanitiseFields(s.fields),
      expiresAt: s.expires_at,
      revokedAt: s.revoked_at,
      viewCount: s.view_count ?? 0,
      lastViewedAt: s.last_viewed_at,
      createdAt: s.created_at,
      live: !s.revoked_at && new Date(s.expires_at).getTime() > now,
    })),
  })
}

// ── POST: mint a new link ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { body = {} }
  const parsed = CreateSchema.safeParse(body ?? {})
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 422 })
  }

  const admin = await createAdminClient()
  const myProfileId = await findOwnProfileId(admin, session.id)
  if (!myProfileId) {
    return NextResponse.json({ ok: false, message: 'Create your profile first.' }, { status: 422 })
  }

  // Cap live links. Without this a script could mint tokens indefinitely, and
  // a member with a hundred links has no hope of noticing one that leaked.
  const { count } = await admin
    .from('profile_shares')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', myProfileId)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
  if ((count ?? 0) >= MAX_ACTIVE_SHARES) {
    return NextResponse.json(
      { ok: false, message: `You can have ${MAX_ACTIVE_SHARES} active links at a time. Revoke one to create another.` },
      { status: 429 }
    )
  }

  const days = parsed.data.expires_in_days ?? 365
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
  const fields = parsed.data.fields ? sanitiseFields(parsed.data.fields) : DEFAULT_SHARE_FIELDS

  const { data, error } = await admin
    .from('profile_shares')
    .insert({
      profile_id: myProfileId,
      token: generateShareToken(),
      label: parsed.data.label?.trim() || null,
      fields,
      expires_at: expiresAt,
    })
    .select('id, token, label, fields, expires_at, view_count, created_at')
    .single()

  if (error || !data) {
    console.error('[shares POST]', error?.message)
    return NextResponse.json({ ok: false, message: 'Could not create the link.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    share: {
      id: (data as any).id,
      token: (data as any).token,
      label: (data as any).label,
      fields: sanitiseFields((data as any).fields),
      expiresAt: (data as any).expires_at,
      viewCount: 0,
      lastViewedAt: null,
      createdAt: (data as any).created_at,
      revokedAt: null,
      live: true,
    },
  }, { status: 201 })
}
