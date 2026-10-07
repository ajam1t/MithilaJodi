'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ProfileGallery } from '@/components/digital-profile/ProfileGallery'
import { ProfilePhotos } from '@/components/digital-profile/ProfilePhotos'
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
  /** Every photograph this viewer may see, primary first (empty if withheld). */
  photos: string[]
  /** An accepted interest in either direction. */
  matched: boolean
  conversationId: string | null
  myProfileId: string | null
  /** The owner previewing their own profile (from /profile): no actions. */
  preview?: boolean
  /** In a preview, whether the profile is currently hidden from members. */
  previewHidden?: boolean
  interestSent: { id: string; status: string } | null
  interestReceived: { id: string; status: string } | null
  shortlisted: boolean
  blocked: boolean
  match: MatchDetail | null
  cardData: SearchCard
}

type MatchDetail = {
  score: number
  band: 'excellent' | 'strong' | 'good' | 'fair'
  confidence: number
  reasons: Array<{ key: string; label: string; detail: string }>
  blockers: string[]
  cautions: string[]
  breakdown: Array<{ key: string; label: string; points: number; max: number; detail: string }>
}

const BAND_LABEL: Record<MatchDetail['band'], string> = {
  excellent: 'Excellent match',
  strong: 'Strong match',
  good: 'Good match',
  fair: 'Possible match',
}

/**
 * Full match breakdown.
 *
 * The card shows a score and its three strongest reasons; this page has room
 * for all nine factors, including the ones that scored badly. Showing the weak
 * factors is the point — a family deciding whether to make contact is better
 * served by "location 0/18, 515 km away" than by a bare 58%.
 */
