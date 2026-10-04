'use client'

import { useState } from 'react'
import type { KundliMatchRequest } from '@/lib/astrology/types'
import { fileSafe, printKundliReport } from './printing'

type Props = {
  request: KundliMatchRequest
  scenario?: { brideSegment: number | null; groomSegment: number | null }
  names: { bride: string; groom: string }
  includeBirthDetails: boolean
  onIncludeBirthDetails: (v: boolean) => void
  onEdit: () => void
  onNew: () => void
}

type Share = { url: string; token: string; manageKey: string; expiresAt: string }

const STORE_KEY = 'mj-kundli-shares'

function remember(share: Share) {
  try {
    const list = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]') as Share[]
    localStorage.setItem(STORE_KEY, JSON.stringify([share, ...list].slice(0, 20)))
  } catch { /* storage unavailable — the link still works, it just can't be revoked later from here */ }
}

export function ResultActions({ request, scenario, names, includeBirthDetails, onIncludeBirthDetails, onEdit, onNew }: Props) {
  const [shareOpen, setShareOpen] = useState(false)
  const [includeNames, setIncludeNames] = useState(true)
  const [busy, setBusy] = useState(false)
  const [share, setShare] = useState<Share | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const printReport = () => printKundliReport(`Kundli-Match-${fileSafe(names.bride)}-${fileSafe(names.groom)}`)

  async function createLink() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/astrology/kundli-match/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request, includeNames, ...(scenario ? { scenario } : {}) }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) { setMsg(json.message ?? 'We could not create a link right now.'); return }
      const s: Share = { url: json.url, token: json.token, manageKey: json.manageKey, expiresAt: json.expiresAt }
      setShare(s)
      remember(s)
    } catch {
      setMsg('You seem to be offline. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function revoke() {
    if (!share) return
    setBusy(true)
    try {
      const res = await fetch('/api/astrology/kundli-match/share', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: share.token, manageKey: share.manageKey }),
      })
      setMsg(res.ok ? 'Link switched off. Anyone opening it now will see that it is no longer available.' : 'Could not switch the link off. Please try again.')
      if (res.ok) setShare(null)
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!share) return
    try {
      await navigator.clipboard.writeText(share.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMsg('Copy is blocked in this browser — press and hold the link to copy it.')
    }
  }

  const shareText = share ? `Our Kundli Match (Ashtakoota) result on Mithila Jodi: ${share.url}` : ''

  return (
    <div className="card p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="font-serif text-maroon text-[20px]">Download PDF</h3>
          <p className="mt-1 text-[14px] text-ink-soft leading-relaxed">
            A printable A4 report with both charts, all eight kootas, Manglik and the methodology. Choose “Save as PDF” in
            the print dialog.
          </p>
          <label className="mt-3 flex items-start gap-2.5 cursor-pointer text-[14px] text-ink">
            <input type="checkbox" className="mt-1 h-[18px] w-[18px] accent-maroon" checked={includeBirthDetails} onChange={e => onIncludeBirthDetails(e.target.checked)} />
            Include birth dates, times and places in the PDF
          </label>
          <button type="button" className="btn-primary mt-4" onClick={printReport}>Download PDF</button>
        </div>

        <div>
          <h3 className="font-serif text-maroon text-[20px]">Share result</h3>
          <p className="mt-1 text-[14px] text-ink-soft leading-relaxed">
            The shared page shows the Guna scores, Moon signs and Manglik status — never birth dates, times, places or
            planet positions. Links expire after 90 days and can be switched off.
          </p>
          {!shareOpen && !share && (
            <button type="button" className="btn-ghost mt-4" onClick={() => setShareOpen(true)}>Create a share link</button>
          )}
          {shareOpen && !share && (
            <div className="mt-3 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-[14px] text-ink">
                <input type="checkbox" className="mt-1 h-[18px] w-[18px] accent-maroon" checked={includeNames} onChange={e => setIncludeNames(e.target.checked)} />
                Show the two names on the shared page
              </label>
              <button type="button" className="btn-ghost" disabled={busy} onClick={createLink}>{busy ? 'Creating…' : 'Create link'}</button>
            </div>
          )}
          {share && (
            <div className="mt-3 space-y-3">
              <input readOnly className="input kd-input text-[14px]" value={share.url} aria-label="Share link" onFocus={e => e.currentTarget.select()} />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-ghost btn-sm" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
                <a className="btn-ghost btn-sm" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button type="button" className="btn-ghost btn-sm" onClick={() => navigator.share({ title: 'Kundli Match result', text: shareText, url: share.url }).catch(() => undefined)}>More…</button>
                )}
                <button type="button" className="btn-danger btn-sm" disabled={busy} onClick={revoke}>Stop sharing</button>
              </div>
              <p className="text-[12px] text-ink-soft">Expires {new Date(share.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
            </div>
          )}
          {msg && <p className="mt-3 text-[13px] text-terra" role="status">{msg}</p>}
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-gold/20 flex flex-wrap gap-3">
        <button type="button" className="btn-ghost" onClick={onEdit}>Edit birth details</button>
        <button type="button" className="btn-ghost" onClick={onNew}>Start a new match</button>
      </div>
    </div>
  )
}
