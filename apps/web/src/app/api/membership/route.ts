import 'server-only'
import { NextResponse } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { getActiveMembership, getAllPlans, getInterestAllowance } from '@/lib/membership'

export async function GET() {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const [membership, plans, allowance] = await Promise.all([
    getActiveMembership(session.id),
    getAllPlans(),
    getInterestAllowance(session.id),
  ])

  return NextResponse.json({ ok: true, membership, plans, allowance })
}
