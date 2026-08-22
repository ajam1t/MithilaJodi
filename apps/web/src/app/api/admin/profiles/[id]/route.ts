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
  const { action, reason } = body as { action: 'approve' | 'reject' | 'suspend'; reason?: string }

  if (action !== 'approve' && action !== 'reject' && action !== 'suspend') {
    return NextResponse.json({ ok: false, message: 'Invalid action.' }, { status: 400 })
  }

  const admin = await createAdminClient()

  if (action === 'approve') {
    const { error } = await admin
      .from('profiles')
      .update({ profile_status: 'active', status_reason: null })
      .eq('id', id)

    if (error) {
      console.error('[admin/profiles/[id] PATCH] approve error:', error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    await admin.from('admin_audit_logs').insert({
      actor_id: session.id,
      action: 'approve_profile',
      target_type: 'profile',
      target_id: id,
      payload: {},
    })
  } else if (action === 'suspend') {
    const statusReason = reason ?? 'Suspended by admin'

    const { error } = await admin
      .from('profiles')
      .update({ profile_status: 'suspended', status_reason: statusReason })
      .eq('id', id)

    if (error) {
      console.error('[admin/profiles/[id] PATCH] suspend error:', error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    await admin.from('admin_audit_logs').insert({
      actor_id: session.id,
      action: 'suspend_profile',
      target_type: 'profile',
      target_id: id,
      payload: { reason: statusReason },
    })
  } else {
    const statusReason = reason ?? 'Rejected by admin'

    const { error } = await admin
      .from('profiles')
      .update({ profile_status: 'draft', status_reason: statusReason })
      .eq('id', id)

    if (error) {
      console.error('[admin/profiles/[id] PATCH] reject error:', error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    await admin.from('admin_audit_logs').insert({
      actor_id: session.id,
      action: 'reject_profile',
      target_type: 'profile',
      target_id: id,
      payload: { reason: statusReason },
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  const admin = await createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({
      profile_status: 'deleted',
      first_name: null,
      last_name: null,
      dob: null,
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/profiles/[id] DELETE] error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'delete_profile',
    target_type: 'profile',
    target_id: id,
    payload: {},
  })

  return NextResponse.json({ ok: true })
}
