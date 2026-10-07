import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { WEDDING_THEMES, weddingTheme, type WeddingTheme } from '@/lib/wedding/themes'
import { visibleMithila, type Invite, type WeddingEvent } from '@/lib/wedding/schema'
import { directionsUrl, mapEmbedUrl, paragraphs, weddingMoment } from '@/lib/wedding/format'
import { dateL, LANG_TAG, timeL, translator, weekdayL, type Lang, type WeddingStrings } from '@/lib/wedding/i18n'
import { Border, Divider, FishPair, Kohbar, Lotus, Paag, Peacock, Sun } from '../motifs'
import { Countdown, LangBar, RsvpWhatsApp, ShareBar, SiteEffects } from './islands'
import { Envelope } from './Envelope'

type Props = {
  invite: Invite
  /** Absolute link to this invitation, for sharing; empty in the builder preview. */
  shareUrl: string
  /** 'embedded' is the builder's live preview: no share bar, no language bar, a shorter opening view. */
  mode: 'public' | 'embedded'
  /** Show this language instead of the invitation's own (a guest's choice). */
  lang?: Lang
  /**
   * The sealed-envelope opening. 'session' = public page, once per visit;
   * 'preview' = in the builder, on request; 'none' = straight to the invitation.
   */
  opening?: 'session' | 'preview' | 'none'
  /** sessionStorage key for 'session' openings. */
  openingKey?: string
}

const DEVANAGARI = /[ऀ-ॿ]/

function themeVars(t: WeddingTheme): CSSProperties {
  return {
    '--w-bg': t.bg, '--w-surface': t.surface, '--w-ink': t.ink, '--w-accent': t.accent, '--w-soft': t.soft,
    '--w-gold': t.gold, '--w-line': `${t.gold}40`, '--w-hero': t.heroBg, '--w-hero-ink': t.heroInk,
  } as CSSProperties
}

function Section({ id, title, sub, children, alt = false, wide = false }: { id: string; title: string; sub?: string; children: ReactNode; alt?: boolean; wide?: boolean }) {
  return (
    <section id={id} className={`wd-section ${alt ? 'wd-alt' : ''}`} aria-labelledby={`${id}-h`}>
      <div className={wide ? 'wd-wide' : 'wd-wrap'}>
        <header className="mb-8 sm:mb-10" data-reveal>
          <h2 id={`${id}-h`} className="wd-h2">{title}</h2>
          {sub && <p className="wd-sub">{sub}</p>}
        </header>
        {children}
      </div>
    </section>
  )
}

const EVENT_GLYPH: Record<WeddingEvent['icon'], string> = {
  tilak: 'M12 4c2 4 2 8 0 12-2-4-2-8 0-12Z M12 19v1',
  matkor: 'M7 10h10l-1 8a3 3 0 0 1-3 2h-2a3 3 0 0 1-3-2l-1-8Z M9 10V7h6v3',
  haldi: 'M12 4c4 3 5 7 3 11-1 2-5 2-6 0-2-4-1-8 3-11Z',
  vivah: 'M12 3c3 4 4 7 2 10a3 3 0 0 1-4 0c-2-3-1-6 2-10Z M6 20h12 M8 17h8',
  vidai: 'M4 11h16M6 11v7h12v-7M9 11V7a3 3 0 0 1 6 0v4 M3 18h18',
  sindoor: 'M8 9h8v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9Z M7 9h10 M12 5v2',
  baraat: 'M5 19 9 9l3 4 3-4 4 10 M9 9l3-5 3 5',
  reception: 'M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.6 7.1 19.2 8 13.7 4 9.8 9.5 9Z',
  puja: 'M6 15c0 3 3 5 6 5s6-2 6-5H6Z M12 15V9 M12 9c2-2 2-4 0-6-2 2-2 4 0 6Z',
  other: 'M12 4c2 3 2 6 0 9-2-3-2-6 0-9Z M5 9c3 0 6 2 7 5-3 0-6-2-7-5Z M19 9c-1 3-4 5-7 5 1-3 4-5 7-5Z M6 18h12',
}

