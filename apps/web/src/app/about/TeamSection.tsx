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

// Static fallback — shown immediately without needing the DB migration applied.
// Once the migration is applied and photos are uploaded via /admin/team,
// the server component passes DB data which overrides this.
const STATIC_TEAM: TeamMemberData[] = [
  {
    id: 'babita-manoj',
    display_name: 'Babita Jha & Manoj Jha',
    role: 'Founders & CEOs',
    bio: 'Babita and Manoj founded Mithila Jodi with a shared belief that matrimonial matchmaking for the Mithila community should honour family traditions, cultural values, and the specific context of Maithili marriage practice.',
    responsibilities: [
      'Overall vision and leadership',
      'Business strategy',
      'Mithila community relationships',
      'Family focused product direction',
      'Partnerships and long term growth',
    ],
    photo_storage_path: null,
  },
  {
    id: 'amit',
    display_name: 'Amit Jha',
    role: 'Head of Technology',
    bio: 'Amit leads the technology behind Mithila Jodi — from the platform architecture and security to the tools that help families create and share marriage biodatas.',
    responsibilities: [
      'Technology strategy',
      'Website and platform development',
      'Infrastructure',
      'Security',
      'Technical reliability',
      'Product technology',
    ],
    photo_storage_path: null,
  },
  {
    id: 'janaki',
    display_name: 'Janaki Jha',
    role: 'Head of Marketing & Community',
    bio: 'Janaki shapes how Mithila Jodi communicates with the Maithili community — through brand storytelling, content, and engagement that feels authentic to Mithila culture.',
    responsibilities: [
      'Brand strategy',
      'Marketing',
      'Social media',
      'Content',
      'Community engagement',
      'User awareness and communication',
    ],
    photo_storage_path: null,
  },
  {
    id: 'sumit',
    display_name: 'Sumit Jha',
    role: 'Head of Operations & User Experience',
    bio: 'Sumit ensures that the experience on Mithila Jodi is smooth, trustworthy, and well supported — from profile quality to day-to-day member operations.',
    responsibilities: [
      'User operations',
      'Profile quality',
      'Verification processes',
      'User support',
      'Operational workflows',
      'Improving the overall member experience',
    ],
    photo_storage_path: null,
  },
  {
    id: 'sandeep',
    display_name: 'Sandeep Jha',
    role: 'Head of Partnerships & Growth',
    bio: 'Sandeep builds the community connections and relationships that help Mithila Jodi grow as a trusted platform for Mithila families across India.',
    responsibilities: [
      'Community partnerships',
      'Strategic relationships',
      'Outreach',
      'Growth initiatives',
      'Institutional/community collaboration',
    ],
    photo_storage_path: null,
  },
]

function photoUrl(path: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!path || !base) return null
  return `${base}/storage/v1/object/public/team-photos/${path}`
}

function initials(name: string): string {
  const caps = name.split(/\s+/).filter(w => /^[A-Z]/.test(w))
  if (caps.length >= 2) return (caps[0][0] + caps[1][0]).toUpperCase()
  if (caps.length === 1) return caps[0][0].toUpperCase()
  return name[0]?.toUpperCase() ?? '?'
}

