import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

export async function GET() {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const admin = await createAdminClient()

  const { data: plans, error } = await admin
    .from('plan_config')
    .select('*')
    .eq('active', true)
    .order('plan')
    .limit(10)

  if (error) {
    console.error('[admin/config GET] query error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true, plans: plans ?? [] })
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const body = await request.json()
  const { plan, price_paise, duration_days, grace_period_days, label_en, label_mai } = body as {
    plan: string
    price_paise?: number
    duration_days?: number
    grace_period_days?: number
    label_en?: string
    label_mai?: string
  }

  if (!plan || typeof plan !== 'string' || plan.trim() === '') {
    return NextResponse.json({ ok: false, message: 'plan is required.' }, { status: 400 })
  }

  if (price_paise !== undefined) {
    if (!Number.isInteger(price_paise) || price_paise <= 0) {
      return NextResponse.json(
        { ok: false, message: 'price_paise must be a positive integer.' },
        { status: 400 }
      )
    }
  }

  if (duration_days !== undefined) {
    if (!Number.isInteger(duration_days) || duration_days <= 0) {
      return NextResponse.json(
        { ok: false, message: 'duration_days must be a positive integer.' },
        { status: 400 }
      )
    }
  }

  if (grace_period_days !== undefined) {
    if (!Number.isInteger(grace_period_days) || grace_period_days <= 0) {
      return NextResponse.json(
        { ok: false, message: 'grace_period_days must be a positive integer.' },
        { status: 400 }
      )
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateObj: Record<string, any> = {}
  if (price_paise !== undefined) updateObj.price_paise = price_paise
  if (duration_days !== undefined) updateObj.duration_days = duration_days
  if (grace_period_days !== undefined) updateObj.grace_days = grace_period_days
  if (label_en !== undefined) updateObj.label_en = label_en
  if (label_mai !== undefined) updateObj.label_mai = label_mai

  if (Object.keys(updateObj).length === 0) {
    return NextResponse.json({ ok: false, message: 'No fields to update.' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('plan_config')
    .update(updateObj)
    .eq('plan', plan)
    .select('plan')

  if (error) {
    console.error('[admin/config PATCH] update error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!data || (data as any[]).length === 0) {
    return NextResponse.json({ ok: false, message: 'Plan not found.' }, { status: 404 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'update_plan_config',
    target_type: 'config',
    target_id: null,
    payload: { plan, ...updateObj },
  })

  return NextResponse.json({ ok: true })
}
