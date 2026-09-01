'use client'

import { useState } from 'react'
import Image from 'next/image'

export type TeamMemberData = {
  id: string
  display_name: string
  role: string
  bio: string | null
  responsibilities: string[]
  photo_storage_path: string | null
}

// Mithila Jodi has a single founder. This is defined in code (not database)
// so the founder shown on the About page is always exactly one person and
// cannot be contradicted by admin-entered team data.
const FOUNDER: TeamMemberData = {
  id: 'sandeep-jha',
  display_name: 'Sandeep Jha',
  role: 'Founder',
  bio: 'Sandeep Jha founded Mithila Jodi to give the Mithila and Maithili community a matrimony platform built around how these families actually arrange marriage — with gotra, mool and native place treated as first-class details, biodata in the family’s own language, and elders involved from the start rather than as an afterthought.',
  responsibilities: [
    'Overall vision and direction of the platform',
    'Mithila and Maithili community relationships',
    'Product decisions rooted in Maithil marriage practice',
    'Trust, privacy and member safety standards',
    'Partnerships and long-term growth',
  ],
  photo_storage_path: null,
}

function buildPhotoUrl(path: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!path || !base) return null
  return `${base}/storage/v1/object/public/team-photos/${path}`
}

function initials(name: string): string {
  const caps = name.split(/\s+/).filter(w => /^[A-Z]/.test(w))
  if (caps.length >= 2) return (caps[0][0] + caps[1][0]).toUpperCase()
  return caps[0]?.[0].toUpperCase() ?? name[0]?.toUpperCase() ?? '?'
}

// Short role label for compact card (strip "Head of " prefix)
function shortRole(role: string): string {
  return role.replace(/^Head of /, '').split(/\s+&\s+/)[0]
}

function DiamondBullet() {
  return (
    <svg viewBox="0 0 10 10" width="7" height="7" className="mt-[4px] shrink-0" aria-hidden="true">
      <path d="M5 1 L9 5 L5 9 L1 5 Z" fill="#B98A2E" />
    </svg>
  )
}

// Subtle Mithila-inspired lotus motif used between photo and ring accent
function LotusAccent() {
  return (
    <svg width="40" height="12" viewBox="0 0 40 12" fill="none" aria-hidden="true" className="mx-auto opacity-50">
      {[0,8,16,24,32].map((x, i) => (
        <ellipse key={i} cx={x + 4} cy={6} rx={3} ry={5} fill="#B98A2E" opacity={i === 2 ? 0.7 : 0.4} />
      ))}
    </svg>
  )
}

