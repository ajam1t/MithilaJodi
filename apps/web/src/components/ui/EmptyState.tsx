import { type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/** Friendly, on-brand empty state with optional icon, guidance and CTA. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('text-center py-14 px-6', className)}>
      {icon && <div className="mx-auto mb-4 flex justify-center text-gold/70">{icon}</div>}
      <h3 className="font-serif text-[20px] text-maroon mb-2">{title}</h3>
      {description && (
        <p className="text-ink-soft max-w-md mx-auto text-[15px] leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
