'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Membership = {
  id: string
  plan: string
  status: string
  started_at: string | null
  expires_at: string | null
  grace_until: string | null
  interests_sent: number
}

type Plan = {
  plan: string
  price_paise: number
  duration_days: number
  label_en: string
  interest_limit: number | null
  can_message: boolean
}

type Allowance = {
  allowed: boolean
  remaining: number | null
  limit: number | null
}

type ApiResponse = {
  ok: boolean
  membership: Membership | null
  plans: Plan[]
  allowance: Allowance
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function rupees(paise: number): string {
  return '₹' + Math.round(paise / 100)
}

function durationLabel(days: number): string {
  if (days === 365) return 'year'
  if (days === 30) return 'month'
  return `${days} days`
}

function humanizePlan(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active:         { label: 'Active',          cls: 'bg-green-100 text-green-700' },
  expiring_soon:  { label: 'Expiring soon',   cls: 'bg-amber-100 text-amber-700' },
  grace:          { label: 'Grace period',    cls: 'bg-orange-100 text-orange-700' },
  pending:        { label: 'Payment pending', cls: 'bg-blue-100 text-blue-700' },
  payment_failed: { label: 'Payment failed',  cls: 'bg-red-100 text-red-700' },
  free:           { label: 'Free',            cls: 'bg-ink/10 text-ink-soft' },
}

export default function CurrentPlanCard() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/membership')
      .then(r => r.json())
      .then((j: ApiResponse) => { if (j.ok) setData(j) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="border-b border-ink/10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="rounded-mj border border-gold/30 bg-cream p-3 sm:p-4 animate-pulse">
            <div className="h-3 w-24 bg-paper-3 rounded mb-3" />
            <div className="h-6 w-40 bg-paper-3 rounded mb-2" />
            <div className="h-8 w-32 bg-paper-3 rounded mt-3" />
          </div>
        </div>
      </div>
    )
  }

  const membership = data?.membership ?? null
  const plans = data?.plans ?? []
  const allowance = data?.allowance

  // ── Free tier (no active/pending membership) ──────────────────────────────
  if (!membership) {
    return (
      <div className="border-b border-ink/10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <PlanShell
            eyebrow="Current Plan"
            name="Free Plan"
            price="₹0"
            statusKey="free"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-ink-soft sm:max-w-[72%]">
                Create your profile and receive interests. Upgrade to send interests and message matches.
              </p>
              <Link href="/membership" className="btn-primary shrink-0 justify-center px-4 py-2 text-xs">
                Upgrade Plan
              </Link>
            </div>
          </PlanShell>
        </div>
      </div>
    )
  }

  // ── Has a membership row (active / expiring / grace / pending / failed) ────
  const planCfg = plans.find(p => p.plan === membership.plan) ?? null
  const planName = planCfg?.label_en ?? humanizePlan(membership.plan)
  const priceStr = planCfg ? `${rupees(planCfg.price_paise)}` : null
  const perStr = planCfg ? `/ ${durationLabel(planCfg.duration_days)}` : null
  const statusKey = STATUS_META[membership.status] ? membership.status : 'active'

  const isLive = ['active', 'expiring_soon', 'grace'].includes(membership.status)
  const isUnlimited = planCfg?.interest_limit === null && isLive

  // CTA per state
  let ctaLabel = 'Manage Plan'
  let ctaPrimary = false
  if (membership.status === 'expiring_soon' || membership.status === 'grace') {
    ctaLabel = 'Renew Plan'; ctaPrimary = true
  } else if (membership.status === 'pending') {
    ctaLabel = 'Complete Payment'; ctaPrimary = true
  } else if (membership.status === 'payment_failed') {
    ctaLabel = 'Retry Payment'; ctaPrimary = true
  }

  return (
    <div className="border-b border-ink/10">
        <div className="max-w-2xl mx-auto px-4 py-3">
        <PlanShell
          eyebrow="Current Plan"
          name={planName}
          price={priceStr}
          per={perStr}
          statusKey={statusKey}
        >
          {/* Dates */}
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
            {membership.started_at && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Started</dt>
                <dd className="text-ink font-medium">{formatDate(membership.started_at)}</dd>
              </div>
            )}
            {membership.expires_at && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">{membership.status === 'grace' ? 'Expired on' : 'Renews / expires'}</dt>
                <dd className="text-ink font-medium">{formatDate(membership.expires_at)}</dd>
              </div>
            )}
            {membership.status === 'grace' && membership.grace_until && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Grace ends</dt>
                <dd className="text-amber-700 font-medium">{formatDate(membership.grace_until)}</dd>
              </div>
            )}
          </dl>

          {/* Interests remaining */}
          {allowance && isLive && allowance.limit !== null && (
            <div className="border-t border-gold/20 pt-3">
              <div className="flex items-center justify-between text-[13px] mb-1.5">
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
            </div>
          )}
          {isUnlimited && (
            <p className="text-[12px] text-green-700 border-t border-gold/20 pt-2">Unlimited interests</p>
          )}

          {/* State hints */}
          {membership.status === 'grace' && (
            <p className="text-[12px] text-orange-700 bg-orange-50 rounded-mj-sm px-3 py-2">
              Your membership has expired but you are still in the grace period. Renew now to keep access.
            </p>
          )}
          {membership.status === 'payment_failed' && (
            <p className="text-[12px] text-red-700 bg-red-50 rounded-mj-sm px-3 py-2">
              Your last payment failed. Your membership is not active yet.
            </p>
          )}
          {membership.status === 'pending' && (
            <p className="text-[12px] text-blue-700 bg-blue-50 rounded-mj-sm px-3 py-2">
              Your payment is being confirmed. Complete it to activate your membership.
            </p>
          )}

          <Link
            href="/membership"
            className={[
              'ml-auto justify-center px-4 py-2 text-xs',
              ctaPrimary ? 'btn-primary' : 'btn-ghost',
            ].join(' ')}
          >
            {ctaLabel}
          </Link>
        </PlanShell>
      </div>
    </div>
  )
}

function PlanShell({
  eyebrow, name, price, per, statusKey, children,
}: {
  eyebrow: string
  name: string
  price: string | null
  per?: string | null
  statusKey: string
  children: React.ReactNode
}) {
  const status = STATUS_META[statusKey] ?? STATUS_META.free
  return (
    <div className="relative rounded-mj border border-gold/40 bg-cream shadow-mj-xs overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-maroon-deep/20 via-gold to-maroon-deep/20" />
      <div className="p-3.5 sm:p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-terra font-semibold mb-1">{eyebrow}</p>
            <h3 className="font-serif text-base sm:text-lg text-maroon leading-tight truncate">{name}</h3>
            {price && (
              <p className="text-ink mt-0.5">
                <span className="font-serif text-lg text-maroon">{price}</span>
                {per && <span className="text-[12px] text-ink-soft ml-1">{per}</span>}
              </p>
            )}
          </div>
          <span className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full ${status.cls}`}>
            {status.label}
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}
