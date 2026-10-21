'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProfileCardGallery3D, { galleryFaceCount } from '@/components/ProfileCardGallery3D'
import { Spinner } from '@/components/ui'
import type { SearchCard, PartnerPreferencesDisplay } from '@/types/profile'
import { normalisePhotoVisibility } from '@/lib/photoVisibility'
import { ProfileStory } from '@/components/profile/ProfileStory'

type AccountInfo = { id: string; mobile: string; role: string }

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  gender: string | null
  dob: string | null
  profile_for: string | null
  self_gotra: string | null
  maternal_gotra: string | null
  mool: string | null
  gram: string | null
  caste: string | null
  sub_caste: string | null
  height_cm: number | null
  diet: string | null
  smoking: string | null
  drinking: string | null
  about_me: string | null
  family_about: string | null
  education_detail: string | null
  profession_detail: string | null
  employer: string | null
  native_place_id: number | null
  current_loc_id: number | null
  marriage_timeline: string | null
  discoverable: boolean
  profile_complete: number | null
  profile_status: string | null
  // ── V10 additive fields ──
  marital_status: string | null
  mother_tongue: string | null
  degree: string | null
  specialization: string | null
  institution: string | null
  passing_year: number | null
  employment_type: string | null
  industry: string | null
  job_title: string | null
  experience_years: number | null
  work_type: string | null
  family_type: string | null
  managed_by: string | null
  family_values: string | null
  parents_info: string | null
  siblings_info: string | null
  family_expectations: string | null
  family_introduction: string | null
}

type Photo = {
  id: string
  is_primary: boolean
  status: string
  signed_url: string | null
}

type Preferences = {
  pref_age_min: number | null
  pref_age_max: number | null
  pref_gender: string | null
  pref_caste: string[] | null
  pref_gotra_safe: boolean
  pref_diet: string[] | null
  pref_notes: string | null
}

type Tab = 'story' | 'details' | 'roots' | 'photos'

