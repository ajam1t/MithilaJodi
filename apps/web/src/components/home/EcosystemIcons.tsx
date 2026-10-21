/**
 * One line-icon family for the parts of Mithila Jodi, shared by the hero's
 * quick links and the ecosystem wheel so the same feature always wears the
 * same mark. 24×24, 1.6 stroke, currentColor — they take their colour from
 * the surrounding text.
 */
export type EcosystemId =
  | 'matrimony' | 'profile' | 'biodata' | 'invitations' | 'astrology'
  | 'names' | 'culture' | 'festivals' | 'songs' | 'journal'

const PATHS: Record<EcosystemId, React.ReactNode> = {
  // A profile card with a portrait and two lines.
  profile: <><rect x="4" y="3.5" width="16" height="17" rx="2" /><circle cx="12" cy="9.5" r="2.6" /><path d="M7.8 16c.8-1.9 2.4-2.9 4.2-2.9s3.4 1 4.2 2.9" /></>,
  // A sprouting seed: two leaves on a stem, for a newborn's name.
  names: <><path d="M12 20.5V11" /><path d="M12 13c0-3.4-2.4-5.6-6-5.6 0 3.4 2.4 5.6 6 5.6z" /><path d="M12 11c0-3.4 2.4-5.6 6-5.6 0 3.4-2.4 5.6-6 5.6z" /><path d="M8 20.5h8" /></>,
  // Two beamed notes.
  songs: <><path d="M9 17.5V6l10-2v11.5" /><circle cx="6.7" cy="17.5" r="2.3" /><circle cx="16.7" cy="15.5" r="2.3" /><path d="M9 9.5l10-2" /></>,
  // An open book.
  journal: <><path d="M12 6.5C10 5 7 4.6 3.5 5v13c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.5z" /><path d="M12 6.5v13" /></>,
  // Two linked rings.
  matrimony: <><circle cx="9" cy="13" r="5.2" /><circle cx="15" cy="13" r="5.2" /><path d="M10.4 5.2 12 3.5l1.6 1.7L12 7z" /></>,
  // A folded page with lines and a seal.
  biodata: <><path d="M6.5 3.5h8l3 3v14h-11z" /><path d="M14.5 3.5v3h3" /><path d="M9 11h6M9 14h6M9 17h3.5" /></>,
  // An envelope with a heart seal.
  invitations: <><rect x="3.5" y="6" width="17" height="12.5" rx="1.5" /><path d="m3.8 6.6 8.2 6.4 8.2-6.4" /><path d="M12 15.8c-1.3-.9-2-1.6-2-2.4a1 1 0 0 1 2-.3 1 1 0 0 1 2 .3c0 .8-.7 1.5-2 2.4z" /></>,
  // A planet on its orbit, with a star.
  astrology: <><circle cx="12" cy="12" r="3.4" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-24 12 12)" /><path d="M18.5 4.2v2.6M17.2 5.5h2.6" /></>,
  // A diya with its flame.
  festivals: <><path d="M4 14.5h16c-.6 3-3.8 5-8 5s-7.4-2-8-5z" /><path d="M12 4.2c1.6 1.8 2.2 3.2 2.2 4.3a2.2 2.2 0 0 1-4.4 0c0-1.1.6-2.5 2.2-4.3z" /><path d="M12 11v3.5" /></>,
  // A Madhubani fish — the Mithila motif of good fortune.
  culture: <><path d="M3.5 12c2.6-3.6 6-5 9.2-5 3 0 5.6 1.8 7.3 5-1.7 3.2-4.3 5-7.3 5-3.2 0-6.6-1.4-9.2-5z" /><path d="M3.5 12 1.8 9.2M3.5 12l-1.7 2.8" /><circle cx="16.2" cy="11" r=".9" fill="currentColor" stroke="none" /><path d="M9 9.5c.8 1.6.8 3.4 0 5M11.6 8.8c1 2 1 4.4 0 6.4" /></>,
}

export function EcosystemIcon({ id, className = 'h-5 w-5' }: { id: EcosystemId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[id]}
    </svg>
  )
}
