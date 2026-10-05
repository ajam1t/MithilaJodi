'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '@/styles/wedding.css'
import {
  CEREMONY_PRESETS, contentSchema, EMPTY_CONTENT, MITHILA_FIELDS, newEventId, readiness, WELCOME_PRESETS,
  type Invite, type ThemeId, type WeddingContent, type WeddingEvent,
} from '@/lib/wedding/schema'
import { WEDDING_THEMES } from '@/lib/wedding/themes'
import { encodeInvite, MAX_LINK_PAYLOAD } from '@/lib/wedding/codec'
import { baseSlug, invitationPath, slugStem } from '@/lib/wedding/slug'
import { LANG_LABEL, LANGS, wt, type Lang } from '@/lib/wedding/i18n'
import { WeddingSite } from '../site/WeddingSite'

const DRAFT_KEY = 'mj-wedding-draft'

const STEPS = [
  { key: 'couple', hi: 'युगल', en: 'Couple' },
  { key: 'wedding', hi: 'विवाह', en: 'Wedding' },
  { key: 'events', hi: 'कार्यक्रम', en: 'Ceremonies' },
  { key: 'message', hi: 'संदेश', en: 'Message & story' },
  { key: 'mithila', hi: 'हमर मिथिला', en: 'Mithila' },
  { key: 'family', hi: 'परिवार', en: 'Family' },
  { key: 'share', hi: 'सजाउ आ पठाउ', en: 'Theme & share' },
] as const
type StepKey = (typeof STEPS)[number]['key']

const ICONS: Array<{ v: WeddingEvent['icon']; label: string }> = [
  { v: 'tilak', label: 'Tilak' }, { v: 'matkor', label: 'Matkor' }, { v: 'haldi', label: 'Haldi' }, { v: 'baraat', label: 'Baraat' },
  { v: 'vivah', label: 'Vivah (fire)' }, { v: 'sindoor', label: 'Sindoordan' }, { v: 'vidai', label: 'Vidai (doli)' },
  { v: 'reception', label: 'Reception' }, { v: 'puja', label: 'Puja' }, { v: 'other', label: 'Lotus' },
]

/** Earlier wordings of the default messages — still treated as untouched defaults. */
const LEGACY_PRESETS = [
  'अहाँ सभक स्नेह आ आशीर्वाद हमर नव जीवनक पहिल पूँजी अछि।\n\nएहि शुभ अवसर पर अहाँ सभ सपरिवार पधारि नव दम्पतिके आशीर्वाद देबाक कृपा करी।',
  'आपका स्नेह और आशीर्वाद हमारे नए जीवन की पहली पूँजी है।\n\nइस शुभ अवसर पर आप सपरिवार पधारकर नवदम्पति को आशीर्वाद देने की कृपा करें।',
]
const isDefaultMessage = (text: string) => !text || Object.values(WELCOME_PRESETS).includes(text) || LEGACY_PRESETS.includes(text)

function freshContent(): WeddingContent {
  return { ...EMPTY_CONTENT, message: { language: 'mai', text: WELCOME_PRESETS.mai } }
}

// ─── Small form pieces ──────────────────────────────────────────────────────

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

function Text({ id, value, onChange, max, placeholder, type = 'text', inputMode }: {
  id: string; value: string; onChange: (v: string) => void; max: number; placeholder?: string; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return <input id={id} type={type} inputMode={inputMode} className="input kd-input" value={value} maxLength={max} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
}

function Area({ id, value, onChange, max, rows = 4, placeholder }: { id: string; value: string; onChange: (v: string) => void; max: number; rows?: number; placeholder?: string }) {
  return (
    <>
      <textarea id={id} className="input kd-input !h-auto py-3 leading-relaxed" rows={rows} value={value} maxLength={max} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      <p className="mt-1 text-right text-[11px] text-ink-soft">{value.length} / {max}</p>
    </>
  )
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex items-center gap-3 min-h-[40px] text-left text-[14px] text-ink">
      <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-maroon' : 'bg-paper-3'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </span>
      {label}
    </button>
  )
}

function StepHead({ hi, en, children }: { hi: string; en: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="font-serif text-maroon text-[24px] leading-tight"><span className="font-deva">{hi}</span> <span className="text-ink-soft text-[16px]">· {en}</span></h2>
      {children && <p className="mt-1.5 text-[14px] text-ink-soft leading-relaxed">{children}</p>}
    </div>
  )
}

