import { Suspense } from 'react'
import MessagesContent from './MessagesContent'

// The (main) layout supplies robots: noindex. This exists only so the browser
// tab, history entry and bookmark say what the page is, instead of every member
// page reading as the site's default title.
export const metadata = { title: 'Messages' }

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesContent />
    </Suspense>
  )
}
