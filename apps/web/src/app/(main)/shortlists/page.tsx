import { Suspense } from 'react'
import { MemberPageSkeleton } from '@/components/ui/MemberPageSkeleton'
import ShortlistsContent from './ShortlistsContent'

// The (main) layout supplies robots: noindex. This exists only so the browser
// tab, history entry and bookmark say what the page is, instead of every member
// page reading as the site's default title.
export const metadata = { title: 'Your Shortlist' }

export default function ShortlistsPage() {
  return (
    <Suspense fallback={<MemberPageSkeleton />}>
      <ShortlistsContent />
    </Suspense>
  )
}
