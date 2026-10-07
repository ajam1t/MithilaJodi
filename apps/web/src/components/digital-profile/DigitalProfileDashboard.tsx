'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { WhatsAppIcon } from '@/components/whatsapp/JoinCommunity'
import {
  DEFAULT_SHARE_MESSAGE, SECTION_GROUPS, SHARE_SECTIONS, formatDay,
} from '@/lib/digitalProfile'
import type { LinkActivity, OwnerShare } from '@/lib/digitalProfileOwner'
import { track } from '@/lib/track'

/**
 * The owner's Digital Profile — a primary destination in the member nav.
 * Top to bottom: the link and how to share it, how it is doing, compact
 * controls, then the real visitor view. Every change goes through the
 * existing share API and the page re-renders on the server, so the preview is
 * always the true projection, never a client-side guess at it.
 */

const MSG_KEY = 'mjdp-share-message'

type Props = {
  firstName: string
  shares: OwnerShare[]
  primary: OwnerShare | null
  activity: LinkActivity | null
  /** Members who viewed the profile inside Mithila Jodi, last 30 days. */
  profileViews: number
  siteUrl: string
  preview: ReactNode
  /** The six-card Profile Gallery, from this link's shared fields. */
  gallery?: ReactNode
}

async function api(url: string, method: 'POST' | 'PATCH', body: object) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (r.status === 401) throw new Error('Your session has ended. Please log in again to make changes.')
  if (!r.ok || !j.ok) throw new Error(j.message ?? 'Something went wrong. Please try again.')
  return j
}

function Card({ title, children, id, aside }: { title?: string; children: ReactNode; id?: string; aside?: ReactNode }) {
  return (
    <section id={id} className="rounded-mj border border-gold/30 bg-cream p-4 shadow-mj-xs sm:p-5" aria-label={title}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-maroon">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={onChange}
      className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors disabled:opacity-60 ${on ? 'bg-maroon' : 'bg-ink/20'}`}
    >
      <span className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-[left] ${on ? 'left-[23px]' : 'left-[3px]'}`} />
    </button>
  )
}

function Status({ share }: { share: OwnerShare }) {
  if (share.live) return <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[12px] font-semibold text-success-fg"><span aria-hidden="true">🟢</span> Active</span>
  if (share.revokedAt) return <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-2.5 py-1 text-[12px] font-semibold text-ink-soft"><span aria-hidden="true">⚪</span> Turned off</span>
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-1 text-[12px] font-semibold text-warning-fg"><span aria-hidden="true">🟠</span> Expired</span>
}

/** "7 October 2027" — the long form reads better as a validity date. */
const longDay = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10)
const plusDays = (d: number) => new Date(Date.now() + d * 864e5 + 5.5 * 3600e3).toISOString().slice(0, 10)

/** The sections, folded into the few headings a member thinks in. */
const SUMMARY: Array<{ label: string; keys: string[] }> = [
  { label: 'About', keys: ['about'] },
  { label: 'Photos', keys: ['photos'] },
  { label: 'Mithila', keys: ['caste', 'gotra', 'maternal_gotra', 'mool', 'gram'] },
  { label: 'Family', keys: ['family'] },
  { label: 'Education & career', keys: ['education', 'career'] },
  { label: 'Lifestyle', keys: ['lifestyle'] },
  { label: 'Looking for', keys: ['preferences'] },
  { label: 'Horoscope', keys: ['horoscope'] },
  { label: 'Contact', keys: ['contact'] },
]

