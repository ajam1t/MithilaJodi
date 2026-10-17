'use client'

import { useState } from 'react'

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800) } catch { /* blocked */ } }}
      className="shrink-0 rounded-md border border-[#DDD3C2] bg-white px-2 py-1 text-[12px] font-medium text-ink hover:border-[#BFAF95]"
    >
      {done ? 'Copied ✓' : label}
    </button>
  )
}
