import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSessionAccount } from '@/lib/auth'
import { getActiveMembership, getActivePlan } from '@/lib/membership'
import type { PlanConfig } from '@/lib/membership'
import { getPaymentGateway } from '@/lib/services/payment/gateway'
import { createAdminClient } from '@/lib/supabase/server'
import { isFreeAccessMode } from '@/lib/membership'

// ── Payments are currently DISABLED ──────────────────────────────────────────
// Mithila Jodi is free for all members, so this endpoint is closed. The
// implementation below is deliberately retained so paid memberships can be
// restored by setting PAID_MEMBERSHIPS_ENABLED=true (see lib/membership.ts).
function paymentsDisabledResponse() {
  return NextResponse.json(
    { ok: false, message: 'Mithila Jodi is currently free for all members. No payment is required.' },
    { status: 410 }
  )
}

export async function POST(request: NextRequest) {
  if (isFreeAccessMode()) return paymentsDisabledResponse()

  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  // Block duplicate purchase while an active membership exists
  const existing = await getActiveMembership(session.id)
  if (existing && ['active', 'expiring_soon', 'grace'].includes(existing.status)) {
    return NextResponse.json(
      { ok: false, message: 'You already have an active membership' },
      { status: 409 }
    )
  }

  // Accept optional plan slug in body — fall back to cheapest active plan
  let body: Record<string, unknown> = {}
  try { body = await request.json() } catch { /* no body is fine */ }

  const planSlug = typeof body.plan === 'string' ? body.plan.trim() : null

  let plan: PlanConfig | null = null
  if (planSlug) {
    const admin = await createAdminClient()
    const { data } = await admin
      .from('plan_config')
      .select('*')
      .eq('plan', planSlug)
      .eq('active', true)
      .maybeSingle()
    plan = data as PlanConfig | null
    if (!plan) {
      return NextResponse.json({ ok: false, message: 'Plan not found or not available' }, { status: 404 })
    }
  } else {
    // Fallback: cheapest active plan (backward compatibility)
    plan = await getActivePlan()
  }

  if (!plan) {
    return NextResponse.json({ ok: false, message: 'No plan available' }, { status: 503 })
  }

  const idempotencyKey = crypto.randomUUID()
  const gateway = getPaymentGateway()

  let gatewayOrder
  try {
    gatewayOrder = await gateway.createOrder(
      plan.price_paise,
      'INR',
      idempotencyKey,
      { account_id: session.id, plan: plan.plan }
    )
  } catch (err) {
    // TEMP DIAGNOSTIC: surface the real Razorpay reason on-screen to debug the
    // live "Payment gateway error". Revert to a generic message once resolved.
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[orders POST] gateway.createOrder failed:', detail)
    return NextResponse.json({ ok: false, message: 'Gateway error: ' + detail }, { status: 502 })
  }

  const admin = await createAdminClient()

  const { data: payment, error: paymentError } = await admin
    .from('payments')
    .insert({
      account_id: session.id,
      gateway: 'razorpay',
      gateway_order_id: gatewayOrder.orderId,
      amount_paise: plan.price_paise,
      currency: 'INR',
      plan: plan.plan,
      status: 'created',
      idempotency_key: idempotencyKey,
    })
    .select('id')
    .single()

  if (paymentError || !payment) {
    console.error('[orders POST] payment insert:', paymentError)
    return NextResponse.json({ ok: false, message: 'Failed to create payment record' }, { status: 500 })
  }

  const { error: membershipError } = await admin
    .from('memberships')
    .insert({
      account_id: session.id,
      payment_id: payment.id,
      plan: plan.plan,
      status: 'pending',
    })

  if (membershipError) {
    console.error('[orders POST] membership insert:', membershipError)
    return NextResponse.json({ ok: false, message: 'Failed to create membership record' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    orderId: gatewayOrder.orderId,
    amount: plan.price_paise,
    currency: 'INR',
    key: process.env.RAZORPAY_KEY_ID ?? '',
    plan: { label: plan.label_en, duration_days: plan.duration_days },
  })
}
