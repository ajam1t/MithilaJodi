import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { findOwnProfileId } from '@/lib/ownProfile'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Respond to a WhatsApp request.
 *
 *   approve / decline — only the OWNER of the number may do this.
 *   revoke           — the owner withdraws a previous approval, or the
 *                      requester withdraws their own pending request.
 *
 * Approving never returns the number here; the requester reads it from
 * GET /api/whatsapp, which re-checks the approval and the owner's opt-in.
 */

const ActionSchema = z.object({ action: z.enum(['approve', 'decline', 'revoke']) })

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
  const parsed = ActionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'action must be approve, decline or revoke' }, { status: 422 })
  }
  const { action } = parsed.data

  const admin = await createAdminClient()
  const myProfileId = await findOwnProfileId(admin, session.id)
  if (!myProfileId) return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 })

  const { data: reqRow } = await admin
    .from('whatsapp_requests')
    .select('id, requester_profile_id, owner_profile_id, status')
    .eq('id', id)
    .maybeSingle()

  if (!reqRow) return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 })

  const row = reqRow as any
  const isOwner = row.owner_profile_id === myProfileId
  const isRequester = row.requester_profile_id === myProfileId
  if (!isOwner && !isRequester) {
    return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 })
  }

  // Only the number's owner may approve or decline.
  if ((action === 'approve' || action === 'decline') && !isOwner) {
    return NextResponse.json({ ok: false, message: 'Only the profile owner can respond' }, { status: 403 })
  }

  const now = new Date().toISOString()
  const patch: Record<string, unknown> =
    action === 'approve' ? { status: 'approved', responded_at: now, revoked_at: null }
    : action === 'decline' ? { status: 'declined', responded_at: now }
    : { status: 'revoked', revoked_at: now }

  // Guard the transition so concurrent responses cannot both apply.
  const query = admin.from('whatsapp_requests').update(patch).eq('id', id)
  const { data: updated, error } = await (
    action === 'revoke' ? query : query.eq('status', 'pending')
  ).select('id, status').maybeSingle()

  if (error) {
    console.error('[whatsapp PATCH] update:', error.message)
    return NextResponse.json({ ok: false, message: 'Could not update the request' }, { status: 500 })
  }
  if (!updated) {
    return NextResponse.json(
      { ok: false, message: 'This request has already been responded to' },
      { status: 409 }
    )
  }

  return NextResponse.json({ ok: true, status: (updated as any).status })
}
