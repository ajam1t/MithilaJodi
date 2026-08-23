'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ProfileCard3D from '@/components/ProfileCard3D'
import type { SearchCard } from '@/components/ProfileCard'

type ProfileData = {
  id: string
  display_name: string
  gender: string
  age: number | null
  height_cm: number | null
  religion: string | null
  caste: string | null
  self_gotra: string | null
  mool: string | null
  gram: string | null
  diet: string | null
  about_me: string | null
  profile_complete: number
  native_place_name: string | null
  current_loc_name: string | null
  photo_url: string | null
  myProfileId: string | null
  interestSent: { id: string; status: string } | null
  interestReceived: { id: string; status: string } | null
  shortlisted: boolean
  blocked: boolean
  cardData: SearchCard
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

  const locationLine = [data.current_loc_name, data.native_place_name].filter(Boolean).join(' · ')
  const communityLine = [data.caste, data.self_gotra, data.mool, data.gram].filter(Boolean).join(' · ')

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
            <ProfileCard3D profile={data.cardData} hideActions />
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

          {/* About */}
          {data.about_me && (
            <div className="card p-5">
              <h2 className="font-semibold text-ink text-sm mb-2">About</h2>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{data.about_me}</p>
            </div>
          )}

          {/* Details */}
          <div className="card p-5 space-y-2.5">
            <h2 className="font-semibold text-ink text-sm mb-3">Details</h2>
            <Row label="Religion" value={data.religion} />
            <Row label="Caste" value={data.caste} />
            <Row label="Gotra" value={data.self_gotra} />
            <Row label="Mool" value={data.mool} />
            <Row label="Gram" value={data.gram} />
            <Row label="Diet" value={data.diet?.replace('_', '-') ?? null} />
            <Row label="Height" value={data.height_cm ? `${data.height_cm} cm` : null} />
            <Row label="Currently in" value={data.current_loc_name} />
            <Row label="Native place" value={data.native_place_name} />
          </div>

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

                {/* Block */}
                <button
                  type="button"
                  onClick={blockProfile}
                  disabled={busy}
                  className="text-xs text-red-600 hover:underline self-center ml-auto disabled:opacity-60"
                >
                  Block
                </button>
              </div>
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