// ─── The builder ────────────────────────────────────────────────────────────

/** A published invitation: its short link and the private key that edits it. */
type Published = { slug: string; key: string }

export function Builder({ initial, published = null }: { initial: Invite | null; published?: Published | null }) {
  const [theme, setTheme] = useState<ThemeId>(initial?.t ?? 'kohbar')
  const [lang, setLang] = useState<Lang>(initial?.l ?? 'mai')
  /** Bumped to play the envelope opening inside the preview. */
  const [openingRun, setOpeningRun] = useState(0)
  const [c, setC] = useState<WeddingContent>(initial?.c ?? freshContent())
  const [step, setStep] = useState<StepKey>('couple')
  const [saved, setSaved] = useState<'idle' | 'saved'>('idle')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [result, setResult] = useState<{ share: string; edit: string } | null>(null)
  /** Set once this invitation has a short link; saving then updates it in place. */
  const [pub, setPub] = useState<Published | null>(published)
  const [renameLink, setRenameLink] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const loaded = useRef(false)
  const topRef = useRef<HTMLDivElement>(null)

  // Restore a draft from this device, unless an edit link brought its own.
  useEffect(() => {
    if (!initial) {
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) {
          const d = JSON.parse(raw)
          const parsed = contentSchema.safeParse(d.c)
          if (parsed.success) {
            setC(parsed.data)
            if (WEDDING_THEMES.some(t => t.id === d.t)) setTheme(d.t)
            if ((LANGS as readonly string[]).includes(d.l)) setLang(d.l)
            if (d.pub && typeof d.pub.slug === 'string' && typeof d.pub.key === 'string') setPub(d.pub)
          }
        }
      } catch { /* no draft */ }
    }
    loaded.current = true
  }, [initial])

  // Autosave to this device only.
  useEffect(() => {
    if (!loaded.current) return
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ t: theme, l: lang, c, pub })); setSaved('saved') } catch { /* storage full or blocked */ }
    }, 600)
    return () => clearTimeout(t)
  }, [c, theme, lang, pub])

  const update = useCallback(<K extends keyof WeddingContent>(key: K, patch: Partial<WeddingContent[K]>) => {
    setC(prev => ({ ...prev, [key]: { ...(prev[key] as object), ...patch } }))
    setResult(null)
    setSaved('idle')
  }, [])
  const setEvents = (events: WeddingEvent[]) => { setC(prev => ({ ...prev, events })); setResult(null) }

  const invite: Invite = useMemo(() => ({ v: 1, t: theme, l: lang, c }), [theme, lang, c])

  /** The invitation's language. The welcome message follows it only while it is still an untouched default. */
  const chooseLang = (l: Lang) => {
    setLang(l)
    setResult(null)
    setC(prev => (prev.message.language !== 'custom' && isDefaultMessage(prev.message.text)
      ? { ...prev, message: { language: l, text: WELCOME_PRESETS[l] } }
      : prev))
  }
  const ready = readiness(c)
  const idx = STEPS.findIndex(s => s.key === step)
  const go = (k: StepKey) => { setStep(k); setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' }), 0) }

  async function createLink() {
    setError(null)
    const parsed = contentSchema.safeParse(c)
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Please check your details.'); return }
    if (!ready.ready) { setError(`Please add: ${ready.missing.join(', ')}.`); return }
    const payload = await encodeInvite({ v: 1, t: theme, l: lang, c: parsed.data })
    if (payload.length > MAX_LINK_PAYLOAD) {
      setError('Your invitation has more text than one link can carry. Please shorten the story or the ceremony descriptions.')
      return
    }
    setPublishing(true)
    try {
      const r = await fetch('/api/wedding/invites', {
        method: pub ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pub ? { slug: pub.slug, key: pub.key, payload, rename: renameLink } : { payload }),
      })
      const j = await r.json().catch(() => ({}))
      // An edit link that no longer matches (the link closed after 180 days): start a fresh one.
      if (pub && r.status === 404) { setPub(null); setError(`${j.message ?? 'This link has closed.'} Press the button again for a new link.`); return }
      if (!r.ok || !j.ok) { setError(j.message ?? 'Could not create the link. Please try again.'); return }
      const next: Published = pub ? { ...pub, slug: j.slug } : { slug: j.slug, key: j.editKey }
      setPub(next)
      setRenameLink(false)
      const origin = window.location.origin
      setResult({
        share: `${origin}${invitationPath(next.slug)}`,
        edit: `${origin}/marriage-invitation/premium?i=${encodeURIComponent(next.slug)}&k=${encodeURIComponent(next.key)}`,
      })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  async function copy(text: string, what: string) {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(null), 2000) } catch { /* copy blocked */ }
  }

  function startOver() {
    if (!window.confirm('Clear everything and start a new invitation?')) return
    setC(freshContent()); setTheme('kohbar'); setLang('mai'); setResult(null); setPub(null); go('couple')
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
  }

  const couple = `${c.couple.brideName || wt(lang, 'bridePlaceholder')} & ${c.couple.groomName || wt(lang, 'groomPlaceholder')}`
  const waText = result ? wt(lang, 'shareText', { url: result.share, couple }) : ''
  /** After publishing, did the names or date change enough that the link no longer matches them? */
  const wantedStem = baseSlug(c.couple.brideName, c.couple.groomName, c.wedding.date)
  const linkOutdated = !!pub && !!c.couple.brideName && !!c.couple.groomName && !!c.wedding.date && slugStem(pub.slug) !== wantedStem

  /** The scroller is the containing block for the envelope (translateZ), so it opens inside the frame. */
  const site = (
    <WeddingSite key={openingRun} invite={invite} shareUrl="" mode="embedded" opening={openingRun > 0 ? 'preview' : 'none'} />
  )
  const watchOpening = (
    <button type="button" className="btn-ghost btn-sm" onClick={() => setOpeningRun(n => n + 1)}>
      ✉️ Watch the opening
    </button>
  )
  const preview = (
    <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-[30px] border-[8px] border-[#2B211C] bg-[#2B211C] shadow-mj">
      <div data-wd-scroll className="relative h-[min(78vh,760px)] overflow-y-auto overscroll-contain rounded-[22px] bg-white [transform:translateZ(0)]">
        {site}
      </div>
    </div>
  )

  return (
    <div ref={topRef} className="scroll-mt-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        {/* ── Editor ── */}
        <div className="min-w-0">
          {/* Step chips */}
          <nav aria-label="Builder steps" className="-mx-1 mb-6 overflow-x-auto">
            <ol className="flex gap-2 px-1 pb-1 min-w-max">
              {STEPS.map((s, i) => (
                <li key={s.key}>
                  <button type="button" onClick={() => go(s.key)} aria-current={step === s.key ? 'step' : undefined}
                    className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] min-h-[40px] transition-colors ${step === s.key ? 'border-maroon bg-maroon text-cream' : 'border-gold/40 bg-cream text-ink hover:border-gold'}`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${step === s.key ? 'bg-cream text-maroon' : 'bg-paper-2 text-ink-soft'}`}>{i + 1}</span>
                    <span className="font-deva">{s.hi}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <div className="kd-person kd-person-bride p-5 sm:p-7">
            {step === 'couple' && (
              <div className="space-y-4">
                <StepHead hi="युगल" en="The couple">Just the two names are enough to begin — everything else is optional.</StepHead>
                <fieldset className="rounded-mj border border-gold/30 bg-paper px-4 py-3">
                  <legend className="px-1 field-label !mb-0">Invitation language</legend>
                  <p className="text-[13px] text-ink-soft mb-2.5">Every heading, button and date on the invitation will be in this language. Guests can switch if they prefer.</p>
                  <div className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-4" role="radiogroup" aria-label="Invitation language">
                    {LANGS.map(l => (
                      <button key={l} type="button" role="radio" aria-checked={lang === l} lang={l} onClick={() => chooseLang(l)}
                        className={`rounded-mj-sm border px-3 py-2.5 text-[16px] min-h-[46px] transition-colors ${lang === l ? 'border-maroon bg-maroon text-cream' : 'border-gold/40 bg-cream text-ink hover:border-gold'} ${l === 'en' ? '' : 'font-deva'}`}>
                        {LANG_LABEL[l]}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="w-bride" label="Bride’s name"><Text id="w-bride" value={c.couple.brideName} max={60} placeholder="e.g. मुस्कान or Muskan" onChange={v => update('couple', { brideName: v })} /></Field>
                  <Field id="w-groom" label="Groom’s name"><Text id="w-groom" value={c.couple.groomName} max={60} placeholder="e.g. अंकित or Ankit" onChange={v => update('couple', { groomName: v })} /></Field>
                </div>
                <Field id="w-nick" label="Couple nickname or hashtag (optional)"><Text id="w-nick" value={c.couple.nickname} max={60} placeholder="e.g. MuskanKeAnkit" onChange={v => update('couple', { nickname: v })} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="w-babout" label="A line about the bride (optional)"><Area id="w-babout" rows={3} value={c.couple.brideAbout} max={240} placeholder="Daughter of … · from Darbhanga" onChange={v => update('couple', { brideAbout: v })} /></Field>
                  <Field id="w-gabout" label="A line about the groom (optional)"><Area id="w-gabout" rows={3} value={c.couple.groomAbout} max={240} placeholder="Son of … · from Madhubani" onChange={v => update('couple', { groomAbout: v })} /></Field>
                </div>
              </div>
            )}

            {step === 'wedding' && (
              <div className="space-y-4">
                <StepHead hi="विवाह" en="The wedding">The date and time drive the live countdown on the invitation.</StepHead>
                <div className="grid gap-4 min-[420px]:grid-cols-2">
                  <Field id="w-date" label="Wedding date"><input id="w-date" type="date" className="input kd-input" value={c.wedding.date} onChange={e => update('wedding', { date: e.target.value })} /></Field>
                  <Field id="w-time" label="Muhurat / time (optional)"><input id="w-time" type="time" className="input kd-input" value={c.wedding.time} onChange={e => update('wedding', { time: e.target.value })} /></Field>
                </div>
                <Field id="w-venue" label="Venue"><Text id="w-venue" value={c.wedding.venueName} max={120} placeholder="e.g. Shyama Mandir Parisar" onChange={v => update('wedding', { venueName: v })} /></Field>
                <Field id="w-addr" label="Venue address (optional)"><Area id="w-addr" rows={2} value={c.wedding.venueAddress} max={300} placeholder="Village / town, district, PIN" onChange={v => update('wedding', { venueAddress: v })} /></Field>
                <Field id="w-map" label="Google Maps link (optional)" hint="In Google Maps, tap Share and paste the link. Without it, directions use the address.">
                  <Text id="w-map" type="url" inputMode="url" value={c.wedding.mapUrl} max={500} placeholder="https://maps.app.goo.gl/…" onChange={v => update('wedding', { mapUrl: v })} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="w-dress" label="Dress code (optional)"><Text id="w-dress" value={c.wedding.dressCode} max={120} placeholder="e.g. Traditional, shades of red" onChange={v => update('wedding', { dressCode: v })} /></Field>
                  <Field id="w-note" label="A note for guests (optional)"><Text id="w-note" value={c.wedding.note} max={300} placeholder="e.g. Parking near the north gate" onChange={v => update('wedding', { note: v })} /></Field>
                </div>
              </div>
            )}

            {step === 'events' && (
              <div className="space-y-4">
                <StepHead hi="कार्यक्रम" en="Ceremonies">Every family’s rituals differ — add only the ones yours will hold, in your own words.</StepHead>
                <div className="flex flex-wrap gap-2">
                  {CEREMONY_PRESETS[lang].map(p => (
                    <button key={p.name} type="button" className="rounded-full border border-gold/50 bg-cream px-3 py-1.5 text-[13px] text-maroon hover:bg-paper-2 min-h-[36px]"
                      onClick={() => setEvents([...c.events, { id: newEventId(), name: p.name, icon: p.icon, date: c.wedding.date, time: '', venue: '', description: '' }])}>
                      + <span className="font-deva">{p.name}</span> <span className="text-ink-soft">{p.hint}</span>
                    </button>
                  ))}
                </div>
                {c.events.length === 0 && <p className="rounded-mj-sm bg-paper px-4 py-3 text-[14px] text-ink-soft">No ceremonies yet. Tap one above, or add your own below.</p>}
                <ol className="space-y-4">
                  {c.events.map((e, i) => {
                    const set = (patch: Partial<WeddingEvent>) => setEvents(c.events.map(x => (x.id === e.id ? { ...x, ...patch } : x)))
                    const move = (d: number) => {
                      const next = [...c.events]; const j = i + d
                      if (j < 0 || j >= next.length) return
                      ;[next[i], next[j]] = [next[j], next[i]]; setEvents(next)
                    }
                    return (
                      <li key={e.id} className="rounded-mj border border-gold/30 bg-paper px-4 py-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] uppercase tracking-[0.16em] text-terra font-semibold">Ceremony {i + 1}</span>
                          <span className="flex gap-1">
                            <button type="button" className="btn-ghost btn-sm !px-2.5" onClick={() => move(-1)} disabled={i === 0} aria-label={`Move ${e.name || 'ceremony'} up`}>↑</button>
                            <button type="button" className="btn-ghost btn-sm !px-2.5" onClick={() => move(1)} disabled={i === c.events.length - 1} aria-label={`Move ${e.name || 'ceremony'} down`}>↓</button>
                            <button type="button" className="btn-ghost btn-sm !px-2.5 text-error-fg" onClick={() => setEvents(c.events.filter(x => x.id !== e.id))} aria-label={`Delete ${e.name || 'ceremony'}`}>✕</button>
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
                          <Field id={`e-name-${e.id}`} label="Name"><Text id={`e-name-${e.id}`} value={e.name} max={60} placeholder="e.g. मटकोर" onChange={v => set({ name: v })} /></Field>
                          <Field id={`e-icon-${e.id}`} label="Symbol">
                            <select id={`e-icon-${e.id}`} className="select kd-input" value={e.icon} onChange={ev => set({ icon: ev.target.value as WeddingEvent['icon'] })}>
                              {ICONS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                            </select>
                          </Field>
                        </div>
                        <div className="grid gap-3 min-[420px]:grid-cols-2">
                          <Field id={`e-date-${e.id}`} label="Date"><input id={`e-date-${e.id}`} type="date" className="input kd-input" value={e.date} onChange={ev => set({ date: ev.target.value })} /></Field>
                          <Field id={`e-time-${e.id}`} label="Time"><input id={`e-time-${e.id}`} type="time" className="input kd-input" value={e.time} onChange={ev => set({ time: ev.target.value })} /></Field>
                        </div>
                        <Field id={`e-venue-${e.id}`} label="Venue (optional)"><Text id={`e-venue-${e.id}`} value={e.venue} max={120} onChange={v => set({ venue: v })} /></Field>
                        <Field id={`e-desc-${e.id}`} label="Description (optional)"><Area id={`e-desc-${e.id}`} rows={2} value={e.description} max={400} onChange={v => set({ description: v })} /></Field>
                      </li>
                    )
                  })}
                </ol>
                {c.events.length < 20 && (
                  <button type="button" className="btn-ghost w-full" onClick={() => setEvents([...c.events, { id: newEventId(), name: '', icon: 'other', date: c.wedding.date, time: '', venue: '', description: '' }])}>
                    + Add Ceremony
                  </button>
                )}
              </div>
            )}

            {step === 'message' && (
              <div className="space-y-5">
                <StepHead hi="संदेश आ कहानी" en="Welcome message & your story" />
                <fieldset>
                  <legend className="field-label">Welcome message</legend>
                  <div className="flex flex-wrap gap-2">
                    {([['mai', 'मैथिली'], ['hi', 'हिन्दी'], ['en', 'English'], ['sa', 'संस्कृत'], ['custom', 'Write my own']] as const).map(([lang, label]) => (
                      <button key={lang} type="button" aria-pressed={c.message.language === lang}
                        className={`rounded-full border px-3.5 py-1.5 text-[14px] min-h-[38px] ${c.message.language === lang ? 'border-maroon bg-maroon text-cream' : 'border-gold/40 bg-cream text-ink'}`}
                        onClick={() => {
                          const presets = Object.values(WELCOME_PRESETS)
                          const isPreset = !c.message.text || presets.includes(c.message.text) || LEGACY_PRESETS.includes(c.message.text)
                          if (lang === 'custom') { update('message', { language: 'custom', text: isPreset ? '' : c.message.text }); return }
                          if (!isPreset && !window.confirm('Replace your message with the ready-made one?')) return
                          update('message', { language: lang, text: WELCOME_PRESETS[lang] })
                        }}>
                        <span className={lang === 'en' || lang === 'custom' ? '' : 'font-deva'}>{label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <Field id="w-msg" label="Message (you can edit it)"><Area id="w-msg" rows={6} value={c.message.text} max={800} onChange={v => update('message', { text: v })} /></Field>
                <div className="border-t border-gold/20 pt-5">
                  <p className="font-deva text-[20px] text-maroon">❤️ हमर कहानी</p>
                  <p className="text-[13px] text-ink-soft mb-3">Optional. How you met, your journey, the engagement, a favourite memory — in any language.</p>
                  <Field id="w-stitle" label="Title (optional)"><Text id="w-stitle" value={c.story.title} max={80} placeholder="e.g. Two families, one story" onChange={v => update('story', { title: v })} /></Field>
                  <div className="mt-4"><Field id="w-story" label="Your story"><Area id="w-story" rows={8} value={c.story.text} max={3000} placeholder="Leave a blank line between paragraphs." onChange={v => update('story', { text: v })} /></Field></div>
                </div>
              </div>
            )}

            {step === 'mithila' && (
              <div className="space-y-5">
                <StepHead hi="🌺 हमर मिथिला" en="Your Mithila roots">
                  Entirely optional. Show only what your families are happy to share — each detail can be hidden with its switch.
                </StepHead>
                <Switch checked={c.mithila.enabled} onChange={v => update('mithila', { enabled: v })} label="Show a हमर मिथिला section on the invitation" />
                {c.mithila.enabled && (
                  <>
                    <Field id="w-mintro" label="A few words about your families’ Mithila (optional)"><Area id="w-mintro" rows={3} value={c.mithila.intro} max={500} onChange={v => update('mithila', { intro: v })} /></Field>
                    <div className="grid gap-5 md:grid-cols-2">
                      {(['bride', 'groom'] as const).map(side => (
                        <fieldset key={side} className="rounded-mj border border-gold/30 bg-paper p-4 space-y-3">
                          <legend className="px-1 font-deva text-[18px] text-maroon">{side === 'bride' ? 'वधू पक्ष' : 'वर पक्ष'} <span className="font-sans text-[13px] text-ink-soft">· {side === 'bride' ? 'Bride’s family' : 'Groom’s family'}</span></legend>
                          {MITHILA_FIELDS.map(f => {
                            const val = c.mithila[side][f.key]
                            const setVal = (patch: Partial<typeof val>) => update('mithila', { [side]: { ...c.mithila[side], [f.key]: { ...val, ...patch } } } as Partial<WeddingContent['mithila']>)
                            const id = `m-${side}-${f.key}`
                            return (
                              <div key={f.key}>
                                <div className="flex items-center justify-between gap-2">
                                  <label className="field-label !mb-1" htmlFor={id}><span className="font-deva normal-case tracking-normal text-[14px]">{f.hi}</span> · {f.label}</label>
                                  <button type="button" onClick={() => setVal({ show: !val.show })} aria-pressed={!val.show}
                                    className="text-[12px] text-ink-soft underline underline-offset-2 min-h-[32px]">{val.show ? 'Shown' : 'Hidden'}</button>
                                </div>
                                <input id={id} className={`input kd-input ${val.show ? '' : 'opacity-50'}`} value={val.value} maxLength={f.key === 'parivar' ? 160 : 80} placeholder={f.placeholder} onChange={e => setVal({ value: e.target.value })} />
                              </div>
                            )
                          })}
                        </fieldset>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 'family' && (
              <div className="space-y-4">
                <StepHead hi="परिवार" en="Family">Optional — the blessings and names families like to see on a card.</StepHead>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="w-bp" label="Bride’s parents"><Area id="w-bp" rows={2} value={c.family.brideParents} max={160} placeholder="e.g. Smt. Sunita & Shri Ramesh Jha" onChange={v => update('family', { brideParents: v })} /></Field>
                  <Field id="w-gp" label="Groom’s parents"><Area id="w-gp" rows={2} value={c.family.groomParents} max={160} placeholder="e.g. Smt. Rekha & Shri Mohan Mishra" onChange={v => update('family', { groomParents: v })} /></Field>
                </div>
                <Field id="w-fm" label="Other family members (optional)"><Area id="w-fm" rows={3} value={c.family.members} max={500} placeholder="Dadi, nana-nani, chacha-chachi…" onChange={v => update('family', { members: v })} /></Field>
                <Field id="w-fmsg" label="A family message (optional)"><Area id="w-fmsg" rows={3} value={c.family.message} max={500} placeholder="e.g. आपके आगमन की प्रतीक्षा में — समस्त परिवार" onChange={v => update('family', { message: v })} /></Field>
              </div>
            )}

            {step === 'share' && (
              <div className="space-y-6">
                <StepHead hi="सजाउ आ पठाउ" en="Choose a look, then share" />
                <fieldset>
                  <legend className="field-label">Theme</legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {WEDDING_THEMES.map(t => (
                      <button key={t.id} type="button" aria-pressed={theme === t.id} onClick={() => { setTheme(t.id); setResult(null) }}
                        className={`overflow-hidden rounded-mj-sm border-2 text-left transition ${theme === t.id ? 'border-maroon shadow-mj-sm' : 'border-transparent hover:border-gold/60'}`}>
                        <span className="block h-16" style={{ background: t.heroBg }}>
                          <span className="flex h-full items-center justify-center font-deva text-[18px]" style={{ color: t.id === 'modern-mithila' ? t.accent : t.gold }}>शुभ विवाह</span>
                        </span>
                        <span className="block bg-cream px-2.5 py-2">
                          <span className="block font-serif text-[15px] text-maroon leading-tight">{t.name}</span>
                          <span className="block text-[11px] text-ink-soft leading-snug">{t.tagline}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="rounded-mj border border-gold/30 bg-paper p-4 space-y-3">
                  <legend className="px-1 font-deva text-[18px] text-maroon">💌 उपस्थितिक पुष्टि <span className="font-sans text-[13px] text-ink-soft">· Guest replies</span></legend>
                  <Switch checked={c.rsvp.enabled} onChange={v => update('rsvp', { enabled: v })} label="Let guests reply on WhatsApp" />
                  {c.rsvp.enabled && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field id="w-phone" label="WhatsApp number for replies" hint="Visible to everyone who has the invitation link.">
                          <div className="flex">
                            <span className="inline-flex items-center rounded-l-mj-sm border border-r-0 border-paper-3 bg-paper-2 px-3 text-[15px] text-ink-soft">+91</span>
                            <input id="w-phone" className="input kd-input !rounded-l-none" inputMode="numeric" maxLength={10} value={c.rsvp.phone} placeholder="98765 43210"
                              onChange={e => update('rsvp', { phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                          </div>
                        </Field>
                        <Field id="w-contact" label="Whose number is it? (optional)"><Text id="w-contact" value={c.rsvp.contactName} max={60} placeholder="e.g. Ankit’s family" onChange={v => update('rsvp', { contactName: v })} /></Field>
                      </div>
                      <Field id="w-dead" label="Reply by (optional)"><input id="w-dead" type="date" className="input kd-input" value={c.rsvp.deadline} onChange={e => update('rsvp', { deadline: e.target.value })} /></Field>
                    </>
                  )}
                </fieldset>

                {!ready.ready && (
                  <p className="rounded-mj-sm bg-warning-soft px-4 py-3 text-[14px] text-warning-fg">
                    Still needed for the invitation: {ready.missing.join(', ')}.
                  </p>
                )}
                {error && <p className="rounded-mj-sm bg-error-soft px-4 py-3 text-[14px] text-error-fg" role="alert">{error}</p>}

                {!result ? (
                  <div className="space-y-3">
                    {pub && (
                      <p className="rounded-mj-sm bg-cream px-4 py-3 text-[13.5px] text-ink-soft">
                        Your link: <span className="break-all font-mono text-ink">mithilajodi.com{invitationPath(pub.slug)}</span>
                        <br />Saving updates this same link, so guests who already have it see the new version.
                      </p>
                    )}
                    {linkOutdated && (
                      <label className="flex items-start gap-2.5 rounded-mj-sm border border-gold/40 bg-paper px-4 py-3 text-[13.5px] text-ink">
                        <input type="checkbox" className="mt-0.5 accent-maroon" checked={renameLink} onChange={e => setRenameLink(e.target.checked)} />
                        <span>
                          Change the link to match the new details: <span className="break-all font-mono">{invitationPath(wantedStem)}</span>
                          <span className="block text-[12.5px] text-ink-soft">The current link will stop working — only tick this if you have not shared it yet.</span>
                        </span>
                      </label>
                    )}
                    <button type="button" className="kd-cta w-full" onClick={createLink} disabled={publishing}>
                      {publishing ? 'Saving…' : pub
                        ? <><span className="font-deva">निमंत्रण सहेजू</span> · Save my invitation</>
                        : <><span className="font-deva">निमंत्रण तैयार करू</span> · Create my invitation link</>}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-mj border-2 border-success/40 bg-success-soft/60 p-4 sm:p-5 space-y-4" role="status">
                    <p className="font-deva text-[22px] text-success-fg">अहाँक निमंत्रण तैयार अछि ❤️</p>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-success-fg">Your Invitation Link</p>
                      <p className="mt-1 break-all rounded-mj-sm bg-cream px-3 py-2 font-mono text-[14px] text-ink">{result.share.replace(/^https?:\/\//, '')}</p>
                    </div>
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                      <a className="btn text-center bg-[#1F7A47] text-white hover:bg-[#186A3C]" href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer">💚 WhatsApp पर निमंत्रण भेजू</a>
                      <button type="button" className="btn-ghost" onClick={() => copy(result.share, 'share')}>{copied === 'share' ? 'Link copied ✓' : 'Copy Link'}</button>
                      {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <button type="button" className="btn-ghost" onClick={() => navigator.share({ title: wt(lang, 'shareTitleNative', { couple }), text: waText, url: result.share }).catch(() => undefined)}>Share…</button>
                      )}
                      <a className="btn-ghost text-center" href={result.share} target="_blank" rel="noopener noreferrer">Open invitation ↗</a>
                    </div>
                    <div className="rounded-mj-sm bg-cream px-4 py-3">
                      <p className="text-[14px] font-semibold text-ink">Keep your private edit link</p>
                      <p className="mt-0.5 text-[13px] text-ink-soft leading-relaxed">
                        This is the only way to reopen and change your invitation from another phone — keep it to yourself.
                        Saved changes appear on the same invitation link. Your link stays open for 180 days from when it was made.
                      </p>
                      <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => copy(result.edit, 'edit')}>{copied === 'edit' ? 'Edit link copied ✓' : 'Copy edit link'}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step controls */}
          <div className="sticky bottom-16 lg:bottom-4 z-20 mt-5 flex items-center justify-between gap-2 rounded-full border border-gold/30 bg-cream/95 p-2 shadow-mj-sm backdrop-blur">
            <button type="button" className="btn-ghost btn-sm" disabled={idx === 0} onClick={() => go(STEPS[idx - 1].key)}>← Back</button>
            <button type="button" className="btn-ghost btn-sm lg:hidden" onClick={() => setPreviewOpen(true)}>Preview</button>
            <span className="hidden lg:inline text-[12px] text-ink-soft" aria-live="polite">{saved === 'saved' ? 'Draft saved on this device' : ''}</span>
            {idx < STEPS.length - 1 ? (
              <button type="button" className="btn-primary btn-sm" onClick={() => go(STEPS[idx + 1].key)}>{idx === 0 || idx === 1 ? 'Next →' : 'Next / Skip →'}</button>
            ) : (
              <button type="button" className="btn-ghost btn-sm" onClick={startOver}>Start over</button>
            )}
          </div>
        </div>

        {/* ── Live preview (desktop) ── */}
        <aside className="hidden lg:block lg:sticky lg:top-24" aria-label="Live preview">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[12px] uppercase tracking-[0.2em] text-terra font-semibold">Live preview</p>
            {watchOpening}
          </div>
          {preview}
        </aside>
      </div>

      {/* ── Full-screen preview (phones) ── */}
      {previewOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#2B211C] lg:hidden" role="dialog" aria-modal="true" aria-label="Invitation preview">
          <div className="flex items-center justify-between px-4 py-3 text-cream">
            <span className="flex items-center gap-3"><span className="text-[13px] uppercase tracking-[0.18em]">Preview</span>
              <button type="button" className="rounded-full border border-cream/50 px-3 py-1.5 text-[13px]" onClick={() => setOpeningRun(n => n + 1)}>✉️ Opening</button></span>
            <button type="button" className="rounded-full bg-cream px-4 py-2 text-[14px] font-semibold text-maroon" onClick={() => setPreviewOpen(false)}>Close</button>
          </div>
          <div data-wd-scroll className="relative flex-1 overflow-y-auto overscroll-contain bg-white [transform:translateZ(0)]">
            {site}
          </div>
        </div>
      )}
    </div>
  )
}
