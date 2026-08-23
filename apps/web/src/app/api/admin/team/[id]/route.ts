import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

async function guard() {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await guard()) return NextResponse.json({ ok: false }, { status: 403 })
  const { id } = await params

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = body as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: Record<string, any> = { updated_at: new Date().toISOString() }

  if (typeof b?.display_name === 'string' && b.display_name.trim()) patch.display_name = b.display_name.trim()
  if (typeof b?.role === 'string' && b.role.trim()) patch.role = b.role.trim()
  if ('bio' in b) patch.bio = typeof b.bio === 'string' && b.bio.trim() ? b.bio.trim() : null
  if (Array.isArray(b?.responsibilities)) {
    patch.responsibilities = (b.responsibilities as unknown[])
      .filter(r => typeof r === 'string' && (r as string).trim())
      .map(r => (r as string).trim())
  }
  if (typeof b?.display_order === 'number') patch.display_order = b.display_order
  if (typeof b?.is_enabled === 'boolean') patch.is_enabled = b.is_enabled

  const admin = await createAdminClient()
  const { error } = await admin.from('team_members').update(patch).eq('id', id)
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await guard()) return NextResponse.json({ ok: false }, { status: 403 })
  const { id } = await params

  const admin = await createAdminClient()

  // Delete photo from storage if one exists.
  const { data: row } = await admin
    .from('team_members')
    .select('photo_storage_path')
    .eq('id', id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const path = (row as any)?.photo_storage_path as string | null
  if (path) {
    await admin.storage.from('team-photos').remove([path])
  }

  const { error } = await admin.from('team_members').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
