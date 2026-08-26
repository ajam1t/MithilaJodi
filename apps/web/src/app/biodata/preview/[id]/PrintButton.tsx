'use client'

export default function PrintButton() {
  function share() {
    const url = window.location.href
    const text = 'Here is my marriage biodata from Mithila Jodi.'
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="no-print fixed top-4 right-4 z-50 flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="bg-maroon text-white text-sm font-medium px-4 py-2 rounded shadow-lg hover:bg-maroon/90 transition-colors"
      >
        Print / Save as PDF
      </button>
      <button
        type="button"
        onClick={share}
        className="bg-[#25D366] text-white text-sm font-medium px-4 py-2 rounded shadow-lg hover:bg-[#1ebe5d] transition-colors"
      >
        Share on WhatsApp
      </button>
    </div>
  )
}
