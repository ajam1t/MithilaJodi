'use client'

import { useCallback, useRef, useState } from 'react'
import { InvitationCard, CARD_W, CARD_H } from '@/components/invitation/InvitationCard'
import {
  EMPTY_INVITATION, TEMPLATES, getTemplate, invitationFileName,
  type InvitationData, type TemplateId,
} from '@/lib/invitation'
import { cn } from '@/lib/utils/cn'

type Status = { kind: 'idle' | 'working' | 'ok' | 'error'; message?: string }

/** Export scale — 2x gives a crisp 2000×2800 PNG, good for print and WhatsApp. */
const EXPORT_SCALE = 2

export function InvitationMaker() {
  // Details and template are separate state, so switching templates never
  // touches the entered data.
  const [data, setData] = useState<InvitationData>(EMPTY_INVITATION)
  const [templateId, setTemplateId] = useState<TemplateId>('kohbar')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const previewRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof InvitationData>(key: K, value: InvitationData[K]) => {
    setData((d) => ({ ...d, [key]: value }))
    setStatus({ kind: 'idle' })
  }

  /** Rasterise the live preview SVG to a PNG blob. No external deps, no server. */
  const renderPng = useCallback(async (): Promise<Blob> => {
    const svg = previewRef.current?.querySelector('svg')
    if (!svg) throw new Error('preview not ready')

    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('width', String(CARD_W))
    clone.setAttribute('height', String(CARD_H))
    clone.removeAttribute('class')

    const xml = new XMLSerializer().serializeToString(clone)
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not render the card image.'))
      el.src = src
    })

    const canvas = document.createElement('canvas')
    canvas.width = CARD_W * EXPORT_SCALE
    canvas.height = CARD_H * EXPORT_SCALE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available in this browser.')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image file.'))),
        'image/png',
        0.95
      )
    })
  }, [])

  const handleDownload = async () => {
    setStatus({ kind: 'working', message: 'Preparing your card…' })
    try {
      const blob = await renderPng()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = invitationFileName(data)
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatus({ kind: 'ok', message: 'Downloaded. Check your device’s Downloads folder.' })
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Download failed.' })
    }
  }

  const handleShare = async () => {
    setStatus({ kind: 'working', message: 'Preparing to share…' })
    try {
      const blob = await renderPng()
      const file = new File([blob], invitationFileName(data), { type: 'image/png' })

      // Native share sheet, where the device supports sharing files.
      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Wedding Invitation',
          text: 'Our wedding invitation — made on Mithila Jodi',
        })
        setStatus({ kind: 'ok', message: 'Shared.' })
        return
      }

      // Graceful fallback: download the image so it can be attached manually.
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = invitationFileName(data)
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatus({
        kind: 'ok',
        message: 'Sharing isn’t supported on this browser, so the card was downloaded — attach it in WhatsApp or email.',
      })
    } catch (err) {
      // A user dismissing the native share sheet throws AbortError — not an error.
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus({ kind: 'idle' })
        return
      }
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Sharing failed.' })
    }
  }

  const busy = status.kind === 'working'

  return (
    <div className="wrap py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-10 lg:items-start">

        {/* ── Left: template picker + form ── */}
        <div className="order-2 lg:order-1 min-w-0">
          {/* Step 1 — template */}
          <section aria-labelledby="step-template">
            <h2 id="step-template" className="font-serif text-[20px] sm:text-[23px] text-maroon">
              <span className="text-gold mr-2">1.</span>Choose a design
            </h2>
            <p className="text-[13.5px] text-ink-soft mt-1 mb-4">
              Switch any time — your details are kept.
            </p>

            <div
              className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar snap-x"
              role="radiogroup"
              aria-label="Invitation design"
            >
              {TEMPLATES.map((t) => {
                const active = t.id === templateId
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTemplateId(t.id)}
                    className={cn(
                      'snap-start shrink-0 w-[104px] rounded-mj-sm border-2 p-1.5 text-left transition-all',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                      active ? 'border-gold bg-gold/10 shadow-mj-xs' : 'border-paper-3 hover:border-gold/60'
                    )}
                  >
                    <span
                      className="block h-[92px] rounded-[4px] overflow-hidden"
                      style={{ background: t.palette.bg }}
                      aria-hidden="true"
                    >
                      <span
                        className="block h-full w-full"
                        style={{
                          background: `linear-gradient(160deg, ${t.palette.bg} 0%, ${t.palette.bg} 22%, ${t.palette.panel} 22%, ${t.palette.panel} 78%, ${t.palette.bg} 78%)`,
                        }}
                      >
                        <span
                          className="block mx-auto mt-[30px] h-[3px] w-8 rounded"
                          style={{ background: t.palette.gold }}
                        />
                        <span
                          className="block mx-auto mt-[6px] h-[7px] w-14 rounded"
                          style={{ background: t.palette.heading, opacity: 0.85 }}
                        />
                        <span
                          className="block mx-auto mt-[5px] h-[3px] w-10 rounded"
                          style={{ background: t.palette.muted, opacity: 0.6 }}
                        />
                      </span>
                    </span>
                    <span className="block mt-1.5 font-serif text-[13px] text-maroon leading-tight truncate">
                      {t.name}
                    </span>
                    <span className="block text-[10.5px] text-ink-soft leading-tight truncate">
                      {t.tag}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-[12.5px] text-ink-soft mt-1.5">
              {getTemplate(templateId).description}
            </p>
          </section>

          {/* Step 2 — details */}
          <section aria-labelledby="step-details" className="mt-8">
            <h2 id="step-details" className="font-serif text-[20px] sm:text-[23px] text-maroon">
              <span className="text-gold mr-2">2.</span>Add your details
            </h2>
            <p className="text-[13.5px] text-ink-soft mt-1 mb-4">
              The preview updates as you type. Leave a field blank to use the sample text.
            </p>

            <div className="card p-4 sm:p-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label htmlFor="inv-bride" className="field-label">Bride’s name</label>
                <input
                  id="inv-bride" type="text" className="input" maxLength={40}
                  placeholder="e.g. Janaki" value={data.brideName}
                  onChange={(e) => set('brideName', e.target.value)}
                />
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="inv-groom" className="field-label">Groom’s name</label>
                <input
                  id="inv-groom" type="text" className="input" maxLength={40}
                  placeholder="e.g. Aditya" value={data.groomName}
                  onChange={(e) => set('groomName', e.target.value)}
                />
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="inv-date" className="field-label">Wedding date</label>
                <input
                  id="inv-date" type="date" className="input"
                  value={data.date}
                  onChange={(e) => set('date', e.target.value)}
                />
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="inv-time" className="field-label">Time</label>
                <input
                  id="inv-time" type="text" className="input" maxLength={40}
                  placeholder="e.g. 7:00 PM onwards" value={data.time}
                  onChange={(e) => set('time', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="inv-venue" className="field-label">Venue</label>
                <input
                  id="inv-venue" type="text" className="input" maxLength={70}
                  placeholder="e.g. Thakur Vivah Bhawan" value={data.venue}
                  onChange={(e) => set('venue', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="inv-city" className="field-label">City</label>
                <input
                  id="inv-city" type="text" className="input" maxLength={50}
                  placeholder="e.g. Darbhanga, Bihar" value={data.city}
                  onChange={(e) => set('city', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="inv-message" className="field-label">
                  Family message <span className="normal-case tracking-normal text-ink-soft font-normal">(optional)</span>
                </label>
                <textarea
                  id="inv-message" className="textarea min-h-[76px]" maxLength={180}
                  placeholder="e.g. Together with our families, we request the honour of your presence."
                  value={data.message}
                  onChange={(e) => set('message', e.target.value)}
                />
                <p className="field-hint">{data.message.length}/180</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setData(EMPTY_INVITATION); setStatus({ kind: 'idle' }) }}
              className="mt-3 text-[13px] text-ink-soft hover:text-maroon underline underline-offset-2"
            >
              Clear all details
            </button>
          </section>
        </div>

        {/* ── Right: live preview + actions (first on mobile) ── */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-24">
          <h2 className="font-serif text-[20px] sm:text-[23px] text-maroon mb-1">
            <span className="text-gold mr-2">3.</span>Preview &amp; download
          </h2>
          <p className="text-[13.5px] text-ink-soft mb-4">
            Every card carries a small “Made with ❤ on Mithila Jodi” credit.
          </p>

          <div
            ref={previewRef}
            className="rounded-mj-sm overflow-hidden shadow-mj bg-cream mx-auto max-w-[380px] lg:max-w-none"
          >
            <InvitationCard data={data} templateId={templateId} className="block w-full h-auto" />
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[380px] mx-auto lg:max-w-none">
            <button
              type="button" onClick={handleDownload} disabled={busy}
              className="btn-primary w-full justify-center py-3.5 text-[15px]"
            >
              {busy ? 'Working…' : 'Download image'}
            </button>
            <button
              type="button" onClick={handleShare} disabled={busy}
              className="btn-ghost w-full justify-center py-3.5 text-[15px]"
            >
              Share
            </button>
          </div>

          {status.message && (
            <p
              role="status"
              className={cn(
                'mt-3 text-[13px] leading-relaxed text-center max-w-[380px] mx-auto lg:max-w-none',
                status.kind === 'error' ? 'text-terra' : 'text-ink-soft'
              )}
            >
              {status.message}
            </p>
          )}

          <p className="mt-4 text-[12px] text-ink-soft/80 leading-relaxed text-center max-w-[380px] mx-auto lg:max-w-none">
            Your details stay in this browser. Nothing is uploaded or saved on our servers.
          </p>
        </div>
      </div>
    </div>
  )
}
