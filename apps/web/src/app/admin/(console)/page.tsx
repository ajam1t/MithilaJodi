import {
  getAttention, getDaily, getDbUsage, getDpPeriods, getEventPeriods, getFunnel, getGeo, getMemberCounts, getMemberSnapshot, getMetricPeriods,
  getRecentAudit, getSectionPeriods, getTrackingSince, getVisitorPeriods,
} from '@/lib/adminData'
import { can, requireAdminPage, type AdminPerm } from '@/lib/adminAuth'
import { DashboardView } from './DashboardView'

export const metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

const ALL: AdminPerm[] = ['view', 'moderate', 'manage_members', 'delete_members', 'manage_content', 'manage_community', 'manage_settings', 'security']

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const session = await requireAdminPage('view')
  const { denied } = await searchParams
  const [m, dp, vis, ev, snap, att, daily, geo, sections, audit, usage, since, counts, funnel] = await Promise.all([
    getMetricPeriods(), getDpPeriods(), getVisitorPeriods(), getEventPeriods(), getMemberSnapshot(), getAttention(),
    getDaily(30), getGeo(), getSectionPeriods(), getRecentAudit(8), getDbUsage(), getTrackingSince(), getMemberCounts(), getFunnel(),
  ])

  return (
    <DashboardView
      role={session.role}
      perms={ALL.filter(p => can(session, p))}
      denied={!!denied}
      {...{ m, dp, vis, ev, snap, att, daily, geo, sections, audit, usage, since, counts, funnel }}
    />
  )
}