function HeroArt({ t }: { t: WeddingTheme }) {
  const c = { ink: t.heroInk, gold: t.gold, fill: t.heroInk }
  switch (t.motif) {
    case 'kohbar':
      return <div className="opacity-[0.2]"><Kohbar {...c} w={460} /></div>
    case 'paag':
      return (
        <svg viewBox="-160 -150 320 300" width="420" className="max-w-full opacity-30" aria-hidden="true">
          <Lotus r={120} {...c} />
          <Paag y={-6} s={1.3} ink={t.heroInk} gold={t.gold} fill={t.accent} />
        </svg>
      )
    case 'peacock':
      return (
        <svg viewBox="-200 -120 400 240" width="480" className="max-w-full opacity-[0.22]" aria-hidden="true">
          <Peacock x={-70} y={10} s={1.3} {...c} flip />
          <Peacock x={70} y={10} s={1.3} {...c} />
          <Lotus y={90} r={34} {...c} />
        </svg>
      )
    case 'sun':
      return (
        <svg viewBox="-160 -160 320 320" width="440" className="max-w-full opacity-[0.26]" aria-hidden="true">
          <Sun y={-40} r={70} {...c} />
          <FishPair y={110} s={1.1} {...c} />
        </svg>
      )
    default:
      return (
        <svg viewBox="-100 -100 200 200" width="300" className="max-w-full opacity-[0.16]" aria-hidden="true">
          <Lotus r={80} ink={t.accent} gold={t.gold} />
        </svg>
      )
  }
}

