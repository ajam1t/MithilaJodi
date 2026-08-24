/** Payment gateway abstraction — Razorpay is the current provider.
 *  All gateway-specific logic is isolated to RazorpayGateway.ts.
 *  Swap by implementing a new class and changing the factory. */

export interface GatewayOrder {
  orderId: string       // gateway order ID
  amount: number        // in paise
  currency: string
  receipt: string       // our idempotency_key
}

export interface GatewayCapture {
  paymentId: string
  orderId: string
  signature: string     // HMAC for server-side verification
  amount: number
}

export interface GatewayRefund {
  refundId: string
  paymentId: string
  amount: number
  status: string
}

export interface GatewayPayment {
  paymentId: string
  orderId: string
  status: string        // 'created' | 'authorized' | 'captured' | 'refunded' | 'failed'
  amount: number        // in paise
  currency: string
}

export interface PaymentGateway {
  /** Create a payment order on the gateway (called server-side) */
  createOrder(
    amountPaise: number,
    currency: string,
    receipt: string,       // our idempotency_key — used as Razorpay receipt
    notes?: Record<string, string>
  ): Promise<GatewayOrder>

  /** Verify HMAC signature from client-side success callback.
   *  NEVER activate membership based on client data alone — this is step 1. */
  verifyPaymentSignature(capture: GatewayCapture): boolean

  /** Verify webhook event signature (from Razorpay webhook header) */
  verifyWebhookSignature(body: string, signature: string): boolean

  /** Fetch the authoritative payment record from the gateway (server-side).
   *  Used to confirm a payment was actually captured and that amount/currency
   *  match before activating membership — never trust client callback data. */
  fetchPayment(paymentId: string): Promise<GatewayPayment>

  /** Initiate refund */
  refund(paymentId: string, amountPaise: number): Promise<GatewayRefund>
}
