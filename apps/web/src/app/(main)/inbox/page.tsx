import { Suspense } from 'react'
import { MemberPageSkeleton } from '@/components/ui/MemberPageSkeleton'
import InboxContent from './InboxContent'

// The (main) layout supplies robots: noindex.
export const metadata = { title: 'Inbox' }

export default function InboxPage() {
  return (
    <Suspense fallback={<MemberPageSkeleton />}>
      <InboxContent />
    </Suspense>
  )
}
