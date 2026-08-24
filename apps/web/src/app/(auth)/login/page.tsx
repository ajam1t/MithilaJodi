'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { OtpBoxInput } from '@/components/OtpBoxInput'
import { OTP_LENGTH } from '@/lib/constants'
import { isMsg91Enabled, ensureMsg91, msg91SendOtp, msg91VerifyOtp, msg91RetryOtp } from '@/lib/msg91'

type Mode = 'password' | 'otp'
type OtpStep = 'mobile' | 'sent' | 'otp'
type OtpChannel = 'msg91' | 'server'

export default function LoginPage() {
  const [mode, setMode]                     = useState<Mode>('password')
  const [mobile, setMobile]                 = useState('')
  const [password, setPassword]             = useState('')
  const [showPassword, setShowPassword]     = useState(false)
  const [otpStep, setOtpStep]               = useState<OtpStep>('mobile')
  const [otpChannel, setOtpChannel]         = useState<OtpChannel>('server')
  const [otp, setOtp]                       = useState('')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [resendCooldown, setResendCooldown] = useState(false)
  const [resendTimer, setResendTimer]       = useState(0)
  const resendIntervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null)

  function startResendCountdown() {
    setResendCooldown(true)
    setResendTimer(30)
    if (resendIntervalRef.current) clearInterval(resendIntervalRef.current)
    resendIntervalRef.current = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { if (resendIntervalRef.current) clearInterval(resendIntervalRef.current); setResendCooldown(false); return 0 }
        return t - 1
      })
    }, 1000)
  }

  const maskedMobile = mobile.length === 10
    ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`
    : mobile

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setOtpStep('mobile')
    setOtp('')
  }

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
      const data: { ok: boolean; message?: string } = await res.json()
      if (!data.ok) { setError(data.message ?? 'Login failed. Please try again.'); return }
      window.location.href = '/profile'
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── OTP: send ── */
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (mobile.length !== 10) { setError('Enter a valid 10-digit mobile number'); return }
    setError('')
    setLoading(true)
    try {
      // MSG91 path (production): headless widget behind our own UI.
      if (isMsg91Enabled()) {
        try {
          await ensureMsg91()
        } catch {
          setError('Could not start OTP verification. Please refresh and try again.')
          return
        }
        try {
          await msg91SendOtp('91' + mobile)
        } catch (err) {
          setError('OTP error: ' + (err instanceof Error ? err.message : 'Could not send OTP.'))
          return
        }
        setOtpChannel('msg91')
        setOtp('')
        setOtpStep('sent')
        startResendCountdown()
        setTimeout(() => setOtpStep('otp'), 1800)
        return
      }

      // Server/dev path (local dev, or if MSG91 is not configured).
      const res  = await fetch('/api/auth/otp/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      })
      const data: { ok: boolean; message?: string } = await res.json()
      if (!data.ok) { setError(data.message ?? 'Could not send OTP. Please try again.'); return }
      setOtpChannel('server')
      setOtp('')
      setOtpStep('sent')
      startResendCountdown()
      setTimeout(() => setOtpStep('otp'), 1800)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown) return
    setError('')
    startResendCountdown()
    try {
      if (otpChannel === 'msg91') {
        await msg91RetryOtp()
        return
      }
      const res = await fetch('/api/auth/otp/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      })
      const data: { ok: boolean; message?: string } = await res.json()
      if (!data.ok) setError(data.message ?? 'Could not resend OTP.')
    } catch {
      setError('Could not resend OTP. Please try again.')
    }
  }

  /* ── OTP: verify ── */
  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < OTP_LENGTH) { setError('Enter the OTP'); return }
    setError('')
    setLoading(true)
    try {
      if (otpChannel === 'msg91') {
        let accessToken: string
        try {
          accessToken = await msg91VerifyOtp(otp)
        } catch {
          setError('Incorrect or expired OTP. Please try again.')
          return
        }
        const res  = await fetch('/api/auth/otp/msg91', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, accessToken, intent: 'login' }),
        })
        const data: { ok: boolean; message?: string } = await res.json()
        if (!data.ok) { setError(data.message ?? 'Verification failed. Please try again.'); return }
        window.location.href = '/profile'
        return
      }

      const res  = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, code: otp, intent: 'login' }),
      })
      const data: { ok: boolean; message?: string } = await res.json()
      if (!data.ok) { setError(data.message ?? 'Verification failed. Please try again.'); return }
      window.location.href = '/profile'
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Mithila Jodi" className="h-24 w-auto object-contain mx-auto" />
        </Link>
      </div>

      <div className="card p-6 sm:p-8">

        {/* Mode tabs */}
        {(mode === 'password' || (mode === 'otp' && otpStep === 'mobile')) && (
          <div className="flex rounded-mj border border-ink/20 overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => switchMode('password')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'password' ? 'bg-maroon text-gold-lt' : 'bg-paper text-ink-soft hover:bg-cream hover:text-ink'}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => switchMode('otp')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'otp' ? 'bg-maroon text-gold-lt' : 'bg-paper text-ink-soft hover:bg-cream hover:text-ink'}`}
            >
              OTP
            </button>
          </div>
        )}

        {/* ── Password mode ── */}
        {mode === 'password' && (
          <>
            <p className="eyebrow mb-2">Log In</p>
            <h2 className="text-xl font-display text-ink mb-6">Welcome back</h2>
            <form onSubmit={handlePasswordLogin} noValidate>
              <label className="block mb-4">
                <span className="text-sm font-medium text-ink">Mobile number</span>
                <div className="mt-1.5 flex items-center border border-ink/20 rounded-mj bg-white overflow-hidden focus-within:ring-2 focus-within:ring-maroon/30">
                  <span className="px-3 py-3 text-ink-soft text-sm bg-paper border-r border-ink/20 font-mono select-none">+91</span>
                  <input
                    type="tel" inputMode="numeric" maxLength={10} placeholder="Enter 10-digit number"
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
              {error && <p className="mt-3 text-sm text-terra">{error}</p>}
              <button type="submit" disabled={loading || mobile.length !== 10 || !password} className="btn btn-primary w-full mt-5">
                {loading ? 'Logging in…' : 'Log In'}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-ink-soft">
              New to Mithila Jodi?{' '}
              <Link href="/register" className="text-maroon font-medium hover:underline">Create account</Link>
            </p>
          </>
        )}

        {/* ── OTP mode ── */}
        {mode === 'otp' && otpStep === 'sent' && <OtpSentAnimation mobile={maskedMobile} />}

        {mode === 'otp' && otpStep === 'mobile' && (
          <>
            <p className="eyebrow mb-2">Log In with OTP</p>
            <h2 className="text-xl font-display text-ink mb-6">Welcome back</h2>
            <form onSubmit={handleSendOtp} noValidate>
              <label className="block mb-1.5">
                <span className="text-sm font-medium text-ink">Mobile number</span>
                <div className="mt-1.5 flex items-center border border-ink/20 rounded-mj bg-white overflow-hidden focus-within:ring-2 focus-within:ring-maroon/30">
                  <span className="px-3 py-3 text-ink-soft text-sm bg-paper border-r border-ink/20 font-mono select-none">+91</span>
                  <input
                    type="tel" inputMode="numeric" maxLength={10} placeholder="Enter 10-digit number"
                    value={mobile} autoFocus
                    onChange={e => { setError(''); setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)) }}
                    className="flex-1 px-4 py-3 text-ink bg-transparent focus:outline-none text-base font-mono"
                  />
                </div>
              </label>
              {error && <p className="mt-3 text-sm text-terra">{error}</p>}
              <button type="submit" disabled={loading || mobile.length !== 10} className="btn btn-primary w-full mt-5">
                {loading ? 'Sending…' : 'Get OTP'}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-ink-soft">
              New to Mithila Jodi?{' '}
              <Link href="/register" className="text-maroon font-medium hover:underline">Create account</Link>
            </p>
          </>
        )}

        {mode === 'otp' && otpStep === 'otp' && (
          <>
            <p className="eyebrow mb-2">Verify OTP</p>
            <h2 className="text-xl font-display text-ink mb-1">Enter the code</h2>
            <p className="text-sm text-ink-soft mb-6">
              Sent to <span className="font-mono font-medium text-ink">{maskedMobile}</span>
            </p>

            <div className="mb-2">
              <OtpBoxInput
                value={otp}
                onChange={v => { setError(''); setOtp(v) }}
                onComplete={() => handleOtpVerify({ preventDefault: () => {} } as React.FormEvent)}
                disabled={loading}
                hasError={!!error}
                autoFocus
              />
            </div>

            {loading && (
              <div className="flex justify-center gap-1.5 my-3" aria-hidden="true">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-maroon"
                    style={{ animation: `bounce 0.7s ease-in-out ${i * 0.15}s infinite alternate` }} />
                ))}
                <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-5px); } }`}</style>
              </div>
            )}

            {error && <p className="mt-3 text-sm text-terra text-center">{error}</p>}

            <form onSubmit={handleOtpVerify} noValidate>
              <button type="submit" disabled={loading || otp.length < OTP_LENGTH} className="btn btn-primary w-full mt-5">
                {loading ? 'Verifying…' : 'Log In'}
              </button>
            </form>
            <div className="mt-5 flex items-center justify-between text-sm text-ink-soft">
              <button type="button" onClick={() => { setOtpStep('mobile'); setOtp(''); setError('') }} className="hover:text-ink hover:underline">
                ← Change number
              </button>
              <button type="button" onClick={handleResend} disabled={resendCooldown} className="hover:text-ink hover:underline disabled:opacity-40">
                {resendCooldown ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

/* ── OTP Sent Animation ── */
function OtpSentAnimation({ mobile }: { mobile: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), 60); return () => clearTimeout(t) }, [])
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div
        className="relative w-20 h-20"
        style={{ transform: show ? 'scale(1)' : 'scale(0.5)', opacity: show ? 1 : 0, transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease' }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-gold animate-ping opacity-30" />
        <div className="absolute inset-0 rounded-full border-4 border-gold" />
        <div className="absolute inset-2 rounded-full bg-maroon flex items-center justify-center shadow-mj-xs">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M 7 16 L 13 22 L 25 10" stroke="#E4C572" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 24, strokeDashoffset: show ? 0 : 24, transition: 'stroke-dashoffset 0.45s ease 0.25s' }} />
          </svg>
        </div>
      </div>
      <div style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.35s ease 0.3s, transform 0.35s ease 0.3s' }}>
        <p className="font-serif text-xl text-maroon">OTP Sent!</p>
        <p className="text-sm text-ink-soft mt-1">Code sent to <span className="font-mono text-ink">{mobile}</span></p>
        <p className="text-xs text-ink-soft mt-3 opacity-60">Taking you to verification…</p>
      </div>
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-marigold" style={{ animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
        ))}
      </div>
      <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-6px); } }`}</style>
    </div>
  )
}
