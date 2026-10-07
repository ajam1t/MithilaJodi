import { redirect } from 'next/navigation'

// The profile list is now Members → All members (search, filters, actions).
// Individual profile editing stays at /admin/profiles/[id].
export default function OldProfilesPage() {
  redirect('/admin/members')
}