export function DigitalProfileDashboard({ firstName, shares, primary, activity, profileViews, siteUrl, preview, gallery }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [confirmOff, setConfirmOff] = useState<OwnerShare | null>(null)
  const [confirmRegen, setConfirmRegen] = useState(false)
  const [confirmContact, setConfirmContact] = useState(false)
  const [manage, setManage] = useState(false)

  // ── visibility, staged until saved ──
  const [fields, setFields] = useState<string[]>(primary?.fields ?? [])
  useEffect(() => { setFields(primary?.fields ?? []) }, [primary?.id, primary?.fields])
  const dirty = useMemo(
    () => !!primary && [...fields].sort().join() !== [...primary.fields].sort().join(),
    [fields, primary],
  )

  // ── expiry editor ──
  const [editExpiry, setEditExpiry] = useState(false)
  const [expiryMode, setExpiryMode] = useState<'date' | 'none'>('date')
  const [expiryDate, setExpiryDate] = useState(plusDays(365))

  // ── WhatsApp message, remembered on this device only ──
  const [message, setMessage] = useState(DEFAULT_SHARE_MESSAGE)
  const [editMsg, setEditMsg] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  useEffect(() => {
    try { const m = localStorage.getItem(MSG_KEY); if (m) setMessage(m) } catch { /* ignore */ }
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  // ── new labelled link ──
  const [newLabel, setNewLabel] = useState('')

  const url = (s: OwnerShare) => `${siteUrl}/p/${s.token}`
  const shownUrl = (s: OwnerShare) => url(s).replace(/^https?:\/\//, '')
  const textFor = (s: OwnerShare) => (message.includes('{link}') ? message : `${message}\n\n{link}`).replace('{link}', url(s))

  function flash(text: string) { setNotice(text); window.setTimeout(() => setNotice(''), 3000) }

  async function run(fn: () => Promise<unknown>, done?: string) {
    setBusy(true); setError('')
    try { await fn(); if (done) flash(done); router.refresh() } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  async function copy(s: OwnerShare) {
    track('dp_shared', { k: 'copy' })
    try { await navigator.clipboard.writeText(url(s)); setCopied(s.id); window.setTimeout(() => setCopied(null), 2000) } catch { window.prompt('Copy your profile link:', url(s)) }
  }
  async function nativeShare(s: OwnerShare) {
    try { await navigator.share({ title: `${firstName || 'My'} — Mithila Jodi Digital Profile`, text: textFor(s).replace(url(s), '').trim(), url: url(s) }); track('dp_shared', { k: 'native' }) } catch { /* cancelled */ }
  }
  function saveMessage(m: string) { setMessage(m); try { localStorage.setItem(MSG_KEY, m) } catch { /* ignore */ } }

  function toggle(key: string) {
    if (key === 'contact' && !fields.includes('contact')) { setConfirmContact(true); return }
    setFields(f => (f.includes(key) ? f.filter(k => k !== key) : [...f, key]))
  }

  const saveFields = () => primary && run(() => api(`/api/profile/shares/${primary.id}`, 'PATCH', { fields }), 'Saved — your preview is updated.')
  const saveExpiry = () => primary && run(async () => {
    await api(`/api/profile/shares/${primary.id}`, 'PATCH', { expires_at: expiryMode === 'none' ? null : expiryDate })
    setEditExpiry(false)
  }, 'Expiry updated.')
  const turnOff = (s: OwnerShare) => run(async () => { await api(`/api/profile/shares/${s.id}`, 'PATCH', { revoke: true }); setConfirmOff(null) }, 'Link revoked.')
  /** A fresh link with the same sections; the old one stops working. */
  const regenerate = () => run(async () => {
    await api('/api/profile/shares', 'POST', { fields: primary?.fields })
    if (primary?.live) await api(`/api/profile/shares/${primary.id}`, 'PATCH', { revoke: true })
    setConfirmRegen(false)
  }, 'New link ready. The old one no longer works.')
  const newLink = (label?: string) => run(async () => {
    await api('/api/profile/shares', 'POST', { fields: primary?.fields, label: label?.trim() || null })
    setNewLabel('')
  }, 'New link ready.')

  const others = shares.filter(s => s.id !== primary?.id)
  const shown = new Set(primary?.fields ?? [])

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:py-8">
      <header>
        <h1 className="font-serif text-[28px] leading-tight text-maroon sm:text-[32px]">Your Digital Profile</h1>
        <p className="mt-1 text-[13.5px] text-ink-soft">Your shareable Mithila Jodi profile</p>
      </header>

      {(error || notice) && (
        <p role="status" className={`rounded-mj-sm border px-3 py-2 text-[13.5px] ${error ? 'border-error/30 bg-error-soft text-error-fg' : 'border-success/30 bg-success-soft text-success-fg'}`}>
          {error || notice}
        </p>
      )}

      {/* ── Link & sharing ── */}
      {primary && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Status share={primary} />
            <p className="text-[13px] text-ink-soft">
              {primary.live
                ? primary.noExpiry ? 'No expiry date' : <>Valid until <span className="font-semibold text-ink">{longDay(primary.expiresAt)}</span></>
                : primary.revokedAt ? 'You revoked this link' : `Expired on ${longDay(primary.expiresAt)}`}
            </p>
          </div>

          <p className="mt-4 text-[12px] font-medium uppercase tracking-wide text-ink-soft">Your profile link</p>
          <p className="mt-1 break-all rounded-mj-sm border border-paper-3 bg-white px-3 py-2.5 font-mono text-[13px] text-ink">{shownUrl(primary)}</p>

          {primary.live ? (
            <>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(textFor(primary))}`} target="_blank" rel="noopener noreferrer" onClick={() => track('dp_shared', { k: 'whatsapp' })}
                className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-green px-5 text-[15px] font-semibold text-white transition-colors hover:bg-green-2"
              >
                <WhatsAppIcon size={19} /> Share on WhatsApp
              </a>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => copy(primary)} className="btn-ghost min-h-[44px] justify-center px-4 text-[14px]">
                  {copied === primary.id ? 'Link copied ✓' : 'Copy Link'}
                </button>
                <a href="#preview" className="btn-ghost min-h-[44px] justify-center px-4 text-[14px]">Preview</a>
              </div>
              <p className="sr-only" aria-live="polite">{copied === primary.id ? 'Link copied' : ''}</p>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                <button type="button" onClick={() => setEditMsg(v => !v)} className="text-maroon underline underline-offset-2">
                  {editMsg ? 'Done editing message' : 'Edit the WhatsApp message'}
                </button>
                {canNativeShare && (
                  <button type="button" onClick={() => nativeShare(primary)} className="text-maroon underline underline-offset-2">More ways to share</button>
                )}
              </div>
              {editMsg && (
                <div className="mt-2">
                  <textarea value={message} onChange={e => saveMessage(e.target.value)} rows={4} maxLength={600}
                    className="w-full rounded-mj-sm border border-ink/20 bg-white px-3 py-2 text-[14px] text-ink focus:border-maroon focus:outline-none" />
                  <p className="mt-1 text-[12px] text-ink-soft">
                    <code>{'{link}'}</code> is replaced with your link. Nothing about you is added to the message. ·{' '}
                    <button type="button" className="underline" onClick={() => saveMessage(DEFAULT_SHARE_MESSAGE)}>Reset</button>
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="mt-3 rounded-mj-sm bg-paper-2/60 p-3">
              <p className="text-[13.5px] text-ink-soft">
                {primary.revokedAt ? 'Anyone holding this link sees that it was turned off.' : 'Anyone opening this link sees that it has expired.'} Nothing from your profile is shown.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => newLink()} className="btn-primary px-4 py-2.5 text-[14px]">Generate new link</button>
                {!primary.revokedAt && (
                  <button type="button" onClick={() => setEditExpiry(true)} className="btn-ghost px-4 py-2.5 text-[14px]">Extend this link</button>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Stats ── real counts; nothing about a visitor beyond "opened". */}
      {primary && activity && (
        <Card title="How it's doing">
          <dl className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Profile views', value: String(profileViews), hint: 'members, last 30 days' },
              { label: 'Link opens', value: String(activity.totalOpens), hint: 'all time' },
              ...(activity.uniqueVisitors != null ? [{ label: 'Unique visitors', value: String(activity.uniqueVisitors), hint: 'per browser' }] : []),
              { label: 'Last opened', value: activity.lastOpenedAt ? formatDay(activity.lastOpenedAt) : '—', hint: activity.lastOpenedAt ? '' : 'not yet', small: true },
            ].map(t => (
              <div key={t.label} className="rounded-mj-sm border border-gold/25 bg-white px-3 py-2.5">
                <dd className={`font-serif leading-none text-maroon ${'small' in t && t.small ? 'text-[17px]' : 'text-[26px]'}`}>{t.value}</dd>
                <dt className="mt-1.5 text-[12px] font-medium text-ink">{t.label}</dt>
                {t.hint && <p className="text-[11px] text-ink-soft">{t.hint}</p>}
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
            Your own visits and WhatsApp&rsquo;s link previews are not counted. No visitor details are recorded.
          </p>
          {activity.recent.length > 0 && (
            <details className="mt-2 text-[13px]">
              <summary className="cursor-pointer font-medium text-maroon">Recent opens</summary>
              <ul className="mt-2 divide-y divide-paper-3 rounded-mj-sm border border-paper-3 bg-white">
                {activity.recent.map(r => (
                  <li key={r.day} className="flex items-center justify-between px-3 py-2">
                    <span className="text-ink">{formatDay(`${r.day}T12:00:00+05:30`)}</span>
                    <span className="text-ink-soft">Opened{r.opens > 1 ? ` · ${r.opens}×` : ''}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>
      )}

      {/* ── Your Profile Gallery ── what families see first, from this link. */}
      {gallery && primary?.live && <Card>{gallery}</Card>}

      {/* ── Controls ── compact; detail on demand. */}
      {primary && (
        <Card title="Controls">
          <ul className="divide-y divide-paper-3">
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="block text-[14px] font-medium text-ink">Visibility</span>
                <span className="mt-0.5 block"><Status share={primary} /></span>
              </span>
              {primary.live && (
                <button type="button" onClick={() => setConfirmOff(primary)} className="text-[13.5px] font-medium text-terra underline underline-offset-2">Revoke link</button>
              )}
            </li>
            {!primary.revokedAt && (
              <li className="py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-[14px] font-medium text-ink">Link expiry</span>
                    <span className="block text-[13px] text-ink-soft">{primary.noExpiry ? 'No expiry' : longDay(primary.expiresAt)}</span>
                  </span>
                  {!editExpiry && (
                    <button type="button" onClick={() => {
                        setExpiryMode(primary.noExpiry ? 'none' : 'date')
                        if (!primary.noExpiry && primary.live) setExpiryDate(new Date(new Date(primary.expiresAt).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10))
                        setEditExpiry(true)
                      }}
                      className="text-[13.5px] font-medium text-maroon underline underline-offset-2">Change</button>
                  )}
                </div>
                {editExpiry && (
                  <div className="mt-3 rounded-mj-sm border border-gold/30 bg-paper-2/60 p-3">
                    <fieldset className="space-y-2">
                      <legend className="sr-only">When should this link stop working?</legend>
                      <label className="flex flex-wrap items-center gap-2.5 text-[14px] text-ink">
                        <input type="radio" name="expiry" checked={expiryMode === 'date'} onChange={() => setExpiryMode('date')} className="accent-maroon" />
                        Stops working after
                        <input type="date" value={expiryDate} min={today()} max={plusDays(5 * 365)}
                          onChange={e => { setExpiryDate(e.target.value); setExpiryMode('date') }}
                          className="rounded-mj-sm border border-ink/20 bg-white px-2 py-1 text-[14px]" />
                      </label>
                      <div className="flex flex-wrap gap-1.5 pl-7">
                        {[[30, '30 days'], [90, '3 months'], [365, '1 year']].map(([d, l]) => (
                          <button key={d} type="button" onClick={() => { setExpiryDate(plusDays(d as number)); setExpiryMode('date') }}
                            className="rounded-full border border-gold/40 bg-cream px-2.5 py-1 text-[12px] text-maroon">{l}</button>
                        ))}
                      </div>
                      <label className="flex items-center gap-2.5 text-[14px] text-ink">
                        <input type="radio" name="expiry" checked={expiryMode === 'none'} onChange={() => setExpiryMode('none')} className="accent-maroon" />
                        No expiry — works until I turn it off
                      </label>
                    </fieldset>
                    <div className="mt-3 flex gap-2">
                      <button type="button" disabled={busy} onClick={saveExpiry} className="btn-primary px-4 py-2 text-[13.5px]">Save expiry</button>
                      <button type="button" onClick={() => setEditExpiry(false)} className="btn-ghost px-4 py-2 text-[13.5px]">Cancel</button>
                    </div>
                  </div>
                )}
              </li>
            )}
            <li className="py-2.5">
              <span className="block text-[14px] font-medium text-ink">Public sections</span>
              <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="What your link shows">
                {SUMMARY.map(g => {
                  const on = g.keys.some(k => shown.has(k))
                  return (
                    <li key={g.label} className={`rounded-full border px-2.5 py-0.5 text-[12px] ${on ? 'border-green/30 bg-green/[0.06] text-green' : 'border-ink/10 text-ink-soft line-through decoration-ink/30'}`}>
                      {g.label}{on ? ' ✓' : ''}<span className="sr-only">{on ? ', shown' : ', hidden'}</span>
                    </li>
                  )
                })}
              </ul>
              <button type="button" onClick={() => setManage(v => !v)} aria-expanded={manage} className="mt-2.5 text-[13.5px] font-semibold text-maroon">
                {manage ? 'Done' : 'Manage visibility →'}
              </button>
              {manage && (
                <div className="mt-3 space-y-4">
                  <p className="text-[12.5px] text-ink-soft">Changes apply to this link straight away — including for people who already have it.</p>
                  {SECTION_GROUPS.map(g => {
                    const items = SHARE_SECTIONS.filter(s => s.group === g.id)
                    return (
                      <div key={g.id}>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-terra">{g.title}</p>
                        <ul className="divide-y divide-paper-3 rounded-mj-sm border border-paper-3 bg-white">
                          {items.map(s => {
                            const locked = 'locked' in s && s.locked
                            const on = locked || fields.includes(s.key)
                            return (
                              <li key={s.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
                                <span className="min-w-0">
                                  <span className={`block text-[14px] leading-tight ${'sensitive' in s && s.sensitive ? 'font-medium text-terra' : 'text-ink'}`}>{s.label}</span>
                                  <span className="mt-0.5 block text-[12px] leading-snug text-ink-soft">{s.hint}</span>
                                </span>
                                <Switch on={on} disabled={locked || !!primary.revokedAt} onChange={() => toggle(s.key)} label={s.label} />
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )}
              {dirty && (
                <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 mt-4 flex items-center justify-between gap-3 rounded-mj-sm border border-maroon/30 bg-cream px-3 py-2.5 shadow-mj lg:bottom-4">
                  <span className="text-[13px] text-ink">Unsaved changes</span>
                  <span className="flex gap-2">
                    <button type="button" onClick={() => setFields(primary.fields)} className="btn-ghost px-3 py-1.5 text-[13px]">Discard</button>
                    <button type="button" disabled={busy} onClick={saveFields} className="btn-primary px-4 py-1.5 text-[13px]">{busy ? 'Saving…' : 'Save'}</button>
                  </span>
                </div>
              )}
            </li>
          </ul>
          <div className="mt-2 flex flex-wrap gap-2 border-t border-paper-3 pt-3">
            <button type="button" disabled={busy} onClick={() => (primary.live ? setConfirmRegen(true) : newLink())} className="btn-ghost px-4 py-2 text-[13.5px]">
              Generate new link
            </button>
            {primary.live && (
              <button type="button" onClick={() => setConfirmOff(primary)} className="px-3 py-2 text-[13.5px] font-medium text-terra underline underline-offset-2">Revoke link</button>
            )}
          </div>

          {/* Separate links for particular families — kept, but out of the way. */}
          <details className="mt-3 border-t border-paper-3 pt-3">
            <summary className="cursor-pointer text-[13.5px] font-medium text-maroon">
              Separate links{others.length > 0 ? ` (${others.length})` : ''}
            </summary>
            <p className="mt-1.5 text-[12.5px] text-ink-soft">Give one family their own link, so you can turn it off without affecting anyone else.</p>
            {others.length > 0 && (
              <ul className="mt-2 space-y-2">
                {others.map(s => (
                  <li key={s.id} className={`rounded-mj-sm border border-paper-3 px-3 py-2.5 ${s.live ? 'bg-white' : 'bg-paper-2/50 opacity-75'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[14px] font-medium text-ink">{s.label || 'Profile link'}</span>
                      <Status share={s} />
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-soft">
                      {s.viewCount === 0 ? 'Not opened yet' : `Opened ${s.viewCount}×`} · {s.live ? (s.noExpiry ? 'no expiry' : `until ${formatDay(s.expiresAt)}`) : `made ${formatDay(s.createdAt)}`}
                    </p>
                    {s.live && (
                      <div className="mt-2 flex gap-3 text-[13px]">
                        <button type="button" onClick={() => copy(s)} className="font-medium text-maroon underline underline-offset-2">{copied === s.id ? 'Copied' : 'Copy'}</button>
                        <a href={`https://wa.me/?text=${encodeURIComponent(textFor(s))}`} target="_blank" rel="noopener noreferrer" onClick={() => track('dp_shared', { k: 'whatsapp' })} className="font-medium text-green underline underline-offset-2">WhatsApp</a>
                        <button type="button" onClick={() => setConfirmOff(s)} className="font-medium text-terra underline underline-offset-2">Revoke</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input type="text" maxLength={80} value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Who is it for? e.g. Sharma family (only you see this)"
                className="min-w-0 flex-1 rounded-mj-sm border border-ink/20 bg-white px-3 py-2 text-[14px] focus:border-maroon focus:outline-none" />
              <button type="button" disabled={busy} onClick={() => newLink(newLabel)} className="btn-ghost px-4 py-2 text-[14px]">Make a separate link</button>
            </div>
          </details>
        </Card>
      )}

      {/* ── Preview ── the real visitor projection, no owner controls in it. */}
      <section id="preview" aria-labelledby="dp-preview" className="scroll-mt-20 pt-2">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <h2 id="dp-preview" className="font-serif text-[20px] text-maroon">Preview</h2>
            <p className="text-[12.5px] text-ink-soft">Exactly what a visitor sees.</p>
          </div>
          {primary?.live && (
            <a href={url(primary)} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0 px-4 py-2 text-[13.5px]">Preview as visitor ↗</a>
          )}
        </div>
        <div className="overflow-hidden rounded-[26px] border-[6px] border-[#2B211C] bg-paper shadow-mj">
          {preview}
        </div>
      </section>

      <Modal open={!!confirmOff} onClose={() => setConfirmOff(null)} title="Revoke this link?">
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Anyone who opens it — including people it was forwarded to — will see that it has been turned off, and nothing from your profile.
          You can generate a new link whenever you want to share again.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => confirmOff && turnOff(confirmOff)} className="btn-primary px-5 py-2.5 text-[14px]">Revoke link</button>
          <button type="button" onClick={() => setConfirmOff(null)} className="btn-ghost px-5 py-2.5 text-[14px]">Keep it</button>
        </div>
      </Modal>

      <Modal open={confirmRegen} onClose={() => setConfirmRegen(false)} title="Generate a new link?">
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          You get a fresh link with the same sections, valid for a year. Your current link stops working straight away, including anywhere it has been forwarded.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={regenerate} className="btn-primary px-5 py-2.5 text-[14px]">Generate new link</button>
          <button type="button" onClick={() => setConfirmRegen(false)} className="btn-ghost px-5 py-2.5 text-[14px]">Cancel</button>
        </div>
      </Modal>

      <Modal open={confirmContact} onClose={() => setConfirmContact(false)} title="Share your contact details?">
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Your mobile, email and address will be visible to anyone who opens this link — and links get forwarded on WhatsApp.
          Most families leave this off and share a number once they have spoken.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => setConfirmContact(false)} className="btn-primary px-5 py-2.5 text-[14px]">Keep them private</button>
          <button type="button" onClick={() => { setFields(f => [...f, 'contact']); setConfirmContact(false) }} className="btn-ghost px-5 py-2.5 text-[14px]">Show contact details</button>
        </div>
      </Modal>
    </div>
  )
}
