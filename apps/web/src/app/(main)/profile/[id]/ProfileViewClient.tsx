'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ProfileCardGallery3D from '@/components/ProfileCardGallery3D'
import { WhatsAppConnect } from '@/components/whatsapp/WhatsAppConnect'
import type { SearchCard } from '@/types/profile'

type ProfileData = {
  id: string
  display_name: string
  gender: string
  age: number | null
  height_cm: number | null
  religion: string | null
  caste: string | null
  sub_caste: string | null
  self_gotra: string | null
  maternal_gotra: string | null
  mool: string | null
  gram: string | null
  diet: string | null
  marital_status: string | null
  mother_tongue: string | null
  about_me: string | null
  family_about: string | null
  profile_complete: number
  native_place_name: string | null
  current_loc_name: string | null
  job_loc_name: string | null
  marriage_timeline: string | null
  education_detail: string | null
  degree: string | null
  specialization: string | null
  institution: string | null
  passing_year: number | null
  job_title: string | null
  profession_detail: string | null
  employer: string | null
  employment_type: string | null
  industry: string | null
  work_type: string | null
  experience_years: number | null
  family_type: string | null
  managed_by: string | null
  family_values: string | null
  parents_info: string | null
  siblings_info: string | null
  family_expectations: string | null
  family_introduction: string | null
  photo_url: string | null
  myProfileId: string | null
  interestSent: { id: string; status: string } | null
  interestReceived: { id: string; status: string } | null
  shortlisted: boolean
  blocked: boolean
  cardData: SearchCard
}

const TIMELINE_LABELS: Record<string, string> = {
  within_3_months: 'Within 3 months',
  within_6_months: 'Within 6 months',
  within_1_year: 'Within 1 year',
  within_2_years: 'Within 2 years',
  no_rush: 'No rush',
}

// Humanize a master-data slug (e.g. "never_married" → "Never married").
function humanize(v: string | null | undefined): string | null {
  if (!v) return null
  const s = v.replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-ink-soft w-28 shrink-0">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  )
}

