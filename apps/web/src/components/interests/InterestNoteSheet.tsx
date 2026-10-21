'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { INTEREST_NOTE_MAX, INTEREST_NOTE_TEMPLATES } from '@/lib/interestNotes'

/*
 * "Send interest" with an optional note — one sheet for every place an
 * interest is sent (profile page, search cards, Home, Digital Profile).
 *
 * A bottom sheet on phones, a centred dialog from `sm` up. Focus moves to the
 * note, Tab stays inside, Escape and the backdrop close it, and focus goes
 * back to whatever opened it. The note is optional: Send works empty.
 */
export function InterestNoteSheet({
  open,
  onClose,
  name,
  onSend,
}: {
  open: boolean
  onClose: () => void
  /** First name of the person the interest goes to. */
  name: string
  /**
   * Sends the interest. Resolve true to close the sheet; false (the caller
   * showed its own error) or an error message (shown here) keeps it open with
   * the note intact.
   */
  onSend: (note: string) => Promise<boolean | string>
}) {
  const titleId = useId()
  const hintId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  // Read from the key handler without re-running the open/close effect (which
  // would move focus) every time these change.
  const sendingRef = useRef(false)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // Fresh each time it opens.
  useEffect(() => { if (open) { setNote(''); setError('') } }, [open])

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    textRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sendingRef.current) { e.preventDefault(); onCloseRef.current(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), a[href]')
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [open])

  /** Put a template at the cursor (or replace an empty note) and select its first blank. */
  function insertTemplate(text: string) {
    const el = textRef.current
    const start = el?.selectionStart ?? note.length
    const end = el?.selectionEnd ?? note.length
    const before = note.slice(0, start)
    const joiner = before && !/\s$/.test(before) ? ' ' : ''
    const next = (before + joiner + text + note.slice(end)).slice(0, INTEREST_NOTE_MAX)
    setNote(next)
    const blank = next.indexOf('___', before.length)
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      if (blank >= 0) el.setSelectionRange(blank, blank + 3)
      else el.setSelectionRange(next.length, next.length)
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (sendingRef.current) return
    sendingRef.current = true
    setSending(true)
    setError('')
    let result: boolean | string = false
    try {
      result = await onSend(note.trim())
    } finally {
      sendingRef.current = false
      setSending(false)
    }
    if (result === true) onClose()
    else if (typeof result === 'string') setError(result)
  }

  if (!open || typeof document === 'undefined') return null

  const left = INTEREST_NOTE_MAX - note.length
  const hasBlank = note.includes('___')

  return createPortal(
    <div
      className="fixed inset-0 z-[160] flex items-end justify-center bg-[rgba(42,18,10,0.55)] backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !sending) onClose() }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card relative max-h-[92dvh] w-full overflow-y-auto rounded-b-none px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-6 sm:max-w-md sm:rounded-b-mj sm:pb-6"
      >
        <div className="gold-strip absolute inset-x-0 top-0" />
        <button
          type="button"
          onClick={onClose}
          disabled={sending}
          aria-label="Close"
          className="absolute right-3.5 top-3 text-2xl leading-none text-ink-soft hover:text-maroon"
        >
          ×
        </button>
        <h2 id={titleId} className="pr-6 font-serif text-[21px] leading-tight text-maroon">Send interest to {name}</h2>
        <p className="mt-1 text-[13px] text-ink-soft">A short note is optional, but it helps a family know who is reaching out.</p>

        <form onSubmit={submit} className="mt-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8A6516]">Start from</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTEREST_NOTE_TEMPLATES.map(t => (
              <button
                key={t.label}
                type="button"
                onClick={() => insertTemplate(t.text)}
                className="rounded-full border border-gold/50 bg-gold/[0.08] px-3 py-1.5 text-[12.5px] font-medium text-maroon transition-colors hover:border-gold hover:bg-gold/15"
              >
                {t.label}
              </button>
            ))}
          </div>

          <label htmlFor={`${titleId}-note`} className="mt-4 block text-[13px] font-semibold text-ink">
            Your note <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <textarea
            id={`${titleId}-note`}
            ref={textRef}
            value={note}
            onChange={e => setNote(e.target.value.slice(0, INTEREST_NOTE_MAX))}
            maxLength={INTEREST_NOTE_MAX}
            rows={4}
            aria-describedby={hintId}
            placeholder="Namaste…"
            className="mt-1.5 w-full resize-none rounded-mj-sm border border-ink/15 bg-paper px-3 py-2.5 text-[14.5px] leading-relaxed text-ink placeholder:text-ink-soft/70 focus:border-maroon/50 focus:outline-none focus:ring-2 focus:ring-maroon/20"
          />
          <p id={hintId} className="mt-1 flex justify-between gap-3 text-[12px] text-ink-soft">
            <span className={hasBlank ? 'text-terra' : undefined}>
              {hasBlank ? 'Fill in the ___ blanks, or remove them.' : 'Shown to them with your interest.'}
            </span>
            <span aria-live="polite" className="tabular-nums">{left}</span>
          </p>

          {error && (
            <p role="alert" className="mt-3 rounded-mj-sm border border-error/30 bg-error-soft px-3 py-2 text-[13px] text-error-fg">{error}</p>
          )}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={sending} className="btn-ghost px-4 py-2.5 text-[14px] disabled:opacity-60">
              Cancel
            </button>
            <button type="submit" disabled={sending || hasBlank} className="btn-primary px-5 py-2.5 text-[14px] disabled:opacity-60">
              {sending ? 'Sending…' : note.trim() ? 'Send interest with note' : 'Send interest'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
