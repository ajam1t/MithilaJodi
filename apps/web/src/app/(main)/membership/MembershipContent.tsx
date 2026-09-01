'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ActiveMembership, MembershipStatus, PlanConfig, InterestAllowance } from '@/lib/membership'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

type ApiData = {
  membership: ActiveMembership | null
  plans: PlanConfig[]
  allowance: InterestAllowance
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatPrice(paise: number): string {
  return '₹' + (paise / 100).toFixed(0)
}

/** Human-readable membership term, e.g. 365 days → "Annual · 365 days". */
function durationLabel(days: number): string {
  if (days >= 365) return `Annual · ${days} days`
  if (days >= 28) return `${Math.round(days / 30)} months · ${days} days`
  return `${days} days`
}

function StatusBadge({ status }: { status: MembershipStatus }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    active:         { label: 'Active',          cls: 'bg-success-soft text-success-fg' },
    expiring_soon:  { label: 'Expiring soon',   cls: 'bg-warning-soft text-warning-fg' },
    grace:          { label: 'Grace period',    cls: 'bg-warning-soft text-warning-fg' },
    pending:        { label: 'Payment pending', cls: 'bg-info-soft text-info-fg' },
    expired:        { label: 'Expired',         cls: 'bg-error-soft text-error-fg' },
    payment_failed: { label: 'Payment failed',  cls: 'bg-error-soft text-error-fg' },
    cancelled:      { label: 'Cancelled',       cls: 'bg-ink/10 text-ink-soft' },
    refunded:       { label: 'Refunded',        cls: 'bg-ink/10 text-ink-soft' },
    none:           { label: 'No membership',   cls: 'bg-ink/10 text-ink-soft' },
  }
  const { label, cls } = cfg[status] ?? cfg.none
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function interestLabel(plan: PlanConfig): string {
  if (!plan.can_send_interest) return 'No interest sending'
  if (plan.interest_limit === null) return 'Unlimited interests'
  return `${plan.interest_limit} interests / year`
}

export default function MembershipContent() {
  const [data, setData]     = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [buying, setBuying] = useState<string | null>(null)  // plan slug being purchased
  const [success, setSuccess] = useState<{ expires_at: string; plan: string } | null>(null)

  useEffect(() => {
    fetch('/api/membership')
      .then(r => r.json())
      .then(j => {
        if (j.ok) setData({ membership: j.membership, plans: j.plans ?? [], allowance: j.allowance })
        else setError(j.message ?? 'Failed to load membership details')
      })
      .catch(() => setError('Could not load membership details'))
      .finally(() => setLoading(false))
  }, [])

  async function handleBuy(planSlug: string) {
    setBuying(planSlug)
    setError('')

    try {
      const orderRes = await fetch('/api/membership/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planSlug }),
      })
      const orderJson = await orderRes.json()
      if (!orderRes.ok || !orderJson.ok) {
        setError(orderJson.message ?? 'Could not create order. Try again.')
        return
      }

      const loaded = await loadRazorpayScript()
      if (!loaded) {
        setError('Could not load payment gateway. Check your connection and try again.')
        return
      }

      await new Promise<void>((resolve) => {
        const rzp = new window.Razorpay({
          key: orderJson.key,
          amount: orderJson.amount,
          currency: orderJson.currency,
          order_id: orderJson.orderId,
          name: 'Mithila Jodi',
          description: `${orderJson.plan.label} — ${orderJson.plan.duration_days} days`,
          theme: { color: '#7A1220' },
          modal: { ondismiss() { resolve() } },
          handler: async (response: {
            razorpay_order_id: string
            razorpay_payment_id: string
            razorpay_signature: string
          }) => {
            try {
              const verifyRes = await fetch('/api/membership/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              })
              const verifyJson = await verifyRes.json()
              if (verifyJson.ok) {
                setSuccess({ expires_at: verifyJson.expires_at, plan: planSlug })
                const refreshRes = await fetch('/api/membership')
                const refreshJson = await refreshRes.json()
                if (refreshJson.ok) setData({ membership: refreshJson.membership, plans: refreshJson.plans ?? [], allowance: refreshJson.allowance })
              } else {
                setError(verifyJson.message ?? 'Payment verification failed. Contact support.')
              }
            } catch {
              setError('Verification failed. Contact support if amount was deducted.')
            } finally {
              resolve()
            }
          },
        })
        rzp.on('payment.failed', (resp: { error: { description: string } }) => {
          setError(resp.error?.description ?? 'Payment failed. Try again.')
          resolve()
        })
        rzp.open()
      })
    } finally {
      setBuying(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-paper">
        <div className="wrap py-10">
          <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
            <div className="h-8 bg-paper-3 rounded w-1/3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-6 space-y-3 h-40" />
              <div className="card p-6 space-y-3 h-40" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  const membership = data?.membership ?? null
  const plans = data?.plans ?? []
  const allowance = data?.allowance
  const isLive = membership && ['active', 'expiring_soon', 'grace'].includes(membership.status)

  return (
    <main className="min-h-screen bg-paper">
      <div className="wrap py-10">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="font-serif text-3xl text-ink">Membership</h1>

          {/* Success banner */}
          {success && (
            <div className="rounded-mj-sm bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
              Payment successful! Your membership is active until{' '}
              <strong>{formatDate(success.expires_at)}</strong>. You can now send interests and message matches.
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="rounded-mj-sm bg-error-soft border border-error/30 px-4 py-3 text-error-fg text-sm">
              {error}
            </div>
          )}

          {/* Current membership status */}
          {membership && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-ink">Current membership</h2>
                <StatusBadge status={membership.status} />
              </div>
              <dl className="text-sm space-y-1.5">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Plan</dt>
                  <dd className="text-ink font-medium capitalize">{membership.plan}</dd>
                </div>
                {membership.started_at && (
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Started</dt>
                    <dd className="text-ink font-medium">{formatDate(membership.started_at)}</dd>
                  </div>
                )}
                {membership.expires_at && (
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">{membership.status === 'grace' ? 'Expired' : 'Expires'}</dt>
                    <dd className="text-ink font-medium">{formatDate(membership.expires_at)}</dd>
                  </div>
                )}
                {membership.status === 'grace' && membership.grace_until && (
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Grace ends</dt>
                    <dd className="text-amber-700 font-medium">{formatDate(membership.grace_until)}</dd>
                  </div>
                )}
              </dl>

              {/* Interest counter */}
              {allowance && allowance.limit !== null && isLive && (
                <div className="border-t border-paper-3 pt-3">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-ink-soft">Interests remaining</span>
                    <span className={`font-semibold ${(allowance.remaining ?? 0) === 0 ? 'text-red-600' : 'text-maroon'}`}>
                      {allowance.remaining} / {allowance.limit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-paper-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-maroon rounded-full transition-all"
                      style={{ width: `${Math.round(((allowance.remaining ?? 0) / allowance.limit) * 100)}%` }}
                    />
                  </div>
                  {(allowance.remaining ?? 0) === 0 && (
                    <p className="text-xs text-ink-soft mt-1.5">
                      Upgrade to Mithila Premium for unlimited interests.
                    </p>
                  )}
                </div>
              )}
              {allowance && allowance.limit === null && isLive && (
                <p className="text-xs text-success-fg border-t border-paper-3 pt-2">
                  Unlimited interests — Mithila Premium
                </p>
              )}

              {membership.status === 'expiring_soon' && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-mj-sm px-3 py-2">
                  Your membership expires soon. Renew to keep sending interests and messaging.
                </p>
              )}
              {membership.status === 'grace' && (
                <p className="text-xs text-orange-700 bg-orange-50 rounded-mj-sm px-3 py-2">
                  Your membership has expired but you are in the grace period. Renew now to avoid losing access.
                </p>
              )}
            </div>
          )}

          {/* Plan cards */}
          {plans.length > 0 && (
            <div>
              <h2 className="font-serif text-xl text-ink mb-4">
                {isLive ? 'Change or renew plan' : 'Choose a plan'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.map(plan => {
                  const isCurrent = membership?.plan === plan.plan && isLive
                  const isPremium = plan.interest_limit === null
                  return (
                    <div
                      key={plan.plan}
                      className={[
                        'card p-5 space-y-4 relative overflow-hidden',
                        isPremium ? 'border-2 border-gold' : '',
                      ].join(' ')}
                    >
                      {isPremium && (
                        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-maroon-deep/20 via-gold to-maroon-deep/20" />
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-terra font-semibold mb-1">
                            {isPremium ? 'Best value' : 'Popular'}
                          </p>
                          <h3 className="font-serif text-lg text-maroon">{plan.label_en}</h3>
                        </div>
                        <div className="text-right">
                          <p className="font-serif text-2xl text-maroon">{formatPrice(plan.price_paise)}</p>
                          <p className="text-[11px] text-ink-soft">total payable</p>
                          <p className="text-xs text-ink-soft mt-0.5">{durationLabel(plan.duration_days)}</p>
                        </div>
                      </div>

                      <ul className="text-sm text-ink space-y-1.5">
                        {[
                          'Profile search & discovery',
                          plan.can_message ? 'Messaging' : null,
                          interestLabel(plan),
                          'Shortlist profiles',
                          'Privacy controls',
                        ].filter(Boolean).map(feature => (
                          <li key={feature} className="flex items-start gap-2">
                            <span className="text-gold mt-0.5 shrink-0">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* Pre-payment disclosure — shown before the pay button */}
                      <div className="text-xs text-ink-soft border-t border-paper-3 pt-3 space-y-1.5">
                        <p>
                          <strong className="text-ink">No automatic renewal.</strong> Your membership
                          will expire at the end of the {plan.duration_days >= 365 ? 'annual' : 'paid'}{' '}
                          membership period unless you choose to purchase or renew another plan. Your
                          card is not charged again and no recurring mandate is created.
                        </p>
                        <p>Your profile and data are retained after expiry.</p>
                        <p>
                          <Link href="/legal/refunds" className="text-maroon underline underline-offset-2">
                            Refund &amp; Cancellation Policy
                          </Link>
                          {' · '}
                          <Link href="/legal/terms" className="text-maroon underline underline-offset-2">
                            Terms
                          </Link>
                        </p>
                      </div>

                      {isCurrent ? (
                        <div className="text-center py-2 text-sm text-success-fg font-medium">
                          ✓ Your current plan
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBuy(plan.plan)}
                          disabled={buying !== null}
                          className={[
                            'w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed',
                            isPremium ? 'btn-primary' : 'btn-ghost',
                          ].join(' ')}
                        >
                          {buying === plan.plan
                            ? 'Opening payment…'
                            : isLive
                            ? `Switch to ${plan.label_en} — ${formatPrice(plan.price_paise)}`
                            : `Activate — ${formatPrice(plan.price_paise)}`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {plans.length === 0 && !loading && (
            <div className="card p-5 text-center text-ink-soft text-sm">
              No membership plans are currently available. Please check back later.
            </div>
          )}

          <p className="text-xs text-ink-soft text-center">
            Secure payment via Razorpay. UPI, cards, net banking accepted.
          </p>
        </div>
      </div>
    </main>
  )
}
