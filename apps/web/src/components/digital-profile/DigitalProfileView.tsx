import Link from 'next/link'
import type { ReactNode } from 'react'
import '@/styles/digital-profile.css'
import type { SharedProfile } from '@/lib/profileShare'
import { SharedPhotoCarousel } from '@/components/SharedPhotoCarousel'
import { DemoPortrait } from '@/components/digital-profile/DemoPortrait'

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
  profile: p, mode, audience = 'visitor', connection, nested = false,
}: {
  profile: SharedProfile
  /** Kept for callers; the view itself no longer needs it. */
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
    [c?.caste, c?.subCaste].filter(Boolean).join(' · ') || null,
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

      {/* ── Identity: who is this person? No photo here — the gallery has them. */}
      <header className="dp-identity dp-rise" style={{ ['--i' as string]: 0 }}>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.3em] text-[#8A6516]">Mithila Jodi · Digital Profile</p>
        <Name className="mt-2 font-serif text-[30px] leading-[1.1] text-maroon sm:text-[36px]">{p.displayName}</Name>
        {meta && <p className="mt-1.5 text-[14.5px] text-ink">{meta}</p>}
        {place && <p className="mt-0.5 text-[14px] text-ink-soft">{place}</p>}
        {chips.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Community">
            {chips.map(x => <li key={x} className="dp-chip">{x}</li>)}
          </ul>
        )}
        {mode !== 'demo' && audience === 'visitor' && (
          <p className="mt-3 border-t border-gold/20 pt-2.5 text-[12.5px] leading-relaxed text-ink-soft">
            Shared with you by {first}&rsquo;s family on Mithila Jodi, a matrimonial platform for Maithil families. No account needed to read it.
          </p>
        )}
      </header>

      {/* ── Photographs: the one place they appear. */}
      {photos.length > 1 ? (
        <div className="dp-rise" style={{ ['--i' as string]: 1 }}>
          <SharedPhotoCarousel photos={photos} name={p.displayName} />
        </div>
      ) : (photos.length === 1 || mode === 'demo') && (
        <figure className="dp-rise mx-auto w-[72%] max-w-[300px]" style={{ ['--i' as string]: 1 }}>
          <div className="aspect-[4/5] overflow-hidden rounded-[20px] border border-gold/45 bg-paper-2 shadow-mj-sm">
            {photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[0]} alt={`${p.displayName}, photograph`} className="h-full w-full object-cover object-[center_30%]" />
            ) : <DemoPortrait />}
          </div>
        </figure>
      )}

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

      {hasAny(p.contact) && p.contact && (
        <Panel h={h} title="Contact" i={n++}>
          <Fact label={p.contact.relation ? `Mobile (${p.contact.relation})` : 'Mobile'} value={p.contact.mobile} />
          <Fact label="Email" value={p.contact.email} />
          <Fact label="Address" value={p.contact.address} />
        </Panel>
      )}

      {/* ── Actions: the only part that differs by who is looking. */}
      {mode === 'public' && audience === 'member' && connection}

      {mode !== 'demo' && audience === 'visitor' && (
        // The growth loop's last step: someone a member shared with joins, and
        // gets a Digital Profile of their own to share.
        <section className="rounded-[20px] border border-gold/40 bg-cream px-5 py-5 text-center shadow-mj-xs" aria-label="Join Mithila Jodi">
          <p className="font-serif text-[20px] leading-tight text-maroon">Interested in {first}?</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-ink-soft">
            {hasAny(p.contact)
              ? 'Join Mithila Jodi free to send an interest and find your own Jodi.'
              : 'Contact details are not part of this link. Join Mithila Jodi free, send an interest, and you can request their number once they accept.'}
          </p>
          <Link href="/register?start=1" className="btn-primary mt-4 inline-flex px-6 py-2.5 text-[14.5px]">Join Mithila Jodi →</Link>
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
