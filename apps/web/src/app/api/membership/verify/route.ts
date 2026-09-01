import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { getPaymentGateway } from '@/lib/services/payment/gateway'
import { createAdminClient } from '@/lib/supabase/server'
import { isFreeAccessMode } from '@/lib/membership'
import type { GatewayCapture } from '@/lib/services/payment/types'

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

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body as {
    razorpay_order_id?: string
    razorpay_payment_id?: string
    razorpay_signature?: string
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ ok: false, message: 'Missing payment fields' }, { status: 400 })
  }

  // Verify HMAC — prevents client-side tampering
  const capture: GatewayCapture = {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    amount: 0,
  }
  let valid: boolean
  try {
    valid = getPaymentGateway().verifyPaymentSignature(capture)
  } catch (err) {
    console.error('[verify POST] signature check error:', err)
    return NextResponse.json({ ok: false, message: 'Verification failed' }, { status: 500 })
  }
  if (!valid) {
    console.warn('[verify POST] invalid signature for order:', razorpay_order_id)
    return NextResponse.json({ ok: false, message: 'Invalid payment signature' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Find payment — must belong to this session's account
  const { data: payment, error: fetchErr } = await admin
    .from('payments')
    .select('id, account_id, plan, status, amount_paise, currency')
    .eq('gateway_order_id', razorpay_order_id)
    .eq('account_id', session.id)
    .maybeSingle()

  if (fetchErr || !payment) {
    return NextResponse.json({ ok: false, message: 'Payment not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = payment as any

  // Idempotency: already captured by webhook (or a duplicate callback)
  if (p.status === 'captured') {
    return NextResponse.json({ ok: true, already_active: true })
  }

  // Confirm with Razorpay that the payment is genuinely captured and that the
  // amount/currency/order match the order we created. A valid signature only
  // proves the IDs are authentic — it does NOT prove money was captured, so we
  // fetch the authoritative payment record before activating anything.
  let gp
  try {
    gp = await getPaymentGateway().fetchPayment(razorpay_payment_id)
  } catch (err) {
    console.error('[verify POST] fetchPayment error:', err)
    return NextResponse.json(
      { ok: false, message: 'Could not confirm payment right now. If money was deducted it will reflect shortly.' },
      { status: 502 },
    )
  }

  if (gp.orderId !== razorpay_order_id) {
    console.warn('[verify POST] order mismatch for', razorpay_order_id)
    return NextResponse.json({ ok: false, message: 'Payment does not match the order' }, { status: 400 })
  }
  if (gp.status !== 'captured') {
    console.warn('[verify POST] payment not captured, status:', gp.status)
    return NextResponse.json(
      { ok: false, message: 'Payment not captured yet. If money was deducted, it will reflect shortly.' },
      { status: 402 },
    )
  }
  if (gp.amount !== p.amount_paise || gp.currency !== p.currency) {
    console.warn('[verify POST] amount/currency mismatch for', razorpay_order_id)
    return NextResponse.json({ ok: false, message: 'Payment amount mismatch' }, { status: 400 })
  }

  // Mark payment captured
  await admin
    .from('payments')
    .update({
      status: 'captured',
      gateway_payment_id: razorpay_payment_id,
      gateway_signature: razorpay_signature,
    })
    .eq('id', p.id)

  // Fetch plan duration from DB
  const { data: planRow } = await admin
    .from('plan_config')
    .select('duration_days')
    .eq('plan', p.plan)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const durationDays = (planRow as any)?.duration_days ?? 365
  const now = new Date()
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

  // Activate the pending membership linked to this payment
  const { data: membership } = await admin
    .from('memberships')
    .update({
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq('payment_id', p.id)
    .eq('account_id', session.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (membership) {
    // Back-link membership_id onto payment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await admin.from('payments').update({ membership_id: (membership as any).id }).eq('id', p.id)
  }

  // Make active profiles discoverable
  await admin
    .from('profiles')
    .update({ discoverable: true })
    .eq('account_id', session.id)
    .eq('profile_status', 'active')

  return NextResponse.json({ ok: true, expires_at: expiresAt.toISOString() })
}
