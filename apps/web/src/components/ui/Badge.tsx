import { type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

type BadgeVariant =
  | 'verified' | 'new' | 'gold' | 'premium'
  | 'success' | 'warning' | 'error' | 'info' | 'neutral'

const variantClass: Record<BadgeVariant, string> = {
  verified: 'badge-verified',
  new: 'badge-new',
  gold: 'badge-gold',
  premium: 'badge-premium',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
  neutral: 'bg-paper-2 text-ink-soft',
}

export function Badge({
  variant = 'neutral',
  className,
  children,
}: {
  variant?: BadgeVariant
  className?: string
  children: ReactNode
}) {
  return <span className={cn('badge', variantClass[variant], className)}>{children}</span>
}

/** Convenience: green "Verified" badge with a check glyph — the core trust signal. */
export function VerifiedBadge({ label = 'Verified', className }: { label?: string; className?: string }) {
  return (
    <Badge variant="verified" className={className}>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2.5 6.5l2.2 2.2L9.5 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </Badge>
  )
}
