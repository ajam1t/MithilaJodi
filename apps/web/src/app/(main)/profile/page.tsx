'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProfileCard3D from '@/components/ProfileCard3D'
import type { SearchCard } from '@/components/ProfileCard'
import CurrentPlanCard from './CurrentPlanCard'

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

type Tab = 'about' | 'community' | 'preferences' | 'photos'

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

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-ink/5 last:border-0">
      <dt className="text-xs text-ink-soft uppercase tracking-wide shrink-0 w-28">{label}</dt>
      <dd className="text-sm text-ink text-right">{value}</dd>
    </div>
  )
}

function CompletionRing({ pct }: { pct: number }) {
  const r = 18, circ = 2 * Math.PI * r
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-ink/10" />
        <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
          className="text-maroon transition-all duration-500"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-maroon">
        {pct}%
      </span>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [tab, setTab] = useState<Tab>('about')
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [cardMode, setCardMode] = useState<'own' | 'preview'>('own')
  const [locationNames, setLocationNames] = useState<{ native_place_name: string | null; current_loc_name: string | null }>({ native_place_name: null, current_loc_name: null })
  const [stickyVisible, setStickyVisible] = useState(false)
  const headerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { rootMargin: '-56px 0px 0px 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loading])

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
      fetch('/api/profile/preferences').then(r => r.json()),
    ])
      .then(([authData, profileData, prefsData]) => {
        if (!authData.ok) { router.replace('/login'); return }
        setAccount(authData.account ?? null)
        if (profileData.profile) setProfile(profileData.profile)
        setPhotos(profileData.photos ?? [])
        setLocationNames({ native_place_name: profileData.native_place_name ?? null, current_loc_name: profileData.current_loc_name ?? null })
        if (prefsData.ok && prefsData.preferences) setPrefs(prefsData.preferences)
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router])

  async function handleLogout() {
    setLogoutLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-soft">Loading…</p>
      </main>
    )
  }

  if (!account) return null

  const primaryPhoto = photos.find(p => p.is_primary) ?? photos[0] ?? null
  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'No name yet'
    : null
  const pct = profile?.profile_complete ?? 0

  const ownPhotoUrl = primaryPhoto?.signed_url ?? null
  const previewPhotoUrl = photos.find(p => p.is_primary && p.status === 'approved')?.signed_url ?? null

  const cardProfile: SearchCard | null = profile ? {
    id: profile.id,
    display_name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Your Profile',
    gender: profile.gender ?? '',
    age: profile.dob ? Math.floor((Date.now() - new Date(profile.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
    religion: null,
    caste: profile.caste,
    self_gotra: profile.self_gotra,
    mool: profile.mool,
    gram: profile.gram,
    height_cm: profile.height_cm,
    diet: profile.diet,
    about_snippet: profile.about_me ? profile.about_me.slice(0, 200) : null,
    profile_complete: profile.profile_complete ?? 0,
    profile_status: profile.profile_status ?? 'active',
    native_place_name: locationNames.native_place_name,
    current_loc_name: locationNames.current_loc_name,
    has_photo: cardMode === 'preview' ? !!previewPhotoUrl : !!ownPhotoUrl,
    primary_photo_url: cardMode === 'preview' ? previewPhotoUrl : ownPhotoUrl,
    employer: profile.employer,
    profession_detail: profile.profession_detail,
    education_detail: profile.education_detail,
    smoking: profile.smoking,
    drinking: profile.drinking,
    maternal_gotra: profile.maternal_gotra,
    job_loc_name: null,
    marriage_timeline: profile.marriage_timeline,
  } : null

  return (
    <main className="min-h-screen bg-paper">

      {/* ── Compact sticky identity bar (appears when main header scrolls out) ── */}
      <div
        className={[
          'fixed left-0 right-0 z-30 bg-cream border-b border-paper-3 shadow-mj-xs transition-all duration-200',
          'top-12 lg:top-14',
          stickyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none',
        ].join(' ')}
        aria-hidden={!stickyVisible}
      >
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden border border-ink/10 bg-paper flex items-center justify-center">
            {primaryPhoto?.signed_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={primaryPhoto.signed_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-base font-serif text-ink-soft">
                {profile?.first_name?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm text-ink leading-tight truncate">
              {displayName ?? 'Complete Your Profile'}
            </p>
            {profile?.dob && (
              <p className="text-[11px] text-ink-soft leading-tight truncate">
                {age(profile.dob)} yrs
                {profile.gender ? ` · ${profile.gender === 'male' ? 'Male' : 'Female'}` : ''}
              </p>
            )}
          </div>
          {profile && (
            <span className="shrink-0 text-[10px] font-semibold text-maroon bg-paper border border-gold border-opacity-40 rounded-full px-2 py-0.5">
              {pct}%
            </span>
          )}
        </div>
      </div>

      {/* ── Profile header ── */}
      <div ref={headerRef} className="bg-cream border-b border-ink/10">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-start gap-4">

            {/* Avatar */}
            <div className="shrink-0 w-20 h-20 rounded-full overflow-hidden border-2 border-ink/10 bg-paper flex items-center justify-center">
              {primaryPhoto?.signed_url ? (
                <img src={primaryPhoto.signed_url} alt={displayName ?? 'Profile'}
                  className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-serif text-ink-soft">
                  {profile?.first_name?.[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {!profile ? (
                    <h1 className="font-serif text-xl text-ink">Complete Your Profile</h1>
                  ) : (
                    <>
                      <h1 className="font-serif text-xl text-ink leading-tight truncate">{displayName}</h1>
                      {profile.dob && (
                        <p className="text-sm text-ink-soft mt-0.5">
                          {age(profile.dob)} yrs{profile.gender ? ` · ${profile.gender === 'male' ? 'Male' : 'Female'}` : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${profile.discoverable ? 'bg-green-100 text-green-700' : 'bg-ink/10 text-ink-soft'}`}>
                          {profile.discoverable ? 'Visible' : 'Hidden'}
                        </span>
                        {profile.profile_status && profile.profile_status !== 'active' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 capitalize">
                            {profile.profile_status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Completion ring */}
                <CompletionRing pct={pct} />
              </div>
            </div>
          </div>

          {pct < 100 && profile && (
            <p className="mt-3 text-xs text-ink-soft bg-paper/60 rounded-mj-sm px-3 py-2">
              {pct < 40
                ? 'Your profile is just getting started. Add more details to get better matches.'
                : 'Almost there! Complete the remaining details to strengthen your profile.'}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <Link href="/profile/edit"
              className="flex-1 text-center text-sm font-medium py-2 rounded-mj bg-maroon text-gold-lt hover:bg-maroon/90 transition-colors">
              {profile ? 'Edit Profile' : 'Create Profile'}
            </Link>
            <button type="button" onClick={handleLogout} disabled={logoutLoading}
              className="px-4 text-sm font-medium py-2 rounded-mj border border-ink/20 text-ink-soft hover:text-ink hover:border-ink/40 transition-colors disabled:opacity-50">
              {logoutLoading ? '…' : 'Log Out'}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        {profile && (
          <div className="flex border-t border-ink/10 max-w-2xl mx-auto">
            {(['about', 'community', 'preferences', 'photos'] as Tab[]).map(t => (
              <button key={t} type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-xs font-medium uppercase tracking-wide transition-colors border-b-2
                  ${tab === t
                    ? 'border-maroon text-maroon'
                    : 'border-transparent text-ink-soft hover:text-ink'}`}>
                {t === 'preferences' ? 'Prefs' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Current Plan / Subscription ── */}
      <CurrentPlanCard />

      {/* ── 3D Profile Card ── */}
      {profile && cardProfile && (
        <div className="border-b border-ink/10">
          <div className="max-w-2xl mx-auto px-4 py-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">Your Profile Card</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button type="button" onClick={() => setCardMode('own')}
                className={`text-xs px-3 py-1.5 rounded-mj-sm transition-colors ${cardMode === 'own' ? 'bg-maroon text-cream' : 'text-ink-soft border border-ink/20 hover:text-ink'}`}>
                View Your Profile
              </button>
              <button type="button" onClick={() => setCardMode('preview')}
                className={`text-xs px-3 py-1.5 rounded-mj-sm transition-colors ${cardMode === 'preview' ? 'bg-maroon text-cream' : 'text-ink-soft border border-ink/20 hover:text-ink'}`}>
                Preview as Other Members
              </button>
            </div>
            <div className="flex justify-center">
              <ProfileCard3D profile={cardProfile} hideActions />
            </div>
            {cardMode === 'preview' && (
              <p className="text-xs text-ink-soft text-center mt-3">
                This is how your card appears to other members.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Tab content ── */}
      {!profile ? (
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="text-ink-soft text-sm mb-6">Add your details to start matching with families.</p>
          <Link href="/profile/edit" className="btn-primary inline-block">Create Profile</Link>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

          {/* ── About tab ── */}
          {tab === 'about' && (
            <>
              {profile.about_me && (
                <section className="card p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">About Me</h3>
                  <p className="text-sm text-ink leading-relaxed">{profile.about_me}</p>
                </section>
              )}

              {(profile.education_detail || profile.degree || profile.specialization || profile.institution || profile.passing_year) && (
                <section className="card p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-3">Education</h3>
                  <dl>
                    <InfoRow label="Education" value={profile.education_detail} />
                    <InfoRow label="Degree" value={profile.degree} />
                    <InfoRow label="Specialization" value={profile.specialization} />
                    <InfoRow label="Institution" value={profile.institution} />
                    <InfoRow label="Passing Year" value={profile.passing_year ? String(profile.passing_year) : null} />
                  </dl>
                </section>
              )}

              {(profile.profession_detail || profile.employer || profile.job_title || profile.employment_type || profile.industry || profile.work_type || profile.experience_years != null) && (
                <section className="card p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-3">Career</h3>
                  <dl>
                    <InfoRow label="Job Title" value={profile.job_title} />
                    <InfoRow label="Profession" value={profile.profession_detail} />
                    <InfoRow label="Company" value={profile.employer} />
                    <InfoRow label="Employment" value={humanize(profile.employment_type)} />
                    <InfoRow label="Industry" value={humanize(profile.industry)} />
                    <InfoRow label="Work Type" value={humanize(profile.work_type)} />
                    <InfoRow label="Experience" value={profile.experience_years != null ? `${profile.experience_years} yrs` : null} />
                  </dl>
                </section>
              )}

              <section className="card p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-3">Personal Details</h3>
                <dl>
                  <InfoRow label="Height" value={profile.height_cm ? formatHeight(profile.height_cm) : null} />
                  <InfoRow label="Marital Status" value={humanize(profile.marital_status)} />
                  <InfoRow label="Mother Tongue" value={humanize(profile.mother_tongue)} />
                  <InfoRow label="Diet" value={profile.diet ? profile.diet.replace(/_/g, ' ') : null} />
                  <InfoRow label="Smoking" value={profile.smoking} />
                  <InfoRow label="Drinking" value={profile.drinking} />
                  <InfoRow label="Looking to marry" value={profile.marriage_timeline ? TIMELINE_LABELS[profile.marriage_timeline] : null} />
                  <InfoRow label="Profile for" value={profile.profile_for ? profile.profile_for.replace(/_/g, ' ') : null} />
                </dl>
                {!profile.height_cm && !profile.diet && (
                  <p className="text-xs text-ink-soft mt-2">
                    <Link href="/profile/edit" className="text-maroon hover:underline">Add personal details</Link> to improve your profile.
                  </p>
                )}
              </section>

              {(profile.managed_by || profile.family_type || profile.family_values || profile.parents_info || profile.siblings_info || profile.family_expectations || profile.family_introduction || profile.family_about) && (
                <section className="card p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-3">Family</h3>
                  <dl>
                    <InfoRow label="Managed By" value={humanize(profile.managed_by)} />
                    <InfoRow label="Family Type" value={humanize(profile.family_type)} />
                    <InfoRow label="Family Values" value={humanize(profile.family_values)} />
                    <InfoRow label="Parents" value={profile.parents_info} />
                    <InfoRow label="Siblings" value={profile.siblings_info} />
                    <InfoRow label="Expectations" value={profile.family_expectations} />
                  </dl>
                  {profile.family_introduction && (
                    <p className="text-sm text-ink leading-relaxed mt-3">{profile.family_introduction}</p>
                  )}
                  {profile.family_about && (
                    <p className="text-sm text-ink leading-relaxed mt-3">{profile.family_about}</p>
                  )}
                </section>
              )}
            </>
          )}

          {/* ── Community tab ── */}
          {tab === 'community' && (
            <section className="card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-3">Community & Heritage</h3>
              <dl>
                <InfoRow label="Caste" value={profile.caste} />
                <InfoRow label="Sub-caste" value={profile.sub_caste} />
                <InfoRow label="Self Gotra" value={profile.self_gotra} />
                <InfoRow label="Maternal Gotra" value={profile.maternal_gotra} />
                <InfoRow label="Mool" value={profile.mool} />
                <InfoRow label="Gram" value={profile.gram} />
              </dl>
              {!profile.self_gotra && !profile.caste && (
                <p className="text-xs text-ink-soft mt-2">
                  <Link href="/profile/edit" className="text-maroon hover:underline">Add community details</Link> for gotra-safe matching.
                </p>
              )}
            </section>
          )}

          {/* ── Preferences tab ── */}
          {tab === 'preferences' && (
            <section className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Partner Preferences</h3>
                <Link href="/profile/preferences" className="text-xs text-maroon hover:underline">Edit</Link>
              </div>

              {!prefs ? (
                <div className="text-center py-6">
                  <p className="text-sm text-ink-soft mb-3">You haven&apos;t set any partner preferences yet.</p>
                  <Link href="/profile/preferences"
                    className="text-sm text-maroon font-medium border border-maroon/30 rounded-mj px-4 py-2 hover:bg-maroon/5 transition-colors">
                    Set Preferences
                  </Link>
                </div>
              ) : (
                <dl>
                  {(prefs.pref_age_min || prefs.pref_age_max) && (
                    <InfoRow label="Age Range"
                      value={`${prefs.pref_age_min ?? '—'} to ${prefs.pref_age_max ?? '—'} years`} />
                  )}
                  <InfoRow label="Gender" value={prefs.pref_gender ? (prefs.pref_gender === 'male' ? 'Male' : 'Female') : null} />
                  {prefs.pref_caste?.length ? (
                    <InfoRow label="Caste" value={prefs.pref_caste.join(', ')} />
                  ) : null}
                  <InfoRow label="Gotra safe" value={prefs.pref_gotra_safe ? 'Yes (exclude same gotra)' : 'No preference'} />
                  {prefs.pref_diet?.length ? (
                    <InfoRow label="Diet" value={prefs.pref_diet.join(', ')} />
                  ) : null}
                  {prefs.pref_notes && (
                    <div className="pt-2 mt-2 border-t border-ink/5">
                      <dt className="text-xs text-ink-soft uppercase tracking-wide mb-1">Notes</dt>
                      <dd className="text-sm text-ink leading-relaxed">{prefs.pref_notes}</dd>
                    </div>
                  )}
                </dl>
              )}
            </section>
          )}

          {/* ── Photos tab ── */}
          {tab === 'photos' && (
            <section className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">My Photos</h3>
                <Link href="/profile/edit" className="text-xs text-maroon hover:underline">Manage</Link>
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-ink-soft mb-3">No photos yet. Add a photo so families can recognise you.</p>
                  <Link href="/profile/edit"
                    className="text-sm text-maroon font-medium border border-maroon/30 rounded-mj px-4 py-2 hover:bg-maroon/5 transition-colors">
                    Add Photo
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(photo => (
                    <div key={photo.id}
                      className="aspect-square rounded-mj-sm overflow-hidden border border-ink/10 bg-cream relative">
                      {photo.signed_url ? (
                        <img src={photo.signed_url} alt="Profile photo"
                          className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-soft text-xs">
                          No preview
                        </div>
                      )}
                      {photo.status === 'pending_moderation' && (
                        <div className="absolute inset-0 bg-ink/30 flex items-center justify-center">
                          <span className="text-white text-[9px] font-medium text-center leading-tight px-1">
                            Under review
                          </span>
                        </div>
                      )}
                      {photo.is_primary && photo.status === 'approved' && (
                        <div className="absolute top-1 left-1 bg-maroon text-white text-[9px] px-1 rounded">★</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      )}
    </main>
  )
}
