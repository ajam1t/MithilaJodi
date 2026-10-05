import Link from 'next/link'
import type { ReactNode } from 'react'
import '@/styles/digital-profile.css'
import type { SharedProfile } from '@/lib/profileShare'
import { SharedPhotoCarousel } from '@/components/SharedPhotoCarousel'
import ProfileCardGallery3D from '@/components/ProfileCardGallery3D'
import { DemoPortrait } from '@/components/digital-profile/DemoPortrait'
import { DIGITAL_PROFILE_PATH } from '@/lib/digitalProfile'
import type { SearchCard } from '@/types/profile'

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

/** Shape the projection for the rotating "at a glance" card. */
function toCard(p: SharedProfile, id: string): SearchCard {
  return {
    id,
    display_name: p.displayName,
    gender: p.gender ?? '',
    age: p.age ?? 0,
    religion: p.community?.religion ?? null,
    caste: p.community?.caste ?? null,
    self_gotra: p.community?.selfGotra ?? null,
    maternal_gotra: p.community?.maternalGotra ?? null,
    mool: p.community?.mool ?? null,
    gram: p.community?.gram ?? null,
    height_cm: p.heightCm,
    diet: p.lifestyle?.diet ?? null,
    about_snippet: p.about ? p.about.slice(0, 200) : null,
    profile_complete: 100,
    profile_status: 'active',
    native_place_name: p.location?.native ?? null,
    current_loc_name: p.location?.current ?? null,
    job_loc_name: p.location?.work ?? null,
    has_photo: p.photos.length > 0,
    primary_photo_url: p.photos[0] ?? null,
    employer: p.career?.employer ?? null,
    profession_detail: p.career?.detail ?? null,
    job_title: p.career?.jobTitle ?? null,
    education_detail: p.education?.detail ?? null,
    degree: p.education?.degree ?? null,
    specialization: p.education?.specialization ?? null,
    institution: p.education?.institution ?? null,
    smoking: p.lifestyle?.smoking ?? null,
    drinking: p.lifestyle?.drinking ?? null,
    marital_status: p.maritalStatus,
    marriage_timeline: p.lifestyle?.marriageTimeline ?? null,
    family_type: p.family?.type ?? null,
    preferences: p.preferences ?? null,
    match: null,
  }
}

// ─── The profile ────────────────────────────────────────────────────────────

