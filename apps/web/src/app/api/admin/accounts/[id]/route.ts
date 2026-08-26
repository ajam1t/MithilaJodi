import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { account_status, reason, grant_plan } = body as {
    account_status: 'active' | 'suspended' | 'banned'
    reason?: string
    grant_plan?: string
  }

  const admin = await createAdminClient()

  if (grant_plan !== undefined) {
    if (typeof grant_plan !== 'string' || grant_plan.trim() === '') {
      return NextResponse.json({ ok: false, message: 'grant_plan is required.' }, { status: 400 })
    }

    const { data: plan } = await admin
      .from('plan_config')
      .select('plan, duration_days, grace_days')
      .eq('plan', grant_plan)
      .eq('active', true)
      .maybeSingle()

    if (!plan) {
      return NextResponse.json({ ok: false, message: 'Active plan not found.' }, { status: 404 })
    }

    const { data: account } = await admin
      .from('accounts')
      .select('id')
      .eq('id', id)
      .neq('account_status', 'deleted')
      .maybeSingle()

    if (!account) {
      return NextResponse.json({ ok: false, message: 'Account not found.' }, { status: 404 })
    }

    const startedAt = new Date()
    const expiresAt = new Date(startedAt.getTime() + plan.duration_days * 24 * 60 * 60 * 1000)
    const graceUntil = new Date(expiresAt.getTime() + plan.grace_days * 24 * 60 * 60 * 1000)

    const { error: cancelError } = await admin
      .from('memberships')
      .update({
        status: 'cancelled',
        cancelled_at: startedAt.toISOString(),
        cancellation_reason: 'Replaced by an administrator grant',
      })
      .eq('account_id', id)
      .in('status', ['pending', 'active', 'expiring_soon', 'grace', 'payment_failed'])

    if (cancelError) {
      console.error('[admin/accounts/[id] grant] cancel existing membership error:', cancelError.message)
      return NextResponse.json({ ok: false, message: 'Could not replace the existing membership.' }, { status: 500 })
    }

    const { data: membership, error: membershipError } = await admin
      .from('memberships')
      .insert({
        account_id: id,
        payment_id: null,
        plan: plan.plan,
        status: 'active',
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        grace_until: graceUntil.toISOString(),
        cancelled_at: null,
        cancellation_reason: null,
      })
      .select('id, plan, status, expires_at')
      .single()

    if (membershipError || !membership) {
      console.error('[admin/accounts/[id] grant] insert membership error:', membershipError?.message)
      return NextResponse.json({ ok: false, message: 'Could not grant the membership.' }, { status: 500 })
    }

    await admin.from('admin_audit_logs').insert({
      actor_id: session.id,
      action: 'grant_membership',
      target_type: 'account',
      target_id: id,
      payload: {
        plan: plan.plan,
        duration_days: plan.duration_days,
        expires_at: expiresAt.toISOString(),
      },
    })

    return NextResponse.json({ ok: true, membership })
  }

  const validStatuses = ['active', 'suspended', 'banned'] as const
  if (!validStatuses.includes(account_status)) {
    return NextResponse.json({ ok: false, message: 'Invalid account_status.' }, { status: 400 })
  }

  const { error } = await admin
    .from('accounts')
    .update({ account_status, status_reason: reason ?? null })
    .eq('id', id)

  if (error) {
    console.error('[admin/accounts/[id] PATCH] update error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'update_account_status',
    target_type: 'account',
    target_id: id,
    payload: { new_status: account_status, reason: reason ?? null },
  })

  return NextResponse.json({ ok: true })
}