function age(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function formatHeight(cm: number) {
  const totalIn = Math.round(cm / 2.54)
  return `${Math.floor(totalIn / 12)}′${totalIn % 12}″ (${cm} cm)`
}

// Humanize a master-data value (e.g. "never_married" → "Never married") for display.
function humanize(v: string | null | undefined): string | null {
  if (!v) return null
  const s = v.replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const TIMELINE_LABELS: Record<string, string> = {
  within_3_months: 'Within 3 months',
  within_6_months: 'Within 6 months',
  within_1_year:   'Within 1 year',
  within_2_years:  'Within 2 years',
  no_rush:         'No rush',
}

/**
 * The profile-completion checklist shown on the member's own profile.
 *
 * The percentage and ring already existed, but they were passive: a number in a
 * corner tells a member they are "60%" without telling them which 40% is
 * missing or how to add it. Members were landing here straight after the
 * four-field onboarding gate and stopping, because nothing pointed them at the
 * next thing to fill.
 *
 * Each row mirrors exactly one of the twelve checks in computeCompletion()
 * (app/api/profile/route.ts), so the bar here always agrees with the stored
 * profile_complete used to rank search results. Missing rows deep-link into the
 * matching section of the editor via its URL hash.
 */
const CHECKLIST: { label: string; section: string; has: (p: Profile) => boolean }[] = [
  { label: 'Name',             section: 'basic',     has: p => !!p.first_name },
  { label: 'Bride or groom',   section: 'basic',     has: p => !!p.gender },
  { label: 'Date of birth',    section: 'basic',     has: p => !!p.dob },
  { label: 'Height',           section: 'basic',     has: p => p.height_cm != null },
  { label: 'Marital status',   section: 'basic',     has: p => !!p.marital_status },
  { label: 'Mother tongue',    section: 'basic',     has: p => !!p.mother_tongue },
  { label: 'Diet',             section: 'basic',     has: p => !!p.diet },
  { label: 'Caste / community', section: 'community', has: p => !!p.caste },
  { label: 'Gotra',            section: 'community', has: p => !!p.self_gotra },
  { label: 'Native place',     section: 'location',  has: p => p.native_place_id != null },
  { label: 'Current location', section: 'location',  has: p => p.current_loc_id != null },
  { label: 'About you',        section: 'about',     has: p => !!p.about_me },
]

// ─── Presentation ────────────────────────────────────────────────────────────

/** Uppercase section label used across the page. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6516]">{children}</h2>
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[12.5px] text-ink-soft">{label}</dt>
      <dd className="text-right text-[14px] leading-snug text-ink">{value}</dd>
    </div>
  )
}

/** A titled group of rows. Renders nothing when every row is empty. */
function Group({ title, rows, children, roots = false }: {
  title: string
  rows?: Array<[string, string | null | undefined]>
  children?: React.ReactNode
  roots?: boolean
}) {
  const filled = (rows ?? []).filter(([, v]) => !!v)
  if (filled.length === 0 && !children) return null
  return (
    <section className={`rounded-[18px] border p-4 sm:p-5 ${roots ? 'border-gold/40 bg-[#FFFBF3]' : 'border-gold/25 bg-cream'}`} aria-label={title}>
      <Eyebrow>{title}</Eyebrow>
      {roots && <div className="mt-2 h-px w-12 bg-gradient-to-r from-gold to-transparent" aria-hidden="true" />}
      {filled.length > 0 && (
        <dl className="mt-1.5 divide-y divide-gold/15">
          {filled.map(([l, v]) => <Row key={l} label={l} value={v} />)}
        </dl>
      )}
      {children}
    </section>
  )
}

/** Completion as a gold ring drawn around the photo arch. */
function CompletionRing({ pct }: { pct: number }) {
  return (
    <svg viewBox="0 0 120 140" className="mj-me-ring" aria-hidden="true">
      <path d="M60 4C30 4 8 26 8 56v58a22 22 0 0 0 22 22h60a22 22 0 0 0 22-22V56C112 26 90 4 60 4Z" fill="none" stroke="rgba(185,138,46,.25)" strokeWidth="3" />
      <path d="M60 4C30 4 8 26 8 56v58a22 22 0 0 0 22 22h60a22 22 0 0 0 22-22V56C112 26 90 4 60 4Z" fill="none" stroke={pct >= 100 ? '#B98A2E' : '#7A1220'} strokeWidth="3.4" strokeLinecap="round"
        pathLength={100} strokeDasharray={`${pct} 100`} className="mj-me-ring-fill" />
    </svg>
  )
}

const ICON = {
  lock: 'M6 11h12v9.5H6V11Zm2.5 0V8a3.5 3.5 0 0 1 7 0v3',
  bell: 'M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5M10.3 20.5a1.9 1.9 0 0 0 3.4 0',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-1.5 1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-1.7 1l-.3 2h-4l-.3-2a7 7 0 0 1-1.7-1l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-2l-1.6-1.2 2-3.4 1.9.7a7 7 0 0 1 1.7-1l.3-2h4l.3 2a7 7 0 0 1 1.7 1l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 2Z',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
}

function Glyph({ d, className = 'h-[18px] w-[18px]' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={d} />
    </svg>
  )
}

// About me tells the profile as a story; Details holds the facts; Roots &
// Preferences puts lineage beside who they hope to meet; Photos manages them.
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'story', label: 'About me' },
  { id: 'details', label: 'Details' },
  { id: 'roots', label: 'Roots & Preferences' },
  { id: 'photos', label: 'Photos' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

/**
 * The member's own profile: "this is me, and this is where I manage it".
 * Identity first, then the details in tabs, the gallery of how families see
 * the profile, and the account rows. No promotional cards — Digital Profile,
 * Biodata and the WhatsApp community all have their own homes.
 */
export default function ProfilePage() {
  const router = useRouter()
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  // The same preferences with id arrays resolved and values formatted — read by
  // the Preferences tab and the gallery's "Looking for" face.
  const [prefsDisplay, setPrefsDisplay] = useState<PartnerPreferencesDisplay | null>(null)
  const [photoVisibility, setPhotoVisibility] = useState<string | null>(null)
  // Option keys → labels ("maithil_brahmin" → "Maithil Brahmin"), from master data.
  const [labels, setLabels] = useState<Record<string, Record<string, string>>>({})
  const [tab, setTab] = useState<Tab>('story')
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [locationNames, setLocationNames] = useState<{
    native_place_name: string | null
    current_loc_name: string | null
    job_loc_name: string | null
  }>({ native_place_name: null, current_loc_name: null, job_loc_name: null })

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json()),
      // no-store: after editing, the profile must never come from browser cache
      fetch('/api/profile', { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/profile/preferences', { cache: 'no-store' }).then(r => r.json()),
    ])
      .then(([authData, profileData, prefsData]) => {
        if (!authData.ok) { router.replace('/login'); return }
        setAccount(authData.account ?? null)
        if (profileData.profile) setProfile(profileData.profile)
        setPhotos(profileData.photos ?? [])
        setPhotoVisibility(profileData.private?.photo_visibility ?? null)
        setLocationNames({
          native_place_name: profileData.native_place_name ?? null,
          current_loc_name: profileData.current_loc_name ?? null,
          job_loc_name: profileData.job_loc_name ?? null,
        })
        if (prefsData.ok && prefsData.preferences) setPrefs(prefsData.preferences)
        if (prefsData.ok) setPrefsDisplay(prefsData.display ?? null)
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))

    // Master data only (labels), never profile data — so it does not hold up the page.
    fetch('/api/options?types=caste,sub_caste,gotra,mool,religion')
      .then(r => r.json())
      .then(j => {
        if (!j?.ok) return
        const out: Record<string, Record<string, string>> = {}
        for (const [type, list] of Object.entries(j.options as Record<string, Array<{ value: string; label: string }>>)) {
          out[type] = Object.fromEntries(list.map(o => [o.value, o.label]))
        }
        setLabels(out)
      })
      .catch(() => { /* fall back to humanised keys */ })
  }, [router])

  async function handleLogout() {
    setLogoutLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  if (loading) {
    return (
      <main id="main-content" className="min-h-screen bg-paper flex flex-col items-center justify-center gap-3 text-ink-soft">
        <Spinner className="w-8 h-8 text-maroon" />
        <p className="text-sm">Loading your profile…</p>
      </main>
    )
  }

  if (!account) return null

  const L = (type: string, v: string | null | undefined) => (v ? labels[type]?.[v] ?? humanize(v) : null)
  const primaryPhoto = photos.find(p => p.is_primary) ?? photos[0] ?? null
  const displayName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'No name yet' : null
  // The stored score computeCompletion() writes — the one search ranks by.
  const pct = profile?.profile_complete ?? 0
  const missing = profile ? CHECKLIST.filter(c => !c.has(profile)) : []
  const ownPhotoUrl = primaryPhoto?.signed_url ?? null
  const visible = !!profile?.discoverable && profile?.profile_status === 'active'

  const cardProfile: SearchCard | null = profile ? {
    id: profile.id,
    display_name: displayName || 'Your Profile',
    gender: profile.gender ?? '',
    age: profile.dob ? age(profile.dob) : 0,
    religion: null,
    caste: L('caste', profile.caste),
    self_gotra: L('gotra', profile.self_gotra),
    mool: L('mool', profile.mool),
    gram: profile.gram,
    height_cm: profile.height_cm,
    diet: profile.diet,
    about_snippet: profile.about_me ? profile.about_me.slice(0, 200) : null,
    profile_complete: profile.profile_complete ?? 0,
    profile_status: profile.profile_status ?? 'active',
    native_place_name: locationNames.native_place_name,
    current_loc_name: locationNames.current_loc_name,
    has_photo: !!ownPhotoUrl,
    primary_photo_url: ownPhotoUrl,
    employer: profile.employer,
    profession_detail: profile.profession_detail,
    education_detail: profile.education_detail,
    degree: profile.degree,
    specialization: profile.specialization,
    institution: profile.institution,
    smoking: profile.smoking,
    drinking: profile.drinking,
    maternal_gotra: L('gotra', profile.maternal_gotra),
    job_loc_name: locationNames.job_loc_name,
    marriage_timeline: profile.marriage_timeline,
    marital_status: profile.marital_status,
    family_type: profile.family_type,
    job_title: profile.job_title,
    preferences: prefsDisplay,
  } : null

  const education = profile && [
    [profile.degree, profile.specialization].filter(Boolean).join(', '),
    profile.institution,
    profile.passing_year ? `Class of ${profile.passing_year}` : null,
    profile.education_detail,
  ].filter(Boolean) as string[]
  const career = profile && [
    profile.job_title,
    profile.employer,
    profile.profession_detail,
    [humanize(profile.industry), humanize(profile.employment_type), humanize(profile.work_type), profile.experience_years != null ? `${profile.experience_years} yrs experience` : null].filter(Boolean).join(' · '),
  ].filter(Boolean) as string[]

  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 pb-4 pt-5">

        {/* ── Identity: photo in a Mithila arch, completion drawn as a gold ring
               around it, name rising in, a sheen across the card. ── */}
        <section className="mj-me" aria-label="Your profile">
          <div className="mj-me-mesh" aria-hidden="true"><i /><i /></div>
          <div className="relative flex items-center gap-4">
            <div className="mj-me-photo">
              {profile && <CompletionRing pct={pct} />}
              <div className="mj-me-arch">
                {ownPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ownPhotoUrl} alt={displayName ?? 'Your photo'} />
                ) : (
                  <span className="grid h-full w-full place-items-center font-serif text-[34px] text-maroon/70">
                    {profile?.first_name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
              {profile && <span className={`mj-me-pct ${pct >= 100 ? 'is-full' : ''}`}>{pct}%</span>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[#8A6516]">My profile</p>
              <h1 className="mj-me-name">{displayName ?? 'Complete your profile'}</h1>
              {profile?.dob && (
                <p className="mt-0.5 text-[13.5px] text-ink-soft">
                  {[`${age(profile.dob)} yrs`, profile.gender ? (profile.gender === 'male' ? 'Male' : 'Female') : null, locationNames.current_loc_name].filter(Boolean).join(' · ')}
                </p>
              )}
              {profile && (
                <Link href="/profile/edit#visibility" className="mj-me-vis">
                  <span className={`mj-me-dot ${visible ? 'is-on' : ''}`} aria-hidden="true" />
                  {visible ? 'Visible to members' : profile.profile_status && profile.profile_status !== 'active' ? `Profile ${profile.profile_status.replace(/_/g, ' ')}` : 'Hidden from members'}
                  <span aria-hidden="true" className="text-ink-soft">›</span>
                  <span className="sr-only">— change who can see your profile</span>
                </Link>
              )}
            </div>
          </div>
          {profile && (L('gotra', profile.self_gotra) || L('mool', profile.mool) || locationNames.native_place_name) && (
            <ul className="mj-me-roots" aria-label="Your roots">
              {L('gotra', profile.self_gotra) && <li><span>Gotra</span>{L('gotra', profile.self_gotra)}</li>}
              {L('mool', profile.mool) && <li><span>Mool</span>{L('mool', profile.mool)}</li>}
              {locationNames.native_place_name && <li><span>Native</span>{locationNames.native_place_name}</li>}
            </ul>
          )}

          <Link href="/profile/edit" className="relative mt-4 flex min-h-[48px] w-full items-center justify-center rounded-full bg-maroon-gradient text-[15px] font-semibold text-cream shadow-mj-xs transition active:scale-[0.99]">
            {profile ? 'Edit Profile' : 'Create Profile'}
          </Link>


          {/* Completion: a quiet line when done, a clear next step when not. */}
          {profile && (pct >= 100 ? (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[12.5px] text-green">
              <span aria-hidden="true">✓</span>
              {visible ? 'Your profile is visible to the Mithila Jodi community.' : 'Your profile is complete.'}
            </p>
          ) : (
            <div className="mt-3 rounded-mj-sm border border-gold/35 bg-[#FFF8EC] p-3.5">
              <p className="text-[14px] font-semibold text-ink">Your profile is {pct}% complete.</p>
              <p className="mt-0.5 text-[13px] text-ink-soft">Add a few more details to help families discover you.</p>
              {missing.length > 0 && (
                <p className="mt-1.5 text-[12.5px] text-ink-soft">Still to add: {missing.map(m => m.label).join(', ')}.</p>
              )}
              <Link href={`/profile/edit#${missing[0]?.section ?? 'basic'}`} className="mt-2.5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-maroon">
                Complete Profile →
              </Link>
            </div>
          ))}
        </section>
      </div>

      {!profile ? (
        <div className="mx-auto max-w-2xl px-4 py-8 text-center">
          <p className="text-[14px] text-ink-soft">Add your details to start matching with families.</p>
        </div>
      ) : (
        <>
          {/* ── Tabs ── scroll sideways rather than shrinking the text. */}
          <div className="mx-auto max-w-2xl px-4">
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-1 border-b border-gold/25" role="tablist" aria-label="Profile sections">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-3 text-[13.5px] font-semibold tracking-wide transition-colors ${
                      tab === t.id ? 'border-maroon text-maroon' : 'border-transparent text-ink-soft hover:text-ink'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div key={tab} className="mx-auto max-w-2xl space-y-3 px-4 py-4 animate-[fadeIn_.25s_ease] motion-reduce:animate-none" role="tabpanel">
            {tab === 'story' && (
              <>
                <ProfileStory
                  story={null}
                  prefs={prefsDisplay}
                  p={{
                    display_name: displayName || 'You', age: profile.dob ? age(profile.dob) : null, gender: profile.gender ?? '', height_cm: profile.height_cm, photo: ownPhotoUrl,
                    degree: profile.degree, specialization: profile.specialization, institution: profile.institution, passing_year: profile.passing_year, education_detail: profile.education_detail,
                    job_title: profile.job_title, profession_detail: profile.profession_detail, employer: profile.employer, industry: humanize(profile.industry), experience_years: profile.experience_years,
                    current_loc_name: locationNames.current_loc_name, native_place_name: locationNames.native_place_name, job_loc_name: locationNames.job_loc_name, gram: profile.gram,
                    self_gotra: L('gotra', profile.self_gotra), maternal_gotra: L('gotra', profile.maternal_gotra), mool: L('mool', profile.mool), caste: L('caste', profile.caste),
                    family_type: profile.family_type, family_values: profile.family_values, parents_info: profile.parents_info, siblings_info: profile.siblings_info,
                    diet: humanize(profile.diet), mother_tongue: humanize(profile.mother_tongue), marital_status: profile.marital_status, about_me: profile.about_me,
                  }}
                />
                <Link href={`/profile/${profile.id}?preview=1`} className="flex items-center justify-center gap-2 py-2 text-[13.5px] font-medium text-maroon hover:underline hover:underline-offset-4">
                  <Glyph d={ICON.eye} className="h-4 w-4" /> See it exactly as members do →
                </Link>
              </>
            )}

            {tab === 'details' && (
              <>
                <Group title="Personal Details" rows={[
                  ['Height', profile.height_cm ? formatHeight(profile.height_cm) : null],
                  ['Marital status', humanize(profile.marital_status)],
                  ['Mother tongue', humanize(profile.mother_tongue)],
                  ['Diet', humanize(profile.diet)],
                  ['Smoking', humanize(profile.smoking)],
                  ['Drinking', humanize(profile.drinking)],
                  ['Looking to marry', profile.marriage_timeline ? TIMELINE_LABELS[profile.marriage_timeline] ?? null : null],
                  ['Profile for', humanize(profile.profile_for)],
                ]} />
                {((education?.length ?? 0) > 0 || (career?.length ?? 0) > 0) && (
                  <Group title="Education & Career">
                    {education && education.length > 0 && (
                      <div className="mt-2.5">
                        <p className="text-[12px] text-ink-soft">Education</p>
                        <p className="mt-0.5 text-[14.5px] font-medium text-ink">{education[0]}</p>
                        {education.slice(1).map(l => <p key={l} className="text-[13px] text-ink-soft">{l}</p>)}
                      </div>
                    )}
                    {career && career.length > 0 && (
                      <div className="mt-3 border-t border-gold/15 pt-3">
                        <p className="text-[12px] text-ink-soft">Career</p>
                        <p className="mt-0.5 text-[14.5px] font-medium text-ink">{career[0]}</p>
                        {career.slice(1).map(l => <p key={l} className="text-[13px] text-ink-soft">{l}</p>)}
                      </div>
                    )}
                  </Group>
                )}
                <Group title="Location" rows={[
                  ['Lives in', locationNames.current_loc_name],
                  ['Works in', locationNames.job_loc_name],
                  ['Native place', locationNames.native_place_name],
                ]} />
                <Group title="Family Background" rows={[
                  ['Profile managed by', humanize(profile.managed_by)],
                  ['Family type', humanize(profile.family_type)],
                  ['Family values', humanize(profile.family_values)],
                  ['Parents', profile.parents_info],
                  ['Siblings', profile.siblings_info],
                  ['Expectations', profile.family_expectations],
                ]}>
                  {[profile.family_introduction, profile.family_about].filter(Boolean).map(t => (
                    <p key={t} className="mt-2.5 whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{t}</p>
                  ))}
                </Group>
              </>
            )}

            {tab === 'roots' && (
              (profile.caste || profile.self_gotra || profile.maternal_gotra || profile.mool || profile.gram || locationNames.native_place_name) ? (
                <Group title="Mithila Roots" roots rows={[
                  ['Community', L('caste', profile.caste)],
                  ['Sub-caste', L('sub_caste', profile.sub_caste)],
                  ['Gotra', L('gotra', profile.self_gotra)],
                  ['Maternal gotra', L('gotra', profile.maternal_gotra)],
                  ['Mool', L('mool', profile.mool)],
                  ['Native village', profile.gram],
                  ['Native place', locationNames.native_place_name],
                ]} />
              ) : (
                <div className="rounded-[18px] border border-gold/40 bg-[#FFFBF3] p-5 text-center">
                  <p className="font-serif text-[17px] text-maroon">Add your Mithila roots</p>
                  <p className="mt-1 text-[13px] text-ink-soft">Gotra, mool and native village help families find gotra-safe matches.</p>
                  <Link href="/profile/edit#community" className="btn-primary mt-3 inline-flex px-5 py-2 text-[14px]">Add community details</Link>
                </div>
              )
            )}

            {tab === 'roots' && (
              prefsDisplay || prefs ? (
                <Group title="Partner Preferences" rows={prefsDisplay ? [
                  ['Preferred age', prefsDisplay.ageRange],
                  ['Looking for', prefsDisplay.lookingFor],
                  ['Community', prefsDisplay.community],
                  ['Marital status', prefsDisplay.maritalStatus],
                  ['Education', prefsDisplay.education],
                  ['Occupation', prefsDisplay.profession],
                  ['Location', prefsDisplay.location],
                  ['Diet', prefsDisplay.diet],
                  ['Marriage timeline', prefsDisplay.marriageTimeline],
                  ['Manglik', prefsDisplay.manglik],
                  ['Children', prefsDisplay.children],
                  ['Living arrangement', prefsDisplay.livingArrangement],
                  ['Career', prefsDisplay.career],
                  ['Gotra', prefsDisplay.gotraSafe ? 'Gotra-safe matches only' : null],
                ] : [
                  ['Preferred age', prefs && (prefs.pref_age_min || prefs.pref_age_max) ? `${prefs.pref_age_min ?? '—'} to ${prefs.pref_age_max ?? '—'} years` : null],
                  ['Gotra', prefs?.pref_gotra_safe ? 'Gotra-safe matches only' : null],
                ]}>
                  {(prefsDisplay?.notes ?? prefs?.pref_notes) && (
                    <p className="mt-2.5 border-t border-gold/15 pt-2.5 text-[13.5px] leading-relaxed text-ink">{prefsDisplay?.notes ?? prefs?.pref_notes}</p>
                  )}
                  <Link href="/profile/preferences" className="mt-3 inline-flex text-[13.5px] font-semibold text-maroon">Edit preferences →</Link>
                </Group>
              ) : (
                <div className="rounded-[18px] border border-gold/25 bg-cream p-5 text-center">
                  <p className="font-serif text-[17px] text-maroon">Who are you hoping to meet?</p>
                  <p className="mt-1 text-[13px] text-ink-soft">Your preferences shape the matches we suggest.</p>
                  <Link href="/profile/preferences" className="btn-primary mt-3 inline-flex px-5 py-2 text-[14px]">Set preferences</Link>
                </div>
              )
            )}

            {tab === 'photos' && (
              <section className="rounded-[18px] border border-gold/25 bg-cream p-4 sm:p-5" aria-label="Your photos">
                <div className="flex items-center justify-between gap-3">
                  <Eyebrow>Your Photos</Eyebrow>
                  <span className="text-[12px] text-ink-soft">{photos.length} of 5</span>
                </div>
                {photos.length === 0 ? (
                  <p className="mt-3 text-[13.5px] text-ink-soft">No photos yet. Add one so families can recognise you.</p>
                ) : (
                  <ul className="mt-3 grid grid-cols-3 gap-2">
                    {photos.map(photo => (
                      <li key={photo.id} className="relative aspect-[4/5] overflow-hidden rounded-mj-sm border border-gold/20 bg-paper-2">
                        {photo.signed_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo.signed_url} alt="" className="h-full w-full object-cover object-[center_30%]" loading="lazy" decoding="async" />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-[11px] text-ink-soft">No preview</span>
                        )}
                        {photo.status === 'pending_moderation' && (
                          <span className="absolute inset-x-0 bottom-0 bg-ink/60 py-1 text-center text-[10.5px] font-medium text-white">Under review</span>
                        )}
                        {photo.status === 'rejected' && (
                          <span className="absolute inset-x-0 bottom-0 bg-error-fg/80 py-1 text-center text-[10.5px] font-medium text-white">Not approved</span>
                        )}
                        {photo.is_primary && photo.status === 'approved' && (
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-maroon px-1.5 py-0.5 text-[10px] font-semibold text-cream">Main</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-[12.5px] text-ink-soft">
                  {{
                    all: 'Public — visible to members, and on public pages if your profile is featured.',
                    members: 'Members — visible to signed-in members only.',
                    connected: 'Matches — visible to your accepted matches only.',
                  }[normalisePhotoVisibility(photoVisibility)]}
                </p>
                <Link href="/profile/edit#photos-section" className="btn-ghost mt-3 flex min-h-[44px] w-full justify-center text-[14px]">
                  Manage photos
                </Link>
                <p className="mt-1.5 text-center text-[11.5px] text-ink-soft">Add, remove, reorder, choose your main photo and who can see them.</p>
              </section>
            )}
          </div>

          {/* ── How families see you ── */}
          {cardProfile && (
            <section className="mx-auto max-w-2xl px-4 pb-2 pt-4" aria-labelledby="gallery-heading">
              <h2 id="gallery-heading" className="font-serif text-[20px] text-maroon">Your Profile Gallery</h2>
              <p className="mt-0.5 text-[13px] text-ink-soft">How your details are presented to families — {galleryFaceCount(cardProfile)} views.</p>
              <div className="mt-3">
                <ProfileCardGallery3D profile={cardProfile} variant="deck" />
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Account ── */}
      <section className="mx-auto max-w-2xl px-4 pb-8 pt-5" aria-labelledby="account-heading">
        <h2 id="account-heading" className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6516]">Account</h2>
        <div className="divide-y divide-gold/15 overflow-hidden rounded-[18px] border border-gold/25 bg-cream">
          {[
            { href: '/profile/edit#visibility', label: 'Privacy & Visibility', icon: ICON.lock },
            { href: '/notifications', label: 'Notifications', icon: ICON.bell },
            { href: '/settings', label: 'Account Settings', icon: ICON.gear },
          ].map(r => (
            <Link key={r.href} href={r.href} className="flex min-h-[52px] items-center gap-3 px-4 transition-colors hover:bg-paper active:bg-paper-2">
              <span className="text-maroon"><Glyph d={r.icon} /></span>
              <span className="flex-1 text-[14.5px] text-ink">{r.label}</span>
              <span aria-hidden="true" className="text-ink-soft">›</span>
            </Link>
          ))}
        </div>
        <button type="button" onClick={handleLogout} disabled={logoutLoading}
          className="mt-3 w-full rounded-full py-3 text-[14px] font-medium text-ink-soft transition-colors hover:text-maroon disabled:opacity-60">
          {logoutLoading ? 'Logging out…' : 'Log out'}
        </button>
      </section>
    </main>
  )
}
