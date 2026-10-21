'use client'

import { useEffect, useState } from 'react'

/** A live India-time clock for the sign-in screen's HUD. Decorative. */
export function AdminClock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' IST')
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  return <span className="tabular-nums">{t}</span>
}
