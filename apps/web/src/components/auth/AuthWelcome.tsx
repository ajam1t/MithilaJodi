'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MithilaCouple } from '@/components/astrology/hub/MithilaCouple'

/**
 * The entrance to Mithila Jodi (/register before any step is chosen).
 *
 * Two equal ways in — Create Account and Welcome Back — as whole-card links
 * with the same size, border, type and CTA. The registration stepper only
 * appears once Create Account is chosen. No auth logic lives here.
 */

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden="true">
      <circle cx="8" cy="8" r="7.2" fill="#B98A2E" />
      <path d="M4.6 8.3 7 10.6l4.4-4.8" fill="none" stroke="#FFFAF0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function JoinIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="#7A1220" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="14" cy="11" r="5" />
      <path d="M5 26c.8-5 4.4-8 9-8 2 0 3.8.5 5.2 1.5" />
      <circle cx="24" cy="23" r="5.4" fill="#7A1220" stroke="none" />
      <path d="M24 20.6v4.8M21.6 23h4.8" stroke="#FFFAF0" strokeWidth="1.7" />
    </svg>
  )
}

function LoginIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="#7A1220" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-6" />
      <path d="M6 16h13M14 11l5 5-5 5" />
    </svg>
  )
}

function Arrow() {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-maroon-gradient text-cream shadow-mj-sm transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true">
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10h11M11 5.5 15.5 10 11 14.5" />
      </svg>
    </span>
  )
}

type CardProps = {
  href: string
  title: string
  eyebrow: string
  body: string
  benefits: string[]
  icon: React.ReactNode
  emphasis?: boolean
}

/** One way in. Both cards share this, so they cannot drift apart. */
function EntryCard({ href, title, eyebrow, body, benefits, icon, emphasis }: CardProps) {
  return (
    <Link
      href={href}
      className={`group flex flex-col overflow-hidden rounded-[18px] border bg-cream transition duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold motion-reduce:transform-none ${
        emphasis ? 'border-gold/70 shadow-mj-sm hover:shadow-mj' : 'border-gold/45 shadow-mj-xs hover:shadow-mj-sm'
      }`}
    >
      <div className="flex flex-1 items-center gap-3 px-3.5 pb-2.5 pt-3.5 sm:gap-4 sm:px-5 sm:pb-3 sm:pt-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold/40 bg-paper-2/70 sm:h-14 sm:w-14" aria-hidden="true">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-terra">{eyebrow}</span>
          <span className="mt-0.5 block font-serif text-[21px] leading-tight text-maroon sm:text-[24px]">{title}</span>
          <span className="mt-1 block text-[12.5px] leading-snug text-ink-soft sm:text-[13px]">{body}</span>
        </span>
        <Arrow />
      </div>
      <ul className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 border-t border-gold/25 bg-paper-2/45 px-2 py-1.5 sm:gap-x-3.5 sm:py-2">
        {benefits.map(b => (
          <li key={b} className="flex items-center gap-1 whitespace-nowrap text-[10.5px] text-ink sm:gap-1.5 sm:text-[11.5px]">
            <Check />{b}
          </li>
        ))}
      </ul>
    </Link>
  )
}

/** A Maithil couple by the river at sunset, lotus in the foreground. Decorative. */
function WelcomeScene() {
  return (
    <div className="pointer-events-none relative mx-auto h-[150px] w-full max-w-[460px] overflow-hidden sm:h-[210px]" aria-hidden="true">
      <svg viewBox="0 0 460 210" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="wsSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FCF5E7" stopOpacity="0" />
            <stop offset="0.45" stopColor="#F8E2BC" />
            <stop offset="1" stopColor="#F2C88E" />
          </linearGradient>
          <radialGradient id="wsSun" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#FFE7B0" />
            <stop offset="0.5" stopColor="#F6C27A" stopOpacity="0.85" />
            <stop offset="1" stopColor="#F6C27A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="wsRiver" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F0D2A0" />
            <stop offset="1" stopColor="#E7BE86" />
          </linearGradient>
        </defs>
        <rect width="460" height="150" fill="url(#wsSky)" />
        <circle cx="300" cy="128" r="58" fill="url(#wsSun)" />
        <circle cx="300" cy="128" r="17" fill="#FBDDA0" />
        {/* distant Mithila temples and trees along the far bank */}
        <g fill="#C9966A" fillOpacity="0.55">
          <path d="M40 132h28v-14l6-9 6 9v14h22v-8l4-6 4 6v8h18v18H40Z" />
          <path d="M150 134h14v-18c0-6 4-10 8-14 4 4 8 8 8 14v18h14v16h-44Z" />
          <path d="M360 136h20v-10l5-7 5 7v10h24v14h-54Z" />
          <ellipse cx="128" cy="134" rx="14" ry="9" />
          <ellipse cx="226" cy="136" rx="18" ry="8" />
          <ellipse cx="430" cy="134" rx="16" ry="10" />
        </g>
        <rect y="148" width="460" height="62" fill="url(#wsRiver)" />
        {/* the sun on the water */}
        {[156, 164, 172, 181, 190].map((y, i) => (
          <path key={y} d={`M${300 - 30 + i * 3} ${y}h${60 - i * 6}`} stroke="#FCE3AE" strokeWidth="1.6" strokeLinecap="round" opacity={0.9 - i * 0.15} />
        ))}
        {/* ghat steps the couple stands on */}
        <path d="M150 210l14-16h132l14 16Z" fill="#E1B47C" />
        <path d="M164 194l8-8h116l8 8Z" fill="#D9A86F" />
      </svg>

      <MithilaCouple className="absolute bottom-[12px] left-1/2 h-[128px] w-auto -translate-x-1/2 sm:h-[178px]" />

      {/* lotus in the foreground, both sides */}
      <svg viewBox="0 0 460 210" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        {[[30, 196, 1], [92, 204, 0.8], [372, 202, 0.85], [430, 194, 1.05]].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx="0" cy="6" rx="30" ry="7" fill="#7E8F4A" fillOpacity="0.75" />
            <path d="M0 0C-7-9-7-22 0-32 7-22 7-9 0 0Z" fill="#C2405E" />
            <path d="M0 0C-13-4-20-14-21-25-11-22-4-13 0 0ZM0 0C13-4 20-14 21-25 11-22 4-13 0 0Z" fill="#9E1C3E" />
            <path d="M0 0C-17 0-27-6-31-14-20-15-9-9 0 0ZM0 0C17 0 27-6 31-14 20-15 9-9 0 0Z" fill="#B8323F" />
            <circle cx="0" cy="-4" r="2.4" fill="#E4C572" />
          </g>
        ))}
      </svg>
    </div>
  )
}

