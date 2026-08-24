import 'server-only'
import crypto from 'crypto'
import type { PaymentGateway, GatewayOrder, GatewayCapture, GatewayRefund, GatewayPayment } from './types'

const BASE_URL = 'https://api.razorpay.com/v1'

function creds() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) throw new Error('Razorpay credentials not configured')
  return { keyId, keySecret }
}

function basicAuth(keyId: string, keySecret: string): string {
  return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
}

export class RazorpayGateway implements PaymentGateway {
  async createOrder(
    amountPaise: number,
    currency: string,
    receipt: string,
    notes?: Record<string, string>
  ): Promise<GatewayOrder> {
    const { keyId, keySecret } = creds()
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: basicAuth(keyId, keySecret),
      },
      body: JSON.stringify({ amount: amountPaise, currency, receipt, notes: notes ?? {} }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Razorpay createOrder ${res.status}: ${JSON.stringify(err)}`)
    }
    const d = await res.json()
    return { orderId: d.id, amount: d.amount, currency: d.currency, receipt: d.receipt }
  }

  async fetchPayment(paymentId: string): Promise<GatewayPayment> {
    const { keyId, keySecret } = creds()
    const res = await fetch(`${BASE_URL}/payments/${paymentId}`, {
      headers: { Authorization: basicAuth(keyId, keySecret) },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Razorpay fetchPayment ${res.status}: ${JSON.stringify(err)}`)
    }
    const d = await res.json()
    return {
      paymentId: d.id,
      orderId: d.order_id,
      status: d.status,
      amount: d.amount,
      currency: d.currency,
    }
  }

  verifyPaymentSignature(capture: GatewayCapture): boolean {
    const { keySecret } = creds()
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${capture.orderId}|${capture.paymentId}`)
      .digest('hex')
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(capture.signature, 'hex')
      )
    } catch {
      return false
    }
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET not configured')
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex')
      )
    } catch {
      return false
    }
  }

  async refund(paymentId: string, amountPaise: number): Promise<GatewayRefund> {
    const { keyId, keySecret } = creds()
    const res = await fetch(`${BASE_URL}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: basicAuth(keyId, keySecret),
      },
      body: JSON.stringify({ amount: amountPaise }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Razorpay refund ${res.status}: ${JSON.stringify(err)}`)
    }
    const d = await res.json()
    return { refundId: d.id, paymentId: d.payment_id, amount: d.amount, status: d.status }
  }
}
