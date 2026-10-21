import Link from 'next/link'
import type { ReactNode } from 'react'
import '@/styles/digital-profile.css'
import type { SharedProfile } from '@/lib/profileShare'
import { ProfilePhotos } from '@/components/digital-profile/ProfilePhotos'
import { ProfileGallery } from '@/components/digital-profile/ProfileGallery'
import { ProfileModes } from '@/components/digital-profile/ProfileModes'
import { ContactCard } from '@/components/digital-profile/ContactCard'
import { ProfileStory } from '@/components/profile/ProfileStory'
import { ProfileCover, type CoverFact } from '@/components/digital-profile/ProfileCover'
import { GOTRAS } from '@/lib/mithilaRoots'

/**
 * THE Digital Profile renderer.
 *
 * One component for every place a profile is shown as a Digital Profile — the
 * public /p/[token] page, the owner's "preview as visitor", and the demo on
 * /digital-profile — so what an owner previews is exactly what a visitor
 * sees. It only ever receives `SharedProfile`, the projection lib/profileShare
 * builds after applying the owner's section choices, so it cannot render a
 * field the link did not grant.
 *
 *   public  — a visitor who opened a shared link
 *   preview — the owner, looking at their own link
 *   demo    — the fictional profile on the landing page
 *
 * Layout (2026-10-07): a compact cream identity header — no photo, no maroon
 * poster — then the photographs, which appear nowhere else, then the profile
 * section by section, then the actions for whoever is looking.
 */
export type ProfileMode = 'public' | 'preview' | 'demo'

// ─── Pieces ─────────────────────────────────────────────────────────────────

function Fact({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gold/15 last:border-0">
      <span className="w-[40%] sm:w-[34%] shrink-0 text-[11.5px] uppercase tracking-wide text-ink-soft leading-snug pt-0.5">{label}</span>
      <span className="min-w-0 text-[14.5px] text-ink leading-snug break-words">{value}</span>
    </div>
  )
}

/** Heading levels shift down inside the landing page, which has its own H1. */
type Level = 'h1' | 'h2' | 'h3' | 'h4'

function Panel({ title, children, i = 0, className = '', h: H = 'h2' }: { title: string; children: ReactNode; i?: number; className?: string; h?: Level }) {
  return (
    <section className={`dp-panel dp-rise ${className}`} style={{ ['--i' as string]: i }} aria-label={title}>
      <H className="dp-panel-title">{title}</H>
      {children}
    </section>
  )
}

function hasAny(obj: object | null | undefined): boolean {
  if (!obj) return false
  return Object.values(obj).some(v => v != null && v !== '' && v !== false)
}

