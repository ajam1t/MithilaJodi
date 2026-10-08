import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { isAdminRole } from '@/lib/adminAuth'
import { AdminLoginForm } from './AdminLoginForm'

export const metadata = { title: 'Sign in' }
export const dynamic = 'force-dynamic'

/** Admin Console sign-in. No registration, no member sign-up link. */
export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const session = await getSessionAccount()
  if (session && isAdminRole(session.role)) redirect('/admin')
  const fromMember = (await searchParams).from === 'member' && !!session?.staff

  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-[#FAF7F2] px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 text-center">
          {/* The official lockup, unaltered — it already carries the name. */}
          <Image src="/logo.png" alt="Mithila Jodi" width={707} height={615} sizes="150px" priority className="mx-auto h-auto w-[150px]" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">Admin Console</h1>
        </div>
        {fromMember && (
          <p role="status" className="mb-4 rounded-lg border border-[#E8D9B5] bg-[#FBF5E6] px-4 py-3 text-[13px] leading-relaxed text-ink">
            You are signed in to the member site. Admin access needs a separate Admin Console sign-in.
          </p>
        )}
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
