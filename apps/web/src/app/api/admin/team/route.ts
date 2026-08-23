import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

async function guard() {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function GET() {
  if (!await guard()) return NextResponse.json({ ok: false }, { status: 403 })
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('team_members')
    .select('id, display_name, role, bio, responsibilities, photo_storage_path, display_order, is_enabled, created_at')
    .order('display_order', { ascending: true })
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, members: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!await guard()) return NextResponse.json({ ok: false }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = body as any
  const display_name = typeof b?.display_name === 'string' ? b.display_name.trim() : ''
  const role = typeof b?.role === 'string' ? b.role.trim() : ''
  const bio = typeof b?.bio === 'string' && b.bio.trim() ? b.bio.trim() : null
  const responsibilities: string[] = Array.isArray(b?.responsibilities)
    ? (b.responsibilities as unknown[]).filter(r => typeof r === 'string' && (r as string).trim()).map(r => (r as string).trim())
    : []
  const display_order = typeof b?.display_order === 'number' ? b.display_order : 99

  if (!display_name) return NextResponse.json({ ok: false, message: 'display_name is required' }, { status: 400 })
  if (!role) return NextResponse.json({ ok: false, message: 'role is required' }, { status: 400 })

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('team_members')
    .insert({ display_name, role, bio, responsibilities, display_order })
    .select('id')
    .single()

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: (data as { id: string }).id }, { status: 201 })
}
