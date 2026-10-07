import { Suspense } from 'react'
import InboxContent from './InboxContent'

// The (main) layout supplies robots: noindex.
export const metadata = { title: 'Inbox' }

export default function InboxPage() {
  return (
    <Suspense fallback={null}>
      <InboxContent />
    </Suspense>
  )
}
