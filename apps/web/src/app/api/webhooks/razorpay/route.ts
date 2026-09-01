import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getPaymentGateway } from '@/lib/services/payment/gateway'
import { createAdminClient } from '@/lib/supabase/server'
import { isFreeAccessMode } from '@/lib/membership'

/**
 * Idempotently mark a payment captured and activate its pending membership.
 * Shared by the `payment.captured` and `order.paid` events — either may arrive
 * first (or both, or twice); the `status !== 'captured'` and membership
 * `status === 'pending'` guards ensure membership is never activated twice.
 */
async function capturePaymentAndActivate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any>,
  orderId: string,
  paymentId: string | null,
  entityAmount: number | null,
  entityCurrency: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any,
): Promise<void> {
  if (!orderId) return

  const { data: payment } = await admin
    .from('payments')
    .select('id, account_id, plan, status, amount_paise, currency')
    .eq('gateway_order_id', orderId)
    .maybeSingle()

  if (!payment) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = payment as any

  // Defense-in-depth: the signature is already verified, but never activate if
  // the amount/currency in the event do not match what we charged for.
  if (typeof entityAmount === 'number' && entityAmount !== p.amount_paise) {
    console.warn('[webhook] amount mismatch for order', orderId)
    await admin.from('payments').update({ raw_webhook: event }).eq('id', p.id)
    return
  }
  if (entityCurrency && entityCurrency !== p.currency) {
    console.warn('[webhook] currency mismatch for order', orderId)
    await admin.from('payments').update({ raw_webhook: event }).eq('id', p.id)
    return
  }

  // Idempotency: if already captured (e.g. by the verify endpoint or a prior
  // webhook), just store the latest payload for audit and stop.
  if (p.status === 'captured') {
    await admin.from('payments').update({ raw_webhook: event }).eq('id', p.id)
    return
  }

  await admin
    .from('payments')
    .update({
      status: 'captured',
      ...(paymentId ? { gateway_payment_id: paymentId } : {}),
      raw_webhook: event,
    })
    .eq('id', p.id)

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

    await admin
      .from('memberships')
      .update({
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('id', (mem as any).id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await admin.from('payments').update({ membership_id: (mem as any).id }).eq('id', p.id)

    await admin
      .from('profiles')
      .update({ discoverable: true })
      .eq('account_id', p.account_id)
      .eq('profile_status', 'active')
  }
}

// Razorpay sends raw body for signature verification — must read as text
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

  const signature = request.headers.get('x-razorpay-signature') ?? ''
  const body = await request.text()

  if (!signature) return NextResponse.json({ ok: false }, { status: 400 })

  // Verify webhook authenticity (raw body + RAZORPAY_WEBHOOK_SECRET) before
  // processing any payload.
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

  try {
    // ── payment.captured ─────────────────────────────────────────────────────
    if (eventType === 'payment.captured') {
      const entity = event.payload?.payment?.entity
      if (entity?.order_id) {
        await capturePaymentAndActivate(
          admin,
          entity.order_id,
          entity.id ?? null,
          typeof entity.amount === 'number' ? entity.amount : null,
          entity.currency ?? null,
          event,
        )
      }
    }

    // ── order.paid ───────────────────────────────────────────────────────────
    // Fires once an order is fully paid. Carries both the order and payment
    // entities. Routed through the same idempotent activation path.
    else if (eventType === 'order.paid') {
      const order = event.payload?.order?.entity
      const pay = event.payload?.payment?.entity
      if (order?.id) {
        await capturePaymentAndActivate(
          admin,
          order.id,
          pay?.id ?? null,
          typeof order.amount === 'number' ? order.amount : null,
          order.currency ?? null,
          event,
        )
      }
    }

    // ── payment.failed ─────────────────────────────────────────────────────────
    else if (eventType === 'payment.failed') {
      const entity = event.payload?.payment?.entity
      if (entity?.order_id) {
        await admin
          .from('payments')
          .update({
            status: 'failed',
            failure_code: entity.error_code ?? null,
            failure_description: entity.error_description ?? null,
            raw_webhook: event,
          })
          .eq('gateway_order_id', entity.order_id)
          .neq('status', 'captured') // never overwrite a captured payment

        const { data: payment } = await admin
          .from('payments')
          .select('id')
          .eq('gateway_order_id', entity.order_id)
          .maybeSingle()

        if (payment) {
          await admin
            .from('memberships')
            .update({ status: 'payment_failed' })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .eq('payment_id', (payment as any).id)
            .eq('status', 'pending')
        }
      }
    }

    // ── refund.created ─────────────────────────────────────────────────────────
    else if (eventType === 'refund.created') {
      const entity = event.payload?.refund?.entity
      if (entity?.payment_id) {
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
          await admin.from('memberships').update({ status: 'refunded' }).eq('payment_id', rp.id)
          await admin.from('profiles').update({ discoverable: false }).eq('account_id', rp.account_id)
        }
      }
    }
  } catch (err) {
    // Return 500 so Razorpay retries later (webhook processing is idempotent).
    console.error('[webhook] processing error for', eventType, err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // All other events: acknowledge and ignore.
  return NextResponse.json({ ok: true })
}
