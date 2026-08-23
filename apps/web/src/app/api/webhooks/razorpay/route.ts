import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getPaymentGateway } from '@/lib/services/payment/gateway'
import { createAdminClient } from '@/lib/supabase/server'

// Razorpay sends raw body for signature verification — must read as text
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-razorpay-signature') ?? ''
  const body = await request.text()

  if (!signature) return NextResponse.json({ ok: false }, { status: 400 })

  // Verify webhook authenticity before processing any payload
  let valid: boolean
  try {
    valid = getPaymentGateway().verifyWebhookSignature(body, signature)
  } catch (err) {
    console.error('[webhook] signature error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  if (!valid) {
    console.warn('[webhook] invalid signature')
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const eventType: string = event?.event ?? ''
  const admin = await createAdminClient()

  // ── payment.captured ─────────────────────────────────────────────────────
  if (eventType === 'payment.captured') {
    const entity = event.payload?.payment?.entity
    if (!entity) return NextResponse.json({ ok: true })

    const orderId: string = entity.order_id
    const paymentId: string = entity.id

    const { data: payment } = await admin
      .from('payments')
      .select('id, account_id, plan, status')
      .eq('gateway_order_id', orderId)
      .maybeSingle()

    if (!payment) return NextResponse.json({ ok: true })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = payment as any

    // Idempotency: verify endpoint may have already captured this
    if (p.status !== 'captured') {
      await admin.from('payments').update({
        status: 'captured',
        gateway_payment_id: paymentId,
        raw_webhook: event,
      }).eq('id', p.id)

      // Activate membership if still pending
      const { data: mem } = await admin
        .from('memberships')
        .select('id, status')
        .eq('payment_id', p.id)
        .maybeSingle()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (mem && (mem as any).status === 'pending') {
        const { data: planRow } = await admin
          .from('plan_config')
          .select('duration_days')
          .eq('plan', p.plan)
          .maybeSingle()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const durationDays = (planRow as any)?.duration_days ?? 365
        const now = new Date()
        const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

        await admin.from('memberships').update({
          status: 'active',
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).eq('id', (mem as any).id)

        await admin.from('profiles')
          .update({ discoverable: true })
          .eq('account_id', p.account_id)
          .eq('profile_status', 'active')
      }
    } else {
      // Still store latest webhook payload for audit
      await admin.from('payments').update({ raw_webhook: event }).eq('id', p.id)
    }
  }

  // ── payment.failed ────────────────────────────────────────────────────────
  else if (eventType === 'payment.failed') {
    const entity = event.payload?.payment?.entity
    if (!entity) return NextResponse.json({ ok: true })

    await admin.from('payments').update({
      status: 'failed',
      failure_code: entity.error_code ?? null,
      failure_description: entity.error_description ?? null,
      raw_webhook: event,
    }).eq('gateway_order_id', entity.order_id)

    // Mark pending membership as payment_failed
    const { data: payment } = await admin
      .from('payments')
      .select('id')
      .eq('gateway_order_id', entity.order_id)
      .maybeSingle()

    if (payment) {
      await admin.from('memberships')
        .update({ status: 'payment_failed' })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('payment_id', (payment as any).id)
        .eq('status', 'pending')
    }
  }

  // ── refund.created ────────────────────────────────────────────────────────
  else if (eventType === 'refund.created') {
    const entity = event.payload?.refund?.entity
    if (!entity) return NextResponse.json({ ok: true })

    const { data: refundedPayment } = await admin
      .from('payments')
      .update({
        status: 'refunded',
        refund_id: entity.id,
        refunded_amount_paise: entity.amount,
        refunded_at: new Date().toISOString(),
        raw_webhook: event,
      })
      .eq('gateway_payment_id', entity.payment_id)
      .select('id, account_id')
      .maybeSingle()

    // Downgrade the linked membership so refunded users lose paid access and
    // discoverability. Without this, a refunded member keeps every feature.
    if (refundedPayment) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rp = refundedPayment as any
      await admin.from('memberships')
        .update({ status: 'refunded' })
        .eq('payment_id', rp.id)
      await admin.from('profiles')
        .update({ discoverable: false })
        .eq('account_id', rp.account_id)
    }
  }

  // All other events: acknowledge and ignore
  return NextResponse.json({ ok: true })
}
