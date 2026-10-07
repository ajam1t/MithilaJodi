'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminLoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
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

  const input = 'mt-1 block w-full rounded-lg border border-[#DDD3C2] bg-white px-3 py-2.5 text-[15px] text-ink outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15'

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor="admin-id" className="text-[13px] font-medium text-ink">Email or mobile number</label>
        <input id="admin-id" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
          value={identifier} onChange={e => setIdentifier(e.target.value)} className={input} />
      </div>
      <div>
        <label htmlFor="admin-pw" className="text-[13px] font-medium text-ink">Password</label>
        <div className="relative">
          <input id="admin-pw" type={show ? 'text' : 'password'} autoComplete="current-password"
            value={password} onChange={e => setPassword(e.target.value)} className={`${input} pr-16`} />
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[12px] font-medium text-ink-soft hover:text-ink">
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="rounded-lg border border-[#EDC4C4] bg-[#FBEFEF] px-3 py-2 text-[13px] text-[#8A1C1C]">{error}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-lg bg-maroon py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-maroon-2 disabled:opacity-60">
        {busy ? 'Signing in…' : 'Sign In'}
      </button>
      <p className="text-center">
        {/* Password reset uses the account's registered mobile number (OTP). */}
        <a href="/forgot-password" className="text-[13px] font-medium text-maroon underline-offset-4 hover:underline">Forgot password?</a>
      </p>
    </form>
  )
}