export function TeamSection({ dbMembers }: { dbMembers: TeamMemberData[] }) {
  // The founder is always first and always code-owned. Any database entry that
  // claims founder/CEO status is dropped, so the single-founder statement holds
  // regardless of what has been entered via /admin/team.
  const additional = dbMembers.filter(
    (m) => !/founder|ceo/i.test(m.role) && m.display_name !== FOUNDER.display_name
  )
  const members = [FOUNDER, ...additional]
  const [activeId, setActiveId] = useState<string>(members[0]?.id ?? '')
  const active = members.find(m => m.id === activeId) ?? members[0] ?? null

  return (
    <section className="bg-paper py-14 sm:py-20 overflow-x-clip" aria-label="Founder of Mithila Jodi">
      <div className="wrap max-w-4xl">

        {/* ── Section header ── */}
        <div className="text-center mb-8">
          <p className="eyebrow mb-1.5">The person behind the platform</p>
          <h2 className="section-heading">
            {additional.length > 0 ? 'Founder & Team' : 'Our Founder'}
          </h2>
          <div className="ornament-line w-20 mx-auto mt-3" />
        </div>

        {/* ── Compact selector strip ──
            On mobile: scrolls horizontally, extends to screen edges.
            On sm+: centred, no scroll needed.                           */}
        <div
          className="-mx-6 px-6 sm:mx-0 sm:px-0 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex gap-3 sm:gap-4 sm:justify-center" style={{ WebkitOverflowScrolling: 'touch' }}>
            {members.map((m) => {
              const isActive = m.id === activeId
              const url = buildPhotoUrl(m.photo_storage_path)
              const ini = initials(m.display_name)
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveId(m.id)}
                  aria-pressed={isActive}
                  className={[
                    'shrink-0 flex flex-col items-center gap-2 py-3 px-2 rounded-mj-sm border-2',
                    'w-[82px] sm:w-[106px] text-center',
                    'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                    isActive
                      ? 'border-gold bg-cream shadow-mj-sm'
                      : 'border-gold/20 bg-paper hover:border-gold/50 hover:bg-cream hover:shadow-mj-xs',
                  ].join(' ')}
                >
                  {/* Avatar */}
                  <div
                    className={[
                      'relative rounded-full overflow-hidden bg-maroon flex items-center justify-center',
                      'w-12 h-12 sm:w-14 sm:h-14',
                      'transition-all duration-200',
                      isActive ? 'ring-2 ring-gold ring-offset-[3px] ring-offset-cream' : 'ring-1 ring-gold/30',
                    ].join(' ')}
                  >
                    {url ? (
                      <Image src={url} alt={m.display_name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <span className="font-serif text-gold-lt font-bold text-sm select-none">{ini}</span>
                    )}
                  </div>

                  {/* Name */}
                  <span
                    className={[
                      'font-serif text-[10px] sm:text-[11px] leading-snug line-clamp-2 w-full transition-colors duration-150',
                      isActive ? 'text-maroon font-semibold' : 'text-maroon',
                    ].join(' ')}
                  >
                    {m.display_name}
                  </span>

                  {/* Short role */}
                  <span
                    className={[
                      'text-[8px] sm:text-[9px] uppercase tracking-[0.1em] font-medium line-clamp-1 w-full transition-colors duration-150',
                      isActive ? 'text-gold' : 'text-ink-soft',
                    ].join(' ')}
                  >
                    {shortRole(m.role)}
                  </span>

                  {/* Active indicator dot */}
                  <span
                    className={[
                      'w-1 h-1 rounded-full bg-gold transition-all duration-200',
                      isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Detail card ── */}
        {active && (
          <div className="mt-5 rounded-mj border border-gold/45 bg-cream shadow-mj-xs overflow-hidden">

            {/* Mithila top accent line */}
            <div className="h-[3px] bg-gradient-to-r from-maroon-deep/20 via-gold to-maroon-deep/20" />

            {/* Content — key triggers fade-up animation on member switch */}
            <div key={active.id} className="p-5 sm:p-7 animate-fade-up">
              <div className="flex gap-5 sm:gap-8 items-start">

                {/* Left: large avatar */}
                <div className="shrink-0 flex flex-col items-center gap-2.5">
                  <div
                    className="relative rounded-full overflow-hidden bg-maroon flex items-center justify-center ring-[3px] ring-gold ring-offset-[3px] ring-offset-cream w-[72px] h-[72px] sm:w-[108px] sm:h-[108px]"
                  >
                    {buildPhotoUrl(active.photo_storage_path) ? (
                      <Image
                        src={buildPhotoUrl(active.photo_storage_path)!}
                        alt={active.display_name}
                        fill
                        className="object-cover"
                        sizes="(min-width: 640px) 108px, 72px"
                      />
                    ) : (
                      <span className="font-serif text-gold-lt font-bold text-2xl sm:text-3xl select-none">
                        {initials(active.display_name)}
                      </span>
                    )}
                  </div>
                  <LotusAccent />
                </div>

                {/* Right: content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-maroon text-[18px] sm:text-[22px] font-semibold leading-snug">
                    {active.display_name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gold uppercase tracking-[0.18em] font-medium mt-1">
                    {active.role}
                  </p>

                  {active.bio && (
                    <p className="font-serif italic text-ink-soft text-[13px] sm:text-[14px] leading-relaxed mt-3">
                      {active.bio}
                    </p>
                  )}

                  {/* Divider */}
                  <div className="my-4 h-px bg-gradient-to-r from-gold/40 via-gold/20 to-transparent" />

                  {/* Responsibilities */}
                  {active.responsibilities.length > 0 && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                      {active.responsibilities.map((r) => (
                        <li key={r} className="flex items-start gap-2 text-[12px] sm:text-[13px] text-ink leading-snug">
                          <DiamondBullet />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Mithila bottom accent line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
          </div>
        )}

      </div>
    </section>
  )
}