export function TeamSection({ dbMembers }: { dbMembers: TeamMemberData[] }) {
  const members = dbMembers.length > 0 ? dbMembers : STATIC_TEAM
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = members.find(m => m.id === activeId) ?? null

  function toggle(id: string) {
    setActiveId(prev => (prev === id ? null : id))
  }

  return (
    <section className="bg-paper py-14 sm:py-20" aria-label="Meet our team">
      <div className="wrap max-w-5xl">
        <div className="text-center mb-9">
          <p className="eyebrow mb-1.5">The people behind the platform</p>
          <h2 className="section-heading">Meet Our Team</h2>
          <div className="ornament-line w-16 mx-auto mt-2" />
        </div>

        {/* 5-card grid — 5 across on large, 3 on md, 2 on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {members.map(m => {
            const isActive = activeId === m.id
            const url = photoUrl(m.photo_storage_path)
            const ini = initials(m.display_name)

            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                aria-expanded={isActive}
                aria-controls={`team-panel-${m.id}`}
                className={[
                  'group flex flex-col items-center text-center gap-2 py-4 px-2 sm:py-5 sm:px-3 rounded-mj-sm border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                  isActive
                    ? 'border-gold bg-cream shadow-mj-sm scale-[1.02]'
                    : 'border-paper-3 bg-cream hover:border-gold hover:shadow-mj-xs hover:scale-[1.01]',
                ].join(' ')}
              >
                {/* Avatar circle */}
                <div
                  className={[
                    'w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center flex-shrink-0 overflow-hidden bg-maroon relative transition-all duration-200',
                    isActive ? 'border-gold shadow-mj-xs' : 'border-gold/40 group-hover:border-gold/70',
                  ].join(' ')}
                >
                  {url ? (
                    <Image src={url} alt={m.display_name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <span className="font-serif text-gold text-lg font-bold select-none">{ini}</span>
                  )}
                </div>

                {/* Name */}
                <span
                  className={[
                    'font-serif text-[11px] sm:text-[12px] leading-snug transition-colors duration-200',
                    isActive ? 'text-maroon font-semibold' : 'text-maroon',
                  ].join(' ')}
                >
                  {m.display_name}
                </span>

                {/* Role */}
                <span className="text-[10px] text-gold font-medium uppercase tracking-wider leading-tight">
                  {m.role}
                </span>

                {/* Active dot */}
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

        {/* Expand panel — same CSS grid-rows trick as FeatureStrip */}
        <div
          className={[
            'grid transition-all duration-300 ease-in-out',
            active ? 'grid-rows-[1fr] mt-4 sm:mt-5' : 'grid-rows-[0fr] mt-0',
          ].join(' ')}
        >
          <div className="overflow-hidden">
            {active && (
              <div
                id={`team-panel-${active.id}`}
                role="region"
                aria-label={active.display_name}
                className="rounded-mj-sm border border-gold/50 bg-cream px-5 py-5 sm:px-8 sm:py-6 shadow-mj-xs"
              >
                <div className="h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent mb-5" />

                <div className="flex items-start gap-5 sm:gap-7">
                  {/* Photo — larger in panel */}
                  <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-2 ring-gold ring-offset-2 ring-offset-cream overflow-hidden bg-maroon flex items-center justify-center">
                    {photoUrl(active.photo_storage_path) ? (
                      <Image
                        src={photoUrl(active.photo_storage_path)!}
                        alt={active.display_name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <span className="font-serif text-gold text-2xl font-bold select-none">
                        {initials(active.display_name)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-[17px] sm:text-[20px] text-maroon font-semibold leading-snug mb-0.5">
                      {active.display_name}
                    </p>
                    <p className="text-[11px] sm:text-[12px] text-gold font-medium uppercase tracking-wider mb-3">
                      {active.role}
                    </p>
                    {active.bio && (
                      <p className="font-serif italic text-[13px] sm:text-[14px] text-ink-soft leading-relaxed mb-4">
                        {active.bio}
                      </p>
                    )}
                  </div>
                </div>

                {active.responsibilities.length > 0 && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 mt-4 pt-4 border-t border-gold/20">
                    {active.responsibilities.map(r => (
                      <li key={r} className="flex items-start gap-2.5 text-[12px] sm:text-[13px] text-ink leading-snug">
                        <svg viewBox="0 0 10 10" width="8" height="8" className="mt-[3px] flex-shrink-0" aria-hidden="true">
                          <path d="M5 1 L9 5 L5 9 L1 5 Z" fill="#B98A2E" />
                        </svg>
                        {r}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent mt-5 opacity-40" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
