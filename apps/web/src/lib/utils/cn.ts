import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names intelligently.
 * clsx handles conditional/array/object class values; twMerge resolves
 * conflicting Tailwind utilities so the last one wins (e.g. `px-2 px-4` → `px-4`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
