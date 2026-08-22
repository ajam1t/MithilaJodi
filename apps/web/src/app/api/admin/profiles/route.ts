import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const status = request.nextUrl.searchParams.get('status')
  const admin = await createAdminClient()

  let query = admin
    .from('profiles')
    .select('id, first_name, last_name, dob, gender, caste, profile_status, created_at, account_id, accounts(mobile)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (status && status !== 'all') {
    query = query.eq('profile_status', status)
  }

  const { data: profiles, error } = await query

  if (error) {
    console.error('[admin/profiles GET] query error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true, profiles: profiles ?? [] })
}
