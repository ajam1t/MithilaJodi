import { NextRequest, NextResponse, after } from 'next/server'
import { nanoid } from 'nanoid'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { HEIC_UNSUPPORTED_MESSAGE, sniffImage } from '@/lib/imageSniff'
import { refreshPublicShowcase } from '@/lib/showcaseCache'
import { syncDiscoverability } from '@/lib/discoverability'
import { signPhoto } from '@/lib/photoWeb'
import { makeWebCopy, toStoredOriginal } from '@/lib/photoWeb'

// HEIC is let through to here only so a photo sharp cannot decode gets a clear message.
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_BYTES = 5 * 1024 * 1024  // 5 MB

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
      const { data: signed } = await signPhoto(admin, photo.storage_path)
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

  const bytes = await file.arrayBuffer()
  // Trust the bytes, not the browser's label.
  const realType = sniffImage(bytes)
  if (!realType) {
    return NextResponse.json(
      { ok: false, message: 'That file is not a JPEG, PNG, WebP or HEIC photo.' },
      { status: 400 }
    )
  }

  // Stored re-encoded as JPEG with no metadata, so EXIF/GPS never reaches Storage.
  const stored = await toStoredOriginal(bytes)
  if (!stored) {
    const heic = realType === 'image/heic' || realType === 'image/heif'
    return NextResponse.json(
      { ok: false, message: heic ? HEIC_UNSUPPORTED_MESSAGE : 'We could not read that photo. Please try another one.' },
      { status: 400 }
    )
  }

  const photoFileId = nanoid()
  const storagePath = `${account.id}/${profile.id}/${photoFileId}.jpg`

  const { error: uploadError } = await admin.storage
    .from('profile-photos')
    .upload(storagePath, stored, { contentType: 'image/jpeg', upsert: false })

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

  // The web-sized copy pages load, made after the response is sent.
  after(() => makeWebCopy(admin, storagePath, stored))

  // The first photo can be what completes onboarding and makes the profile visible.
  await syncDiscoverability(admin, account.id)
  refreshPublicShowcase()
  return NextResponse.json({ ok: true, photo_id: photo.id }, { status: 201 })
}
