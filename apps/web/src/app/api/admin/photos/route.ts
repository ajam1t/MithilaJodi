import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

type PhotoStatus = 'pending_moderation' | 'approved' | 'rejected'

export async function GET(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const status = (request.nextUrl.searchParams.get('status') ?? 'pending_moderation') as PhotoStatus
  const allowed: PhotoStatus[] = ['pending_moderation', 'approved', 'rejected']
  if (!allowed.includes(status)) {
    return NextResponse.json({ ok: false, message: 'Invalid status filter.' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { data: photos, error } = await admin
    .from('profile_photos')
    .select('id, profile_id, is_primary, created_at, storage_path, status, moderation_note')
    .eq('status', status)
    .order('created_at', { ascending: status === 'pending_moderation' })
    .limit(50)

  if (error) {
    console.error('[admin/photos GET] query error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  if (!photos || photos.length === 0) {
    return NextResponse.json({ ok: true, photos: [] })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileIds = [...new Set((photos as any[]).map((p) => p.profile_id))]

  const { data: profileRows } = await admin
    .from('profiles')
    .select('id, first_name, last_name, account_id')
    .in('id', profileIds)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileAccountIds = (profileRows as any[] ?? []).map(p => p.account_id).filter(Boolean)
  const { data: accountRows } = await admin
    .from('accounts')
    .select('id, mobile')
    .in('id', profileAccountIds)

  const profileMap: Record<string, { name: string; mobile: string | null }> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accountMobileMap: Record<string, string> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(accountRows as any[] ?? []).forEach(a => { accountMobileMap[a.id] = a.mobile })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(profileRows as any[] ?? []).forEach((p) => {
    profileMap[p.id] = {
      name: [p.first_name, p.last_name].filter(Boolean).join(' ') || '(no name)',
      mobile: accountMobileMap[p.account_id] ?? null,
    }
  })

  const result = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (photos as any[]).map(async (photo) => {
      const { data: signedData } = await admin.storage
        .from('profile-photos')
        .createSignedUrl(photo.storage_path, 3600)

      return {
        id: photo.id,
        profile_id: photo.profile_id,
        profile_name: profileMap[photo.profile_id]?.name ?? null,
        profile_mobile: profileMap[photo.profile_id]?.mobile ?? null,
        is_primary: photo.is_primary,
        photo_url: signedData?.signedUrl ?? null,
        created_at: photo.created_at,
        status: photo.status,
        moderation_note: photo.moderation_note ?? null,
      }
    })
  )

  return NextResponse.json({ ok: true, photos: result })
}
