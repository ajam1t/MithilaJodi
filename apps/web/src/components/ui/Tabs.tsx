'use client'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface TabItem {
  value: string
  label: ReactNode
}

/** Controlled pill tab bar. */
export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn('inline-flex rounded-pill bg-paper-2 p-1 gap-1', className)}>
      {items.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'rounded-pill px-4 py-2 text-[14px] font-semibold transition-colors duration-200',
              active ? 'bg-maroon text-cream shadow-mj-xs' : 'text-ink-soft hover:text-maroon'
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
