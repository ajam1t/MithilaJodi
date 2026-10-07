/** Readable names for audit actions (unknown ones fall back to the raw key). */
const ACTIONS: Record<string, string> = {
  admin_login: 'Signed in to the console',
  admin_logout: 'Signed out',
  admin_login_failed: 'Failed sign-in attempt',
  admin_login_blocked: 'Sign-in blocked (locked)',
  admin_session_revoked: 'Revoked an admin session',
  approve_photo: 'Approved a photo',
  reject_photo: 'Rejected a photo',
  delete_photo: 'Deleted a photo',
  set_primary_photo: 'Set a primary photo',
  admin_upload_profile_photo: 'Uploaded a profile photo',
  update_profile: 'Edited a profile',
  approve_profile: 'Approved a profile',
  update_account_status: 'Changed an account status',
  member_suspended: 'Suspended a member',
  member_enabled: 'Re-enabled a member',
  member_deleted: 'Deleted a member (soft)',
  member_visibility: 'Changed profile visibility',
  member_dp_revoked: 'Revoked Digital Profile links',
  member_contact_revealed: 'Viewed a member’s mobile number',
  grant_membership: 'Granted a membership',
  send_official_message: 'Sent an official message',
  showcase_update: 'Updated the search showcase',
  showcase_add: 'Added to the search showcase',
  showcase_remove: 'Removed from the search showcase',
  account_data_export: 'Member exported their data',
  account_self_deactivated: 'Member deactivated their account',
  setting_whatsapp_community: 'Changed the WhatsApp community link',
  setting_social_links: 'Changed official social links',
  setting_platform_limits: 'Changed Supabase plan limits',
  setting_admin_email: 'Changed an admin email',
  storage_orphan_deleted: 'Deleted an orphaned storage file',
  song_added: 'Added a festival song',
  song_updated: 'Edited a festival song',
  song_removed: 'Removed a festival song',
}

export function actionLabel(action: string): string {
  return ACTIONS[action] ?? action.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

/** Sensitive actions surface on the Security page. */
export const SENSITIVE = new Set([
  'admin_login_failed', 'admin_login_blocked', 'admin_session_revoked', 'member_deleted', 'member_suspended',
  'member_contact_revealed', 'member_dp_revoked', 'update_account_status', 'setting_whatsapp_community',
  'setting_social_links', 'setting_platform_limits', 'setting_admin_email', 'storage_orphan_deleted', 'delete_photo',
])

export function actorLabel(row: { actor_id: string | null; accounts?: { role?: string; mobile?: string; email?: string | null } | null }): string {
  const a = row.accounts
  if (!row.actor_id || !a) return 'System'
  const who = a.email ?? (a.mobile ? `••••${a.mobile.slice(-4)}` : 'account')
  return a.role === 'admin' ? `Admin (${who})` : a.role === 'moderator' ? `Moderator (${who})` : `Member (${who})`
}
