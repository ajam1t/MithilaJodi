import type { AdminPerm } from '@/lib/adminAuth'

export type NavItem = { label: string; href: string; perm?: AdminPerm; hint?: string }
export type NavGroup = { label: string; href?: string; items?: NavItem[] }

/**
 * The console's information architecture. Items a role cannot use are hidden
 * in the menu — but every page and API also checks permission on the server,
 * so hiding is a convenience, not the control.
 */
export const ADMIN_NAV: NavGroup[] = [
  { label: 'Dashboard', href: '/admin' },
  {
    label: 'Members',
    items: [
      { label: 'All members', href: '/admin/members', hint: 'Search, filter and manage' },
      { label: 'Member map', href: '/admin/members/map', hint: 'Members by state' },
      { label: 'Photo review', href: '/admin/photos', perm: 'moderate' },
      { label: 'Reports', href: '/admin/reports', perm: 'moderate' },
      { label: 'Flags', href: '/admin/flags', perm: 'moderate' },
      { label: 'Search showcase', href: '/admin/showcase', perm: 'manage_members' },
      { label: 'Add a profile', href: '/admin/profiles/new', perm: 'manage_members' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Overview', href: '/admin/analytics' },
      { label: 'Visitors', href: '/admin/analytics/visitors' },
      { label: 'Member growth', href: '/admin/analytics/growth' },
      { label: 'Digital Profile views', href: '/admin/analytics/digital-profiles' },
      { label: 'Engagement', href: '/admin/analytics/engagement' },
      { label: 'Conversion', href: '/admin/analytics/conversion' },
    ],
  },
  {
    label: 'Features',
    items: [
      { label: 'All features', href: '/admin/features' },
      { label: 'Matrimony', href: '/admin/features#matrimony' },
      { label: 'Digital Profile', href: '/admin/features#digital-profile' },
      { label: 'Biodata', href: '/admin/features#biodata' },
      { label: 'Invitation', href: '/admin/features#invitation' },
      { label: 'Astrology', href: '/admin/features#astrology' },
      { label: 'Festivals & songs', href: '/admin/features#festivals' },
      { label: 'Journal', href: '/admin/features#journal' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Journal articles', href: '/admin/blog', perm: 'manage_content' },
      { label: 'New article', href: '/admin/blog/new', perm: 'manage_content' },
      { label: 'Journal categories', href: '/admin/blog/categories', perm: 'manage_content' },
      { label: 'Festivals & songs', href: '/admin/content' },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'WhatsApp community', href: '/admin/community' },
      { label: 'Social links', href: '/admin/community#social' },
      { label: 'Announcements', href: '/admin/notifications', perm: 'manage_settings' },
      { label: 'Official messages', href: '/admin/messages', perm: 'moderate' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Health', href: '/admin/system' },
      { label: 'Supabase usage', href: '/admin/system/supabase' },
      { label: 'Storage', href: '/admin/system/storage' },
      { label: 'Performance', href: '/admin/system/performance' },
      { label: 'Errors', href: '/admin/system/performance#errors' },
    ],
  },
  {
    label: 'Security',
    items: [
      { label: 'Admin access', href: '/admin/security', perm: 'security' },
      { label: 'Audit log', href: '/admin/security/audit', perm: 'security' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Platform settings', href: '/admin/settings', perm: 'manage_settings' },
      { label: 'Membership plans', href: '/admin/config', perm: 'manage_settings' },
      { label: 'Accounts & memberships', href: '/admin/accounts', perm: 'manage_settings' },
      { label: 'Master data', href: '/admin/master-data', perm: 'manage_settings' },
    ],
  },
]
