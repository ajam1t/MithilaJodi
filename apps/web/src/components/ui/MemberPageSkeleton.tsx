/**
 * A light placeholder for a member page while it loads: a heading bar and a
 * few card rows on the ivory page colour. Used by the (main) loading screen
 * and as the Suspense fallback of client-rendered member pages, so a slow
 * load shows the shape of the page instead of a blank area under the nav.
 * The layout's own nav stays in place around it.
 */
export function MemberPageSkeleton({ rows = 3, label = 'Loading…' }: { rows?: number; label?: string }) {
  return (
    <main id="main-content" className="min-h-[60vh] bg-paper" aria-busy="true">
      <span className="sr-only" role="status">{label}</span>
      <div className="wrap py-6 sm:py-8" aria-hidden="true">
        <div className="animate-pulse">
          <div className="h-3 w-24 rounded bg-gold/25 mb-3" />
          <div className="h-7 w-2/3 max-w-xs rounded bg-paper-3 mb-6" />
          <div className="space-y-3">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="card p-4 flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-paper-3 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-paper-3 rounded w-1/3" />
                  <div className="h-3 bg-paper-3 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
