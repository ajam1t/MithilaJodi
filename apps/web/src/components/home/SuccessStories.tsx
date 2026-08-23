'use client'

import { useState } from 'react'

type ValueCard = {
  id: string
  title: string
  tagline: string
  bullets: string[]
  icon: React.ReactNode
}

const VALUES: ValueCard[] = [
  {
    id: 'family-connect',
    title: 'Family Connect',
    tagline: 'Where Families Come Together.',
    bullets: [
      'Parents and elders welcome at every step',
      'Family-led introductions honoured',
      'From first meeting to milap, together',
      'Traditional introductions supported',
    ],
    icon: (
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
        {[14, 24, 34].map((cx, i) => (
          <g key={i}>
            <circle cx={cx} cy={16} r={5.5} fill={i === 1 ? '#7A1220' : '#C4562F'} stroke="#5A0E19" strokeWidth="1" />
            <path d={`M ${cx - 6} 40 Q ${cx} 26 ${cx + 6} 40 Z`} fill={i === 1 ? '#7A1220' : '#C4562F'} stroke="#5A0E19" strokeWidth="1" />
          </g>
        ))}
        <circle cx="24" cy="9" r="2" fill="#D4122C" />
      </svg>
    ),
  },
  {
    id: 'meaningful-matches',
    title: 'Meaningful Matches',
    tagline: 'Compatible Lives. Shared Values.',
    bullets: [
      'Gotra, kul, mool and gram considered',
      'Values-based compatibility matching',
      'Cultural and community fit prioritised',
      'Thoughtful, curated introductions',
    ],
    icon: (
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
          const r = (a * Math.PI) / 180
          return (
            <ellipse
              key={i}
              cx={24 + 12 * Math.cos(r)}
              cy={24 + 12 * Math.sin(r)}
              rx={4} ry={7}
              fill={i % 2 === 0 ? '#E8912A' : '#FFD700'}
              stroke="#B96A1A" strokeWidth="0.6"
              transform={`rotate(${a} ${24 + 12 * Math.cos(r)} ${24 + 12 * Math.sin(r)})`}
            />
          )
        })}
        <circle cx="24" cy="24" r="6" fill="#7A1220" />
        <circle cx="24" cy="24" r="2.5" fill="#E4C572" />
      </svg>
    ),
  },
  {
    id: 'mithila-roots',
    title: 'Mithila Roots',
    tagline: 'Rooted in Culture. Built for Community.',
    bullets: [
      'Mithila & Maithili traditions honoured',
      'Gotra compatibility built in',
      'Community-first matchmaking',
      'Cultural heritage preserved',
    ],
    icon: (
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
        <path d="M24 40 C 10 30, 8 18, 16 14 C 20 12, 24 15, 24 19 C 24 15, 28 12, 32 14 C 40 18, 38 30, 24 40 Z" fill="#7A1220" stroke="#5A0E19" strokeWidth="1" />
        {[0, 60, 120, 180, 240, 300].map((a, i) => {
          const r = (a * Math.PI) / 180
          return <circle key={i} cx={24 + 17 * Math.cos(r)} cy={22 + 15 * Math.sin(r)} r={1.6} fill="#B98A2E" />
        })}
      </svg>
    ),
  },
  {
    id: 'family-involvement',
    title: 'Family Involvement',
    tagline: 'Where Families Find Their Match.',
    bullets: [
      'Parental participation encouraged',
      'Elder guidance respected fully',
      'Family profiles and introductions',
      'Decisions made together, with love',
    ],
    icon: (
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
        <circle cx="15" cy="13" r="5.5" fill="#C4562F" stroke="#7A1220" strokeWidth="1" />
        <circle cx="33" cy="13" r="5.5" fill="#C4562F" stroke="#7A1220" strokeWidth="1" />
        <circle cx="24" cy="11" r="6" fill="#7A1220" stroke="#5A0E19" strokeWidth="1" />
        <path d="M 7 40 Q 15 26 24 30 Q 33 26 41 40 Z" fill="#C4562F" stroke="#7A1220" strokeWidth="1" />
        <path d="M 16 40 Q 20 28 24 30 Q 28 28 32 40 Z" fill="#7A1220" stroke="#5A0E19" strokeWidth="1" />
        <circle cx="24" cy="8" r="1.8" fill="#E4C572" />
      </svg>
    ),
  },
  {
    id: 'traditional-values',
    title: 'Traditional Values',
    tagline: 'Honouring What Has Always Mattered.',
    bullets: [
      'Time-honoured Maithili customs respected',
      'Ritual significance preserved',
      'Purity of lineage and gotra honoured',
      'Modern platform, timeless values',
    ],
    icon: (
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
        <rect x="16" y="24" width="16" height="18" fill="#C4562F" stroke="#7A1220" strokeWidth="1.2" />
        <rect x="22" y="30" width="4" height="12" fill="#7A1220" />
        <rect x="12" y="24" width="24" height="5" fill="#7A1220" stroke="#B98A2E" strokeWidth="0.8" />
        <rect x="14" y="16" width="20" height="10" fill="#9B2233" stroke="#7A1220" strokeWidth="1" />
        <rect x="18" y="10" width="12" height="8" fill="#7A1220" />
        <ellipse cx="24" cy="4" rx="5" ry="3.5" fill="#B98A2E" />
        <circle cx="24" cy="0" r="2" fill="#E4C572" />
        <line x1="12" y1="26" x2="36" y2="26" stroke="#E4C572" strokeWidth="0.8" />
      </svg>
    ),
  },
  {
    id: 'mother-tongue-biodata',
    title: 'Biodata in Your Mother Tongue',
    tagline: 'Your Story in Maithili or Hindi.',
    bullets: [
      'Biodata templates in Maithili and Hindi',
      'Devanagari script supported',
      'Traditional formats for family elders',
      'Beautiful PDF ready to share',
    ],
    icon: (
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
        <rect x="10" y="6" width="28" height="36" rx="3" fill="#FBF1DD" stroke="#7A1220" strokeWidth="1.5" />
        <rect x="10" y="6" width="28" height="9" rx="3" fill="#7A1220" />
        <rect x="10" y="11" width="28" height="4" fill="#7A1220" />
        <text x="24" y="13" textAnchor="middle" fill="#E4C572" fontSize="6" fontFamily="serif">अ</text>
        <line x1="15" y1="22" x2="33" y2="22" stroke="#B98A2E" strokeWidth="1.4" />
        <line x1="15" y1="28" x2="33" y2="28" stroke="#B98A2E" strokeWidth="1.4" />
        <line x1="15" y1="34" x2="27" y2="34" stroke="#B98A2E" strokeWidth="1.4" />
        <text x="24" y="19.5" textAnchor="middle" fill="#9B2233" fontSize="4" fontFamily="serif">मैथिली</text>
      </svg>
    ),
  },
]

