'use client'

import Link from 'next/link'
import { useState } from 'react'

/**
 * The first decision on /marriage-invitation: which invitation to make.
 * Basic above Premium; Premium holds its three invitations (Mithila Premium,
 * MJ Scratch & Reveal and Blush Lace Elegance) side by side, equal in weight. The menu links to #premium.
 * browser back returns here. Features listed are only ones that exist.
 */

const BASIC = [
  'Five Mithila designs',
  'Bride & groom details',
  'Live preview',
  'High-resolution download',
  'Share on WhatsApp',
  'No login needed',
]

const PREMIUM = [
  'Wedding webpage',
  'Envelope opening',
  'Live countdown',
  'Tilak to Vidai',
  'हमर मिथिला',
  'Venue & directions',
  'WhatsApp RSVP',
  'Four languages',
]

const SCRATCH = [
  'Scratch to reveal the date',
  'Gold MJ seal opening',
  'Ivory & gold design',
  'Live countdown',
  'Tilak to Vidai',
  'Venue & directions',
  'WhatsApp RSVP',
  'Four languages',
]

const LACE = [
  'Lace veil opening',
  'Blush & ivory lace design',
  'Optional couple photos',
  'Live countdown',
  'Ceremony timeline',
  'Venue & directions',
  'WhatsApp RSVP',
  'Four languages',
]

/** A folded invitation card with a Kohbar lotus. */
function CardEmblem() {
  return (
    <svg viewBox="0 0 64 64" className="h-11 w-11 sm:h-14 sm:w-14" aria-hidden="true">
      <rect x="14" y="8" width="38" height="50" rx="3" fill="#F7EBD3" stroke="#C89B45" strokeWidth="1.4" transform="rotate(8 33 33)" />
      <rect x="10" y="6" width="38" height="50" rx="3" fill="#FFFCF5" stroke="#B98A2E" strokeWidth="1.6" />
      <rect x="14" y="10" width="30" height="42" rx="2" fill="none" stroke="#C89B45" strokeOpacity="0.6" strokeDasharray="2 2" />
      <g transform="translate(29 28)" fill="none" stroke="#7A1220" strokeWidth="1.4">
        <path d="M0 6C-3 2-3-4 0-8 3-4 3 2 0 6Z" fill="#7A1220" fillOpacity="0.15" />
        <path d="M0 6C-6 4-9 0-9-5-4-4-1-1 0 6ZM0 6C6 4 9 0 9-5 4-4 1-1 0 6Z" />
      </g>
      <path d="M18 44h22M21 48h16" stroke="#B98A2E" strokeWidth="1.2" />
    </svg>
  )
}

/** The envelope and wax seal the premium invitation opens with. */
function EnvelopeEmblem() {
  return (
    <svg viewBox="0 0 64 64" className="h-11 w-11 sm:h-14 sm:w-14" aria-hidden="true">
      <rect x="6" y="16" width="52" height="38" rx="3" fill="#FFF8EA" stroke="#E4C572" strokeWidth="1.4" />
      <path d="M6 18 32 38 58 18" fill="#F3E3C4" stroke="#E4C572" strokeWidth="1.4" />
      <path d="M6 54 26 36M58 54 38 36" stroke="#E4C572" strokeOpacity="0.7" strokeWidth="1" />
      <circle cx="32" cy="38" r="8" fill="#8B1235" stroke="#E4C572" strokeWidth="1.2" />
      <path d="M32 41c-2-2-2-4 0-6 2 2 2 4 0 6Z" fill="#E4C572" />
    </svg>
  )
}

/** The gold MJ seal over a strip of scratched gold foil. */
function SealEmblem() {
  return (
    <svg viewBox="0 0 64 64" className="h-11 w-11 sm:h-14 sm:w-14" aria-hidden="true">
      <defs>
        <linearGradient id="mj-foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B8892F" /><stop offset="0.45" stopColor="#F2DC9C" /><stop offset="1" stopColor="#A87A28" /></linearGradient>
      </defs>
      <rect x="8" y="40" width="48" height="16" rx="3" fill="url(#mj-foil)" />
      <path d="M14 50c6-5 10 3 16-2s9 2 14-1" stroke="#FFFCF5" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="24" r="16" fill="#D9B565" stroke="#8E6420" strokeWidth="1.2" />
      <circle cx="32" cy="24" r="11" fill="#FFFCF5" stroke="#B4862F" strokeWidth="1" />
      <text x="32" y="28.5" textAnchor="middle" fontSize="11" fontFamily="Georgia, serif" fill="#6E1024">MJ</text>
    </svg>
  )
}

