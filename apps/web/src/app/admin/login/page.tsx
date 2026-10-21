import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { isAdminRole } from '@/lib/adminAuth'
import { AdminLoginForm } from './AdminLoginForm'
import { AdminClock } from './AdminClock'
import '@/styles/admin-login.css'

export const metadata = { title: 'Sign in' }
export const dynamic = 'force-dynamic'

/**
 * Command Centre sign-in, after the Ask Compass leadership sign-in: a maroon
 * deck (aurora, gold dust, turning rings round the mark, India time, status)
 * and an ivory card where you choose your profile and sign in. No
 * registration, no member sign-up link. Motion stops under reduced motion.
 */
export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const session = await getSessionAccount()
  if (session && isAdminRole(session.role)) redirect('/admin')
  const fromMember = (await searchParams).from === 'member' && !!session?.staff

  return (
    <main id="main-content" className="mcx">
      <section className="mcx-deck" aria-label="Mithila Jodi">
        <div className="mcx-dust" aria-hidden="true" />
        <div className="mcx-aurora" aria-hidden="true"><i /><i /><i /></div>
        <Link href="/" className="mcx-logo">
          <span className="mcx-logo-chip"><Image src="/logo-mark-128.webp" alt="" width={40} height={37} priority className="h-8 w-auto" /></span>
          <span><b>Mithila Jodi</b><small>Admin command centre</small></span>
        </Link>

        <div className="mcx-emblem" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="mcx-aripan">
            <g fill="none" stroke="#F5C35E" strokeOpacity=".45">
              {Array.from({ length: 12 }, (_, k) => <ellipse key={k} cx="100" cy="52" rx="12" ry="34" transform={`rotate(${k * 30} 100 100)`} />)}
            </g>
          </svg>
          <div className="mcx-rings"><i /><i /><i /></div>
          <div className="mcx-medal">
            <Image src="/logo-mark-288.webp" alt="" width={176} height={162} priority />
          </div>
        </div>

        <div className="mcx-deck-foot">
          <p className="mcx-tag">Where tradition<br /><span>meets love.</span></p>
          <AdminClock />
          <ul className="mcx-sys" aria-label="Status">
            <li><i aria-hidden="true" />Member site<span>Live</span></li>
            <li><i aria-hidden="true" />Connection<span>Encrypted</span></li>
            <li><i aria-hidden="true" />Sign-ins<span>Recorded</span></li>
          </ul>
        </div>
      </section>

      <section className="mcx-panel" aria-labelledby="mcx-title">
        <div className="mcx-grid" aria-hidden="true" />
        <div className="mcx-card">
          <div className="mcx-top">
            <span className="mcx-chip">Admin access</span>
            <span className="mcx-chip is-ok"><i aria-hidden="true" />Secure sign-in</span>
          </div>
          {fromMember && (
            <p role="status" className="mcx-note">
              You are signed in to the member site. The command centre needs its own admin sign-in.
            </p>
          )}
          <AdminLoginForm />
          <p className="mcx-foot">© Mithila Jodi · <Link href="/safety">Safety</Link> · <Link href="/">Member site</Link></p>
        </div>
      </section>
    </main>
  )
}
