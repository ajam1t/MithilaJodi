'use client'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

type ToastType = 'default' | 'success' | 'error'
interface ToastItem { id: number; message: string; type: ToastType }
interface ToastOptions { type?: ToastType; duration?: number }
interface ToastContextValue { toast: (message: string, opts?: ToastOptions) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, opts?: ToastOptions) => {
    const id = Date.now() + Math.random()
    const type = opts?.type ?? 'default'
    setItems((prev) => [...prev, { id, message, type }])
    const duration = opts?.duration ?? 3500
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto text-cream text-[14px] px-5 py-3 rounded-mj-sm shadow-mj border-l-4 max-w-xs animate-slide-up',
              t.type === 'success' && 'bg-green border-gold-lt',
              t.type === 'error' && 'bg-maroon border-terra',
              t.type === 'default' && 'bg-maroon border-gold'
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx.toast
}