/** A lace oval frame with a small rosette — the Blush Lace cover. */
function LaceEmblem() {
  const scallops = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2
    return `<circle cx="${(32 + Math.cos(a) * 21).toFixed(1)}" cy="${(32 + Math.sin(a) * 26).toFixed(1)}" r="4.2"/>`
  }).join('')
  return (
    <svg viewBox="0 0 64 64" className="h-11 w-11 sm:h-14 sm:w-14" aria-hidden="true">
      <g fill="#FFFFFF" stroke="#E8C5CA" strokeWidth="1" dangerouslySetInnerHTML={{ __html: scallops }} />
      <ellipse cx="32" cy="32" rx="19" ry="24" fill="#FFFFFF" stroke="#C8A96B" strokeWidth="1.2" />
      <path d="M26 30c0-4 6-5 6 0 0-5 6-4 6 0 0 4-6 8-6 8s-6-4-6-8Z" fill="#E8C5CA" stroke="#86525E" strokeWidth="1" />
    </svg>
  )
}

function Features({ items, rich, className = '' }: { items: string[]; rich?: boolean; className?: string }) {
  return (
    <ul className={`mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:mt-5 sm:gap-y-2 ${className}`}>
      {items.map(f => (
        <li key={f} className={`flex gap-1.5 text-[13.5px] leading-snug sm:gap-2 sm:text-[14.5px] ${rich ? 'text-cream/90' : 'text-ink'}`}>
          <span className={rich ? 'text-gold-lt' : 'text-marigold'} aria-hidden="true">◆</span>
          <span className={/[ऀ-ॿ]/.test(f) ? 'font-deva' : ''}>{f}</span>
        </li>
      ))}
    </ul>
  )
}

