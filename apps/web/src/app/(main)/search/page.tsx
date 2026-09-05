import { Suspense } from 'react'
import SearchPageContent from './SearchPageContent'

function SearchFallback() {
  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <div className="bg-cream border-b border-paper-3">
        <div className="wrap py-4">
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-paper-3 rounded-mj-sm animate-pulse" />
            <div className="w-20 h-10 bg-paper-3 rounded-mj-sm animate-pulse" />
          </div>
        </div>
      </div>
      <div className="wrap py-6">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 flex gap-4 animate-pulse">
              <div className="w-20 h-24 rounded-mj-sm bg-paper-3" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-paper-3 rounded w-1/3" />
                <div className="h-3 bg-paper-3 rounded w-1/2" />
                <div className="h-3 bg-paper-3 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPageContent />
    </Suspense>
  )
}
