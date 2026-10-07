/** Shown while a console page's queries run — the frame stays, the workspace shimmers. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-5">
      <div className="h-8 w-64 rounded-lg bg-[#EFE9DF]" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => <div key={i} className="h-24 rounded-xl border border-[#E8E1D5] bg-white" />)}
      </div>
      <div className="h-72 rounded-xl border border-[#E8E1D5] bg-white" />
    </div>
  )
}
