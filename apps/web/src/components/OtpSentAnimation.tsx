'use client'
import { useEffect, useState } from 'react'

/**
 * Celebratory "OTP sent" confirmation — animated check draw + settle.
 * Shared by login, register and forgot-password so the experience is identical.
 * Respects reduced motion (the CSS transitions collapse via the global rule).
 */
export function OtpSentAnimation({ mobile }: { mobile: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div
        className="relative w-20 h-20"
        style={{
          transform: show ? 'scale(1)' : 'scale(0.5)',
          opacity: show ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-gold animate-ping opacity-30" />
        <div className="absolute inset-0 rounded-full border-4 border-gold" />
        <div className="absolute inset-2 rounded-full bg-maroon flex items-center justify-center shadow-mj-xs">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              d="M 7 16 L 13 22 L 25 10"
              stroke="#E4C572"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ strokeDasharray: 24, strokeDashoffset: show ? 0 : 24, transition: 'stroke-dashoffset 0.45s ease 0.25s' }}
            />
          </svg>
        </div>
      </div>
      <div
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.35s ease 0.3s, transform 0.35s ease 0.3s',
        }}
      >
        <p className="font-serif text-xl text-maroon">OTP Sent!</p>
        <p className="text-sm text-ink-soft mt-1">
          Code sent to <span className="font-mono text-ink">{mobile}</span>
        </p>
        <p className="text-xs text-ink-soft mt-3 opacity-60">Taking you to verification…</p>
      </div>
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-marigold"
            style={{ animation: `otpDotBounce 0.8s ease-in-out ${i * 0.15}s infinite alternate` }}
          />
        ))}
      </div>
      <style>{`@keyframes otpDotBounce { from { transform: translateY(0); } to { transform: translateY(-6px); } }`}</style>
    </div>
  )
}
