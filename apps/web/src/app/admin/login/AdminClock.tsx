'use client'

import { useEffect, useState } from 'react'

/** India time for the sign-in deck: a ticking clock and today's date. Decorative. */
export function AdminClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const time = now?.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) ?? '--:--:--'
  const date = now?.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <div className="mcx-time" aria-hidden="true">
      <span>{time}</span>
      <small>{date ? `${date} · IST` : 'India Standard Time'}</small>
    </div>
  )
}