function height(cm: number | null): string | null {
  if (!cm) return null
  const inches = Math.round(cm / 2.54)
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

/** The gotra guide page for a shown gotra name, matching its common spellings. */
function gotraSlug(name: string | null | undefined): string | null {
  if (!name) return null
  const n = name.toLowerCase().replace(/\s*gotra\s*$/, '').trim()
  const g = GOTRAS.find(x => x.slug === n || x.name.toLowerCase() === n || x.aliases?.some(a => a.toLowerCase() === n))
  return g?.slug ?? null
}

const ASTRO_ICON: Record<string, ReactNode> = {
  kundli: <><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M4 4l16 16M20 4 4 20M12 4l8 8-8 8-8-8z" /></>,
  gotra: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.2" /><path d="M12 3.5v5.3M12 15.2v5.3M3.5 12h5.3M15.2 12h5.3" /></>,
  manglik: <><circle cx="10" cy="14" r="5.5" /><path d="M14 10 20 4M15 4h5v5" /></>,
  muhurat: <><path d="M12 4c1.8 2 2.6 3.6 2.6 5a2.6 2.6 0 0 1-5.2 0c0-1.4.8-3 2.6-5Z" /><path d="M5 15h14c-.6 2.8-3.4 5-7 5s-6.4-2.2-7-5Z" /></>,
}

/** "Before you decide" — the astrology tools families reach for next, ready to open. */
function AstroLinks({ first, gotra, h: H }: { first: string; gotra: string | null; h: Level }) {
  const slug = gotraSlug(gotra)
  const tiles = [
    // Only the first name travels, for labels on the form. Their birth details
    // are private and are never pre-filled; the family shares them.
    { k: 'kundli', href: `/astrology/kundli-match?partner=${encodeURIComponent(first)}`, title: `Kundli match with ${first}`, body: `Add your birth details and ${first}’s (from the family) for Ashtakoot guna milan.`, wide: true },
    { k: 'gotra', href: slug ? `/gotra/${slug}` : '/gotra', title: gotra ? `${first} is ${gotra} gotra` : 'Gotra check', body: gotra ? 'Check it against yours in a tap.' : 'Is it a gotra-safe match?' },
    { k: 'manglik', href: '/astrology/manglik', title: 'Manglik check', body: 'Mangal dosha, explained.' },
    { k: 'muhurat', href: '/astrology/vivah-muhurat', title: 'Vivah muhurat', body: 'Auspicious wedding dates.', wide: true },
  ]
  return (
    <section className="dpa dp-rise" aria-label="Before you decide">
      <p className="dpa-eyebrow">Before you decide</p>
      <H className="dpa-title">Look at the stars together</H>
      <ul className="dpa-grid">
        {tiles.map(t => (
          <li key={t.k} className={t.wide ? 'dpa-wide' : ''}>
            <Link href={t.href} className="dpa-tile" data-k={t.k}>
              <span className="dpa-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ASTRO_ICON[t.k]}</svg></span>
              <span className="dpa-t">{t.title}</span>
              <span className="dpa-b">{t.body}</span>
              <span className="dpa-go" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="dpa-note">Free tools on Mithila Jodi. Nothing from this profile is sent to them.</p>
    </section>
  )
}

// ─── The profile ────────────────────────────────────────────────────────────

/**
 * Who is looking. The profile itself — every field shown, and the layout — is
 * identical for all three; only the actions around it differ.
 *   visitor  not signed in: invited to join (the growth loop's last step)
 *   member   signed in, someone else's profile: the `connection` action
 *   owner    the member's own link — sees exactly what others see
 */
export type ProfileAudience = 'visitor' | 'member' | 'owner'

/** "About him" / "About her", falling back to plain "About". */
function aboutTitle(gender: string | null): string {
  const g = (gender ?? '').toLowerCase()
  return g.startsWith('m') ? 'About him' : g.startsWith('f') ? 'About her' : 'About'
}

export function DigitalProfileView({
  profile: p, profileId, mode, audience = 'visitor', connection, nested = false,
}: {
  profile: SharedProfile
  /** Keys the gallery; never shown. */
  profileId?: string | null
  mode: ProfileMode
  audience?: ProfileAudience
  /** For a signed-in member: Send Interest / Interest Sent / It's a Match. */
  connection?: ReactNode
  /** Inside another page (the landing): headings step down below that page's H1. */
  nested?: boolean
}) {
  const first = p.displayName.split(' ')[0]
  const c = p.community
  const meta = [p.age ? `${p.age}` : null, p.gender, height(p.heightCm)].filter(Boolean).join(' · ')
  const place = [p.location?.current, p.location?.native ? `Originally from ${p.location.native}` : null].filter(Boolean).join(' · ')
  const chips = [
    // A sub-caste that only repeats the community is left out.
    [c?.caste, c?.subCaste && c.subCaste.toLowerCase() !== c?.caste?.toLowerCase() ? c.subCaste : null].filter(Boolean).join(' · ') || null,
    c?.selfGotra ? `${c.selfGotra} Gotra` : null,
  ].filter(Boolean) as string[]
  const profession = p.career?.jobTitle || p.career?.detail || null
  const keyDetails: Array<[string, string | null | undefined]> = [
    ['Age', p.age ? `${p.age} years` : null],
    ['Height', height(p.heightCm)],
    ['Marital status', p.maritalStatus],
    ['Profession', profession],
    ['Current location', p.location?.current],
    ['Native place', p.location?.native],
    ['Community', c?.caste],
    ['Gotra', c?.selfGotra],
  ]
  const roots: Array<[string, string | null | undefined]> = [
    ['Gotra', c?.selfGotra], ['Maternal gotra', c?.maternalGotra], ['Mool', c?.mool],
    ['Native village', c?.gram], ['Native place', p.location?.native],
  ]
  const hasRoots = roots.some(([, v]) => v)
  const hasCommunity = !!(c?.religion || c?.caste || c?.subCaste || p.motherTongue)
  const photos = p.photos
  // The cover's split-flap line: one fact at a time, only what was shared.
  const coverFacts = ([
    c?.selfGotra ? { lead: 'Gotra', word: c.selfGotra } : null,
    c?.mool ? { lead: 'Mool', word: c.mool } : null,
    p.education?.degree ? { lead: 'Studied', word: p.education.degree } : null,
    profession ? { lead: 'Works as', word: profession } : null,
    p.location?.native ? { lead: 'Roots in', word: p.location.native } : null,
  ].filter(Boolean) as CoverFact[]).filter(f => f.word.length <= 12)
  let n = 3
  const Name: Level = nested ? 'h3' : 'h1'
  const h: Level = nested ? 'h4' : 'h2'

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-5 sm:py-8">
      {mode === 'demo' && (
        <p className="dp-demo-ribbon dp-rise rounded-full px-4 py-1.5 text-center text-[11.5px] font-bold uppercase tracking-[0.2em]">
          Sample profile · fictional
        </p>
      )}

      {/* ── Cover: who is this person, at a glance. */}
      <ProfileCover
        name={p.displayName}
        meta={meta}
        place={place}
        photo={photos[0] ?? null}
        facts={coverFacts}
        // The gotra turns on the flap line, so the chips carry the community only.
        chips={coverFacts.some(f => f.lead === 'Gotra') ? chips.filter(x => !x.endsWith(' Gotra')) : chips}
        demo={mode === 'demo'}
        headingLevel={Name === 'h1' ? 'h1' : 'h3'}
        note={mode !== 'demo' && audience === 'visitor' ? `Shared with you by ${first}\u2019s family on Mithila Jodi, a matrimonial platform for Maithil families. No account needed to read it.` : null}
      />

      {/* ── Story or Details: the same shared fields, told two ways. */}
      <ProfileModes
        story={
          <ProfileStory
            story={null}
            prefs={p.preferences}
            p={{
              display_name: p.displayName, age: p.age, gender: p.gender ?? '', height_cm: p.heightCm, photo: photos[0] ?? null,
              degree: p.education?.degree ?? null, specialization: p.education?.specialization ?? null, institution: p.education?.institution ?? null,
              passing_year: p.education?.passingYear ?? null, education_detail: p.education?.detail ?? null,
              job_title: p.career?.jobTitle ?? null, profession_detail: p.career?.detail ?? null, employer: p.career?.employer ?? null,
              industry: p.career?.industry ?? null, experience_years: p.career?.experienceYears ?? null,
              current_loc_name: p.location?.current ?? null, native_place_name: p.location?.native ?? null, job_loc_name: p.location?.work ?? null,
              gram: c?.gram ?? null, self_gotra: c?.selfGotra ?? null, maternal_gotra: c?.maternalGotra ?? null, mool: c?.mool ?? null, caste: c?.caste ?? null,
              family_type: p.family?.type ?? null, family_values: p.family?.values ?? null, parents_info: p.family?.parents ?? null, siblings_info: p.family?.siblings ?? null,
              diet: p.lifestyle?.diet ?? null, mother_tongue: p.motherTongue, marital_status: p.maritalStatus, about_me: p.about,
            }}
          />
        }
        contact={mode === 'demo' && !p.contactPrefs ? undefined : (
          <ContactCard
            first={first}
            contact={p.contact}
            prefs={p.contactPrefs}
            partner={p.preferences}
            audience={mode === 'demo' ? 'visitor' : audience}
            profileHref={mode === 'demo' ? null : audience === 'visitor' ? '/register?start=1' : profileId ? `/profile/${profileId}` : null}
          />
        )}
        details={<>
      {/* ── Photographs: the one place they appear. */}
      <ProfilePhotos photos={photos} name={p.displayName} demo={mode === 'demo'} style={{ ['--i' as string]: 1 }} />

      {p.about && (
        <Panel h={h} title={aboutTitle(p.gender)} i={2}>
          <p className="whitespace-pre-wrap py-1.5 font-serif text-[16px] leading-relaxed text-ink">{p.about}</p>
        </Panel>
      )}

      {keyDetails.some(([, v]) => v) && (
        <Panel h={h} title="Key details" i={n++}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 pb-2 pt-1">
            {keyDetails.filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-[10.5px] uppercase tracking-[0.12em] text-ink-soft">{label}</dt>
                <dd className="mt-0.5 break-words text-[15px] leading-snug text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}

      {/* The six-card Profile Gallery — the same component as the member's own
          Profile page, built only from this link's shared fields. */}
      <div className="dp-rise" style={{ ['--i' as string]: n++ }}>
        <ProfileGallery profile={p} id={profileId ?? 'shared'} h={h === 'h4' ? 'h4' : 'h2'} />
      </div>

      {(hasAny(p.education) || hasAny(p.career)) && (
        <Panel h={h} title="Education & career" i={n++}>
          {hasAny(p.education) && p.education && (
            <div className="pb-1">
              <p className="pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A6516]">Education</p>
              <Fact label="Degree" value={p.education.degree} />
              <Fact label="Specialisation" value={p.education.specialization} />
              <Fact label="Institution" value={p.education.institution} />
              <Fact label="Year" value={p.education.passingYear} />
              <Fact label="Details" value={p.education.detail} />
            </div>
          )}
          {hasAny(p.career) && p.career && (
            <div className={hasAny(p.education) ? 'mt-2 border-t border-gold/20 pt-2' : ''}>
              <p className="pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A6516]">Career</p>
              <Fact label="Role" value={p.career.jobTitle} />
              <Fact label="Employer" value={p.career.employer} />
              <Fact label="Industry" value={p.career.industry} />
              <Fact label="Employment" value={p.career.employmentType} />
              <Fact label="Work type" value={p.career.workType} />
              <Fact label="Experience" value={p.career.experienceYears ? `${p.career.experienceYears} years` : null} />
              <Fact label="Works in" value={p.location?.work} />
              <Fact label="Details" value={p.career.detail} />
            </div>
          )}
        </Panel>
      )}

      {hasAny(p.family) && p.family && (
        <Panel h={h} title="Family" i={n++}>
          <Fact label="Family type" value={p.family.type} />
          <Fact label="Values" value={p.family.values} />
          <Fact label="Parents" value={p.family.parents} />
          <Fact label="Siblings" value={p.family.siblings} />
          {[p.family.about, p.family.introduction].filter(Boolean).map(t => (
            <p key={t} className="whitespace-pre-wrap py-2 text-[14.5px] leading-relaxed text-ink">{t}</p>
          ))}
        </Panel>
      )}

      {(hasRoots || hasCommunity) && (
        <Panel h={h} title="Mithila roots" i={n++} className="dp-roots">
          {hasRoots && (
            <div className="grid grid-cols-2 gap-2.5 pb-2 pt-1">
              {roots.filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="dp-tile">
                  <p className="text-[10.5px] uppercase tracking-[0.12em] text-ink-soft">{label}</p>
                  <p className="mt-0.5 font-serif text-[16px] leading-snug text-maroon">{value}</p>
                </div>
              ))}
            </div>
          )}
          {hasCommunity && (
            <div className="pb-1">
              <Fact label="Religion" value={c?.religion} />
              <Fact label="Community" value={c?.caste} />
              <Fact label="Sub-caste" value={c?.subCaste} />
              <Fact label="Mother tongue" value={p.motherTongue} />
            </div>
          )}
        </Panel>
      )}

      {hasAny(p.lifestyle) && p.lifestyle && (
        <Panel h={h} title="Lifestyle" i={n++}>
          <Fact label="Diet" value={p.lifestyle.diet} />
          <Fact label="Smoking" value={p.lifestyle.smoking} />
          <Fact label="Drinking" value={p.lifestyle.drinking} />
          <Fact label="Marriage timeline" value={p.lifestyle.marriageTimeline} />
        </Panel>
      )}

      {p.preferences && (
        <Panel h={h} title="Looking for" i={n++}>
          <Fact label="Age" value={p.preferences.ageRange} />
          <Fact label="Bride / Groom" value={p.preferences.lookingFor} />
          <Fact label="Community" value={p.preferences.community} />
          <Fact label="Marital status" value={p.preferences.maritalStatus} />
          <Fact label="Education" value={p.preferences.education} />
          <Fact label="Profession" value={p.preferences.profession} />
          <Fact label="Location" value={p.preferences.location} />
          <Fact label="Diet" value={p.preferences.diet} />
          <Fact label="Timeline" value={p.preferences.marriageTimeline} />
          <Fact label="Manglik" value={p.preferences.manglik} />
          <Fact label="Children" value={p.preferences.children} />
          <Fact label="Living" value={p.preferences.livingArrangement} />
          <Fact label="Career" value={p.preferences.career} />
          <Fact label="Notes" value={p.preferences.notes} />
        </Panel>
      )}

      {hasAny(p.horoscope) && p.horoscope && (
        <Panel h={h} title="Horoscope" i={n++}>
          <Fact label="Rashi" value={p.horoscope.rashi} />
          <Fact label="Nakshatra" value={p.horoscope.nakshatra} />
          <Fact label="Manglik" value={p.horoscope.manglik} />
          <Fact label="Birth time" value={p.horoscope.birthTime} />
          <Fact label="Birth place" value={p.horoscope.birthPlace} />
        </Panel>
      )}


        </>}
      />

      <AstroLinks first={first} gotra={c?.selfGotra ?? null} h={h} />

      {/* ── Actions: the only part that differs by who is looking. */}
      {mode === 'public' && audience === 'member' && connection}

      {mode !== 'demo' && audience === 'visitor' && (
        // The growth loop's last step: someone a member shared with joins, and
        // gets a Digital Profile of their own to share.
        <section className="dpj" aria-label="Join Mithila Jodi">
          <svg viewBox="0 0 120 64" className="dpj-rings" aria-hidden="true">
            <circle className="dpj-a" cx="46" cy="32" r="22" fill="none" stroke="#7A1220" strokeWidth="2" />
            <circle className="dpj-b" cx="74" cy="32" r="22" fill="none" stroke="#B98A2E" strokeWidth="2" />
            <path className="dpj-h" d="M60 41c-4.6-3.3-7.4-5.9-7.4-8.9a3.7 3.7 0 0 1 7.4-1.5 3.7 3.7 0 0 1 7.4 1.5c0 3-2.8 5.6-7.4 8.9Z" fill="#A3202A" />
          </svg>
          <p className="font-serif text-[22px] leading-tight text-maroon">Interested in {first}?</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-ink-soft">
            {hasAny(p.contact)
              ? 'Join Mithila Jodi free to send an interest and find your own Jodi.'
              : 'Contact details are not part of this link. Join Mithila Jodi free, send an interest, and you can request their number once they accept.'}
          </p>
          <Link href="/register?start=1" className="dpj-cta">Join Mithila Jodi free →</Link>
          <p className="mt-2.5 text-[13px] text-ink-soft">
            Already a member? <Link href="/login" className="font-semibold text-maroon underline-offset-2 hover:underline">Log in</Link>
          </p>
        </section>
      )}

      {mode === 'demo' && (
        <p className="text-center text-[12px] leading-relaxed text-ink-soft">
          {p.displayName} is fictional. Every detail above was written to show how a Digital Profile looks —
          this is not a Mithila Jodi member.
        </p>
      )}

      {mode !== 'demo' && (
        <footer className="pb-2 pt-3 text-center">
          <div className="ornament-line mx-auto mb-3 w-14" />
          <Link href="/" className="font-serif text-[18px] leading-none text-maroon">Mithila Jodi</Link>
          <p className="mt-1 font-deva text-[12px] text-ink-soft" lang="hi">जहाँ परंपरा मिले, प्रेम से</p>
          <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-ink-soft">
            Shared privately by a member. Please do not forward it without asking them first.
          </p>
        </footer>
      )}
    </div>
  )
}
