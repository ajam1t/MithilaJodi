/**
 * The cover of a Digital Profile — the first thing a family sees when they
 * open the link. The main photograph in a simple Mithila arch, the name, and
 * one quiet line of the person's facts (where they live, their roots, gotra,
 * work). Every fact comes from the shared projection, so nothing appears that
 * the owner did not share. Motion: a single one-time fade on entry.
 */

export type CoverFact = { lead: string; word: string }

function FactLine({ facts }: { facts: CoverFact[] }) {
  return (
    <p className="dpc-facts">
      {facts.map((f, k) => (
        <span key={f.lead + f.word}>
          {k > 0 && <span className="dpc-facts-sep" aria-hidden="true"> · </span>}
          <span className="dpc-facts-lead">{f.lead}</span> {f.word}
        </span>
      ))}
    </p>
  )
}

export function ProfileCover({
  name, meta, place, photo, facts, chips, note, demo, headingLevel = 'h1',
}: {
  name: string
  meta: string
  place: string
  photo: string | null
  facts: CoverFact[]
  chips: string[]
  note: string | null
  demo: boolean
  headingLevel?: 'h1' | 'h3'
}) {
  const H = headingLevel
  const first = name.split(' ')[0]
  return (
    <header className="dpc" aria-label={`${name} — Digital Profile`}>

      <p className="dpc-eyebrow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark-128.webp" alt="" width={22} height={20} />
        Mithila Jodi <span aria-hidden="true">·</span> Digital Profile
      </p>

      <div className="dpc-stage">
        <div className="dpc-arch">
          <div className="dpc-arch-in">
            {photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photo} alt={demo ? '' : `${first}'s photo`} />
              : <span className="dpc-mono">{first[0]?.toUpperCase()}</span>}
          </div>
        </div>
      </div>

      <H className="dpc-name">
        {name}
      </H>
      {meta && <p className="dpc-meta">{meta}</p>}
      {place && <p className="dpc-place"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>{place}</p>}

      {facts.length > 0 && <FactLine facts={facts} />}

      {chips.length > 0 && (
        <ul className="dpc-chips" aria-label="Community">
          {chips.map(c => <li key={c}>{c}</li>)}
        </ul>
      )}
      {note && <p className="dpc-note">{note}</p>}
    </header>
  )
}
