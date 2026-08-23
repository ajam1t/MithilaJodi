import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

// Reasons must match the report_reason enum (migration 009).
const VALID_REASONS = [
  'fake_profile',
  'harassment',
  'inappropriate_photo',
  'spam',
  'underage',
  'fraud',
  'other',
] as const

/**
 * User-facing report submission. A logged-in member reports another profile
 * (fake profile, harassment, etc.). Reports land in the `reports` table for
 * admin moderation (/admin/reports). Authorization + validation are enforced
 * server-side; a member can only file as themselves.
 */
export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = body as any
  const reportedId = typeof b?.reported_profile_id === 'string' ? b.reported_profile_id : null
  const reason = typeof b?.reason === 'string' ? b.reason : null
  const notes =
    typeof b?.notes === 'string' && b.notes.trim().length > 0
      ? b.notes.trim().slice(0, 1000)
      : null

  if (!reportedId) {
    return NextResponse.json({ ok: false, message: 'reported_profile_id is required' }, { status: 400 })
  }
  if (!reason || !VALID_REASONS.includes(reason as typeof VALID_REASONS[number])) {
    return NextResponse.json({ ok: false, message: 'A valid reason is required' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Resolve the reporter's own profile.
  const { data: myProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', session.id)
    .is('deleted_at', null)
    .neq('profile_status', 'deleted')
    .limit(1)
    .maybeSingle()

  if (!myProfile) return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myId = (myProfile as any).id as string

  if (myId === reportedId) {
    return NextResponse.json({ ok: false, message: 'You cannot report your own profile' }, { status: 400 })
  }

  // Validate the reported profile exists.
  const { data: target } = await admin
    .from('profiles')
    .select('id')
    .eq('id', reportedId)
    .maybeSingle()

  if (!target) return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })

  // De-duplicate: if this reporter already has an open/under_review report against
  // this profile, don't create another — acknowledge success idempotently.
  const { data: existing } = await admin
    .from('reports')
    .select('id')
    .eq('reporter_id', myId)
    .eq('reported_id', reportedId)
    .in('status', ['open', 'under_review'])
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, deduped: true })
  }

  const { error: insertError } = await admin
    .from('reports')
    .insert({ reporter_id: myId, reported_id: reportedId, reason, notes, status: 'open' })

  if (insertError) {
    console.error('[reports POST] insert error:', insertError.message)
    return NextResponse.json({ ok: false, message: 'Could not submit report. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
