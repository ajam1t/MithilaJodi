import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

export default async function FirstSetupPage() {
  const session = await getSessionAccount()
  if (!session) redirect('/login')

  const admin = await createAdminClient()
  const { count: adminCount } = await admin
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .in('role', ['admin', 'moderator'])

  const hasAdmins = (adminCount ?? 0) > 0

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <h1 className="font-serif text-2xl text-ink mb-2">Admin Setup</h1>
      <p className="text-sm text-ink-soft mb-6">
        This page is only accessible when logged in. Use it to promote an account to admin role.
      </p>

      {hasAdmins ? (
        <div className="card p-5 bg-green-50 border-green-200">
          <p className="text-sm text-green-800 font-medium">
            Admin accounts exist. Go to <a href="/admin" className="underline">/admin</a> and log in with an admin account.
          </p>
        </div>
      ) : (
        <div className="card p-5 space-y-4">
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-mj-sm px-3 py-2">
            No admin accounts found. Run the SQL below in your Supabase SQL Editor to promote your account.
          </p>
          <div>
            <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">Your current mobile</p>
            <p className="font-mono text-sm text-ink">{session.mobile}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">SQL to run in Supabase Dashboard → SQL Editor</p>
            <pre className="bg-ink text-green-300 text-xs rounded-mj-sm px-4 py-3 overflow-x-auto">
{`UPDATE accounts
SET role = 'admin'
WHERE mobile = '${session.mobile}';`}
            </pre>
          </div>
          <p className="text-xs text-ink-soft">
            After running the SQL, log out and log back in, then visit <a href="/admin" className="text-maroon hover:underline">/admin</a>.
          </p>
        </div>
      )}
    </div>
  )
}