export function InvitationChooser() {
  const [chosen, setChosen] = useState<'basic' | 'premium' | 'scratch' | 'lace' | null>(null)
  const ring = (k: 'basic' | 'premium' | 'scratch' | 'lace') =>
    chosen === k ? 'ring-4 ring-gold-lt/70 shadow-[0_0_0_1px_rgba(228,197,114,0.9),0_24px_50px_-20px_rgba(185,138,46,0.75)]' : ''

  return (
    <div className="grid items-stretch gap-4 lg:gap-5">
      {/* ── Basic ── */}
      <Link
        href="/marriage-invitation/basic"
        onClick={() => setChosen('basic')}
        aria-describedby="choose-basic-sub"
        className={`group relative flex flex-col rounded-[22px] border border-gold/45 bg-cream p-4 shadow-mj-sm transition duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-mj focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/50 motion-reduce:transform-none sm:p-7 ${ring('basic')}`}
      >
        <div className="flex items-start justify-between gap-3">
          <CardEmblem />
          <span className="rounded-full border border-gold/50 bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-maroon">Basic invitation</span>
        </div>
        <h3 className="mt-3 font-serif text-[24px] leading-tight text-maroon sm:text-[27px]">Basic Invitation</h3>
        <p id="choose-basic-sub" className="mt-1 text-[15px] text-ink-soft">Beautiful digital wedding invitation cards</p>
        <Features items={BASIC} className="lg:max-w-3xl lg:grid-cols-3" />
        <div className="mt-auto pt-4 sm:pt-6">
          <p className="mb-2.5 text-[12.5px] text-ink-soft">Free · Ready in about a minute</p>
          <span className="btn-primary inline-flex w-full justify-center px-6 py-3 text-[15px] transition-transform group-hover:translate-x-0.5 sm:w-auto">
            Create Basic Invitation →
          </span>
        </div>
      </Link>

      <p className="text-center text-[12px] font-semibold uppercase tracking-[0.3em] text-terra" aria-hidden="true">or</p>

      {/* ── Premium: two invitations to choose between ── */}
      <section id="premium" aria-labelledby="choose-premium-heading" className="scroll-mt-24 rounded-[26px] border border-gold/45 bg-cream/70 p-3 shadow-mj-xs sm:p-4">
        <div className="mb-3 px-1 text-center sm:mb-4">
          <h3 id="choose-premium-heading" className="font-serif text-[21px] leading-tight text-maroon sm:text-[24px]">✦ Premium Invitation</h3>
          <p className="mt-0.5 text-[13.5px] text-ink-soft sm:text-[14.5px]">A complete wedding webpage — choose one of three designs</p>
        </div>
        <div className="grid items-stretch gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* ── Mithila Premium ── */}
      <Link
        href="/marriage-invitation/premium#builder"
        onClick={() => setChosen('premium')}
        aria-describedby="choose-premium-sub"
        className={`group relative flex flex-col overflow-hidden rounded-[22px] border border-gold/60 p-4 text-cream shadow-mj transition duration-300 hover:-translate-y-1 hover:border-gold-lt hover:shadow-[0_28px_56px_-24px_rgba(90,14,25,0.85)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 motion-reduce:transform-none sm:p-7 ${ring('premium')}`}
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(232,150,60,0.22), transparent 60%), linear-gradient(160deg, #8E1A2C 0%, #6E1024 55%, #5A0E19 100%)',
        }}
      >
        <span
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          aria-hidden="true"
          style={{
            background:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='88' height='88' viewBox='0 0 88 88'%3E%3Cg fill='none' stroke='%23E7C877' stroke-width='1'%3E%3Cpath d='M44 30c4 5 4 11 0 16-4-5-4-11 0-16Z'/%3E%3Cpath d='M44 46c-6-1-10-6-10-11 5 1 9 5 10 11Zm0 0c6-1 10-6 10-11-5 1-9 5-10 11Z'/%3E%3C/g%3E%3C/svg%3E\") center / 88px 88px",
          }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <EnvelopeEmblem />
          <span className="rounded-full bg-gold-gradient px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-maroon-deep shadow-mj-xs">✦ Mithila Premium</span>
        </div>
        <h3 className="relative mt-3 font-serif text-[24px] leading-tight sm:text-[27px]">Mithila Premium Invitation</h3>
        <p id="choose-premium-sub" className="relative mt-1 text-[15px] text-gold-lt">Your complete digital wedding experience</p>
        <div className="relative"><Features items={PREMIUM} rich /></div>
        <div className="relative mt-auto pt-4 sm:pt-6">
          <p className="mb-2.5 text-[12.5px] text-cream/75">Free · No login · Link stays open for 180 days</p>
          <span className="inline-flex w-full justify-center rounded-mj-sm bg-gold-gradient px-6 py-3 text-[15px] font-semibold text-maroon-deep shadow-mj-sm transition-transform group-hover:translate-x-0.5 sm:w-auto">
            Create Mithila Premium →
          </span>
        </div>
      </Link>

      {/* ── MJ Scratch & Reveal ── */}
      <Link
        href="/marriage-invitation/scratch-reveal#builder"
        onClick={() => setChosen('scratch')}
        aria-describedby="choose-scratch-sub"
        className={`group relative flex flex-col overflow-hidden rounded-[22px] border border-gold/70 p-4 text-maroon shadow-mj transition duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-[0_28px_56px_-24px_rgba(140,100,32,0.7)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 motion-reduce:transform-none sm:p-7 ${ring('scratch')}`}
        style={{ background: 'radial-gradient(ellipse 90% 70% at 20% 0%, #FFFDF7 0%, #F7EEDC 55%, #EBDAB8 100%)' }}
      >
        <span className="pointer-events-none absolute inset-2 rounded-[16px] border border-gold/40" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3">
          <SealEmblem />
          <span className="rounded-full bg-gold-gradient px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-maroon-deep shadow-mj-xs">✦ New · Premium</span>
        </div>
        <h3 className="relative mt-3 font-serif text-[24px] leading-tight sm:text-[27px]">MJ Scratch &amp; Reveal Invitation</h3>
        <p id="choose-scratch-sub" className="relative mt-1 text-[15px] text-ink-soft">Guests scratch gold foil to reveal your date</p>
        <div className="relative"><Features items={SCRATCH} /></div>
        <div className="relative mt-auto pt-4 sm:pt-6">
          <p className="mb-2.5 text-[12.5px] text-ink-soft">Free · No login · Link stays open for 180 days</p>
          <span className="inline-flex w-full justify-center rounded-mj-sm bg-maroon px-6 py-3 text-[15px] font-semibold text-cream shadow-mj-sm transition-transform group-hover:translate-x-0.5 sm:w-auto">
            Create Scratch &amp; Reveal →
          </span>
        </div>
      </Link>

      {/* ── Blush Lace Elegance ── */}
      <Link
        href="/marriage-invitation/blush-lace#builder"
        onClick={() => setChosen('lace')}
        aria-describedby="choose-lace-sub"
        className={`group relative flex flex-col overflow-hidden rounded-[22px] border border-[#E8C5CA] p-4 text-[#46363A] shadow-mj transition duration-300 hover:-translate-y-1 hover:border-[#C8A96B] hover:shadow-[0_28px_56px_-24px_rgba(134,82,94,0.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E8C5CA] motion-reduce:transform-none sm:p-7 ${ring('lace')}`}
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,.75) 0 1.4px, rgba(255,255,255,0) 2px) 0 0 / 24px 24px, radial-gradient(ellipse 90% 70% at 20% 0%, #FFF8F6 0%, #F7E3E3 60%, #EFD3D6 100%)' }}
      >
        <span className="pointer-events-none absolute inset-2 rounded-[16px] border border-dashed border-[#C8A96B]/50" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3">
          <LaceEmblem />
          <span className="rounded-full bg-[#86525E] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#FFF6F4] shadow-mj-xs">✦ New · Premium</span>
        </div>
        <h3 className="relative mt-3 font-serif text-[24px] leading-tight text-[#86525E] sm:text-[27px]">Blush Lace Elegance</h3>
        <p id="choose-lace-sub" className="relative mt-1 text-[15px] text-[#79676A]">Romantic blush, ivory and fine lace</p>
        <div className="relative"><Features items={LACE} /></div>
        <div className="relative mt-auto pt-4 sm:pt-6">
          <p className="mb-2.5 text-[12.5px] text-[#79676A]">Free · No login · Link stays open for 180 days</p>
          <span className="inline-flex w-full justify-center rounded-mj-sm bg-[#86525E] px-6 py-3 text-[15px] font-semibold text-[#FFF6F4] shadow-mj-sm transition-transform group-hover:translate-x-0.5 sm:w-auto">
            Create Blush Lace →
          </span>
        </div>
      </Link>
        </div>
      </section>
    </div>
  )
}
