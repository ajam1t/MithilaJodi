import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { loadSharedProfile, type SharedProfile } from '@/lib/profileShare'
import { SharedPhotoCarousel } from '@/components/SharedPhotoCarousel'
import ProfileCardGallery3D from '@/components/ProfileCardGallery3D'
import type { SearchCard } from '@/types/profile'

export const dynamic = 'force-dynamic'

/**
 * A profile shared by link.
 *
 * `noindex, nofollow` and /p/ is disallowed in robots.txt. Both are needed:
 * robots.txt only asks a crawler not to fetch, and a URL discovered elsewhere
 * (pasted into a public group, a forum, a comment) can still be indexed without
 * the meta tag.
 *
 * The metadata is deliberately generic — no name, no photo, no details. WhatsApp
 * and Meta fetch and cache link previews on a public CDN, so a preview carrying
 * a real person's face and name would leak exactly what this page is careful
 * about before anyone even opens it.
 */
export const metadata: Metadata = {
  title: 'A marriage biodata shared with you — Mithila Jodi',
  description: 'A Mithila Jodi member has shared their marriage biodata with you.',
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: 'A marriage biodata shared with you',
    description: 'Shared privately through Mithila Jodi.',
    images: ['/og-card.png'],
    siteName: 'Mithila Jodi',
  },
  twitter: { card: 'summary_large_image', title: 'A marriage biodata shared with you' },
}

// ─── Presentation ────────────────────────────────────────────────────────────

function Fact({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gold/15 last:border-0">
      <span className="w-[42%] sm:w-[38%] shrink-0 text-[11.5px] uppercase tracking-wide text-ink-soft leading-snug pt-0.5">
        {label}
      </span>
      <span className="text-[14.5px] text-ink leading-snug">{value}</span>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-mj border border-gold/30 bg-cream shadow-mj-xs overflow-hidden">
      <h2 className="bg-maroon-gradient text-cream text-[12px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5">
        {title}
      </h2>
      <div className="px-4 py-2.5">{children}</div>
    </section>
  )
}

/** True when a panel would render nothing — so it can be dropped entirely. */
function hasAny(obj: Record<string, unknown> | null): boolean {
  if (!obj) return false
  return Object.values(obj).some(v => v != null && v !== '')
}

function heightLabel(cm: number | null): string | null {
  if (!cm) return null
  const inches = Math.round(cm / 2.54)
  return `${Math.floor(inches / 12)}'${inches % 12}" · ${cm} cm`
}

/**
 * The shared projection, shaped for the rotating profile card.
 *
 * Built from `SharedProfile` rather than from the database row on purpose: that
 * projection has already had the owner's per-section choices applied, so a
 * section they chose not to share cannot reappear here. Anything absent stays
 * null and the card simply omits that face.
 *
 * `match` is left null — a score needs a viewer to compare against, and this
 * page is designed to work with no account at all.
 */
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

/**
 * The opening panel.
 *
 * Whoever opens this link may never have heard of Mithila Jodi — it arrives on
 * WhatsApp from a relative with no context. Leading straight into a stranger's
 * biodata is disorienting, so the page says what this is and where it came from
 * before showing anyone's details.
 */
function WelcomeIntro({ name }: { name: string }) {
  return (
    <section className="rounded-mj-lg border border-gold/40 bg-cream/70 px-5 py-5 text-center shadow-mj-xs">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terra">Welcome to Mithila Jodi</p>
      <h2 className="mt-2 font-serif text-[21px] leading-snug text-maroon sm:text-[23px]">
        A marriage biodata has been shared with you
      </h2>
      <div className="ornament-line mx-auto my-3 w-16" />
      <p className="mx-auto max-w-md text-[13.5px] leading-relaxed text-ink-soft">
        Mithila Jodi is a matrimonial platform for the Maithil community, where families
        look for an alliance the way Mithila reads a profile — gotra, mool and native
        place first. <span className="text-ink">{name}&rsquo;s</span> family has sent you this
        page directly. You do not need an account to read it.
      </p>
    </section>
  )
}

