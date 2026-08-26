import { type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/** Ornamental section header: eyebrow + lotus rule + serif title + subtitle. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  align?: 'center' | 'left'
  className?: string
}) {
  const centered = align === 'center'
  return (
    <div className={cn(centered ? 'text-center' : 'text-left', 'mb-8', className)}>
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <div className={cn('flex items-center gap-3.5 mb-2.5', centered && 'justify-center')}>
        {centered && <span className="h-px flex-1 max-w-[80px]" style={{ background: 'var(--line)' }} />}
        <span className="text-gold text-lg leading-none" aria-hidden="true">✦</span>
        {centered && <span className="h-px flex-1 max-w-[80px]" style={{ background: 'var(--line)' }} />}
      </div>
      <h2 className="section-heading">{title}</h2>
      {subtitle && (
        <p className={cn('text-ink-soft mt-2.5 text-[16px] leading-relaxed', centered && 'max-w-xl mx-auto')}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
