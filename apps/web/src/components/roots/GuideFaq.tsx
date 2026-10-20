/** Questions and answers shown on the page — the same items feed the page's FAQPage JSON-LD. */
export function GuideFaq({ items, title = 'Common questions' }: { items: Array<{ q: string; a: string }>; title?: string }) {
  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="font-serif text-maroon text-[21px] sm:text-[25px] leading-tight text-center">{title}</h2>
      <div className="ornament-line w-14 mx-auto mt-2.5 mb-5" />
      <div className="space-y-3">
        {items.map(({ q, a }) => (
          <details key={q} className="card p-4 group">
            <summary className="font-semibold text-ink text-[14.5px] cursor-pointer list-none flex items-start gap-2">
              <span className="text-gold mt-0.5 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true">›</span>
              {q}
            </summary>
            <p className="text-ink-soft text-[14px] leading-relaxed mt-2 pl-4">{a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
