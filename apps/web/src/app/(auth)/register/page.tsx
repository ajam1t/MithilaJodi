import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { getPostLoginPath, getSafeNextPath } from '@/lib/safeNext'
import { RegisterFlow } from './RegisterFlow'

/**
 * Signed-in members are sent on to the return path (or /home) instead of the
 * sign-up screens — checked against the session itself, as on /login, so a
 * stale cookie still sees the form. Registration's own steps never reload
 * this page once the code is verified (they navigate to /welcome), so this
 * cannot cut the flow short.
 */
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ start?: string | string[]; next?: string | string[] }> }) {
  const { start, next: raw } = await searchParams
  const next = getSafeNextPath(typeof raw === 'string' ? raw : null)

  const session = await getSessionAccount()
  if (session) redirect(getPostLoginPath(next, session.staff))

  return <RegisterFlow start={typeof start === 'string' ? start : undefined} next={next} />
}
