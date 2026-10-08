import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { refreshPublicShowcase } from '@/lib/showcaseCache'
import { syncDiscoverability } from '@/lib/discoverability'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await getSessionAccount()
  if (!account) return NextResponse.json({ ok: false }, { status: 401 })

  const { id: photoId } = await params
  const admin = await createAdminClient()

  // Fetch photo + verify ownership
  const { data: photo } = await admin
    .from('profile_photos')
    .select('id, profile_id, storage_path, status')
    .eq('id', photoId)
    .neq('status', 'deleted')
    .single()

  if (!photo) return NextResponse.json({ ok: false, message: 'Photo not found.' }, { status: 404 })

  // Verify the photo belongs to one of the current account's profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = photo as any
  const { data: profileRow } = await admin
    .from('profiles')
    .select('id')
    .eq('id', p.profile_id)
    .eq('account_id', account.id)
    .maybeSingle()

  if (!profileRow) {
    return NextResponse.json({ ok: false, message: 'Not authorized.' }, { status: 403 })
  }

  // One photo is part of the onboarding minimum. Removing the last one would
  // hide the profile and send the member back through /welcome, so ask for the
  // replacement first. (Replacing in /welcome uploads the new photo, then
  // removes the old one.)
  if (p.status === 'approved' || p.status === 'pending_moderation') {
    const { count: others } = await admin
      .from('profile_photos')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', p.profile_id)
      .in('status', ['approved', 'pending_moderation'])
      .neq('id', p.id)
    if ((others ?? 0) === 0) {
      return NextResponse.json(
        { ok: false, message: 'Your profile needs at least one photo. Add another photo first, then remove this one.' },
        { status: 409 },
      )
    }
  }

  // Soft-delete in DB
  const { error: updateError } = await admin
    .from('profile_photos')
    .update({ status: 'deleted' })
    .eq('id', photoId)

  if (updateError) {
    console.error('[photos DELETE] update error:', updateError.message)
    return NextResponse.json({ ok: false, message: 'Failed to delete photo.' }, { status: 500 })
  }

  // Remove from Storage (best-effort)
  await admin.storage.from('profile-photos').remove([p.storage_path])

  await syncDiscoverability(admin, account.id)
  refreshPublicShowcase()
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Set a photo as primary
  const account = await getSessionAccount()
  if (!account) return NextResponse.json({ ok: false }, { status: 401 })

  const { id: photoId } = await params
  const admin = await createAdminClient()

  const { data: photo } = await admin
    .from('profile_photos')
    .select('id, profile_id, status')
    .eq('id', photoId)
    .eq('status', 'approved')
    .single()

  if (!photo) {
    return NextResponse.json(
      { ok: false, message: 'Only approved photos can be set as primary.' },
      { status: 400 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = photo as any
  const { data: profileRow } = await admin
    .from('profiles')
    .select('id')
    .eq('id', p.profile_id)
    .eq('account_id', account.id)
    .maybeSingle()

  if (!profileRow) return NextResponse.json({ ok: false }, { status: 403 })

  // Clear existing primary, then set new primary
  await admin
    .from('profile_photos')
    .update({ is_primary: false })
    .eq('profile_id', p.profile_id)

  await admin
    .from('profile_photos')
    .update({ is_primary: true })
    .eq('id', photoId)

  refreshPublicShowcase()
  return NextResponse.json({ ok: true })
}
