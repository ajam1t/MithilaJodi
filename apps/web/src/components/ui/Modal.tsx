'use client'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'

/**
 * Accessible modal dialog: Escape to close, backdrop click to close,
 * body scroll lock, focus moved into the panel. Rendered via portal.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  className?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[150] grid place-items-center p-4 bg-[rgba(42,18,10,0.55)] backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn('card relative w-full max-w-lg p-7 overflow-hidden outline-none', className)}
      >
        <div className="gold-strip absolute top-0 inset-x-0" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3.5 text-ink-soft hover:text-maroon text-2xl leading-none"
        >
          ×
        </button>
        {title && <h3 className="font-serif text-[22px] text-maroon mb-3 pr-6">{title}</h3>}
        {children}
      </div>
    </div>,
    document.body
  )
}
