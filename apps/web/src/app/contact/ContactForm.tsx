'use client'

import { useState } from 'react'

const REASONS = [
  'General Enquiry',
  'Profile Issue',
  'Verification',
  'Privacy Concern',
  'Report a Profile',
  'Premium / Payment',
  'Technical Issue',
  'Partnership',
  'Feedback',
  'Other',
]

type FormState = {
  name: string
  email: string
  mobile: string
  reason: string
  message: string
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

const EMPTY: FormState = { name: '', email: '', mobile: '', reason: '', message: '' }

const BASE_INPUT =
  'w-full bg-cream border rounded-mj-sm px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft/50 ' +
  'focus:outline-none focus:ring-2 transition-colors'
const NORMAL_INPUT = BASE_INPUT + ' border-gold/30 focus:ring-gold/40 focus:border-gold/60'
const ERROR_INPUT  = BASE_INPUT + ' border-terra/60 focus:ring-terra/30 focus:border-terra/60'

function inputCls(hasError: boolean) {
  return hasError ? ERROR_INPUT : NORMAL_INPUT
}

function validate(f: FormState): Record<string, string> {
  const errs: Record<string, string> = {}
  const name = f.name.trim()
  if (!name)                errors(errs, 'name', 'Full name is required.')
  else if (name.length < 2) errors(errs, 'name', 'Please enter your full name.')
  else if (name.length > 100) errors(errs, 'name', 'Name must be under 100 characters.')

  const email = f.email.trim()
  if (!email) errors(errs, 'email', 'Email address is required.')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors(errs, 'email', 'Please enter a valid email address.')

  if (f.mobile.trim()) {
    const digits = f.mobile.replace(/\D/g, '')
    const core = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits
    if (core.length !== 10) errors(errs, 'mobile', 'Please enter a valid 10-digit mobile number.')
  }

  if (!f.reason) errors(errs, 'reason', 'Please select a reason for contact.')

  const msg = f.message.trim()
  if (!msg)                errors(errs, 'message', 'Message is required.')
  else if (msg.length < 10) errors(errs, 'message', 'Please write at least 10 characters.')
  else if (msg.length > 2000) errors(errs, 'message', `Message is too long (${msg.length}/2000 characters).`)

  return errs
}

function errors(obj: Record<string, string>, key: string, msg: string) {
  obj[key] = msg
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-terra text-[12px] mt-1.5 flex items-center gap-1" role="alert">{msg}</p>
}

export function ContactForm() {
  const [form, setForm]         = useState<FormState>(EMPTY)
  const [fieldErrors, setFErrs] = useState<Record<string, string>>({})
  const [status, setStatus]     = useState<Status>('idle')
  const [serverError, setServerError] = useState('')

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      if (fieldErrors[field]) setFErrs(prev => { const n = { ...prev }; delete n[field]; return n })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setFErrs(errs)
      return
    }
    setStatus('submitting')
    setServerError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.name.trim(),
          email:     form.email.trim(),
          mobile:    form.mobile.trim() || null,
          reason:    form.reason,
          message:   form.message.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Something went wrong.')
      setStatus('success')
      setForm(EMPTY)
    } catch (err) {
      setStatus('error')
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="card p-8 sm:p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-green/10 border border-green/20 flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="#1F5133" strokeWidth="1.5" />
            <path d="M7.5 12.5 L10.5 15.5 L16.5 9" stroke="#1F5133" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="font-serif text-maroon text-[21px] mb-2">Message Received</h3>
        <p className="text-ink-soft text-[15px] leading-relaxed mb-7 max-w-sm mx-auto">
          Thank you for reaching out. We will get back to you as soon as possible.
        </p>
        <button
          onClick={() => { setStatus('idle'); setServerError('') }}
          className="btn-ghost"
        >
          Send Another Message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card p-6 sm:p-8 space-y-5">

      {/* Full Name */}
      <div>
        <label htmlFor="cf-name" className="block text-[13px] font-medium text-ink mb-1.5">
          Full Name <span className="text-terra" aria-hidden="true">*</span>
        </label>
        <input
          id="cf-name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          value={form.name}
          onChange={set('name')}
          className={inputCls(!!fieldErrors.name)}
          aria-describedby={fieldErrors.name ? 'cf-name-err' : undefined}
          aria-invalid={!!fieldErrors.name}
          maxLength={100}
        />
        <FieldError msg={fieldErrors.name} />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="cf-email" className="block text-[13px] font-medium text-ink mb-1.5">
          Email Address <span className="text-terra" aria-hidden="true">*</span>
        </label>
        <input
          id="cf-email"
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          value={form.email}
          onChange={set('email')}
          className={inputCls(!!fieldErrors.email)}
          aria-invalid={!!fieldErrors.email}
          maxLength={254}
        />
        <FieldError msg={fieldErrors.email} />
      </div>

      {/* Mobile */}
      <div>
        <label htmlFor="cf-mobile" className="block text-[13px] font-medium text-ink mb-1.5">
          Mobile Number <span className="text-ink-soft font-normal">(optional)</span>
        </label>
        <input
          id="cf-mobile"
          type="tel"
          autoComplete="tel"
          placeholder="+91 XXXXX XXXXX"
          value={form.mobile}
          onChange={set('mobile')}
          className={inputCls(!!fieldErrors.mobile)}
          aria-invalid={!!fieldErrors.mobile}
          maxLength={15}
        />
        <FieldError msg={fieldErrors.mobile} />
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="cf-reason" className="block text-[13px] font-medium text-ink mb-1.5">
          Reason for Contact <span className="text-terra" aria-hidden="true">*</span>
        </label>
        <select
          id="cf-reason"
          value={form.reason}
          onChange={set('reason')}
          className={inputCls(!!fieldErrors.reason)}
          aria-invalid={!!fieldErrors.reason}
        >
          <option value="" disabled>Select a reason…</option>
          {REASONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <FieldError msg={fieldErrors.reason} />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="cf-message" className="block text-[13px] font-medium text-ink mb-1.5">
          Message <span className="text-terra" aria-hidden="true">*</span>
        </label>
        <textarea
          id="cf-message"
          rows={5}
          placeholder="Describe your question or issue…"
          value={form.message}
          onChange={set('message')}
          className={inputCls(!!fieldErrors.message) + ' resize-y min-h-[120px]'}
          aria-invalid={!!fieldErrors.message}
          maxLength={2000}
        />
        <div className="flex items-start justify-between mt-1">
          <FieldError msg={fieldErrors.message} />
          <span className={[
            'text-[11px] ml-auto shrink-0',
            form.message.length > 1800 ? 'text-terra' : 'text-ink-soft/60',
          ].join(' ')}>
            {form.message.length}/2000
          </span>
        </div>
      </div>

      {/* Server error */}
      {status === 'error' && serverError && (
        <div className="rounded-mj-sm border border-terra/40 bg-terra/5 px-4 py-3 text-[14px] text-terra" role="alert">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="btn-primary w-full justify-center text-[15px] py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? (
          <span className="flex items-center gap-2 justify-center">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <path d="M8 2 A6 6 0 0 1 14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Sending…
          </span>
        ) : 'Send Message'}
      </button>

    </form>
  )
}
