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
      {/* Centred: the star sits between two rules on its own line. Left-aligned:
          it leads the title on the same line instead of standing alone. */}
      {centered && (
        <div className="flex items-center justify-center gap-3.5 mb-2.5">
          <span className="h-px flex-1 max-w-[80px]" style={{ background: 'var(--line)' }} />
          <span className="text-gold text-lg leading-none" aria-hidden="true">✦</span>
          <span className="h-px flex-1 max-w-[80px]" style={{ background: 'var(--line)' }} />
        </div>
      )}
      <h2 className="section-heading">
        {!centered && <span className="mr-2.5 inline-block align-middle text-gold text-[0.5em] leading-none" aria-hidden="true">✦</span>}
        {title}
      </h2>
      {subtitle && (
        <p className={cn('text-ink-soft mt-2.5 text-[16px] leading-relaxed', centered && 'max-w-xl mx-auto')}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
