'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { WhatsAppIcon } from '@/components/whatsapp/JoinCommunity'
import {
  DEFAULT_SHARE_MESSAGE, SECTION_GROUPS, SHARE_SECTIONS, formatDay,
} from '@/lib/digitalProfile'
import type { LinkActivity, OwnerShare } from '@/lib/digitalProfileOwner'

/**
 * The owner's side of a Digital Profile: the link, who can see what, and
 * whether it has been opened. Every change goes through the existing share
 * API, then the page re-renders on the server — so the preview below is
 * always the real projection, not a client-side guess at it.
 */

const MSG_KEY = 'mjdp-share-message'

type Props = {
  firstName: string
  shares: OwnerShare[]
  primary: OwnerShare | null
  activity: LinkActivity | null
  siteUrl: string
  preview: ReactNode
}

async function api(url: string, method: 'POST' | 'PATCH', body: object) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (r.status === 401) throw new Error('Your session has ended. Please log in again to make changes.')
  if (!r.ok || !j.ok) throw new Error(j.message ?? 'Something went wrong. Please try again.')
  return j
}

function Card({ title, sub, children, id }: { title: string; sub?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="rounded-mj border border-gold/30 bg-cream p-4 shadow-mj-xs sm:p-5" aria-label={title}>
      <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-maroon">{title}</h2>
      {sub && <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{sub}</p>}
      <div className="mt-3.5">{children}</div>
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

const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10)
const plusDays = (d: number) => new Date(Date.now() + d * 864e5 + 5.5 * 3600e3).toISOString().slice(0, 10)

export function DigitalProfileDashboard({ firstName, shares, primary, activity, siteUrl, preview }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [confirmOff, setConfirmOff] = useState<OwnerShare | null>(null)
  const [confirmContact, setConfirmContact] = useState(false)

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
    try { await navigator.clipboard.writeText(url(s)); setCopied(s.id); window.setTimeout(() => setCopied(null), 2000) } catch { window.prompt('Copy your profile link:', url(s)) }
  }
  async function nativeShare(s: OwnerShare) {
    try { await navigator.share({ title: `${firstName || 'My'} — Mithila Jodi Digital Profile`, text: textFor(s).replace(url(s), '').trim(), url: url(s) }) } catch { /* cancelled */ }
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
  const turnOff = (s: OwnerShare) => run(async () => { await api(`/api/profile/shares/${s.id}`, 'PATCH', { revoke: true }); setConfirmOff(null) }, 'Link turned off.')
  const newLink = (label?: string) => run(async () => {
    await api('/api/profile/shares', 'POST', { fields: primary?.fields, label: label?.trim() || null })
    setNewLabel('')
  }, 'New link ready.')

  const others = shares.filter(s => s.id !== primary?.id)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <header className="mb-6 text-center lg:text-left">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-terra">Digital Profile</p>
        <h1 className="mt-1.5 font-serif text-[28px] leading-tight text-maroon sm:text-[34px]">
          {firstName ? `${firstName}, this is your Digital Profile` : 'Your Digital Profile'}
        </h1>
        <p className="mt-1.5 text-[14.5px] text-ink-soft">See how your profile looks when someone opens your shared link.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2.5 lg:justify-start">
          {primary?.live ? (
            <a href={url(primary)} target="_blank" rel="noopener noreferrer" className="btn-primary px-5 py-2.5 text-[14.5px]">Preview as Visitor ↗</a>
          ) : (
            <a href="#preview" className="btn-primary px-5 py-2.5 text-[14.5px]">Preview as Visitor</a>
          )}
          <a href="#preview" className="btn-ghost px-5 py-2.5 text-[14.5px] lg:hidden">See it here ↓</a>
        </div>
      </header>

      {(error || notice) && (
        <p role="status" className={`mb-4 rounded-mj-sm border px-3 py-2 text-[13.5px] ${error ? 'border-error/30 bg-error-soft text-error-fg' : 'border-success/30 bg-success-soft text-success-fg'}`}>
          {error || notice}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
        <div className="space-y-5">
          {/* ── Sharing controls ── */}
          {primary && (
            <Card title="Sharing controls">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] uppercase tracking-wide text-ink-soft">Profile link</p>
                <Status share={primary} />
              </div>
              <p className="mt-1.5 break-all rounded-mj-sm border border-paper-3 bg-white px-3 py-2 font-mono text-[13px] text-ink">{shownUrl(primary)}</p>
              <p className="mt-1.5 text-[12.5px] text-ink-soft">
                {primary.live
                  ? primary.noExpiry ? 'No expiry date — works until you turn it off.' : `Works until ${formatDay(primary.expiresAt)}.`
                  : primary.revokedAt
                    ? 'You turned this link off. It stays off — anyone holding it sees a “turned off” page.'
                    : `This link expired on ${formatDay(primary.expiresAt)}.`}
              </p>

              {primary.live ? (
                <>
                  <div className="mt-3 grid grid-cols-1 gap-2 min-[440px]:grid-cols-2 sm:flex sm:flex-wrap">
                    <button type="button" onClick={() => copy(primary)} className="btn-ghost justify-center px-4 py-2.5 text-[14px]">
                      {copied === primary.id ? '✓ Copied' : 'Copy Link'}
                    </button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(textFor(primary))}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-green px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-green-2">
                      <WhatsAppIcon /> Share on WhatsApp
                    </a>
                    {canNativeShare && (
                      <button type="button" onClick={() => nativeShare(primary)} className="btn-ghost justify-center px-4 py-2.5 text-[14px] min-[440px]:col-span-2 sm:col-span-1">More ways to share</button>
                    )}
                  </div>
                  <button type="button" onClick={() => setEditMsg(v => !v)} className="mt-2.5 text-[13px] text-maroon underline underline-offset-2">
                    {editMsg ? 'Done editing message' : 'Edit the WhatsApp message'}
                  </button>
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => newLink()} className="btn-primary px-4 py-2.5 text-[14px]">Create a new link</button>
                  {!primary.revokedAt && (
                    <button type="button" onClick={() => setEditExpiry(true)} className="btn-ghost px-4 py-2.5 text-[14px]">Extend this link</button>
                  )}
                </div>
              )}

              {/* Expiry */}
              {!primary.revokedAt && (
                <div className="mt-4 border-t border-paper-3 pt-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-medium text-ink">Link expiry</p>
                      <p className="text-[12.5px] text-ink-soft">{primary.noExpiry ? 'No expiry' : formatDay(primary.expiresAt)}</p>
                    </div>
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
                        <label className="flex items-center gap-2.5 text-[14px] text-ink">
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
                </div>
              )}

              {primary.live && (
                <div className="mt-4 border-t border-paper-3 pt-3.5">
                  <button type="button" onClick={() => setConfirmOff(primary)} className="text-[13.5px] font-medium text-terra underline underline-offset-2">
                    Turn off this link
                  </button>
                  <p className="mt-0.5 text-[12px] text-ink-soft">Stops it working everywhere it has been forwarded. You can make a new link afterwards.</p>
                </div>
              )}
            </Card>
          )}

          {/* ── Activity ── */}
          {primary && activity && (
            <Card title="Profile link activity" sub="Your own visits and WhatsApp’s link previews are not counted.">
              {activity.totalOpens === 0 ? (
                <p className="rounded-mj-sm bg-paper-2/60 px-3 py-3 text-[13.5px] text-ink-soft">
                  Not opened yet. Share your link and you will see here when it is opened.
                </p>
              ) : (
                <>
                  <dl className={`grid gap-2.5 ${activity.uniqueVisitors != null ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <div className="rounded-mj-sm border border-gold/25 bg-white px-3 py-2.5">
                      <dd className="font-serif text-[26px] leading-none text-maroon">{activity.totalOpens}</dd>
                      <dt className="mt-1 text-[11.5px] text-ink-soft">Total opens</dt>
                    </div>
                    {activity.uniqueVisitors != null && (
                      <div className="rounded-mj-sm border border-gold/25 bg-white px-3 py-2.5">
                        <dd className="font-serif text-[26px] leading-none text-maroon">{activity.uniqueVisitors}</dd>
                        <dt className="mt-1 text-[11.5px] text-ink-soft">Unique visitors</dt>
                      </div>
                    )}
                    <div className="rounded-mj-sm border border-gold/25 bg-white px-3 py-2.5">
                      <dd className="font-serif text-[17px] leading-tight text-maroon">{activity.lastOpenedAt ? formatDay(activity.lastOpenedAt) : '—'}</dd>
                      <dt className="mt-1 text-[11.5px] text-ink-soft">Last opened</dt>
                    </div>
                  </dl>
                  {activity.uniqueVisitors != null && (
                    <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                      Unique visitors are counted per browser, so one person on two phones counts twice.
                      {activity.trackedSince && ` Counted since ${formatDay(activity.trackedSince)}.`}
                    </p>
                  )}
                  {activity.recent.length > 0 && (
                    <ul className="mt-3 divide-y divide-paper-3 rounded-mj-sm border border-paper-3 bg-white">
                      {activity.recent.map(r => (
                        <li key={r.day} className="flex items-center justify-between px-3 py-2 text-[13.5px]">
                          <span className="text-ink">{formatDay(`${r.day}T12:00:00+05:30`)}</span>
                          <span className="text-ink-soft">Profile link opened{r.opens > 1 ? ` · ${r.opens}×` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </Card>
          )}

          {/* ── What people can see ── */}
          {primary && (
            <Card title="What people can see" sub="Choose what your shared link shows. Changes apply to this link straight away — including to people who already have it.">
              <div className="space-y-4">
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
                              <Switch on={on} disabled={locked || !primary || !!primary.revokedAt} onChange={() => toggle(s.key)} label={s.label} />
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
              {dirty && (
                <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 mt-4 flex items-center justify-between gap-3 rounded-mj-sm border border-maroon/30 bg-cream px-3 py-2.5 shadow-mj lg:bottom-4">
                  <span className="text-[13px] text-ink">Unsaved changes</span>
                  <span className="flex gap-2">
                    <button type="button" onClick={() => setFields(primary.fields)} className="btn-ghost px-3 py-1.5 text-[13px]">Discard</button>
                    <button type="button" disabled={busy} onClick={saveFields} className="btn-primary px-4 py-1.5 text-[13px]">{busy ? 'Saving…' : 'Save'}</button>
                  </span>
                </div>
              )}
            </Card>
          )}

          {/* ── More links ── */}
          <Card title="Separate links" sub="Give one family their own link, so you can turn it off without affecting anyone else.">
            {others.length > 0 && (
              <ul className="mb-3 space-y-2">
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
                        <a href={`https://wa.me/?text=${encodeURIComponent(textFor(s))}`} target="_blank" rel="noopener noreferrer" className="font-medium text-green underline underline-offset-2">WhatsApp</a>
                        <button type="button" onClick={() => setConfirmOff(s)} className="font-medium text-terra underline underline-offset-2">Turn off</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input type="text" maxLength={80} value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Who is it for? e.g. Sharma family (only you see this)"
                className="min-w-0 flex-1 rounded-mj-sm border border-ink/20 bg-white px-3 py-2 text-[14px] focus:border-maroon focus:outline-none" />
              <button type="button" disabled={busy} onClick={() => newLink(newLabel)} className="btn-ghost px-4 py-2 text-[14px]">Make a separate link</button>
            </div>
            <p className="mt-1.5 text-[12px] text-ink-soft">It shows the same sections as your main link.</p>
          </Card>
        </div>

        {/* ── Preview ── */}
        <section id="preview" aria-label="Preview as visitor" className="scroll-mt-24 lg:sticky lg:top-24">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-maroon">Exactly what visitors see</p>
            {primary?.live && <a href={url(primary)} target="_blank" rel="noopener noreferrer" className="text-[13px] text-maroon underline underline-offset-2">Open ↗</a>}
          </div>
          <div className="overflow-hidden rounded-[26px] border-[6px] border-[#2B211C] bg-paper shadow-mj lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto">
            {preview}
          </div>
        </section>
      </div>

      <Modal open={!!confirmOff} onClose={() => setConfirmOff(null)} title="Turn off this link?">
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Anyone who opens it — including people it was forwarded to — will see that it has been turned off. This cannot be undone,
          but you can make a new link whenever you want to share again.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => confirmOff && turnOff(confirmOff)} className="btn-primary px-5 py-2.5 text-[14px]">Turn it off</button>
          <button type="button" onClick={() => setConfirmOff(null)} className="btn-ghost px-5 py-2.5 text-[14px]">Keep it on</button>
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