export function FamilyRoots() {
  const [activeId, setActiveId] = useState<string | null>(null)

  function toggle(id: string) {
    setActiveId(prev => (prev === id ? null : id))
  }

  const active = VALUES.find(v => v.id === activeId) ?? null

  return (
    <section id="stories" className="relative bg-paper py-10 sm:py-14" aria-label="Family and values at Mithila Jodi">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-maroon-deep via-gold to-maroon-deep opacity-60" aria-hidden="true" />

      <div className="wrap">
        <div className="text-center mb-7 sm:mb-9">
          <p className="eyebrow mb-1.5">Family &amp; Values</p>
          <h2 className="section-heading">Rooted in Family, Built for Marriage</h2>
          <div className="ornament-line w-16 mx-auto mt-2" />
        </div>

        {/* 3 × 2 interactive card grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {VALUES.map(({ id, icon, title }) => {
            const isActive = activeId === id
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                aria-expanded={isActive}
                aria-controls={`value-panel-${id}`}
                className={[
                  'group flex flex-col items-center text-center gap-2 py-4 px-2 sm:py-5 sm:px-4 rounded-mj-sm border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold overflow-hidden',
                  isActive
                    ? 'border-gold bg-paper shadow-mj-sm scale-[1.02]'
                    : 'border-paper-3 bg-paper hover:border-gold hover:shadow-mj-xs hover:scale-[1.01]',
                ].join(' ')}
              >
                {/* Icon circle */}
                <div
                  className={[
                    'w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-200 flex-shrink-0',
                    isActive
                      ? 'bg-cream border-gold shadow-mj-xs'
                      : 'bg-cream border-gold border-opacity-40 group-hover:border-opacity-70',
                  ].join(' ')}
                >
                  {icon}
                </div>

                {/* Title — long title uses viewport-scaled font to stay one line */}
                <span
                  className={[
                    'font-serif leading-snug transition-colors duration-200 w-full whitespace-nowrap overflow-hidden',
                    isActive ? 'text-maroon font-semibold' : 'text-maroon',
                    id === 'mother-tongue-biodata'
                      ? 'text-[2.4vw] sm:text-[11px] md:text-[13px]'
                      : 'text-[11px] sm:text-[13px]',
                  ].join(' ')}
                >
                  {title}
                </span>

                {/* Active indicator dot */}
                <span
                  className={[
                    'w-1.5 h-1.5 rounded-full bg-gold transition-all duration-200',
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0',
                  ].join(' ')}
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </div>

        {/* Expand panel — CSS grid-rows trick for smooth height animation */}
        <div
          className={[
            'grid transition-all duration-300 ease-in-out',
            active ? 'grid-rows-[1fr] mt-4 sm:mt-5' : 'grid-rows-[0fr] mt-0',
          ].join(' ')}
        >
          <div className="overflow-hidden">
            {active && (
              <div
                id={`value-panel-${active.id}`}
                role="region"
                aria-label={active.title}
                className="rounded-mj-sm border border-gold border-opacity-50 bg-paper px-5 py-5 sm:px-8 sm:py-6 shadow-mj-xs"
              >
                <div className="h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent mb-4" />

                <p className="font-serif text-[17px] sm:text-[20px] text-maroon font-semibold leading-snug mb-1">
                  {active.title.replace(/ /g, ' ')}
                </p>
                <p className="font-serif italic text-[12px] sm:text-[13px] text-ink-soft mb-4">
                  {active.tagline}
                </p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                  {active.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2.5 text-[12px] sm:text-[13px] text-ink leading-snug">
                      <svg viewBox="0 0 10 10" width="8" height="8" className="mt-[3px] flex-shrink-0" aria-hidden="true">
                        <path d="M5 1 L9 5 L5 9 L1 5 Z" fill="#B98A2E" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent mt-4 opacity-40" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/** @deprecated use FamilyRoots */
export { FamilyRoots as SuccessStories }
