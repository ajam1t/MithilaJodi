import { redirect } from 'next/navigation'

/**
 * Interests now live in the Inbox (Messages | Interests | Mutual). This keeps
 * every old link working — bookmarks, and notifications stored before the
 * move, which point at /interests?tab=received|sent|mutual.
 */
export default async function InterestsRedirect({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  if (tab === 'mutual') redirect('/inbox?tab=mutual')
  if (tab === 'sent') redirect('/inbox?tab=interests&view=sent')
  if (tab === 'foryou') redirect('/home')
  redirect('/inbox?tab=interests')
}
