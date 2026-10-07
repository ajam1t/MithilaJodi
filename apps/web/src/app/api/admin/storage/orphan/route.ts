import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { audit, requireAdminApi } from '@/lib/adminAuth'

/**
 * Delete ONE orphaned profile-photo file, after an admin confirmed it. The
 * server re-checks that no photo record references it at the moment of
 * deletion — the list the admin saw could be stale. Nothing is ever deleted
 * automatically.
 */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdminApi('manage_settings')
  if (guard.error) return guard.error
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, message: 'Invalid request.' }, { status: 400 }) }
  const name = typeof body.name === 'string' ? body.name : ''
  if (!name || name.length > 300 || name.includes('..')) return NextResponse.json({ ok: false, message: 'Invalid file.' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: ref } = await admin.from('profile_photos').select('id').eq('storage_path', name).limit(1).maybeSingle()
  if (ref) return NextResponse.json({ ok: false, message: 'This file is now in use by a photo record, so it was not deleted.' }, { status: 409 })

  const { error } = await admin.storage.from('profile-photos').remove([name])
  if (error) return NextResponse.json({ ok: false, message: 'Storage refused the deletion. Nothing was removed.' }, { status: 500 })
  await audit(guard.session.id, 'storage_orphan_deleted', { type: 'storage_object', id: null }, { bucket: 'profile-photos', name }, request)
  return NextResponse.json({ ok: true })
}
