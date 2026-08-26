import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_BYTES = 5 * 1024 * 1024

function extensionFor(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/heic' || mime === 'image/heif') return 'heic'
  return 'jpg'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') return NextResponse.json({ ok: false }, { status: 403 })
  const { id } = await params
  const admin = await createAdminClient()

  const { data: profile } = await admin.from('profiles').select('id, account_id').eq('id', id).maybeSingle()
  if (!profile) return NextResponse.json({ ok: false, message: 'Profile not found.' }, { status: 404 })

  let formData: FormData
  try { formData = await request.formData() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid form data.' }, { status: 400 })
  }
  const file = formData.get('photo')
  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: 'Photo file is required.' }, { status: 400 })
  if (!ALLOWED_MIME.includes(file.type)) return NextResponse.json({ ok: false, message: 'Only JPEG, PNG, WebP, and HEIC images are allowed.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, message: 'Photo must be under 5 MB.' }, { status: 400 })

  const { count } = await admin.from('profile_photos').select('id', { count: 'exact', head: true }).eq('profile_id', id).neq('status', 'deleted')
  if ((count ?? 0) >= 5) return NextResponse.json({ ok: false, message: 'Maximum 5 photos allowed per profile.' }, { status: 400 })

  const isPrimary = formData.get('is_primary') === 'true' || (count ?? 0) === 0
  if (isPrimary) {
    await admin.from('profile_photos').update({ is_primary: false }).eq('profile_id', id).eq('is_primary', true)
  }

  const storagePath = `admin/${profile.account_id}/${id}/${nanoid()}.${extensionFor(file.type)}`
  const { error: uploadError } = await admin.storage.from('profile-photos').upload(storagePath, await file.arrayBuffer(), { contentType: file.type, upsert: false })
  if (uploadError) {
    console.error('[admin/profiles photo] upload error:', uploadError.message)
    return NextResponse.json({ ok: false, message: 'Photo upload failed.' }, { status: 500 })
  }

  const { data: photo, error: insertError } = await admin.from('profile_photos').insert({
    profile_id: id,
    storage_path: storagePath,
    is_primary: isPrimary,
    display_order: count ?? 0,
    status: 'approved',
    moderated_by: session.id,
    moderated_at: new Date().toISOString(),
  }).select('id').single()
  if (insertError || !photo) {
    await admin.storage.from('profile-photos').remove([storagePath])
    console.error('[admin/profiles photo] insert error:', insertError?.message)
    return NextResponse.json({ ok: false, message: 'Could not save the photo.' }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'admin_upload_profile_photo',
    target_type: 'profile',
    target_id: id,
    payload: { photo_id: photo.id, is_primary: isPrimary },
  })
  return NextResponse.json({ ok: true, photo_id: photo.id }, { status: 201 })
}
