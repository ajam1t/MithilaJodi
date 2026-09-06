import { Suspense } from 'react'
import InterestsContent from './InterestsContent'

// The (main) layout supplies robots: noindex. This exists only so the browser
// tab, history entry and bookmark say what the page is, instead of every member
// page reading as the site's default title.
export const metadata = { title: 'Interests & WhatsApp Requests' }

export default function InterestsPage() {
  return (
    <Suspense fallback={null}>
      <InterestsContent />
    </Suspense>
  )
}
