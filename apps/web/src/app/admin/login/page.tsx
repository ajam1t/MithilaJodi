import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { isAdminRole } from '@/lib/adminAuth'
import { AdminLoginForm } from './AdminLoginForm'
import { AdminClock } from './AdminClock'
import '@/styles/admin-login.css'

export const metadata = { title: 'Sign in' }
export const dynamic = 'force-dynamic'

/**
 * Admin Console sign-in — a secure-access terminal: blueprint grid, a slow
 * radar sweep and aripan rings behind a glass card, HUD corner brackets and a
 * live India-time clock. No registration, no member sign-up link. Motion is
 * decorative and stops under prefers-reduced-motion.
 */
export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const session = await getSessionAccount()
  if (session && isAdminRole(session.role)) redirect('/admin')
  const fromMember = (await searchParams).from === 'member' && !!session?.staff

  return (
    <main id="main-content" className="adl">
      <div className="adl-grid" aria-hidden="true" />
      <div className="adl-radar" aria-hidden="true">
        <svg viewBox="0 0 400 400">
          {[60, 110, 160, 195].map(r => <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#B98A2E" strokeOpacity=".22" strokeDasharray={r === 195 ? '2 6' : undefined} />)}
          {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx="200" cy="120" rx="10" ry="34" fill="none" stroke="#B98A2E" strokeOpacity=".16" transform={`rotate(${i * 30} 200 200)`} />)}
          <path d="M200 200L395 200A195 195 0 0 0 369 102Z" fill="url(#adlSweep)" className="adl-sweep" />
          <defs><linearGradient id="adlSweep" x1="0" y1="1" x2="0.4" y2="0"><stop offset="0" stopColor="#E9C977" stopOpacity="0" /><stop offset="1" stopColor="#E9C977" stopOpacity=".35" /></linearGradient></defs>
        </svg>
      </div>
      {(['tl', 'tr', 'bl', 'br'] as const).map(c => <span key={c} className={`adl-corner adl-${c}`} aria-hidden="true" />)}

      <div className="adl-hud" aria-hidden="true">
        <span>MJ · ADMIN CONSOLE</span>
        <AdminClock />
      </div>

      <div className="adl-wrap">
        <div className="adl-brand">
          <div className="adl-medal">
            <svg viewBox="0 0 120 120" className="adl-orbit" aria-hidden="true">
              <circle cx="60" cy="60" r="56" fill="none" stroke="#B98A2E" strokeOpacity=".45" strokeDasharray="2 5" />
              <circle cx="60" cy="4" r="3.5" fill="#E9C977" />
            </svg>
            <Image src="/logo-mark.png" alt="Mithila Jodi" width={88} height={80} priority className="relative h-auto w-[64px]" />
          </div>
          <h1 className="adl-title">Admin Console</h1>
          <p className="adl-sub">Mithila Jodi · secure access</p>
        </div>

        {fromMember && (
          <p role="status" className="adl-note-box">
            You are signed in to the member site. Admin access needs a separate Admin Console sign-in.
          </p>
        )}

        <div className="adl-card">
          <p className="adl-status"><span className="adl-dot" aria-hidden="true" />Secure connection <span aria-hidden="true">·</span> Sign-ins logged</p>
          <AdminLoginForm />
        </div>
        <p className="adl-foot">For Mithila Jodi administrators only. Sign-ins and failed attempts are recorded.</p>
      </div>
    </main>
  )
}