function ProfileView({
  profile, profileId, viewerIsMember,
}: {
  profile: SharedProfile
  profileId: string
  viewerIsMember: boolean
}) {
  const p = profile
  const metaLine = [
    p.age ? `${p.age} yrs` : null,
    p.gender,
    heightLabel(p.heightCm),
    p.maritalStatus,
  ].filter(Boolean).join(' · ')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <WelcomeIntro name={p.displayName.split(' ')[0]} />

      {/* A signed-in visitor is already a member, so the shared projection is
          strictly less than what they are entitled to see. Point them at the
          real profile — which enforces its own access rules — instead of
          leaving them on a cut-down copy and asking them to register again. */}
      {viewerIsMember && (
        <section className="rounded-mj border border-maroon/30 bg-maroon/[0.05] px-4 py-3 text-center">
          <p className="text-[13.5px] leading-snug text-ink">
            You&rsquo;re signed in to Mithila Jodi — open the full profile to shortlist or send an interest.
          </p>
          <Link href={`/profile/${profileId}`}
            className="btn-primary mt-2.5 inline-flex px-5 py-2 text-[14px]">
            View on Mithila Jodi
          </Link>
        </section>
      )}

      {/* Header card */}
      <section className="rounded-mj-lg border border-gold/40 bg-cream shadow-mj overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-maroon via-gold to-maroon" aria-hidden="true" />
        <div className="px-5 pt-5 pb-4 text-center">
          {p.photos[0] ? (
            <div className="mx-auto mb-3 h-28 w-28 rounded-full overflow-hidden border-[3px] border-gold/60 shadow-mj-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photos[0]} alt={p.displayName} className="h-full w-full object-cover object-[center_35%]" />
            </div>
          ) : (
            <div className="mx-auto mb-3 h-28 w-28 rounded-full grid place-items-center bg-paper-2 border-[3px] border-gold/40">
              <span className="font-serif text-4xl text-maroon/70">{p.displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}

          <h1 className="font-serif text-[26px] sm:text-[30px] text-maroon leading-tight">{p.displayName}</h1>
          {metaLine && <p className="text-ink-soft text-[13.5px] mt-1.5">{metaLine}</p>}
          {p.location?.current && (
            <p className="text-terra text-[13.5px] mt-1">
              {[p.location.current, p.location.native].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="ornament-line w-16 mx-auto mt-3" />
        </div>
      </section>

      {/* More than one photograph gets the rotating deck. This replaced a strip
          of small thumbnails: the photographs are the first thing a family
          looks at, and a thumbnail row makes them work for it. */}
      {p.photos.length > 1 && (
        <SharedPhotoCarousel photos={p.photos} name={p.displayName} />
      )}

      {/* The same rotating card the platform uses, so a shared link feels like
          the product rather than a print-out of it. Built from the shared
          projection, so the owner's section choices still apply. */}
      <section aria-label="Profile at a glance"
        className="rounded-mj border border-gold/30 bg-cream px-4 py-4 shadow-mj-xs">
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">At a glance</p>
        <p className="mb-3 text-xs text-ink-soft">The details families read first — swipe or use the arrows.</p>
        <ProfileCardGallery3D profile={toCard(p, profileId)} />
      </section>

      {p.about && (
        <Panel title="About">
          <p className="text-[14.5px] leading-relaxed text-ink whitespace-pre-wrap py-1">{p.about}</p>
        </Panel>
      )}

      {hasAny(p.community) && p.community && (
        <Panel title="Community">
          <Fact label="Religion" value={p.community.religion} />
          <Fact label="Caste" value={p.community.caste} />
          <Fact label="Sub-caste" value={p.community.subCaste} />
          <Fact label="Gotra" value={p.community.selfGotra} />
          <Fact label="Maternal gotra" value={p.community.maternalGotra} />
          <Fact label="Mool" value={p.community.mool} />
          <Fact label="Gram" value={p.community.gram} />
          <Fact label="Mother tongue" value={p.motherTongue} />
        </Panel>
      )}

      {hasAny(p.education) && p.education && (
        <Panel title="Education">
          <Fact label="Degree" value={p.education.degree} />
          <Fact label="Specialisation" value={p.education.specialization} />
          <Fact label="Institution" value={p.education.institution} />
          <Fact label="Year" value={p.education.passingYear} />
          <Fact label="Details" value={p.education.detail} />
        </Panel>
      )}

      {hasAny(p.career) && p.career && (
        <Panel title="Career">
          <Fact label="Role" value={p.career.jobTitle} />
          <Fact label="Employer" value={p.career.employer} />
          <Fact label="Industry" value={p.career.industry} />
          <Fact label="Employment" value={p.career.employmentType} />
          <Fact label="Work type" value={p.career.workType} />
          <Fact label="Experience" value={p.career.experienceYears ? `${p.career.experienceYears} years` : null} />
          <Fact label="Details" value={p.career.detail} />
        </Panel>
      )}

      {hasAny(p.location) && p.location && (
        <Panel title="Location">
          <Fact label="Currently in" value={p.location.current} />
          <Fact label="Native place" value={p.location.native} />
          <Fact label="Works in" value={p.location.work} />
        </Panel>
      )}

      {hasAny(p.lifestyle) && p.lifestyle && (
        <Panel title="Lifestyle">
          <Fact label="Diet" value={p.lifestyle.diet} />
          <Fact label="Smoking" value={p.lifestyle.smoking} />
          <Fact label="Drinking" value={p.lifestyle.drinking} />
          <Fact label="Marriage timeline" value={p.lifestyle.marriageTimeline} />
        </Panel>
      )}

      {hasAny(p.family) && p.family && (
        <Panel title="Family">
          <Fact label="Family type" value={p.family.type} />
          <Fact label="Values" value={p.family.values} />
          <Fact label="Parents" value={p.family.parents} />
          <Fact label="Siblings" value={p.family.siblings} />
          <Fact label="About" value={p.family.about} />
          <Fact label="Introduction" value={p.family.introduction} />
        </Panel>
      )}

      {p.preferences && (
        <Panel title="Looking for">
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
          {p.preferences.gotraSafe && (
            <p className="pt-2 text-[12px] text-ink-soft leading-snug">
              Gotra-safe matches only.
            </p>
          )}
        </Panel>
      )}

      {hasAny(p.horoscope) && p.horoscope && (
        <Panel title="Horoscope">
          <Fact label="Rashi" value={p.horoscope.rashi} />
          <Fact label="Nakshatra" value={p.horoscope.nakshatra} />
          <Fact label="Manglik" value={p.horoscope.manglik} />
          <Fact label="Birth time" value={p.horoscope.birthTime} />
          <Fact label="Birth place" value={p.horoscope.birthPlace} />
        </Panel>
      )}

      {hasAny(p.contact) && p.contact ? (
        <Panel title="Contact">
          {/* Whose number this is, when the member said. "Mobile (Father)"
              rather than a possessive, so it reads correctly for every option
              including "Guardian" and "Other relative". */}
          <Fact
            label={p.contact.relation ? `Mobile (${p.contact.relation})` : 'Mobile'}
            value={p.contact.mobile}
          />
          <Fact label="Email" value={p.contact.email} />
          <Fact label="Address" value={p.contact.address} />
        </Panel>
      ) : (
        /* Contact is off by default, so this is the normal case rather than an
           edge one — say what to do next instead of leaving a dead end. */
        <section className="rounded-mj border border-gold/40 bg-gold/[0.07] px-4 py-4 text-center">
          <p className="font-serif text-[17px] text-maroon leading-snug">Interested in this profile?</p>
          <p className="text-[13.5px] text-ink-soft leading-relaxed mt-1.5">
            Contact details are not part of this link. Join Mithila Jodi free, send an interest, and
            you can request their number once they accept.
          </p>
          <Link href="/register" className="btn-primary mt-3 inline-flex text-[14px] px-5 py-2.5">
            Create a free account
          </Link>
        </section>
      )}

      {/* Brand footer — the conversion path, and the provenance of the page. */}
      <footer className="text-center pt-3 pb-2">
        <div className="ornament-line w-14 mx-auto mb-3" />
        <Link href="/" className="font-serif text-maroon text-[18px] leading-none">Mithila Jodi</Link>
        <p className="font-deva text-ink-soft text-[12px] mt-1">जहाँ परम्परा मिले, प्रेम से</p>
        <p className="text-ink-soft text-[12px] mt-2 leading-relaxed max-w-sm mx-auto">
          Shared privately by a member. Please do not forward it on without asking them first.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-3">
          <Link href="/register" className="btn-primary text-[13.5px] px-4 py-2">Join free</Link>
          <Link href="/marriage-biodata" className="btn-ghost text-[13.5px] px-4 py-2">Make your own biodata</Link>
        </div>
      </footer>
    </div>
  )
}

function Unavailable({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="ornament-line w-14 mx-auto mb-5" />
      <h1 className="font-serif text-[24px] text-maroon leading-tight">{title}</h1>
      <p className="text-ink-soft text-[14px] leading-relaxed mt-2.5">{body}</p>
      <div className="flex flex-wrap gap-3 justify-center mt-5">
        <Link href="/" className="btn-primary text-[14px] px-5 py-2.5">Visit Mithila Jodi</Link>
        <Link href="/marriage-biodata" className="btn-ghost text-[14px] px-5 py-2.5">Make a biodata</Link>
      </div>
    </div>
  )
}

export default async function SharedProfilePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = await createAdminClient()
  const result = await loadSharedProfile(admin, token)

  // These three states are told apart on purpose. "Turned off" and "expired"
  // are useful to a real recipient — they know to ask for a new link — and the
  // small amount they reveal (that a token once existed) does not matter
  // against a 128-bit random token, where probing is not a realistic attack.
  if (result.status === 'revoked') {
    return (
      <main id="main-content" className="min-h-screen bg-paper">
        <Unavailable
          title="This link has been turned off"
          body="The member who shared it has withdrawn access. If they meant to send it to you, ask them for a new link."
        />
      </main>
    )
  }
  if (result.status === 'expired') {
    return (
      <main id="main-content" className="min-h-screen bg-paper">
        <Unavailable
          title="This link has expired"
          body="Shared profile links do not last forever. Ask the member for a fresh one."
        />
      </main>
    )
  }
  if (result.status === 'missing') {
    return (
      <main id="main-content" className="min-h-screen bg-paper">
        <Unavailable
          title="Profile not available"
          body="This link is not valid, or the profile is no longer active."
        />
      </main>
    )
  }

  // Whether the visitor is already a member. Only used to offer a link to the
  // full profile — the shared projection itself is identical either way, so a
  // failure to read the session degrades to the no-account experience.
  let viewerIsMember = false
  try {
    viewerIsMember = (await getSessionAccount()) !== null
  } catch (err) {
    console.error('[p/token] session probe failed:', err)
  }

  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <ProfileView
        profile={result.profile}
        profileId={result.profileId}
        viewerIsMember={viewerIsMember}
      />
    </main>
  )
}