export default function ProfileViewClient({ data: initial }: { data: ProfileData }) {
  const [data, setData] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [showReport, setShowReport] = useState(false)
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
  }, [])

  const isMutual =
    data.interestSent?.status === 'accepted' &&
    data.interestReceived?.status === 'accepted'

  async function sendInterest() {
    setBusy(true); setMsg(null)
    const res = await fetch('/api/interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_profile_id: data.id }),
    })
    const json = await res.json()
    if (json.ok) {
      setData(d => ({ ...d, interestSent: { id: json.interest_id, status: 'sent' } }))
      setMsg({ type: 'ok', text: 'Interest sent!' })
    } else {
      setMsg({ type: 'err', text: json.message ?? 'Could not send interest.' })
    }
    setBusy(false)
  }

  async function withdrawInterest() {
    if (!data.interestSent) return
    setBusy(true); setMsg(null)
    const res = await fetch(`/api/interests/${data.interestSent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'withdraw' }),
    })
    const json = await res.json()
    if (json.ok) {
      setData(d => ({ ...d, interestSent: null }))
      setMsg({ type: 'ok', text: 'Interest withdrawn.' })
    } else {
      setMsg({ type: 'err', text: json.message ?? 'Could not withdraw.' })
    }
    setBusy(false)
  }

  async function toggleShortlist() {
    setBusy(true); setMsg(null)
    const method = data.shortlisted ? 'DELETE' : 'POST'
    const res = await fetch(`/api/shortlists/${data.id}`, { method })
    const json = await res.json()
    if (json.ok) {
      setData(d => ({ ...d, shortlisted: !d.shortlisted }))
    } else {
      setMsg({ type: 'err', text: json.message ?? 'Could not update shortlist.' })
    }
    setBusy(false)
  }

  async function blockProfile() {
    if (!confirm('Block this profile? They will not be able to send you interests.')) return
    setBusy(true); setMsg(null)
    const res = await fetch(`/api/blocks/${data.id}`, { method: 'POST' })
    const json = await res.json()
    if (json.ok) {
      setData(d => ({ ...d, blocked: true, interestSent: null }))
      setMsg({ type: 'ok', text: 'Profile blocked.' })
    } else {
      setMsg({ type: 'err', text: json.message ?? 'Could not block.' })
    }
    setBusy(false)
  }

  async function submitReport(reason: string) {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reported_profile_id: data.id, reason }),
      })
      const json = await res.json()
      if (json.ok) {
        setShowReport(false)
        setMsg({ type: 'ok', text: 'Thank you. Our team will review this profile.' })
      } else {
        setMsg({ type: 'err', text: json.message ?? 'Could not submit report.' })
      }
    } catch {
      setMsg({ type: 'err', text: 'Could not submit report. Please try again.' })
    }
    setBusy(false)
  }

  const locationLine = [data.current_loc_name, data.native_place_name].filter(Boolean).join(' · ')
  const communityLine = [data.caste, data.self_gotra, data.mool, data.gram].filter(Boolean).join(' · ')

  return (
    <main id="main-content" className="min-h-screen bg-paper">

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
            {data.photo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={data.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-base font-serif text-ink-soft">
                {data.display_name[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm text-ink leading-tight truncate">
              {data.display_name}
            </p>
            <p className="text-[11px] text-ink-soft leading-tight truncate">
              {[
                data.age ? `${data.age} yrs` : null,
                data.gender,
                data.height_cm ? `${data.height_cm} cm` : null,
              ].filter(Boolean).join(' · ')}
            </p>
          </div>
          {isMutual && (
            <span className="shrink-0 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              Match
            </span>
          )}
        </div>
      </div>

      <div className="wrap py-8">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Flash message */}
          {msg && (
            <div className={`rounded-mj-sm px-4 py-3 text-sm ${
              msg.type === 'ok'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {msg.text}
            </div>
          )}

          {/* 3D Profile Card */}
          <div className="flex justify-center">
            <ProfileCardGallery3D profile={data.cardData} />
          </div>

          {/* Profile header */}
          <div ref={headerRef} className="card p-5 flex gap-5">
            {/* Avatar */}
            <div className="shrink-0 w-28 h-36 rounded-mj-sm overflow-hidden bg-cream border border-paper-3 flex items-center justify-center">
              {data.photo_url ? (
                <img src={data.photo_url} alt={data.display_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-ink-soft select-none">
                  {data.display_name[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h1 className="font-serif text-2xl text-ink leading-tight">{data.display_name}</h1>
                <p className="text-sm text-ink-soft mt-0.5">
                  {[
                    data.age ? `${data.age} yrs` : null,
                    data.gender,
                    data.height_cm ? `${data.height_cm} cm` : null,
                    data.diet?.replace('_', '-'),
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>

              {locationLine && (
                <p className="text-xs text-ink-soft">📍 {locationLine}</p>
              )}
              {communityLine && (
                <p className="text-xs text-ink">{communityLine}</p>
              )}

              {/* Mutual match badge */}
              {isMutual && (
                <span className="inline-block text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                  Mutual match — you can now message each other
                </span>
              )}

              {/* Interest received banner */}
              {data.interestReceived?.status === 'sent' && !isMutual && (
                <p className="text-xs bg-maroon/10 text-maroon px-3 py-1.5 rounded-mj-sm">
                  This person has sent you an interest.{' '}
                  <Link href="/interests" className="underline font-medium">View in Interests</Link>
                </p>
              )}
            </div>
          </div>

          {/* WhatsApp — only after an interest between us has been accepted */}
          <WhatsAppConnect
            profileId={data.id}
            profileName={data.display_name}
            canRequest={
              data.interestSent?.status === 'accepted' ||
              data.interestReceived?.status === 'accepted'
            }
          />

          {/* About */}
          {data.about_me && (
            <div className="card p-5">
              <h2 className="font-semibold text-ink text-sm mb-2">About</h2>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{data.about_me}</p>
            </div>
          )}

          {/* Community & Personal */}
          <div className="card p-5 space-y-2.5">
            <h2 className="font-semibold text-ink text-sm mb-3">Details</h2>
            <Row label="Religion" value={data.religion} />
            <Row label="Caste" value={data.caste} />
            <Row label="Sub-caste" value={data.sub_caste} />
            <Row label="Gotra" value={data.self_gotra} />
            <Row label="Maternal Gotra" value={data.maternal_gotra} />
            <Row label="Mool" value={data.mool} />
            <Row label="Gram" value={data.gram} />
            <Row label="Marital Status" value={humanize(data.marital_status)} />
            <Row label="Mother Tongue" value={humanize(data.mother_tongue)} />
            <Row label="Diet" value={data.diet?.replace('_', '-') ?? null} />
            <Row label="Height" value={data.height_cm ? `${data.height_cm} cm` : null} />
            <Row label="Looking to marry" value={data.marriage_timeline ? (TIMELINE_LABELS[data.marriage_timeline] ?? null) : null} />
            <Row label="Currently in" value={data.current_loc_name} />
            <Row label="Native place" value={data.native_place_name} />
            <Row label="Job location" value={data.job_loc_name} />
          </div>

          {/* Education */}
          {(data.education_detail || data.degree || data.specialization || data.institution || data.passing_year) && (
            <div className="card p-5 space-y-2.5">
              <h2 className="font-semibold text-ink text-sm mb-3">Education</h2>
              <Row label="Education" value={data.education_detail} />
              <Row label="Degree" value={data.degree} />
              <Row label="Specialization" value={data.specialization} />
              <Row label="Institution" value={data.institution} />
              <Row label="Passing Year" value={data.passing_year ? String(data.passing_year) : null} />
            </div>
          )}

          {/* Career */}
          {(data.job_title || data.profession_detail || data.employer || data.employment_type || data.industry || data.work_type || data.experience_years != null) && (
            <div className="card p-5 space-y-2.5">
              <h2 className="font-semibold text-ink text-sm mb-3">Career</h2>
              <Row label="Job Title" value={data.job_title} />
              <Row label="Profession" value={data.profession_detail} />
              <Row label="Company" value={data.employer} />
              <Row label="Employment" value={humanize(data.employment_type)} />
              <Row label="Industry" value={humanize(data.industry)} />
              <Row label="Work Type" value={humanize(data.work_type)} />
              <Row label="Experience" value={data.experience_years != null ? `${data.experience_years} yrs` : null} />
            </div>
          )}

          {/* Family */}
          {(data.managed_by || data.family_type || data.family_values || data.parents_info || data.siblings_info || data.family_expectations || data.family_introduction || data.family_about) && (
            <div className="card p-5 space-y-2.5">
              <h2 className="font-semibold text-ink text-sm mb-3">Family</h2>
              <Row label="Managed By" value={humanize(data.managed_by)} />
              <Row label="Family Type" value={humanize(data.family_type)} />
              <Row label="Family Values" value={humanize(data.family_values)} />
              <Row label="Parents" value={data.parents_info} />
              <Row label="Siblings" value={data.siblings_info} />
              <Row label="Expectations" value={data.family_expectations} />
              {data.family_introduction && (
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap pt-1">{data.family_introduction}</p>
              )}
              {data.family_about && (
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap pt-1">{data.family_about}</p>
              )}
            </div>
          )}

          {/* Actions */}
          {data.myProfileId && !data.blocked && (
            <div className="card p-5 space-y-3">
              <h2 className="font-semibold text-ink text-sm">Actions</h2>
              <div className="flex flex-wrap gap-3">

                {/* Interest button */}
                {!data.interestSent && (
                  <button
                    type="button"
                    onClick={sendInterest}
                    disabled={busy}
                    className="btn-primary text-sm py-2 px-4 disabled:opacity-60"
                  >
                    Send interest
                  </button>
                )}
                {data.interestSent?.status === 'sent' && (
                  <button
                    type="button"
                    onClick={withdrawInterest}
                    disabled={busy}
                    className="btn-ghost text-sm py-2 px-4 disabled:opacity-60"
                  >
                    Withdraw interest
                  </button>
                )}
                {data.interestSent?.status === 'accepted' && (
                  <span className="text-sm text-green-700 font-medium self-center">
                    Interest accepted
                  </span>
                )}
                {data.interestSent?.status === 'declined' && (
                  <span className="text-sm text-ink-soft self-center">
                    Interest declined
                  </span>
                )}
                {data.interestSent?.status === 'withdrawn' && (
                  <button
                    type="button"
                    onClick={sendInterest}
                    disabled={busy}
                    className="btn-ghost text-sm py-2 px-4 disabled:opacity-60"
                  >
                    Send interest again
                  </button>
                )}

                {/* Shortlist */}
                <button
                  type="button"
                  onClick={toggleShortlist}
                  disabled={busy}
                  className="btn-ghost text-sm py-2 px-4 disabled:opacity-60"
                >
                  {data.shortlisted ? 'Remove from shortlist' : 'Shortlist'}
                </button>

                {/* Report + Block */}
                <div className="flex items-center gap-3 self-center ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowReport(v => !v)}
                    disabled={busy}
                    className="text-xs text-ink-soft hover:text-maroon hover:underline disabled:opacity-60"
                  >
                    Report
                  </button>
                  <button
                    type="button"
                    onClick={blockProfile}
                    disabled={busy}
                    className="text-xs text-red-600 hover:underline disabled:opacity-60"
                  >
                    Block
                  </button>
                </div>
              </div>

              {/* Report reason picker */}
              {showReport && (
                <div className="border-t border-ink/10 pt-3">
                  <p className="text-xs text-ink-soft mb-2">Report this profile for:</p>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['fake_profile', 'Fake profile'],
                      ['harassment', 'Harassment'],
                      ['inappropriate_photo', 'Inappropriate photo'],
                      ['spam', 'Spam'],
                      ['fraud', 'Fraud'],
                      ['other', 'Other'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => submitReport(value)}
                        disabled={busy}
                        className="text-xs border border-ink/20 text-ink-soft hover:border-maroon hover:text-maroon rounded-full px-3 py-1 transition-colors disabled:opacity-60"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {data.blocked && (
            <div className="card p-4 text-sm text-ink-soft">
              You have blocked this profile.{' '}
              <button
                type="button"
                onClick={async () => {
                  setBusy(true)
                  const res = await fetch(`/api/blocks/${data.id}`, { method: 'DELETE' })
                  const json = await res.json()
                  if (json.ok) setData(d => ({ ...d, blocked: false }))
                  setBusy(false)
                }}
                disabled={busy}
                className="text-maroon underline disabled:opacity-60"
              >
                Unblock
              </button>
            </div>
          )}

          {!data.myProfileId && (
            <div className="card p-4 text-sm text-center text-ink-soft">
              <Link href="/profile/edit" className="text-maroon underline">Complete your profile</Link>
              {' '}to send interests and shortlist profiles.
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
