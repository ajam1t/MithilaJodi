'use client'

/**
 * The few interactive pieces of the public invitation. Everything else is
 * server-rendered HTML, so the page reads fully before any of this loads.
 */
import { useEffect, useState } from 'react'

// ─── Scroll reveal ──────────────────────────────────────────────────────────

export function SiteEffects() {
  useEffect(() => {
    const root = document.querySelector('.wd')
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!root || reduced || !('IntersectionObserver' in window)) return
    root.classList.add('wd-js')
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).dataset.shown = ''; io.unobserve(e.target) }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    root.querySelectorAll('[data-reveal]').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
  return null
}

// ─── Countdown ──────────────────────────────────────────────────────────────

export function Countdown({ at, label }: { at: number; label: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (now == null) return <p className="text-center wd-soft text-[15px]">{label}</p>
  const left = Math.max(0, at - now)
  if (left === 0) {
    const sameDay = now - at < 24 * 3_600_000
    return <p className="text-center wd-deva wd-accent text-[30px] sm:text-[38px]">{sameDay ? 'आज हमर शुभ विवाह ❤️' : 'शुभ विवाह ❤️'}</p>
  }
  const d = Math.floor(left / 86_400_000)
  const h = Math.floor((left % 86_400_000) / 3_600_000)
  const m = Math.floor((left % 3_600_000) / 60_000)
  const s = Math.floor((left % 60_000) / 1000)
  return (
    <div className="wd-count" role="timer" aria-label={`${d} days, ${h} hours and ${m} minutes to go`}>
      {([[d, 'दिन', 'Days'], [h, 'घंटा', 'Hours'], [m, 'मिनट', 'Minutes'], [s, 'सेकेंड', 'Seconds']] as const).map(([v, hi, en]) => (
        <div key={en}><b>{String(v).padStart(2, '0')}</b><span className="block wd-deva text-[13px] mt-1.5 wd-accent">{hi}</span><span className="block text-[10px] uppercase tracking-[0.14em] wd-soft">{en}</span></div>
      ))}
    </div>
  )
}

// ─── Share ──────────────────────────────────────────────────────────────────

export function ShareBar({ url, couple }: { url: string; couple: string }) {
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)
  useEffect(() => setCanShare(typeof navigator !== 'undefined' && 'share' in navigator), [])
  const text = `💍 हमर विवाहक शुभ अवसर पर अहाँ सपरिवार सादर आमंत्रित छी ❤️\n\nनिमंत्रण देखबाक लेल:\n${url}`
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
      <a className="wd-btn wd-btn-wa" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4Z" /></svg>
        WhatsApp पर निमंत्रण भेजू
      </a>
      <button type="button" className="wd-btn wd-btn-ghost" onClick={async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* copy blocked */ }
      }}>{copied ? 'Link copied ✓' : 'Copy link'}</button>
      {canShare && (
        <button type="button" className="wd-btn wd-btn-ghost" onClick={() => navigator.share({ title: `${couple} — Wedding Invitation`, text, url }).catch(() => undefined)}>Share…</button>
      )}
    </div>
  )
}

// ─── RSVP on WhatsApp ───────────────────────────────────────────────────────

const CHOICES = [
  { v: 'yes', icon: '❤️', hi: 'हँ, अवश्य', en: 'Yes, of course', msg: 'हम अवश्य आएब ❤️' },
  { v: 'maybe', icon: '🙂', hi: 'प्रयास करब', en: 'I will try', msg: 'हम आबैक प्रयास करब 🙂' },
  { v: 'no', icon: '🙏', hi: 'नहि आबि सकब', en: 'Cannot come', msg: 'क्षमा करब, हम नहि आबि सकब 🙏 — शुभकामना ❤️' },
] as const

/**
 * Guests answer straight to the couple's WhatsApp. Mithila Jodi never sees or
 * stores the reply: the button only opens WhatsApp with a ready message.
 */
export function RsvpWhatsApp({ phone, couple, contactName }: { phone: string; couple: string; contactName: string }) {
  const [name, setName] = useState('')
  const [count, setCount] = useState(1)
  const link = (c: (typeof CHOICES)[number]) => {
    const lines = [
      `${couple} — विवाह निमंत्रण`,
      '',
      c.msg,
      ...(c.v !== 'no' && count > 1 ? [`हम सभ ${count} गोटे आएब।`] : []),
      ...(name.trim() ? ['', `— ${name.trim()}`] : []),
    ]
    return `https://wa.me/91${phone}?text=${encodeURIComponent(lines.join('\n'))}`
  }
  return (
    <div className="wd-card p-5 sm:p-7 space-y-5">
      <p className="wd-deva text-[20px] wd-accent text-center">अहाँ विवाहमे आबि रहल छी?</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-[14px] font-medium mb-1.5" htmlFor="rsvp-name">Your name <span className="wd-soft font-normal">(optional)</span></label>
          <input id="rsvp-name" className="wd-input" value={name} maxLength={60} onChange={e => setName(e.target.value)} autoComplete="name" />
        </div>
        <div>
          <span className="block text-[14px] font-medium mb-1.5" id="rsvp-count-l">How many of you?</span>
          <div className="flex items-center gap-3" role="group" aria-labelledby="rsvp-count-l">
            <button type="button" className="wd-btn wd-btn-ghost !min-h-[44px] !w-11 !p-0" onClick={() => setCount(c => Math.max(1, c - 1))} aria-label="One fewer">−</button>
            <output className="wd-display text-[26px] w-10 text-center" aria-live="polite">{count}</output>
            <button type="button" className="wd-btn wd-btn-ghost !min-h-[44px] !w-11 !p-0" onClick={() => setCount(c => Math.min(20, c + 1))} aria-label="One more">+</button>
          </div>
        </div>
      </div>
      <div className="grid gap-2.5">
        {CHOICES.map(c => (
          <a key={c.v} className="wd-choice" href={link(c)} target="_blank" rel="noopener noreferrer">
            <span className="text-[22px]" aria-hidden="true">{c.icon}</span>
            <span className="flex-1"><span className="wd-deva block text-[17px] leading-tight">{c.hi}</span><span className="block text-[12px] wd-soft">{c.en}</span></span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1F7A47" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z" /></svg>
          </a>
        ))}
      </div>
      <p className="text-[12px] wd-soft text-center">Your answer goes on WhatsApp to {contactName || 'the family'}.</p>
    </div>
  )
}