export function WeddingSite({ invite, shareUrl, mode, lang: langOverride, opening = 'none', openingKey }: Props) {
  const CoupleTitle = mode === 'embedded' ? 'p' : 'h1'
  const t = weddingTheme(invite.t)
  const c = invite.c
  const lang: Lang = langOverride ?? invite.l
  const tr = translator(lang)
  const inv = {
    brideName: c.couple.brideName || tr('bridePlaceholder'),
    groomName: c.couple.groomName || tr('groomPlaceholder'),
    weddingAt: weddingMoment(c.wedding.date, c.wedding.time),
  }
  const motifInk = { ink: t.accent, gold: t.gold }
  const divider = ({ kohbar: 'lotus', paag: 'paag', peacock: 'peacock', sun: 'sun', line: 'dot' } as const)[t.motif]
  const couple = `${inv.brideName} & ${inv.groomName}`
  const dateIso = c.wedding.date
  const when = (d: string, tm: string) => [dateL(lang, d), timeL(lang, tm)].filter(Boolean).join(' · ')
  const venueQuery = [c.wedding.venueName, c.wedding.venueAddress].filter(Boolean).join(', ')
  const brideSide = visibleMithila(c.mithila.bride)
  const groomSide = visibleMithila(c.mithila.groom)
  const showMithila = c.mithila.enabled && (brideSide.length > 0 || groomSide.length > 0 || !!c.mithila.intro)
  const showCouple = !!(c.couple.brideAbout || c.couple.groomAbout)
  const showFamily = !!(c.family.brideParents || c.family.groomParents || c.family.members || c.family.message)
  const events = c.events.filter(e => e.name)
  /** Devanagari text gets the Devanagari display face, Latin text the Latin one. */
  const face = (text: string) => (DEVANAGARI.test(text) ? 'wd-deva' : 'wd-display')
  const [madeBefore, madeAfter] = tr('madeWith', { brand: '\u0000' }).split('\u0000')

  return (
    <div className={`wd ${mode === 'embedded' ? 'wd-embedded' : ''}`} style={themeVars(t)} data-theme={t.id} data-lang={lang} lang={LANG_TAG[lang]}>
      {opening !== 'none' && (
        <Envelope
          theme={t}
          lang={lang}
          bride={c.couple.brideName}
          groom={c.couple.groomName}
          dateLine={dateL(lang, dateIso)}
          storageKey={opening === 'session' ? openingKey ?? null : null}
          embedded={mode === 'embedded'}
        />
      )}
      {mode === 'public' && <LangBar lang={lang} />}

      <div className="wd-content">
        {mode === 'public' && <SiteEffects />}

        {/* ── Opening view — what the card becomes ── */}
        <header className="wd-hero">
          <div className="absolute inset-0 -z-10 grid place-items-center wd-hero-art"><HeroArt t={t} /></div>
          {t.ornament > 0 && (
            <>
              <svg className="wd-petal left-[8%] top-[14%]" width="46" viewBox="-30 -30 60 60" aria-hidden="true"><Lotus r={24} ink={t.heroInk} gold={t.gold} /></svg>
              <svg className="wd-petal right-[9%] bottom-[18%]" style={{ animationDelay: '2.5s' }} width="38" viewBox="-30 -30 60 60" aria-hidden="true"><Lotus r={24} ink={t.heroInk} gold={t.gold} /></svg>
            </>
          )}
          <div className="relative max-w-[560px]">
            <p className={`${face(tr('shubhVivah'))} wd-rise wd-d1 text-[34px] sm:text-[44px] leading-none`} style={{ color: t.gold }}>{tr('shubhVivah')}</p>
            <Border ink={t.heroInk} gold={t.gold} className="wd-rise wd-d2 mx-auto mt-5 !w-40 opacity-70" />
            {/* The couple is the page's H1 on a real invitation. Embedded as a
                preview inside another page (the builder, the Premium landing's
                phone mock-ups) it must not be — that page has its own H1. */}
            <CoupleTitle className="wd-display wd-rise wd-d3 mt-6 text-[42px] sm:text-[60px] leading-[1.05]">
              <span className="block">{inv.brideName}</span>
              <span className="block text-[26px] sm:text-[32px] my-1" aria-label={tr('and')}>❤️</span>
              <span className="block">{inv.groomName}</span>
            </CoupleTitle>
            {c.couple.nickname && <p className="wd-rise wd-d3 mt-3 font-hand text-[22px] opacity-90">#{c.couple.nickname.replace(/^#/, '')}</p>}
            {dateIso && (
              <p className="wd-rise wd-d4 mt-6 text-[18px] sm:text-[20px] tracking-wide">
                {dateL(lang, dateIso)}
                <span className="block text-[14px] opacity-80 mt-1">{[weekdayL(lang, dateIso), timeL(lang, c.wedding.time)].filter(Boolean).join(' · ')}</span>
              </p>
            )}
            <a href="#welcome" className="wd-rise wd-d5 inline-flex flex-col items-center gap-1 mt-10 text-[15px] opacity-85 hover:opacity-100">
              <span className={face(tr('viewInvitation'))}>{tr('viewInvitation')}</span>
              <svg className="wd-scroll-cue" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </a>
          </div>
        </header>

        {/* ── Welcome ── */}
        {c.message.text ? (
          <section id="welcome" className="wd-section" aria-label={tr('invitation')}>
            <div className="wd-wrap text-center" data-reveal>
              <Divider {...motifInk} motif={divider} />
              <div className="mt-6 space-y-4">
                {paragraphs(c.message.text).map((p, i) => (
                  <p key={i} className={`${face(p)} ${DEVANAGARI.test(p) ? 'text-[21px] sm:text-[25px]' : 'text-[20px] sm:text-[23px]'} leading-relaxed`} style={{ whiteSpace: 'pre-line' }}>{p}</p>
                ))}
              </div>
              <p className="mt-6 wd-soft text-[14px]">— {couple}</p>
            </div>
          </section>
        ) : <span id="welcome" />}

        {/* ── Story ── */}
        {c.story.text && (
          <Section id="story" title={`❤️ ${tr('storyTitle')}`} sub={c.story.title || undefined} alt>
            <div className="wd-card p-6 sm:p-9 space-y-4 text-[17px] leading-relaxed" data-reveal>
              {paragraphs(c.story.text).map((p, i) => <p key={i} style={{ whiteSpace: 'pre-line' }} className={i === 0 ? 'first-letter:font-serif first-letter:text-[44px] first-letter:float-left first-letter:mr-2 first-letter:leading-none' : ''}>{p}</p>)}
            </div>
          </Section>
        )}

        {/* ── Mithila ── */}
        {showMithila && (
          <Section id="mithila" title={`🌺 ${tr('mithilaTitle')}`}>
            {c.mithila.intro && <p className="text-center text-[17px] leading-relaxed max-w-xl mx-auto mb-8" data-reveal style={{ whiteSpace: 'pre-line' }}>{c.mithila.intro}</p>}
            <div className={`grid gap-5 ${brideSide.length && groomSide.length ? 'sm:grid-cols-2' : 'max-w-md mx-auto'}`}>
              {([[brideSide, tr('brideSide')], [groomSide, tr('groomSide')]] as const).filter(([s]) => s.length).map(([side, title]) => (
                <div key={title} className="wd-card overflow-hidden" data-reveal>
                  <Border ink={t.accent} gold={t.gold} />
                  <div className="p-6">
                    <p className={`${face(title)} text-[22px] wd-accent text-center`}>{title}</p>
                    <dl className="mt-5 space-y-3">
                      {side.map(f => {
                        const label = tr(`field_${f.key}` as keyof WeddingStrings)
                        return (
                          <div key={f.key} className="flex items-baseline justify-between gap-4 border-b pb-2" style={{ borderColor: 'var(--w-line)' }}>
                            <dt className={`shrink-0 ${face(label)} text-[16px] wd-accent`}>{label}</dt>
                            <dd className="text-right text-[16px]">{f.value}</dd>
                          </div>
                        )
                      })}
                    </dl>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── The couple ── */}
        {showCouple && (
          <Section id="couple" title={tr('coupleTitle')} alt>
            <div className="grid grid-cols-2 gap-4 sm:gap-10 max-w-xl mx-auto">
              {([[inv.brideName, c.couple.brideAbout, tr('bride'), 'bride'], [inv.groomName, c.couple.groomAbout, tr('groom'), 'groom']] as const).map(([name, about, role, side]) => (
                <figure key={side} className="text-center" data-reveal>
                  <div className="wd-portrait grid place-items-center">
                    <svg viewBox="-60 -66 120 132" className="w-[78%] h-[78%]" aria-hidden="true">
                      {side === 'bride' ? <Lotus r={44} ink={t.accent} gold={t.gold} fill={t.accent} /> : <Paag s={1.05} ink={t.accent} gold={t.gold} fill={t.bg} />}
                    </svg>
                  </div>
                  <figcaption className="mt-4">
                    <span className={`block ${face(role)} text-[15px]`} style={{ color: t.gold }}>{role}</span>
                    <span className="block wd-display text-[24px] sm:text-[28px] wd-accent leading-tight">{name}</span>
                    {about && <span className="block mt-2 text-[14px] wd-soft leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{about}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>
        )}

        {/* ── Countdown ── */}
        {inv.weddingAt && (
          <section className="wd-section" aria-label={tr('countdownTitle')}>
            <div className="wd-wrap text-center" data-reveal>
              <p className={`${face(tr('countdownTitle'))} text-[24px] sm:text-[30px] wd-accent mb-6`}>{tr('countdownTitle')}</p>
              <Countdown at={inv.weddingAt} lang={lang} label={dateL(lang, dateIso)} />
            </div>
          </section>
        )}

        {/* ── Ceremonies ── */}
        {events.length > 0 && (
          <Section id="events" title={tr('eventsTitle')} alt>
            <ol className="wd-timeline">
              {events.map(e => (
                <li key={e.id} className="wd-event" data-reveal>
                  <span className="wd-event-dot" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={EVENT_GLYPH[e.icon]} /></svg>
                  </span>
                  <div className="wd-card p-5">
                    <h3 className={`${face(e.name)} text-[22px] wd-accent leading-tight`}>{e.name}</h3>
                    {(e.date || e.time) && <p className="mt-1.5 text-[15px] font-medium">{when(e.date, e.time)}</p>}
                    {e.venue && <p className="mt-1 text-[14px] wd-soft">📍 {e.venue}</p>}
                    {e.description && <p className="mt-2.5 text-[15px] leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{e.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* ── Venue ── */}
        {c.wedding.venueName && (
          <Section id="venue" title={`📍 ${tr('venueTitle')}`}>
            <div className="wd-card overflow-hidden" data-reveal>
              <div className="p-6 sm:p-8 text-center">
                <p className="wd-display text-[26px] sm:text-[30px] wd-accent leading-tight">{c.wedding.venueName}</p>
                {c.wedding.venueAddress && <p className="mt-2 text-[16px] wd-soft" style={{ whiteSpace: 'pre-line' }}>{c.wedding.venueAddress}</p>}
                {(dateIso || c.wedding.time) && <p className="mt-3 text-[15px]">{when(dateIso, c.wedding.time)}</p>}
                {c.wedding.dressCode && <p className="mt-2 text-[14px]"><span className="wd-soft">{tr('dressCode')}:</span> {c.wedding.dressCode}</p>}
                {c.wedding.note && <p className="mt-2 text-[14px] wd-soft" style={{ whiteSpace: 'pre-line' }}>{c.wedding.note}</p>}
                <a className="wd-btn mt-6" href={directionsUrl(c.wedding.mapUrl, venueQuery)} target="_blank" rel="noopener noreferrer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                  <span>{tr('directions')}</span>
                </a>
              </div>
              {venueQuery && (
                <iframe
                  title={tr('mapOf', { venue: c.wedding.venueName })}
                  src={mapEmbedUrl(venueQuery)}
                  className="block w-full h-[260px] sm:h-[320px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>
          </Section>
        )}

        {/* ── RSVP ── */}
        {c.rsvp.enabled && c.rsvp.phone && (
          <Section id="rsvp" title={`💌 ${tr('rsvpTitle')}`} sub={c.rsvp.deadline ? tr('rsvpBy', { date: dateL(lang, c.rsvp.deadline) }) : undefined}>
            <div className="max-w-md mx-auto" data-reveal>
              <RsvpWhatsApp phone={c.rsvp.phone} couple={couple} contactName={c.rsvp.contactName} lang={lang} />
            </div>
          </Section>
        )}

        {/* ── Family ── */}
        {showFamily && (
          <Section id="family" title={tr('familyTitle')} alt>
            <div className="grid gap-5 sm:grid-cols-2" data-reveal>
              {c.family.brideParents && (
                <div className="wd-card p-6 text-center"><p className={`${face(tr('brideParents'))} text-[18px]`} style={{ color: t.gold }}>{tr('brideParents')}</p><p className="mt-2 text-[17px]" style={{ whiteSpace: 'pre-line' }}>{c.family.brideParents}</p></div>
              )}
              {c.family.groomParents && (
                <div className="wd-card p-6 text-center"><p className={`${face(tr('groomParents'))} text-[18px]`} style={{ color: t.gold }}>{tr('groomParents')}</p><p className="mt-2 text-[17px]" style={{ whiteSpace: 'pre-line' }}>{c.family.groomParents}</p></div>
              )}
            </div>
            {c.family.members && <p className="mt-6 text-center text-[16px] wd-soft leading-relaxed" data-reveal style={{ whiteSpace: 'pre-line' }}>{c.family.members}</p>}
            {c.family.message && <p className={`mt-6 text-center ${face(c.family.message)} text-[20px] leading-relaxed`} data-reveal style={{ whiteSpace: 'pre-line' }}>{c.family.message}</p>}
          </Section>
        )}

        {/* ── Share ── */}
        {mode === 'public' && (
          <section className="wd-section text-center" aria-label={tr('shareTitle')}>
            <div className="wd-wrap" data-reveal>
              <Divider {...motifInk} motif={divider} />
              <p className={`mt-6 mb-6 ${face(tr('shareTitle'))} text-[22px] wd-accent`}>{tr('shareTitle')}</p>
              <ShareBar url={shareUrl} couple={couple} lang={lang} />
            </div>
          </section>
        )}

        {/* ── Footer ── */}
        <footer className="relative overflow-hidden text-center" style={{ background: t.heroBg, color: t.heroInk }}>
          <Border ink={t.heroInk} gold={t.gold} className="opacity-60" />
          <div className="px-6 py-12">
            <p className="wd-display text-[22px]">{couple}</p>
            {dateIso && <p className="mt-1 text-[14px] opacity-80">{dateL(lang, dateIso)}</p>}
            <div className="mx-auto my-8 h-px w-24" style={{ background: t.gold }} />
            <p className="text-[14px] opacity-90">
              {madeBefore}<Link href="/" className="font-semibold underline underline-offset-4" style={{ textDecorationColor: t.gold }}>Mithila Jodi</Link>{madeAfter}
            </p>
            <p className={`mt-1 ${face(tr('tagline'))} text-[15px] opacity-80`}>{tr('tagline')}</p>
            <Link href="/marriage-invitation/premium" className="inline-block mt-5 rounded-full px-5 py-2.5 text-[14px] font-semibold" style={{ border: `1px solid ${t.gold}`, color: t.heroInk }}>
              {tr('createOwn')}
            </Link>
            <p className="mt-6 text-[11px] opacity-60">
              {tr('footerNote')}{' '}
              <Link href="/contact?topic=report-invitation" className="underline underline-offset-2">{tr('report')}</Link>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export { WEDDING_THEMES }