export function DigitalProfileView({
  profile: p, profileId, mode, viewerIsMember = false, nested = false,
}: {
  profile: SharedProfile
  /** Only used for a signed-in visitor's link to the full member profile. */
  profileId: string | null
  mode: ProfileMode
  viewerIsMember?: boolean
  /** Inside another page (the landing): headings step down below that page's H1. */
  nested?: boolean
}) {
  const first = p.displayName.split(' ')[0]
  const meta = [p.age ? `${p.age}` : null, p.gender, height(p.heightCm)].filter(Boolean).join(' · ')
  const c = p.community
  const identity = [c?.caste, c?.selfGotra ? `${c.selfGotra} Gotra` : null].filter(Boolean) as string[]
  const roots: Array<[string, string | null | undefined]> = [
    ['Gotra', c?.selfGotra], ['Maternal gotra', c?.maternalGotra], ['Mool', c?.mool],
    ['Native village', c?.gram], ['Native place', p.location?.native],
  ]
  const hasRoots = roots.some(([, v]) => v)
  let n = 3
  const Name: Level = nested ? 'h3' : 'h1'
  const h: Level = nested ? 'h4' : 'h2'
  const H = h

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-5 sm:py-8">
      {mode === 'demo' && (
        <p className="dp-demo-ribbon dp-rise rounded-full px-4 py-1.5 text-center text-[11.5px] font-bold uppercase tracking-[0.2em]">
          Sample profile · fictional
        </p>
      )}

      {mode !== 'demo' && (
        <section className="dp-rise rounded-mj-lg border border-gold/40 bg-cream/70 px-5 py-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terra">A Digital Profile shared with you</p>
          <p className="mx-auto mt-1.5 max-w-md text-[13.5px] leading-relaxed text-ink-soft">
            {first}&rsquo;s family sent you this Mithila Jodi Digital Profile directly. Mithila Jodi is a matrimonial
            platform for Maithil families. You do not need an account to read it.
          </p>
        </section>
      )}

      {mode === 'public' && viewerIsMember && profileId && (
        <section className="rounded-mj border border-maroon/30 bg-maroon/[0.05] px-4 py-3 text-center">
          <p className="text-[13.5px] leading-snug text-ink">You&rsquo;re signed in — open the full profile to shortlist or send an interest.</p>
          <Link href={`/profile/${profileId}`} className="btn-primary mt-2.5 inline-flex px-5 py-2 text-[14px]">View on Mithila Jodi</Link>
        </section>
      )}

      {/* Hero */}
      <section className="dp-hero dp-rise rounded-[22px] px-5 pb-7 pt-8 text-center shadow-mj" style={{ ['--i' as string]: 1 }}>
        <p className="relative text-[10.5px] font-semibold uppercase tracking-[0.32em] text-gold-lt">
          Mithila Jodi · Digital Profile
        </p>
        <div className="dp-portrait relative mt-5">
          <span className="dp-portrait-ring" aria-hidden="true" />
          <span className="dp-portrait-img">
            {mode === 'demo' && !p.photos[0] ? <DemoPortrait /> : p.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photos[0]} alt={p.displayName} className="h-full w-full object-cover object-[center_35%]" />
            ) : (
              <span className="grid h-full w-full place-items-center font-serif text-[44px] text-maroon/70">
                {p.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </span>
        </div>
        <Name className="relative mt-4 font-serif text-[30px] leading-tight sm:text-[36px]">{p.displayName}</Name>
        {meta && <p className="relative mt-1 text-[14px] text-cream/85">{meta}</p>}
        {p.location?.current && <p className="relative mt-2 text-[14px] text-cream">{p.location.current}</p>}
        {p.location?.native && <p className="relative text-[13px] italic text-gold-lt">Originally from {p.location.native}</p>}
        {identity.length > 0 && (
          <div className="relative mt-4 flex flex-wrap justify-center gap-2">
            {identity.map(x => <span key={x} className="dp-pill">{x}</span>)}
          </div>
        )}
        <p className="relative mt-5 font-deva text-[12px] text-gold-lt/90" lang="hi">जहाँ परंपरा मिले, प्रेम से</p>
      </section>

      {p.photos.length > 1 && <SharedPhotoCarousel photos={p.photos} name={p.displayName} />}

      <section aria-label="Profile at a glance" className="dp-panel dp-rise" style={{ ['--i' as string]: 2 }}>
        <H className="dp-panel-title">At a glance</H>
        <p className="mb-3 text-xs text-ink-soft">The details families read first — swipe or use the arrows.</p>
        <ProfileCardGallery3D profile={toCard(p, profileId ?? 'demo')} />
      </section>

      {p.about && (
        <Panel h={h} title={`About ${first}`} i={n++}>
          <p className="whitespace-pre-wrap py-1.5 font-serif text-[16px] leading-relaxed text-ink">{p.about}</p>
        </Panel>
      )}

      {hasRoots && (
        <Panel h={h} title="Mithila roots" i={n++} className="dp-roots">
          <div className="grid grid-cols-2 gap-2.5 pb-2 pt-1">
            {roots.filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="dp-tile">
                <p className="text-[10.5px] uppercase tracking-[0.12em] text-ink-soft">{label}</p>
                <p className="mt-0.5 font-serif text-[16px] leading-snug text-maroon">{value}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {(c?.religion || c?.caste || c?.subCaste || p.motherTongue) && (
        <Panel h={h} title="Community" i={n++}>
          <Fact label="Religion" value={c?.religion} />
          <Fact label="Caste" value={c?.caste} />
          <Fact label="Sub-caste" value={c?.subCaste} />
          <Fact label="Mother tongue" value={p.motherTongue} />
        </Panel>
      )}

      {hasAny(p.education) && p.education && (
        <Panel h={h} title="Education" i={n++}>
          <Fact label="Degree" value={p.education.degree} />
          <Fact label="Specialisation" value={p.education.specialization} />
          <Fact label="Institution" value={p.education.institution} />
          <Fact label="Year" value={p.education.passingYear} />
          <Fact label="Details" value={p.education.detail} />
        </Panel>
      )}

      {hasAny(p.career) && p.career && (
        <Panel h={h} title="Career" i={n++}>
          <Fact label="Role" value={p.career.jobTitle} />
          <Fact label="Employer" value={p.career.employer} />
          <Fact label="Industry" value={p.career.industry} />
          <Fact label="Employment" value={p.career.employmentType} />
          <Fact label="Work type" value={p.career.workType} />
          <Fact label="Experience" value={p.career.experienceYears ? `${p.career.experienceYears} years` : null} />
          <Fact label="Details" value={p.career.detail} />
        </Panel>
      )}

      {(p.location?.current || p.location?.work) && p.location && (
        <Panel h={h} title="Location" i={n++}>
          <Fact label="Lives in" value={p.location.current} />
          <Fact label="Works in" value={p.location.work} />
        </Panel>
      )}

      {hasAny(p.family) && p.family && (
        <Panel h={h} title="Family" i={n++}>
          <Fact label="Family type" value={p.family.type} />
          <Fact label="Values" value={p.family.values} />
          <Fact label="Parents" value={p.family.parents} />
          <Fact label="Siblings" value={p.family.siblings} />
          <Fact label="About" value={p.family.about} />
          <Fact label="Introduction" value={p.family.introduction} />
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

      {hasAny(p.contact) && p.contact ? (
        <Panel h={h} title="Contact" i={n++}>
          <Fact label={p.contact.relation ? `Mobile (${p.contact.relation})` : 'Mobile'} value={p.contact.mobile} />
          <Fact label="Email" value={p.contact.email} />
          <Fact label="Address" value={p.contact.address} />
        </Panel>
      ) : mode !== 'demo' ? (
        <section className="rounded-mj border border-gold/40 bg-gold/[0.07] px-4 py-4 text-center">
          <p className="font-serif text-[17px] leading-snug text-maroon">Interested in this profile?</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
            Contact details are not part of this link. Join Mithila Jodi free, send an interest, and you can
            request their number once they accept.
          </p>
          <Link href="/register" className="btn-primary mt-3 inline-flex px-5 py-2.5 text-[14px]">Create a free account</Link>
        </section>
      ) : null}

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
          <p className="mt-1 font-deva text-[12px] text-ink-soft">जहाँ परंपरा मिले, प्रेम से</p>
          <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-ink-soft">
            Shared privately by a member. Please do not forward it without asking them first.
          </p>
          <div className="mx-auto mt-4 max-w-sm rounded-mj border border-gold/35 bg-cream px-4 py-4">
            <p className="font-serif text-[16px] text-maroon">Your story deserves a profile like this</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">Create your own Digital Profile — free, and you decide what it shows.</p>
            <Link href={DIGITAL_PROFILE_PATH} className="btn-primary mt-3 inline-flex px-4 py-2 text-[13.5px]">
              Create your own Digital Profile
            </Link>
          </div>
        </footer>
      )}
    </div>
  )
}