export function AuthWelcome() {
  return (
    <div className="w-full max-w-[460px] motion-safe:animate-fade-in">
      {/* On desktop the brand panel beside this already carries the logo. */}
      <div className="mb-2 text-center lg:hidden">
        <Link href="/" className="inline-block" aria-label="Mithila Jodi — home">
          <Image src="/logo.png" alt="Mithila Jodi — जहाँ परंपरा मिले, प्रेम से" width={160} height={139} priority className="mx-auto h-[86px] w-auto object-contain sm:h-[104px]" />
        </Link>
      </div>

      <div className="text-center">
        <h1 className="font-serif text-[26px] leading-[1.15] text-maroon sm:text-[31px]">
          A beautiful beginning
          <span className="block text-[#9A6F1E]">deserves the right connection.</span>
        </h1>
        <div className="mx-auto mt-2 flex items-center justify-center gap-2" aria-hidden="true">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold" />
          <span className="text-[10px] text-gold">✦</span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold" />
        </div>
        <p className="mt-1.5 font-deva text-[16.5px] text-maroon sm:text-[19px]" lang="mai">अहाँक अपन मिथिला, अहाँक अपन जोड़ी</p>
        <p className="mx-auto mt-1.5 max-w-xs text-[14px] leading-relaxed text-ink-soft sm:max-w-sm sm:text-[15px]">
          Find a life partner who shares your values, culture and dreams.
        </p>
      </div>

      <div className="mt-4 grid auto-rows-fr gap-3">
        <EntryCard
          href="/register?start=1"
          eyebrow="Begin your journey"
          title="Create Account"
          body="Join Mithila Jodi and take the first step towards finding a meaningful connection."
          benefits={['Quick & easy', 'Your number stays private', 'Guided setup']}
          icon={<JoinIcon />}
          emphasis
        />
        <EntryCard
          href="/login"
          eyebrow="Continue your journey"
          title="Welcome Back"
          body="Log in to access your profile, matches and continue where you left off."
          benefits={['Access your profile', 'View your matches', 'Continue your journey']}
          icon={<LoginIcon />}
        />
      </div>

      <ul className="mt-3.5 flex items-center justify-center gap-3 text-[12.5px] text-ink sm:gap-4" aria-label="Why it is safe">
        <li className="flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="#7A1220" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M10 2.5 16 5v4.6c0 3.7-2.5 6.6-6 7.9-3.5-1.3-6-4.2-6-7.9V5Z" /></svg>
          Private
        </li>
        <li className="h-3.5 w-px bg-gold/50" aria-hidden="true" />
        <li className="flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="#7A1220" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><rect x="4" y="9" width="12" height="8.5" rx="1.8" /><path d="M7 9V6.6a3 3 0 0 1 6 0V9" /></svg>
          Secure
        </li>
        <li className="h-3.5 w-px bg-gold/50" aria-hidden="true" />
        <li className="flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="#7A1220" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M10 16.5C5 13.2 2.8 10.4 2.8 7.6 2.8 5.5 4.4 4 6.3 4c1.5 0 2.9.9 3.7 2.2C10.8 4.9 12.2 4 13.7 4c1.9 0 3.5 1.5 3.5 3.6 0 2.8-2.2 5.6-7.2 8.9Z" /></svg>
          Made for Mithila
        </li>
      </ul>

      <div className="-mx-4 mt-3 sm:mx-0">
        <WelcomeScene />
      </div>
    </div>
  )
}
