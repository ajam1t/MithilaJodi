import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0)

  const admin = await createAdminClient()

  let query = admin
    .from('accounts')
    .select('id, mobile, role, account_status, created_at')
    .neq('account_status', 'deleted')
    .order('created_at', { ascending: false })
    .range(page * 20, page * 20 + 19)

  if (q) {
    query = query.ilike('mobile', `%${q}%`)
  }
  if (status) {
    query = query.eq('account_status', status)
  }

  const { data: accounts, error } = await query

  if (error) {
    console.error('[admin/accounts GET] query error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ ok: true, accounts: [] })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accountIds = (accounts as any[]).map((a) => a.id)

  const { data: profileRows } = await admin
    .from('profiles')
    .select('id, account_id, first_name, last_name, profile_status')
    .in('account_id', accountIds)
    .neq('profile_status', 'deleted')

  const { data: membershipRows } = await admin
    .from('memberships')
    .select('account_id, plan, status, expires_at, created_at')
    .in('account_id', accountIds)
    .order('created_at', { ascending: false })

  const { data: plans } = await admin
    .from('plan_config')
    .select('plan, label_en, duration_days')
    .eq('active', true)
    .order('price_paise', { ascending: true })

  const profileMap: Record<string, { id: string; name: string; profile_status: string }> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(profileRows as any[] ?? []).forEach((p) => {
    // Keep first profile found per account
    if (!profileMap[p.account_id]) {
      profileMap[p.account_id] = {
        id: p.id,
        name: [p.first_name, p.last_name].filter(Boolean).join(' '),
        profile_status: p.profile_status,
      }
    }
  })

  const membershipMap: Record<string, { plan: string; status: string; expires_at: string | null }> = {}
  // The newest membership is the one used by the member-facing access checks.
  ;(membershipRows as any[] ?? []).forEach((m) => {
    if (!membershipMap[m.account_id]) {
      membershipMap[m.account_id] = {
        plan: m.plan,
        status: m.status,
        expires_at: m.expires_at,
      }
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (accounts as any[]).map((a) => ({
    id: a.id,
    mobile: a.mobile,
    role: a.role,
    account_status: a.account_status,
    created_at: a.created_at,
    profile: profileMap[a.id] ?? null,
    membership: membershipMap[a.id] ?? null,
  }))

  return NextResponse.json({ ok: true, accounts: result, plans: plans ?? [] })
}
