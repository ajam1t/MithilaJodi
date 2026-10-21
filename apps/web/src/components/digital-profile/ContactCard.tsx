'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { SharedProfile } from '@/lib/profileShare'
import type { PartnerPreferencesDisplay } from '@/types/profile'

/**
 * The Contact tab of a Digital Profile: how to reach the family, the way they
 * asked to be reached. The number (and whose it is) only on a link that
 * shares contact; their preferred way (call / WhatsApp), days and hours in
 * India time — with a live "good time now?" — and "please connect only if",
 * read against their own partner preferences. Without a shared number it says
 * how to connect through Mithila Jodi instead.
 */

const DAY: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }
const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function hm(t: string | null): number | null {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function fmt(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'pm' : 'am', h12 = h % 12 || 12
  return m ? `${h12}:${String(m).padStart(2, '0')} ${ap}` : `${h12} ${ap}`
}
/** Is it within their days and hours right now, in India time? */
function nowStatus(days: string[], from: string | null, to: string | null): 'now' | 'later' | null {
  if (!days.length && !from) return null
  const ist = new Date(Date.now() + 5.5 * 3600e3)
  const day = ORDER[(ist.getUTCDay() + 6) % 7]
  const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes()
  const dayOk = !days.length || days.includes(day)
  const a = hm(from), b = hm(to)
  const timeOk = a == null || b == null || (a <= b ? mins >= a && mins <= b : mins >= a || mins <= b)
  return dayOk && timeOk ? 'now' : 'later'
}

export function ContactCard({ first, contact, prefs, partner, profileHref, audience }: {
  first: string
  contact: SharedProfile['contact']
  prefs: SharedProfile['contactPrefs']
  partner: PartnerPreferencesDisplay | null
  /** Their profile on Mithila Jodi, for a member; join, for a visitor. */
  profileHref: string | null
  audience: 'visitor' | 'member' | 'owner'
}) {
  const [status, setStatus] = useState<'now' | 'later' | null>(null)
  useEffect(() => { if (prefs) setStatus(nowStatus(prefs.days, prefs.timeFrom, prefs.timeTo)) }, [prefs])

  const digits = contact?.mobile?.replace(/\D/g, '').slice(-10) ?? ''
  const via = prefs?.via ?? 'either'
  const days = prefs ? ORDER.filter(d => prefs.days.includes(d)) : []
  const hours = prefs?.timeFrom && prefs?.timeTo ? `${fmt(prefs.timeFrom)} – ${fmt(prefs.timeTo)}` : null
  const rules = (prefs?.rules ?? []).map(r =>
    r === 'age' ? (partner?.ageRange ? `Your age is within ${partner.ageRange}` : null)
    : r === 'location' ? (partner?.location ? `You live in or near ${partner.location}` : null)
    : r === 'community' ? (partner?.community ? `You are from ${partner.community}` : null)
    : 'You have sent an interest on Mithila Jodi first',
  ).filter(Boolean) as string[]

  return (
    <section className="dpk" aria-label={`Contact ${first}'s family`}>
      <p className="dpk-eyebrow">Contact</p>
      <h2 className="dpk-title">Reaching {first}&rsquo;s family</h2>

      {contact?.mobile ? (
        <div className="dpk-number">
          <div className="min-w-0">
            <p className="dpk-label">{contact.relation ? `${contact.relation}'s number` : 'Mobile'}</p>
            <p className="dpk-digits">{contact.mobile}</p>
          </div>
          <div className="dpk-actions">
            {via !== 'whatsapp' && <a href={`tel:+91${digits}`} className={`dpk-btn ${via === 'call' ? 'is-main' : ''}`}>📞 Call</a>}
            {via !== 'call' && <a href={`https://wa.me/91${digits}`} target="_blank" rel="noopener noreferrer" className={`dpk-btn is-wa ${via === 'whatsapp' ? 'is-main' : ''}`}>WhatsApp</a>}
          </div>
        </div>
      ) : (
        <p className="dpk-empty">
          {audience === 'visitor'
            ? `${first}'s number is not part of this link. Join Mithila Jodi free and send an interest — the family can share their number once they accept.`
            : `${first}'s number is not part of this link. Send an interest on Mithila Jodi to connect.`}
        </p>
      )}

      {prefs && (prefs.via || days.length > 0 || hours) && (
        <div className="dpk-when">
          {prefs.via && <p><span className="dpk-k">Best way</span>{prefs.via === 'call' ? 'A phone call' : prefs.via === 'whatsapp' ? 'WhatsApp message first' : 'Call or WhatsApp'}</p>}
          {days.length > 0 && (
            <div><span className="dpk-k">Days</span>
              <span className="dpk-days">{ORDER.map(d => <i key={d} data-on={days.includes(d) || undefined}>{DAY[d][0]}</i>)}</span>
              <span className="ml-2 text-[13px] text-ink-soft">{days.length === 7 ? 'Any day' : days.map(d => DAY[d]).join(', ')}</span>
            </div>
          )}
          {hours && <p><span className="dpk-k">Hours</span>{hours} <span className="text-[12px] text-ink-soft">India time</span></p>}
          {status && contact?.mobile && (
            <p className={`dpk-live ${status === 'now' ? 'is-now' : ''}`}>
              <span aria-hidden="true" />{status === 'now' ? 'A good time to reach them now' : 'Outside their preferred time right now'}
            </p>
          )}
        </div>
      )}

      {rules.length > 0 && (
        <div className="dpk-rules">
          <p className="dpk-k">Please connect only if</p>
          <ul>{rules.map(r => <li key={r}><span aria-hidden="true">✓</span>{r}</li>)}</ul>
        </div>
      )}

      {prefs?.note && <p className="dpk-note">&ldquo;{prefs.note}&rdquo;</p>}

      {profileHref && (
        <Link href={profileHref} className="dpk-link">
          <span className="dpk-link-icon" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" width={24} height={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-maroon">
              {audience === 'visitor' ? 'Join Mithila Jodi to send an interest' : `${first}'s profile on Mithila Jodi`}
            </span>
            <span className="block text-[12px] text-ink-soft">{audience === 'visitor' ? 'Free · takes about three minutes' : 'Send an interest, see your match score'}</span>
          </span>
          <span aria-hidden="true" className="text-maroon">→</span>
        </Link>
      )}
    </section>
  )
}
