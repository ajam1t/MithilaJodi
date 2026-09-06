import { Suspense } from 'react'
import BiodataContent from './BiodataContent'

// The (main) layout supplies robots: noindex. This exists only so the browser
// tab, history entry and bookmark say what the page is, instead of every member
// page reading as the site's default title.
export const metadata = { title: 'Create Your Marriage Biodata' }

export default function BiodataPage() {
  return (
    <Suspense fallback={null}>
      <BiodataContent />
    </Suspense>
  )
}
