/** Shown while a console page's queries run — the frame stays, the workspace shimmers. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-5 motion-reduce:animate-none">
      <div className="h-44 rounded-[26px] border border-[#EADFCB] bg-[#FFFDF8]" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-[72px] rounded-[18px] border border-[#EADFCB] bg-[#FFFDF8]" />)}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-32 rounded-[18px] border border-[#EADFCB] bg-[#FFFDF8]" />)}
      </div>
    </div>
  )
}
