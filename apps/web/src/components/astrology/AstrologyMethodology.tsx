import { METHODOLOGY } from '@/lib/astrology/methodology'

/**
 * The published methodology — one source for every astrology page. `show`
 * picks which tool-specific rule sets follow the shared astronomical basis.
 */
export function AstrologyMethodology({ show }: { show: Array<'match' | 'janam' | 'nakshatra' | 'rashi'> }) {
  return (
    <section id="methodology" className="bg-cream py-14 sm:py-16 scroll-mt-20" aria-labelledby="methodology-title">
      <div className="wrap max-w-3xl">
        <p className="eyebrow mb-2">Methodology v{METHODOLOGY.version}</p>
        <h2 id="methodology-title" className="section-heading text-[30px] sm:text-[36px]">Exactly how the calculation works</h2>
        <div className="ornament-line w-16 mt-3 mb-6" />
        <p className="text-[15px] text-ink-soft leading-relaxed">
          Mithila Jodi uses this methodology consistently for all its astrology calculations. Every result records
          the methodology version that produced it.
        </p>

        <dl className="mt-6 space-y-5">
          {([
            ['Zodiac and ayanamsha', `${METHODOLOGY.zodiac}, ${METHODOLOGY.ayanamsha.name}. Anchored to the Calendar Reform Committee value for 21 March 1956 and carried to any date with the ${METHODOLOGY.ayanamsha.precessionModel}.`],
            ['Ephemeris', `${METHODOLOGY.ephemeris.library} ${METHODOLOGY.ephemeris.libraryVersion} (${METHODOLOGY.ephemeris.licence} licence): ${METHODOLOGY.ephemeris.planets}; Moon: ${METHODOLOGY.ephemeris.moon}. Checked against NASA JPL’s DE421 ephemeris for 40 dates from 1900 to 2045: the Moon agrees within 20 arcseconds and the planets within 13 — far finer than the 3°20′ of a nakshatra pada.`],
            ['Why not Swiss Ephemeris?', METHODOLOGY.ephemeris.whyNotSwissEphemeris],
            ['Rahu and Ketu', METHODOLOGY.nodes],
            ['Houses and chart', `${METHODOLOGY.houses}. ${METHODOLOGY.chartStyle}.`],
            ['Lagna', METHODOLOGY.lagna],
            ['Time zones', METHODOLOGY.timezones],
            ['Unknown birth time', 'No time is assumed. The Lagna, houses and Lagna-based Manglik check are left out. If the Moon changed rashi, nakshatra or Vashya group during the birth date, you are asked which part of the day the birth fell in — or shown every possibility.'],
          ] as const).map(([k, v]) => (
            <div key={k}>
              <dt className="font-serif text-maroon text-[18px]">{k}</dt>
              <dd className="mt-1 text-[15px] text-ink leading-relaxed">{v}</dd>
            </div>
          ))}
        </dl>

        {show.includes('rashi') && (
          <>
            <h3 className="mt-10 font-serif text-maroon text-[22px]">Rashi rules</h3>
            <dl className="mt-4 space-y-3">
              {([
                ['Janma rashi', METHODOLOGY.rashi.janma],
                ['Vedic and Western signs', METHODOLOGY.rashi.western],
                ['Moon-sign compatibility', METHODOLOGY.rashi.compatibility],
                ['Element and quality', METHODOLOGY.rashi.attributes],
              ] as const).map(([k, v]) => (
                <div key={k} className="rounded-mj-sm bg-paper px-4 py-3">
                  <dt className="font-semibold text-ink">{k}</dt>
                  <dd className="mt-0.5 text-[14px] text-ink leading-relaxed">{v}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {show.includes('nakshatra') && (
          <>
            <h3 className="mt-10 font-serif text-maroon text-[22px]">Nakshatra rules</h3>
            <dl className="mt-4 space-y-3">
              {([
                ['Janma nakshatra and pada', METHODOLOGY.nakshatra.janma],
                ['Start and end times', METHODOLOGY.nakshatra.window],
                ['Name syllables', METHODOLOGY.nakshatra.syllables],
                ['Navatara', METHODOLOGY.nakshatra.navatara],
              ] as const).map(([k, v]) => (
                <div key={k} className="rounded-mj-sm bg-paper px-4 py-3">
                  <dt className="font-semibold text-ink">{k}</dt>
                  <dd className="mt-0.5 text-[14px] text-ink leading-relaxed">{v}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {show.includes('janam') && (
          <>
            <h3 className="mt-10 font-serif text-maroon text-[22px]">Janam Kundli rules</h3>
            <dl className="mt-4 space-y-3">
              {([
                ['Navamsa (D9)', METHODOLOGY.janamKundli.navamsa],
                ['Dignity', METHODOLOGY.janamKundli.dignity],
                ['Vimshottari dasha', METHODOLOGY.janamKundli.dasha],
                ['Panchang at birth', METHODOLOGY.janamKundli.panchang],
              ] as const).map(([k, v]) => (
                <div key={k} className="rounded-mj-sm bg-paper px-4 py-3">
                  <dt className="font-semibold text-ink">{k}</dt>
                  <dd className="mt-0.5 text-[14px] text-ink leading-relaxed">{v}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {show.includes('match') && (
          <>
            <h3 className="mt-10 font-serif text-maroon text-[22px]">Ashtakoota rules</h3>
            <p className="mt-2 text-[15px] text-ink-soft leading-relaxed">{METHODOLOGY.ashtakoota.basis}</p>
            <dl className="mt-4 space-y-3">
              {Object.entries(METHODOLOGY.ashtakoota.kootas).map(([key, rule]) => (
                <div key={key} className="rounded-mj-sm bg-paper px-4 py-3">
                  <dt className="font-semibold text-ink capitalize">{key === 'grahaMaitri' ? 'Graha Maitri' : key}</dt>
                  <dd className="mt-0.5 text-[14px] text-ink leading-relaxed">{rule}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[15px] text-ink leading-relaxed">{METHODOLOGY.ashtakoota.cancellations}</p>
          </>
        )}

        <h3 className="mt-10 font-serif text-maroon text-[22px]">Manglik rules</h3>
        <p className="mt-2 text-[15px] text-ink leading-relaxed">
          Houses {METHODOLOGY.manglik.houses.join(', ')}, reckoned from {METHODOLOGY.manglik.reckonedFrom}. {METHODOLOGY.manglik.status}{' '}
          {METHODOLOGY.manglik.notedExceptions} {METHODOLOGY.manglik.houseVariantNote} {METHODOLOGY.manglik.contextOnly}
        </p>

        {show.includes('match') && (
          <>
            <h3 className="mt-10 font-serif text-maroon text-[22px]">Score bands</h3>
            <ul className="mt-3 space-y-1.5 text-[15px] text-ink">
              {METHODOLOGY.scoreBands.map(b => <li key={b.key}><strong>{b.min}–{b.max}</strong> · {b.label}</li>)}
            </ul>
          </>
        )}

        <h3 className="mt-10 font-serif text-maroon text-[22px]">Compared with other calculators</h3>
        <p className="mt-2 text-[15px] text-ink leading-relaxed">
          Tithi, karana, nakshatra and sunrise times agree with Drik Panchang to the minute in our checks. Drik’s
          published Sankranti times run 2 to 16 minutes later than this engine’s; the difference follows the 18.6-year
          nutation cycle exactly — Drik Panchang applies an ayanamsha about 23″ larger to longitudes that still include
          nutation, whereas Mithila Jodi follows the Swiss Ephemeris convention, in which nutation cancels. For the Moon
          this is at most about a minute and a half of birth time, so rashi, nakshatra and Guna results differ only for
          a birth within roughly a minute of a boundary.
        </p>

        <p className="mt-8 rounded-mj border border-gold/30 bg-paper-2/70 px-5 py-4 text-[14px] text-ink leading-relaxed">{METHODOLOGY.review}</p>
      </div>
    </section>
  )
}
