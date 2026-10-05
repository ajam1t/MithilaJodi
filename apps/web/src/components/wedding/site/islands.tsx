'use client'

/**
 * The few interactive pieces of the public invitation. Everything else is
 * server-rendered HTML, so the page reads fully before any of this loads.
 * All wording comes from lib/wedding/i18n — nothing here is hard-coded.
 */
import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LANG_LABEL, LANGS, num, translator, type Lang } from '@/lib/wedding/i18n'
import { ENVELOPE_REPLAY_EVENT } from './Envelope'

const DEVANAGARI = /[ऀ-ॿ]/
const face = (text: string) => (DEVANAGARI.test(text) ? 'wd-deva' : '')

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

// ─── Guest language + "open again" ──────────────────────────────────────────

/**
 * A discreet switcher. The language travels as ?lang= on the same link and the
 * page re-renders in place — scroll position and the opened envelope are kept.
 */
export function LangBar({ lang }: { lang: Lang }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const t = translator(lang)
  const choose = (l: Lang) => {
    if (l === lang) return
    const next = new URLSearchParams(params.toString())
    next.set('lang', l)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }
  return (
    <div className="wd-langbar" role="group" aria-label={t('language')}>
      {LANGS.map(l => (
        <button key={l} type="button" lang={l} aria-pressed={l === lang} onClick={() => choose(l)} className={l === 'en' ? '' : 'wd-deva'}>
          {LANG_LABEL[l]}
        </button>
      ))}
      <span className="wd-langbar-sep" aria-hidden="true" />
      <button type="button" onClick={() => window.dispatchEvent(new Event(ENVELOPE_REPLAY_EVENT))} aria-label={t('replay')} title={t('replay')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  )
}

// ─── Countdown ──────────────────────────────────────────────────────────────

export function Countdown({ at, lang, label }: { at: number; lang: Lang; label: string }) {
  const t = translator(lang)
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  if (now == null) return <p className="text-center wd-soft text-[15px]">{label}</p>
  const left = Math.max(0, at - now)
  if (left === 0) {
    const text = now - at < 24 * 3_600_000 ? t('today') : t('married')
    return <p className={`text-center wd-accent text-[30px] sm:text-[38px] ${face(text) || 'wd-display'}`}>{text}</p>
  }
  const d = Math.floor(left / 86_400_000)
  const h = Math.floor((left % 86_400_000) / 3_600_000)
  const m = Math.floor((left % 3_600_000) / 60_000)
  const s = Math.floor((left % 60_000) / 1000)
  const pad = (v: number) => num(lang, String(v).padStart(2, '0'))
  return (
    <div className="wd-count" role="timer" aria-label={t('countdownAria', { d: num(lang, d), h: num(lang, h), m: num(lang, m) })}>
      {([[d, t('days')], [h, t('hours')], [m, t('minutes')], [s, t('seconds')]] as const).map(([v, unit]) => (
        <div key={unit}><b>{pad(v)}</b><span className={`block text-[13px] mt-1.5 wd-accent ${face(unit)}`}>{unit}</span></div>
      ))}
    </div>
  )
}

// ─── Share ──────────────────────────────────────────────────────────────────

export function ShareBar({ url, couple, lang }: { url: string; couple: string; lang: Lang }) {
  const t = translator(lang)
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)
  useEffect(() => setCanShare(typeof navigator !== 'undefined' && 'share' in navigator), [])
  const text = t('shareText', { url, couple })
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
      <a className="wd-btn wd-btn-wa" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4Z" /></svg>
        <span className={face(t('whatsapp'))}>{t('whatsapp')}</span>
      </a>
      <button type="button" className="wd-btn wd-btn-ghost" onClick={async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* copy blocked */ }
      }}><span className={face(t('copyLink'))}>{copied ? t('copied') : t('copyLink')}</span></button>
      {canShare && (
        <button type="button" className="wd-btn wd-btn-ghost" onClick={() => navigator.share({ title: t('shareTitleNative', { couple }), text, url }).catch(() => undefined)}>
          <span className={face(t('shareMore'))}>{t('shareMore')}</span>
        </button>
      )}
    </div>
  )
}

// ─── RSVP on WhatsApp ───────────────────────────────────────────────────────

/**
 * Guests answer straight to the couple's WhatsApp. Mithila Jodi never sees or
 * stores the reply: each button only opens WhatsApp with a ready message,
 * written in the invitation's language.
 */
export function RsvpWhatsApp({ phone, couple, contactName, lang }: { phone: string; couple: string; contactName: string; lang: Lang }) {
  const t = translator(lang)
  const [name, setName] = useState('')
  const [count, setCount] = useState(1)
  const choices = [
    { v: 'yes', icon: '❤️', label: t('rsvpYes'), msg: t('msgYes') },
    { v: 'maybe', icon: '🙂', label: t('rsvpMaybe'), msg: t('msgMaybe') },
    { v: 'no', icon: '🙏', label: t('rsvpNo'), msg: t('msgNo') },
  ]
  const link = (c: (typeof choices)[number]) => {
    const lines = [
      t('msgSubject', { couple }),
      '',
      c.msg,
      ...(c.v !== 'no' && count > 1 ? [t('msgGuests', { n: num(lang, count) })] : []),
      ...(name.trim() ? ['', `— ${name.trim()}`] : []),
    ]
    return `https://wa.me/91${phone}?text=${encodeURIComponent(lines.join('\n'))}`
  }
  return (
    <div className="wd-card p-5 sm:p-7 space-y-5">
      <p className={`text-[20px] wd-accent text-center ${face(t('rsvpQuestion')) || 'wd-display'}`}>{t('rsvpQuestion')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={`block text-[14px] font-medium mb-1.5 ${face(t('yourName'))}`} htmlFor="rsvp-name">{t('yourName')}</label>
          <input id="rsvp-name" className="wd-input" value={name} maxLength={60} onChange={e => setName(e.target.value)} autoComplete="name" />
        </div>
        <div>
          <span className={`block text-[14px] font-medium mb-1.5 ${face(t('howMany'))}`} id="rsvp-count-l">{t('howMany')}</span>
          <div className="flex items-center gap-3" role="group" aria-labelledby="rsvp-count-l">
            <button type="button" className="wd-btn wd-btn-ghost !min-h-[44px] !w-11 !p-0" onClick={() => setCount(c => Math.max(1, c - 1))} aria-label={t('oneFewer')}>−</button>
            <output className="wd-display text-[26px] w-10 text-center" aria-live="polite">{num(lang, count)}</output>
            <button type="button" className="wd-btn wd-btn-ghost !min-h-[44px] !w-11 !p-0" onClick={() => setCount(c => Math.min(20, c + 1))} aria-label={t('oneMore')}>+</button>
          </div>
        </div>
      </div>
      <div className="grid gap-2.5">
        {choices.map(c => (
          <a key={c.v} className="wd-choice" href={link(c)} target="_blank" rel="noopener noreferrer">
            <span className="text-[22px]" aria-hidden="true">{c.icon}</span>
            <span className={`flex-1 text-[17px] leading-tight ${face(c.label)}`}>{c.label.replace(/\s*❤️$/, '')}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1F7A47" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z" /></svg>
          </a>
        ))}
      </div>
      <p className={`text-[12px] wd-soft text-center ${face(t('replyTo'))}`}>{t('replyTo', { name: contactName || t('theFamily') })}</p>
    </div>
  )
}
