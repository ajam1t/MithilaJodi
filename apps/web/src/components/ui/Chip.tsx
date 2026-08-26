'use client'
import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

/** Selectable pill — filter chips, tag toggles, etc. */
export function Chip({ active = false, className, type, ...props }: ChipProps) {
  return (
    <button
      type={type ?? 'button'}
      aria-pressed={active}
      className={cn('chip', active && 'chip-on', className)}
      {...props}
    />
  )
}
