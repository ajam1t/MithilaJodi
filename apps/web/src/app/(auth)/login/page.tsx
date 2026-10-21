import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { getPostLoginPath, getSafeNextPath } from '@/lib/safeNext'
import { LoginForm } from './LoginForm'

/**
 * A member who is already signed in has nothing to do here, so they go on to
 * the return path (or /home). This is the real session check, not the
 * cookie-presence one middleware does: an expired or revoked cookie falls
 * through to the form, so a stale cookie can never cause a redirect loop.
 */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const raw = (await searchParams).next
  const next = getSafeNextPath(typeof raw === 'string' ? raw : null)

  const session = await getSessionAccount()
  if (session) redirect(getPostLoginPath(next, session.staff))

  return <LoginForm next={next} />
}
