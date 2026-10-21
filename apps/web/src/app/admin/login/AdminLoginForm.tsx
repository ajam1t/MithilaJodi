'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Choose your profile, then sign in. Picking a card only greets you and opens
 * the fields — it carries no email or number, so the public page never reveals
 * an admin's login. Same accounts, same POST /api/admin/auth/login, same rate
 * limits as before. The last profile picked is remembered on this device only.
 */
const PEOPLE = [
  { id: 'amit', name: 'Amit Jha', first: 'Amit', role: 'Admin', org: 'Mithila Jodi', photo: '/admin-amit.webp' },
  { id: 'other', name: 'Another admin', first: '', role: 'Admin team', org: 'Mithila Jodi', photo: null },
] as const
type Who = (typeof PEOPLE)[number]['id']
const KEY = 'mj-admin-who'

export function AdminLoginForm() {
  const router = useRouter()
  const [who, setWho] = useState<Who | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [helloKey, setHelloKey] = useState(0)
  const idRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v && PEOPLE.some(p => p.id === v)) setWho(v as Who) } catch {}
  }, [])

  function pick(id: Who) {
    setWho(id)
    setHelloKey(k => k + 1)
    setError('')
    try { localStorage.setItem(KEY, id) } catch {}
    window.setTimeout(() => idRef.current?.focus({ preventScroll: true }), 320)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!who) return
    if (!identifier.trim() || !password) { setError('Enter your email or mobile number and your password.'); return }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) {
        router.replace('/admin')
        router.refresh()
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

  return (
    <form onSubmit={submit} noValidate>
      <h1 id="mcx-title">
        <span key={helloKey} className={`mcx-hello ${helloKey ? 'is-new' : ''}`}>
          {person?.first ? <>Welcome back, <em>{person.first}.</em></> : 'Welcome back.'}
        </span>
      </h1>
      <p className="mcx-lead">Choose your profile to enter the Mithila Jodi command centre.</p>

      <fieldset className="mcx-people">
        <legend className="sr-only">Choose your profile</legend>
        {PEOPLE.map(p => (
          <label key={p.id} className={`mcx-p ${p.photo ? '' : 'is-other'}`}>
            <input type="radio" name="who" value={p.id} checked={who === p.id} onChange={() => pick(p.id)} />
            <span className="mcx-ava">
              <span className="mcx-ring" aria-hidden="true" />
              {p.photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.photo} width={256} height={256} alt="" />
                : (
                  <span className="mcx-mono-ava" aria-hidden="true">
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
                  </span>
                )}
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

      <div className={`mcx-form ${who ? 'is-open' : ''}`} aria-hidden={!who}>
        <div>
          <div className="mcx-fields">
            <div>
              <label htmlFor="admin-id" className="mcx-label">{person?.first ? `${person.first}'s email or mobile number` : 'Email or mobile number'}</label>
              <input ref={idRef} id="admin-id" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
                tabIndex={who ? 0 : -1} value={identifier} onChange={e => setIdentifier(e.target.value)} className="mcx-input" />
            </div>
            <div>
              <label htmlFor="admin-pw" className="mcx-label">Password</label>
              <div className="relative">
                <input id="admin-pw" type={show ? 'text' : 'password'} autoComplete="current-password"
                  tabIndex={who ? 0 : -1} value={password} onChange={e => setPassword(e.target.value)} className="mcx-input pr-16" />
                <button type="button" tabIndex={who ? 0 : -1} onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[12.5px] font-medium text-ink-soft hover:text-ink">
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="mcx-err">{error}</p>}
          </div>
        </div>
      </div>

      <div className="mcx-go">
        <button type="submit" disabled={!who || busy} className={`mcx-pass ${busy ? 'is-busy' : ''}`}>
          <svg className="mcx-key" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l3 3M14 9l2 2" /></svg>
          <span>{busy ? 'Verifying…' : who ? 'Enter command centre' : 'Choose a profile to continue'}</span>
        </button>
        {/* Password reset uses the account's registered mobile number (OTP). */}
        <a href="/forgot-password" className="mcx-alt">Forgot password?</a>
        <p className="mcx-fine">Sign-ins and failed attempts are recorded. Admins and moderators only.</p>
      </div>
    </form>
  )
}
