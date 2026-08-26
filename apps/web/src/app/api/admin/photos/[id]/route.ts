import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { action, reason } = body as { action: 'approve' | 'reject' | 'set_primary'; reason?: string }

  if (action !== 'approve' && action !== 'reject' && action !== 'set_primary') {
    return NextResponse.json({ ok: false, message: 'Invalid action.' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { data: photo } = await admin
    .from('profile_photos')
    .select('id, profile_id, status')
    .eq('id', id)
    .maybeSingle()

  if (!photo) {
    return NextResponse.json({ ok: false, message: 'Photo not found.' }, { status: 404 })
  }

  if (action === 'set_primary') {
    if (photo.status !== 'approved') {
      return NextResponse.json({ ok: false, message: 'Only approved photos can be set as primary.' }, { status: 400 })
    }

    const { error: clearError } = await admin
      .from('profile_photos')
      .update({ is_primary: false })
      .eq('profile_id', photo.profile_id)

    if (clearError) {
      console.error('[admin/photos/[id] PATCH] clear primary error:', clearError.message)
      return NextResponse.json({ ok: false, message: 'Could not update the primary photo.' }, { status: 500 })
    }

    const { error: setError } = await admin
      .from('profile_photos')
      .update({ is_primary: true })
      .eq('id', id)

    if (setError) {
      console.error('[admin/photos/[id] PATCH] set primary error:', setError.message)
      return NextResponse.json({ ok: false, message: 'Could not update the primary photo.' }, { status: 500 })
    }

    await admin.from('admin_audit_logs').insert({
      actor_id: session.id,
      action: 'set_primary_photo',
      target_type: 'photo',
      target_id: id,
      payload: { profile_id: photo.profile_id },
    })

    return NextResponse.json({ ok: true })
  }

  const now = new Date().toISOString()

  if (action === 'approve') {
    const { error } = await admin
      .from('profile_photos')
      .update({ status: 'approved', moderated_by: session.id, moderated_at: now })
      .eq('id', id)

    if (error) {
      console.error('[admin/photos/[id] PATCH] approve error:', error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }
  } else {
    const { error } = await admin
      .from('profile_photos')
      .update({
        status: 'rejected',
        moderation_note: reason ?? null,
        moderated_by: session.id,
        moderated_at: now,
      })
      .eq('id', id)

    if (error) {
      console.error('[admin/photos/[id] PATCH] reject error:', error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: action === 'approve' ? 'approve_photo' : 'reject_photo',
    target_type: 'photo',
    target_id: id,
    payload: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile_id: (photo as any).profile_id,
      reason: reason ?? null,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  const admin = await createAdminClient()

  const { data: photo } = await admin
    .from('profile_photos')
    .select('id, profile_id, storage_path')
    .eq('id', id)
    .maybeSingle()

  if (!photo) {
    return NextResponse.json({ ok: false, message: 'Photo not found.' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storagePath = (photo as any).storage_path as string | null
  if (storagePath) {
    await admin.storage.from('profile-photos').remove([storagePath])
  }

  const { error } = await admin
    .from('profile_photos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[admin/photos/[id] DELETE] db error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'delete_photo',
    target_type: 'photo',
    target_id: id,
    payload: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile_id: (photo as any).profile_id,
      storage_path: storagePath,
    },
  })

  return NextResponse.json({ ok: true })
}
