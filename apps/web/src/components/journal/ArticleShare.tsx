'use client'

import { useEffect, useState } from 'react'
import { WhatsAppIcon } from '@/components/whatsapp/JoinCommunity'

/**
 * Compact share row: WhatsApp (how most Mithila families pass articles on),
 * Copy link, and the device's own share sheet where the browser has one.
 * Nothing is tracked.
 */
export function ArticleShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const [canNative, setCanNative] = useState(false)

  // Decided after mount so server and client render the same markup.
  useEffect(() => { setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function') }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const t = document.createElement('textarea')
      t.value = url
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  async function nativeShare() {
    try { await navigator.share({ title, url }) } catch { /* dismissed */ }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`
  const btn = 'inline-flex h-9 items-center gap-1.5 rounded-pill border border-paper-3 bg-cream px-3.5 text-[13px] font-medium text-maroon transition-colors hover:border-gold'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[13px] text-ink-soft">Share this article</span>
      <a href={wa} target="_blank" rel="noopener noreferrer" className={btn}>
        <span className="text-[#1F8F4E]"><WhatsAppIcon size={15} /></span> WhatsApp
      </a>
      <button type="button" onClick={copy} className={btn} aria-live="polite">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
        </svg>
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      {canNative && (
        <button type="button" onClick={nativeShare} className={btn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
          </svg>
          More
        </button>
      )}
    </div>
  )
}
