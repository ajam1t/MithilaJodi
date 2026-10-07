import { redirect } from 'next/navigation'

// The audit log moved to Security → Audit log.
export default function OldAuditPage() {
  redirect('/admin/security/audit')
}
