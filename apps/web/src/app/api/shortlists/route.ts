import 'server-only'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

function toDisplayName(firstName: string, lastName: string | null): string {
  if (lastName) return `${firstName} ${lastName}`
  return firstName
}

export async function GET() {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  const { data: myProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', session.id)
    .is('deleted_at', null)
    .neq('profile_status', 'deleted')
    .limit(1)
    .maybeSingle()

  if (!myProfile) return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myId = (myProfile as any).id as string

  const { data: shortlistRows } = await admin
    .from('shortlists')
    .select('saved_id, saved_at')
    .eq('profile_id', myId)
    .order('saved_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = shortlistRows ?? []

  const savedIds = rows.map((r) => r.saved_id as string)

  if (savedIds.length === 0) return NextResponse.json({ ok: true, shortlists: [] })

  const { data: profileRows } = await admin
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', savedIds)

  const profileMap = new Map<string, { first_name: string; last_name: string | null }>()
  for (const row of (profileRows ?? [])) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any
    profileMap.set(r.id, { first_name: r.first_name, last_name: r.last_name ?? null })
  }

  const shortlists = rows.map((r) => {
    const p = profileMap.get(r.saved_id)
    return {
      profile_id: r.saved_id,
      display_name: p ? toDisplayName(p.first_name, p.last_name) : null,
      saved_at: r.saved_at,
    }
  })

  return NextResponse.json({ ok: true, shortlists })
}
