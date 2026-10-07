import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { isAdminRole } from '@/lib/adminAuth'
import { AdminLoginForm } from './AdminLoginForm'

export const metadata = { title: 'Sign in' }
export const dynamic = 'force-dynamic'

/** Admin Console sign-in. No registration, no member sign-up link. */
export default async function AdminLoginPage() {
  const session = await getSessionAccount()
  if (session && isAdminRole(session.role)) redirect('/admin')

  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-[#FAF7F2] px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-maroon font-serif text-[18px] text-white" aria-hidden="true">MJ</span>
          <p className="mt-3 text-[15px] font-semibold text-ink">Mithila Jodi</p>
          <h1 className="text-[22px] font-semibold text-ink">Admin Console</h1>
        </div>
        <div className="rounded-xl border border-[#E8E1D5] bg-white p-6 shadow-[0_12px_32px_-18px_rgba(43,33,28,0.25)]">
          <AdminLoginForm />
        </div>
        <p className="mt-5 text-center text-[12px] leading-relaxed text-ink-soft">
          For Mithila Jodi administrators only. Sign-ins and failed attempts are recorded.
        </p>
      </div>
    </main>
  )
}
