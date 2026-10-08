'use client'
import { useState } from 'react'
import Link from 'next/link'


function getSafeNextPath(): string | null {
  if (typeof window === 'undefined') return null
  const next = new URLSearchParams(window.location.search).get('next')
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null
}

function getPostLoginPath(role?: string): string {
  const next = getSafeNextPath()
  // The console has its own sign-in; a member-login session never carries
  // admin rights (lib/auth.ts), so send staff there rather than to a 404.
  if (next?.startsWith('/admin') && (role === 'admin' || role === 'moderator')) return '/admin/login'
  return '/home'
}

export default function LoginPage() {
  const [mobile, setMobile]                 = useState('')
  const [password, setPassword]             = useState('')
  const [showPassword, setShowPassword]     = useState(false)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')

  /* ── Password login ── */
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (mobile.length !== 10) { setError('Enter a valid 10-digit mobile number'); return }
    if (!password)            { setError('Enter your password'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/password/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password }),
      })
      const data: { ok: boolean; role?: string; message?: string } = await res.json()
      if (!data.ok) { setError(data.message ?? 'Login failed. Please try again.'); return }
      window.location.href = getPostLoginPath(data.role)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm motion-safe:animate-fade-in">

      <div className="card p-6 sm:p-8">

        <Link href="/register" className="-mt-1 mb-3 inline-flex items-center gap-1 text-[13px] text-ink-soft hover:text-maroon">
          <span aria-hidden="true">←</span> Back
        </Link>
        <div className="mb-5">
          <p className="text-sm font-medium text-maroon">Member access</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">Sign in securely with your mobile number.</p>
        </div>

        {/* OTP sign-in was removed: password is the only way to log in.
            Members who never set one recover through Forgot password, which
            verifies by OTP and then sets a password — that is a recovery flow,
            not a login method, so no account is locked out. */}

        {/* ── Password mode ── */}
        {(
          <>
            <p className="eyebrow mb-2">Log In</p>
            <h1 className="text-xl font-display text-ink mb-6">Welcome back</h1>
            <form onSubmit={handlePasswordLogin} noValidate>
              <label className="block mb-4">
                <span className="text-sm font-medium text-ink">Mobile number</span>
                <div className="mt-1.5 flex items-center border border-ink/20 rounded-mj bg-white overflow-hidden focus-within:ring-2 focus-within:ring-maroon/30">
                  <span className="px-3 py-3 text-ink-soft text-sm bg-paper border-r border-ink/20 font-mono select-none">+91</span>
                  <input
                    type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" aria-label="10-digit mobile number" placeholder="Enter 10-digit number"
                    value={mobile} autoFocus
                    onChange={e => { setError(''); setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)) }}
                    className="flex-1 px-4 py-3 text-ink bg-transparent focus:outline-none text-base font-mono"
                  />
                </div>
              </label>
              <label className="block mb-1.5">
                <span className="text-sm font-medium text-ink">Password</span>
                <div className="mt-1.5 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} autoComplete="current-password"
                    onChange={e => { setError(''); setPassword(e.target.value) }}
                    className="block w-full px-4 py-3 pr-12 border border-ink/20 rounded-mj focus:ring-2 focus:ring-maroon/30 focus:outline-none bg-white text-ink"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-sm">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>
              <div className="mt-1 text-right">
                <Link href="/forgot-password" className="text-xs text-maroon hover:underline">Forgot password?</Link>
              </div>
              {error && <p role="alert" className="mt-3 text-sm text-terra">{error}</p>}
              <button type="submit" disabled={loading || mobile.length !== 10 || !password} className="btn btn-primary w-full mt-5">
                {loading ? 'Logging in…' : 'Log In'}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-ink-soft">
              New to Mithila Jodi?{' '}
              <Link href="/register?start=1" className="text-maroon font-medium hover:underline">Create account</Link>
            </p>
          </>
        )}


      </div>
    </div>
  )
}
