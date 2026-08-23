import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

function ext(mime: string): string {
  return mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') return NextResponse.json({ ok: false }, { status: 403 })
  const { id } = await params

  let form: FormData
  try { form = await request.formData() } catch {
    return NextResponse.json({ ok: false, message: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = form.get('photo')
  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: 'photo field is required' }, { status: 400 })
  if (!ALLOWED_MIME.includes(file.type)) return NextResponse.json({ ok: false, message: 'Only JPEG, PNG, or WebP photos are accepted' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, message: 'Photo must be under 5 MB' }, { status: 400 })

  const bytes = Buffer.from(await file.arrayBuffer())
  const storagePath = `${id}/${Date.now()}.${ext(file.type)}`

  const admin = await createAdminClient()

  // Delete existing photo if present.
  const { data: row } = await admin
    .from('team_members')
    .select('photo_storage_path')
    .eq('id', id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingPath = (row as any)?.photo_storage_path as string | null
  if (existingPath) {
    await admin.storage.from('team-photos').remove([existingPath])
  }

  const { error: uploadError } = await admin.storage
    .from('team-photos')
    .upload(storagePath, bytes, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[team photo] upload error:', uploadError.message)
    return NextResponse.json({ ok: false, message: 'Upload failed' }, { status: 500 })
  }

  const { error: updateError } = await admin
    .from('team_members')
    .update({ photo_storage_path: storagePath, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    console.error('[team photo] db update error:', updateError.message)
    return NextResponse.json({ ok: false, message: 'Photo uploaded but record update failed' }, { status: 500 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const photoUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/team-photos/${storagePath}`
    : null

  return NextResponse.json({ ok: true, photo_path: storagePath, photo_url: photoUrl })
}
