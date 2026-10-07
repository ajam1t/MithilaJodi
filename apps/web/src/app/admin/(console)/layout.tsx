import { AdminShell } from '@/components/admin/AdminShell'
import { can, requireAdminPage, ROLE_LABEL, type AdminPerm } from '@/lib/adminAuth'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ALL: AdminPerm[] = ['view', 'moderate', 'manage_members', 'delete_members', 'manage_content', 'manage_community', 'manage_settings', 'security']

/**
 * Every console page renders inside this layout, so every console page is
 * behind requireAdminPage(): signed-out → /admin/login, member → 404.
 */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage('view')
  const admin = await createAdminClient()

  // Items waiting on a person — the bell's count. Four head-only counts.
  const [photos, profiles, reports, flags, acct] = await Promise.all([
    admin.from('profile_photos').select('id', { count: 'exact', head: true }).eq('status', 'pending_moderation'),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('profile_status', 'pending_review'),
    admin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('moderation_flags').select('id', { count: 'exact', head: true }).eq('resolved', false),
    admin.from('accounts').select('email').eq('id', session.id).maybeSingle(),
  ])
  const attention = (photos.count ?? 0) + (profiles.count ?? 0) + (reports.count ?? 0) + (flags.count ?? 0)
  const identity = acct.data?.email ?? `••••${session.mobile.slice(-4)}`

  return (
    <AdminShell
      perms={ALL.filter(p => can(session, p))}
      roleLabel={ROLE_LABEL[session.role] ?? session.role}
      identity={identity}
      attention={attention}
    >
      {children}
    </AdminShell>
  )
}
