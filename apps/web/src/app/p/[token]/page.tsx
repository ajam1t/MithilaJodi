import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { loadSharedProfile, type SharedProfile } from '@/lib/profileShare'

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

function ProfileView({ profile }: { profile: SharedProfile }) {
  const p = profile
  const metaLine = [
    p.age ? `${p.age} yrs` : null,
    p.gender,
    heightLabel(p.heightCm),
    p.maritalStatus,
  ].filter(Boolean).join(' · ')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header card */}
      <section className="rounded-mj-lg border border-gold/40 bg-cream shadow-mj overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-maroon via-gold to-maroon" aria-hidden="true" />
        <div className="px-5 pt-5 pb-4 text-center">
          {p.photos[0] ? (
            <div className="mx-auto mb-3 h-28 w-28 rounded-full overflow-hidden border-[3px] border-gold/60 shadow-mj-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photos[0]} alt={p.displayName} className="h-full w-full object-cover" />
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

      {/* Extra photos. The column count follows the number of photos — a fixed
          3-column grid left a single extra photo sitting at a third of the
          width, which reads as a broken layout rather than a gallery. */}
      {p.photos.length > 1 && (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(p.photos.length - 1, 3)}, minmax(0, 1fr))` }}
        >
          {p.photos.slice(1, 4).map((src, i) => (
            <div key={src} className="aspect-[3/4] rounded-mj-sm overflow-hidden border border-gold/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${p.displayName}, photo ${i + 2}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

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
          <Fact label="Mobile" value={p.contact.mobile} />
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

  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <ProfileView profile={result.profile} />
    </main>
  )
}
