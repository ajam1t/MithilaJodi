'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { AuthMark } from '@/components/auth/AuthMark'
import { LoginPortal, type PortalPhase } from '@/components/auth/LoginPortal'
import { getPostLoginPath, withNext } from '@/lib/safeNext'

/**
 * The /login form. page.tsx (a server component) sends members who are
 * already signed in on before this renders, and passes the return path,
 * already checked by getSafeNextPath, as `next`.
 */
export function LoginForm({ next }: { next: string | null }) {
  const [mobile, setMobile]                 = useState('')
  const [password, setPassword]             = useState('')
  const [showPassword, setShowPassword]     = useState(false)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [portal, setPortal]                 = useState<PortalPhase>('idle')
  const [origin, setOrigin]                 = useState<{ x: number; y: number } | null>(null)
  const submitRef                           = useRef<HTMLButtonElement>(null)

  /* ── Password login ── */
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (mobile.length !== 10) { setError('Enter a valid 10-digit mobile number'); return }
    if (!password)            { setError('Enter your password'); return }
    setError('')
    setLoading(true)
    // The portal opens from the button and travels while the request runs.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const r = submitRef.current?.getBoundingClientRect()
    if (r) setOrigin({ x: ((r.left + r.width / 2) / window.innerWidth) * 100, y: ((r.top + r.height / 2) / window.innerHeight) * 100 })
    setPortal('travel')
    const started = performance.now()
    let arrived = false
    try {
      const res  = await fetch('/api/auth/password/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password }),
      })
      const data: { ok: boolean; role?: string; message?: string } = await res.json()
      if (!data.ok) { setError(data.message ?? 'Login failed. Please try again.'); return }
      // Signed in. Let the journey be seen (a short minimum), flare to ivory, then go.
      arrived = true
      const wait = reduce ? 0 : Math.max(0, 1100 - (performance.now() - started))
      window.setTimeout(() => {
        setPortal('arrive')
        window.setTimeout(() => { window.location.href = getPostLoginPath(next, data.role === 'admin' || data.role === 'moderator') }, reduce ? 0 : 650)
      }, wait)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      if (!arrived) { setLoading(false); setPortal('idle') }
    }
  }

  return (
    <div className="mj-auth w-full max-w-[400px] motion-safe:animate-fade-in">
      <LoginPortal phase={portal} origin={origin} />

      <div className="mj-auth-card">
        <AuthMark />

        <Link href={withNext('/register', next)} className="-mt-1 mb-3 inline-flex items-center gap-1 text-[13px] text-ink-soft hover:text-maroon">
          <span aria-hidden="true">←</span> Back
        </Link>

        {/* OTP sign-in was removed: password is the only way to log in.
            Members who never set one recover through Forgot password, which
            verifies by OTP and then sets a password — that is a recovery flow,
            not a login method, so no account is locked out. */}

        {/* ── Password mode ── */}
        {(
          <>
            <p className="eyebrow mb-2">Log In</p>
            <h1 className="text-xl font-display text-ink">Welcome back</h1>
            <p className="mb-6 mt-1 text-sm leading-relaxed text-ink-soft">Sign in securely with your mobile number.</p>
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
              <button ref={submitRef} type="submit" disabled={loading || mobile.length !== 10 || !password} className="btn btn-primary w-full mt-5">
                {loading ? 'Logging in…' : 'Log In'}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-ink-soft">
              New to Mithila Jodi?{' '}
              <Link href={withNext('/register?start=1', next)} className="text-maroon font-medium hover:underline">Create account</Link>
            </p>
          </>
        )}


      </div>
    </div>
  )
}
