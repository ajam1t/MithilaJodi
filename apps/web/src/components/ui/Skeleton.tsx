import { cn } from '@/lib/utils/cn'

/** Shimmering placeholder block. Compose several to mirror real content. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />
}
