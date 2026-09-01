import Link from 'next/link'

const LANGS = [
  { label: 'English',  script: 'en' },
  { label: 'हिन्दी',   script: 'hi' },
  { label: 'मैथिली',  script: 'mai' },
  { label: 'संस्कृत',  script: 'sa' },
]

export function BiodataSection() {
  return (
    <section id="biodata" className="relative bg-paper-2 py-9 sm:py-12" aria-label="Marriage biodata in your language">
      <div className="wrap">
        <div className="text-center mb-4">
          <p className="eyebrow mb-1.5">Your Language</p>
          <h2 className="font-serif text-maroon leading-tight text-[21px] sm:text-[26px] lg:text-[30px]">
            Biodata in Your Mother Tongue
          </h2>
          <div className="ornament-line w-16 mx-auto mt-2" />
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <p className="text-ink-soft text-[14px] leading-relaxed mb-3.5">
            Create your biodata in <span className="font-deva text-maroon">मैथिली</span>, हिन्दी, English, or Sanskrit — your profile, your culture.
          </p>

          {/* Language pills */}
          <div className="flex gap-2 flex-wrap justify-center mb-3.5" aria-label="Supported languages">
            {LANGS.map(l => (
              <span
                key={l.script}
                className="px-4 py-1.5 rounded-full text-[13px] font-medium bg-cream text-maroon border border-gold border-opacity-40 font-deva shadow-mj-xs"
              >
                {l.label}
              </span>
            ))}
          </div>

          {/* Feature bullets */}
          <ul className="text-left inline-block space-y-1 text-[12px] text-ink-soft mb-4">
            {[
              'Full Devanagari support — names, places, family details',
              'Maithili-specific fields: kul, gotra, mool, ancestral village',
              'Switch language any time; original data preserved',
              'Family members view in their preferred language',
            ].map(pt => (
              <li key={pt} className="flex items-start gap-2.5">
                <span className="text-marigold text-base leading-none mt-0.5 flex-shrink-0">◆</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>

          <div>
            <Link href="/register" className="btn-primary">
              Create Your Biodata
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
