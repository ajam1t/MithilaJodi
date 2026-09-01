import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_BYTES = 5 * 1024 * 1024  // 5 MB

function extFor(mime: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  }
  return map[mime] ?? 'jpg'
}

export async function GET() {
  const account = await getSessionAccount()
  if (!account) return NextResponse.json({ ok: false }, { status: 401 })

  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', account.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!profile) return NextResponse.json({ ok: true, photos: [] })

  const { data: photoRows } = await admin
    .from('profile_photos')
    .select('id, is_primary, display_order, status, blurhash, width_px, height_px, storage_path')
    .eq('profile_id', profile.id)
    .neq('status', 'deleted')
    .order('display_order', { ascending: true })

  const photos = await Promise.all(
    (photoRows ?? []).map(async (p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const photo = p as any
      const { data: signed } = await admin.storage
        .from('profile-photos')
        .createSignedUrl(photo.storage_path, 3600)
      return {
        id: photo.id,
        is_primary: photo.is_primary,
        display_order: photo.display_order,
        status: photo.status,
        blurhash: photo.blurhash,
        width_px: photo.width_px,
        height_px: photo.height_px,
        signed_url: signed?.signedUrl ?? null,
      }
    })
  )

  return NextResponse.json({ ok: true, photos })
}

export async function POST(request: NextRequest) {
  const account = await getSessionAccount()
  if (!account) return NextResponse.json({ ok: false }, { status: 401 })

  const admin = await createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', account.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json(
      { ok: false, message: 'Create your profile before uploading photos.' },
      { status: 400 }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid form data.' }, { status: 400 })
  }

  const file = formData.get('photo')
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: 'No photo file provided.' }, { status: 400 })
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { ok: false, message: 'Only JPEG, PNG, WebP, and HEIC images are allowed.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, message: 'Photo must be under 5 MB.' },
      { status: 400 }
    )
  }

  // Count existing non-deleted photos (max 5 per profile)
  const { count } = await admin
    .from('profile_photos')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profile.id)
    .neq('status', 'deleted')

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { ok: false, message: 'Maximum 5 photos allowed per profile.' },
      { status: 400 }
    )
  }

  const ext = extFor(file.type)
  const photoFileId = nanoid()
  const storagePath = `${account.id}/${profile.id}/${photoFileId}.${ext}`

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage
    .from('profile-photos')
    .upload(storagePath, bytes, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[photos POST] storage upload error:', uploadError.message)
    return NextResponse.json({ ok: false, message: 'Upload failed. Please try again.' }, { status: 500 })
  }

  // Determine if this should be primary (first photo for the profile)
  const isPrimary = (count ?? 0) === 0

  const { data: photo, error: insertError } = await admin
    .from('profile_photos')
    .insert({
      profile_id: profile.id,
      storage_path: storagePath,
      is_primary: isPrimary,
      display_order: count ?? 0,
      status: 'pending_moderation',
    })
    .select('id')
    .single()

  if (insertError || !photo) {
    // Clean up the uploaded file on DB insert failure
    await admin.storage.from('profile-photos').remove([storagePath])
    console.error('[photos POST] insert error:', insertError?.message)
    return NextResponse.json({ ok: false, message: 'Failed to save photo record.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, photo_id: photo.id }, { status: 201 })
}