function MatchPanel({ match }: { match: MatchDetail }) {
  const blocked = match.blockers.length > 0

  // Nothing was scored — currently only the same-gender case. Show the reason
  // without a number: a ring reading "0" implies this pairing was assessed and
  // rated badly, when in fact it was never on the scale.
  if (match.confidence === 0 && match.breakdown.length === 0) {
    return (
      <section className="card p-5" aria-label="Match breakdown">
        {match.blockers.map(b => (
          <p key={b} className="text-[13.5px] leading-snug text-ink-soft">{b}</p>
        ))}
      </section>
    )
  }

  const colour = blocked
    ? 'text-terra'
    : match.score >= 80 ? 'text-green' : match.score >= 65 ? 'text-gold' : 'text-maroon'

  return (
    <section className="card p-5" aria-label="Match breakdown">
      <div className="flex items-baseline gap-3 mb-1">
        <span className={`font-serif text-3xl leading-none ${colour}`}>{match.score}</span>
        <div className="min-w-0">
          <p className="font-serif text-[17px] text-maroon leading-tight">
            {blocked ? 'Needs checking' : BAND_LABEL[match.band]}
          </p>
          <p className="text-[12px] text-ink-soft leading-tight">
            Based on {Math.round(match.confidence * 100)}% of our matching factors
          </p>
        </div>
      </div>

      {match.blockers.map(b => (
        <p key={b} className="mt-3 text-[13px] leading-snug text-terra bg-terra/[0.07] border border-terra/25 rounded-mj-sm px-3 py-2">
          {b}
        </p>
      ))}
      {match.cautions.map(c => (
        <p key={c} className="mt-2 text-[13px] leading-snug text-ink-soft bg-gold/[0.07] border border-gold/30 rounded-mj-sm px-3 py-2">
          {c}
        </p>
      ))}

      <ul className="mt-3 space-y-2">
        {match.breakdown.map(f => {
          const pct = f.max > 0 ? Math.round((f.points / f.max) * 100) : 0
          return (
            <li key={f.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-ink">{f.label}</span>
                <span className="text-[11.5px] text-ink-soft tabular-nums shrink-0">{f.points} / {f.max}</span>
              </div>
              <div className="h-1 rounded-full bg-paper-3 overflow-hidden mt-1" aria-hidden="true">
                <div
                  className={`h-full rounded-full ${pct >= 80 ? 'bg-green' : pct >= 40 ? 'bg-gold' : 'bg-terra'}`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <p className="text-[12.5px] text-ink-soft leading-snug mt-0.5">{f.detail}</p>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 pt-3 border-t border-paper-3 text-[11.5px] text-ink-soft leading-snug">
        A guide, not a verdict. Factors neither of you has filled in are left out of the
        score rather than counted against it, which is what the percentage above refers to.
      </p>
    </section>
  )
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

  // A match is an accepted interest either way round — the same rule as the
  // Inbox and the Digital Profile. (Requiring both directions meant the badge
  // and the Message button almost never appeared.)
  const isMatch =
    data.matched ||
    data.interestSent?.status === 'accepted' ||
    data.interestReceived?.status === 'accepted'
  const firstName = data.display_name.split(' ')[0]

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
  const chips = [
    data.caste,
    data.self_gotra ? `${data.self_gotra} Gotra` : null,
    data.mool ? `Mool: ${data.mool}` : null,
  ].filter(Boolean) as string[]

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
              <img src={data.photo_url} alt="" className="w-full h-full object-cover object-[center_35%]" />
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
          {isMatch && (
            <span className="shrink-0 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              Match
            </span>
          )}
        </div>
      </div>

      <div className="wrap py-6 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Owner preview: what another member sees, nothing they could do. */}
          {data.preview && (
            <div className="rounded-mj border border-gold/40 bg-[#FFF8EC] px-4 py-3">
              <p className="text-[13.5px] font-semibold text-maroon">Preview — this is how other members see your profile.</p>
              {data.previewHidden && (
                <p className="mt-1 text-[12.5px] text-ink-soft">Your profile is hidden right now, so members cannot open it until you make it visible.</p>
              )}
              <Link href="/profile" className="mt-1.5 inline-block text-[13px] font-medium text-maroon underline underline-offset-2">← Back to my profile</Link>
            </div>
          )}

          {/* ── 1. Identity — the Digital Profile header, no photo (the gallery has them). */}
          <header ref={headerRef} className="dp-identity">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.3em] text-[#8A6516]">Mithila Jodi · Member profile</p>
            <h1 className="mt-2 font-serif text-[30px] leading-[1.1] text-maroon sm:text-[36px]">{data.display_name}</h1>
            <p className="mt-1.5 text-[14.5px] text-ink">
              {[
                data.age ? `${data.age} yrs` : null,
                data.gender,
                data.height_cm ? `${data.height_cm} cm` : null,
                data.diet?.replace('_', '-'),
              ].filter(Boolean).join(' · ')}
            </p>
            {locationLine && <p className="mt-0.5 text-[14px] text-ink-soft">{locationLine}</p>}
            {chips.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Community">
                {chips.map(x => <li key={x} className="dp-chip">{x}</li>)}
              </ul>
            )}
            {!data.preview && isMatch && (
              <p className="mt-3 inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                It&rsquo;s a Match — you can message each other on Mithila Jodi
              </p>
            )}
            {!data.preview && data.interestReceived?.status === 'sent' && !isMatch && (
              <p className="mt-3 rounded-mj-sm bg-maroon/10 px-3 py-1.5 text-xs text-maroon">
                {firstName} has sent you an interest.{' '}
                <Link href="/inbox?tab=interests" className="font-medium underline">Respond in Inbox</Link>
              </p>
            )}
          </header>

          {/* ── 2. Profile Gallery — the same photo deck and six-card deck as the
                 Digital Profile, fed this member's data. Keyed by member so
                 moving between two profiles never carries one gallery's state
                 (or photos) into the next. */}
          <section key={data.id} aria-label={`${firstName}'s profile gallery`} className="space-y-4">
            <ProfilePhotos photos={data.photos} name={data.display_name} />
            <ProfileGallery card={data.cardData} />
          </section>

          {/* Flash message — next to the actions that produce it. */}
          {msg && (
            <div className={`rounded-mj-sm px-4 py-3 text-sm ${
              msg.type === 'ok'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {msg.text}
            </div>
          )}

          {/* ── 3. Actions */}
          {!data.preview && data.myProfileId && !data.blocked && (
            <div className="card p-5 space-y-3">
              <h2 className="font-semibold text-ink text-sm">Connect with {firstName}</h2>
              <div className="flex flex-wrap gap-3">

                {isMatch ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold/15 px-4 py-2 text-sm font-semibold text-maroon">
                      It&rsquo;s a Match <span aria-hidden="true">❤️</span>
                    </span>
                    <Link
                      href={data.conversationId ? `/messages/${data.conversationId}` : '/inbox?tab=messages'}
                      className="btn-primary text-sm py-2 px-4"
                    >
                      Message {firstName}
                    </Link>
                  </>
                ) : data.interestReceived?.status === 'sent' ? (
                  <Link href="/inbox?tab=interests" className="btn-primary text-sm py-2 px-4">
                    Respond to {firstName}&rsquo;s interest
                  </Link>
                ) : (
                  <>
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
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green/30 bg-green/[0.07] px-4 py-2 text-sm font-medium text-green">
                          Interest sent <span aria-hidden="true">✓</span>
                        </span>
                        <button
                          type="button"
                          onClick={withdrawInterest}
                          disabled={busy}
                          className="btn-ghost text-sm py-2 px-4 disabled:opacity-60"
                        >
                          Withdraw
                        </button>
                      </>
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
                  </>
                )}

                {/* Shortlist */}
                <button
                  type="button"
                  onClick={toggleShortlist}
                  disabled={busy}
                  aria-pressed={data.shortlisted}
                  className="btn-ghost text-sm py-2 px-4 disabled:opacity-60"
                >
                  {data.shortlisted ? '★ Shortlisted' : '☆ Shortlist'}
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

          {!data.preview && data.blocked && (
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

          {!data.preview && !data.myProfileId && (
            <div className="card p-4 text-sm text-center text-ink-soft">
              <Link href="/profile/edit" className="text-maroon underline">Complete your profile</Link>
              {' '}to send interests and shortlist profiles.
            </div>
          )}

          {/* ── 4–5. Match summary and every factor behind it (unchanged). */}
          {data.match && <MatchPanel match={data.match} />}

          {/* ── 6. Full profile */}
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

        </div>
      </div>
    </main>
  )
}
