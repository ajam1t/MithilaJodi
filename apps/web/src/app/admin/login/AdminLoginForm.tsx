'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Three steps: choose your profile → the Command Centre PIN → mobile number
 * and password. The PIN is checked on the server (POST /api/admin/auth/pin),
 * which sets a short-lived pass the password step requires, so it cannot be
 * skipped by editing this page. Picking a card carries no email or number, so
 * the public page never reveals an admin's login. The last profile picked is
 * remembered on this device only.
 */
const PEOPLE = [
  { id: 'amit', name: 'Amit Jha', first: 'Amit', role: 'Admin', org: 'Mithila Jodi', photo: '/admin-amit.webp' },
] as const
type Who = (typeof PEOPLE)[number]['id']
const KEY = 'mj-admin-who'

export function AdminLoginForm() {
  const router = useRouter()
  const [who, setWho] = useState<Who | null>(null)
  const [step, setStep] = useState<'pick' | 'pin' | 'login'>('pick')
  const [pin, setPin] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [helloKey, setHelloKey] = useState(0)
  const pinRef = useRef<HTMLInputElement>(null)
  const idRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v && PEOPLE.some(p => p.id === v)) setWho(v as Who) } catch {}
  }, [])

  function focusPin() { window.setTimeout(() => pinRef.current?.focus({ preventScroll: true }), 60) }

  function pick(id: Who) {
    setWho(id)
    setHelloKey(k => k + 1)
    setError('')
    setPin('')
    setStep('pin')
    try { localStorage.setItem(KEY, id) } catch {}
    focusPin()
  }

  async function verifyPin(code: string) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) {
        setStep('login')
        window.setTimeout(() => idRef.current?.focus({ preventScroll: true }), 320)
        return
      }
      setError(json.message ?? 'That PIN is not right.')
      setPin('')
      focusPin()
    } catch {
      setError('Network problem — check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  function onPinChange(raw: string) {
    const code = raw.replace(/\D/g, '').slice(0, 4)
    setPin(code)
    if (code.length === 4) verifyPin(code)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (step !== 'login') return
    const digits = mobile.replace(/\D/g, '').slice(-10)
    if (digits.length !== 10 || !password) { setError('Enter your 10-digit mobile number and your password.'); return }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: digits, password }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) {
        router.replace('/admin')
        router.refresh()
        return
      }
      if (json.needPin) {
        // The PIN pass lasts 10 minutes; ask again rather than fail silently.
        setStep('pin')
        setPin('')
        focusPin()
        setError('Please enter the PIN again.')
        return
      }
      setError(json.message ?? 'Could not sign in. Please try again.')
    } catch {
      setError('Network problem — check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const person = PEOPLE.find(p => p.id === who)
  const lead = step === 'pin' ? 'Enter your 4-digit Command Centre PIN.'
    : step === 'login' ? 'PIN accepted. Sign in with your mobile number and password.'
    : 'Choose your profile to enter the Mithila Jodi command centre.'

  return (
    <form onSubmit={submit} noValidate>
      <h1 id="mcx-title">
        <span key={helloKey} className={`mcx-hello ${helloKey ? 'is-new' : ''}`}>
          {person?.first && step !== 'pick' ? <>Welcome back, <em>{person.first}.</em></> : 'Welcome back.'}
        </span>
      </h1>
      <p className="mcx-lead">{lead}</p>

      <fieldset className="mcx-people">
        <legend className="sr-only">Choose your profile</legend>
        {PEOPLE.map(p => (
          <label key={p.id} className="mcx-p">
            <input type="radio" name="who" value={p.id} checked={who === p.id && step !== 'pick'} onChange={() => pick(p.id)} />
            <span className="mcx-ava">
              <span className="mcx-ring" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo} width={256} height={256} alt="" />
            </span>
            <span className="mcx-who">
              <b>{p.name}</b>
              <span className="mcx-role">{p.role}</span>
              <small>{p.org}</small>
            </span>
            <span className="mcx-tick" aria-hidden="true" />
          </label>
        ))}
      </fieldset>

      {/* Step 2 — PIN */}
      <div className={`mcx-form ${step === 'pin' ? 'is-open' : ''}`} inert={step !== 'pin'}>
        <div>
          <div className="mcx-fields">
            <div>
              <p className="mcx-label" id="admin-pin-label">Command Centre PIN</p>
              {/* One real input (typing, paste and SMS-style autofill all work),
                  drawn as four boxes. */}
              <div className="mcx-pin" onClick={() => pinRef.current?.focus()}>
                <input
                  ref={pinRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  maxLength={4}
                  aria-labelledby="admin-pin-label"
                  value={pin}
                  disabled={busy}
                  onChange={e => onPinChange(e.target.value)}
                  className="mcx-pin-input"
                />
                {[0, 1, 2, 3].map(i => (
                  <span key={i} className="mcx-pin-box" data-on={i === Math.min(pin.length, 3) || undefined} aria-hidden="true">
                    {pin[i] ? '•' : ''}
                  </span>
                ))}
              </div>
            </div>
            {step === 'pin' && error && <p role="alert" className="mcx-err">{error}</p>}
          </div>
        </div>
      </div>

      {/* Step 3 — mobile number and password */}
      <div className={`mcx-form ${step === 'login' ? 'is-open' : ''}`} inert={step !== 'login'}>
        <div>
          <div className="mcx-fields">
            <div>
              <label htmlFor="admin-id" className="mcx-label">Mobile number</label>
              <div className="mcx-phone">
                <span aria-hidden="true">+91</span>
                <input ref={idRef} id="admin-id" type="tel" inputMode="numeric" autoComplete="username" maxLength={14}
                  placeholder="10-digit number" value={mobile} onChange={e => setMobile(e.target.value.replace(/[^\d\s+]/g, ''))} className="mcx-input" />
              </div>
            </div>
            <div>
              <label htmlFor="admin-pw" className="mcx-label">Password</label>
              <div className="relative">
                <input id="admin-pw" type={show ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)} className="mcx-input pr-16" />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[12.5px] font-medium text-ink-soft hover:text-ink">
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {step === 'login' && error && <p role="alert" className="mcx-err">{error}</p>}
          </div>
        </div>
      </div>

      <div className="mcx-go">
        {step === 'login' ? (
          <button type="submit" disabled={busy} className={`mcx-pass ${busy ? 'is-busy' : ''}`}>
            <svg className="mcx-key" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l3 3M14 9l2 2" /></svg>
            <span>{busy ? 'Verifying…' : 'Enter command centre'}</span>
          </button>
        ) : (
          <button type="button" disabled className={`mcx-pass ${busy ? 'is-busy' : ''}`}>
            <svg className="mcx-key" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l3 3M14 9l2 2" /></svg>
            <span>{busy ? 'Checking PIN…' : step === 'pin' ? 'Enter your PIN to continue' : 'Choose your profile to continue'}</span>
          </button>
        )}
        {step === 'login' && (
          /* Password reset uses the account's registered mobile number (OTP). */
          <a href="/forgot-password" className="mcx-alt">Forgot password?</a>
        )}
        <p className="mcx-fine">Sign-ins and failed attempts are recorded. Admins only.</p>
      </div>
    </form>
  )
}
