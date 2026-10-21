'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { PartnerPreferencesDisplay } from '@/types/profile'

/**
 * A member's profile, told as their own story — one chapter per part of their
 * life, each arriving as it scrolls into view: a namaste, what they studied,
 * where they work, where they live (on an abstract radar map with you on it),
 * their roots, their gotra, family and lifestyle, in their own words.
 *
 * It shows nothing the member page does not already show: the same fields,
 * the same photo rule (`photo` is null when photos are withheld). Comparisons
 * with the viewer come pre-computed from the server as rounded distances and
 * yes/no answers; the map receives positions inside its own frame, never
 * coordinates. A chapter appears only when its field is filled in.
 *
 * Motion is a reveal per chapter and small looping details (a bowing namaste,
 * a pulsing pin). prefers-reduced-motion shows everything at once, still.
 */

export type StoryData = {
  hasViewer: boolean
  viewerGender: string | null
  distanceKm: number | null
  sameCity: boolean
  nativeDistanceKm: number | null
  sameNative: boolean
  nativeToHomeKm: number | null
  sameGotra: boolean
  pins: Array<{ kind: string; x: number; y: number }>
}

export type StoryProfile = {
  display_name: string
  age: number | null
  gender: string
  height_cm: number | null
  photo: string | null
  degree: string | null
  specialization: string | null
  institution: string | null
  passing_year: number | null
  education_detail: string | null
  job_title: string | null
  profession_detail: string | null
  employer: string | null
  industry: string | null
  experience_years: number | null
  current_loc_name: string | null
  native_place_name: string | null
  job_loc_name: string | null
  gram: string | null
  self_gotra: string | null
  maternal_gotra: string | null
  mool: string | null
  caste: string | null
  family_type: string | null
  family_values: string | null
  parents_info: string | null
  siblings_info: string | null
  diet: string | null
  mother_tongue: string | null
  marital_status: string | null
  about_me: string | null
}

const nice = (v: string | null | undefined) => (v ? v.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : null)
const kmText = (d: number) => `${d.toLocaleString('en-IN')} km`

/** True once the element has scrolled into view (and stays true). */
function useArrived<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [inn, setIn] = useState(false)
  useEffect(() => {
    if (inn) return
    // A rect check on scroll rather than IntersectionObserver — the same choice
    // as the site's reveal driver, which found observers unreliable.
    const check = () => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight * 0.86 && r.bottom > 0) setIn(true)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    const t = window.setTimeout(check, 300)
    return () => { window.removeEventListener('scroll', check); window.removeEventListener('resize', check); window.clearTimeout(t) }
  }, [inn])
  return [ref, inn]
}

/** Words that rise one after another. */
function Kinetic({ children, on, className = '' }: { children: string; on: boolean; className?: string }) {
  return (
    <span className={`mj-st-kin ${on ? 'is-on' : ''} ${className}`}>
      {children.split(' ').map((w, i) => <span key={i} style={{ '--w': i } as React.CSSProperties}>{w}&nbsp;</span>)}
    </span>
  )
}

function Chapter({ n, label, children, art }: { n: number; label: string; children: (on: boolean) => ReactNode; art?: (on: boolean) => ReactNode }) {
  const [ref, on] = useArrived<HTMLElement>()
  return (
    <section ref={ref} className={`mj-st-ch ${on ? 'is-on' : ''}`} aria-label={label}>
      <p className="mj-st-idx"><span>{String(n).padStart(2, '0')}</span>{label}</p>
      <div className="mj-st-body">{children(on)}</div>
      {art && <div className="mj-st-art" aria-hidden="true">{art(on)}</div>}
    </section>
  )
}

/** Folded hands that bow, with a few gold sparks. */
function Namaste() {
  return (
    <span className="mj-st-namaste" aria-hidden="true">
      <span className="mj-st-bow">🙏</span>
      <i /><i /><i />
    </span>
  )
}

function CountUp({ to, on }: { to: number; on: boolean }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!on) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(to); return }
    let i = 0
    const steps = Math.min(30, Math.max(8, to * 3))
    const id = window.setInterval(() => { i++; setV(Math.round((to * i) / steps)); if (i >= steps) window.clearInterval(id) }, 40)
    return () => window.clearInterval(id)
  }, [on, to])
  return <>{v}</>
}

const PIN: Record<string, { label: string; color: string }> = {
  home: { label: 'Lives here', color: '#7A1220' },
  native: { label: 'Native place', color: '#B98A2E' },
  work: { label: 'Works here', color: '#4E6B3A' },
  you: { label: 'You', color: '#2E3A6E' },
}

function RadarMap({ story, names, on }: { story: StoryData; names: Record<string, string | null>; on: boolean }) {
  const W = 320, H = 230
  const at = (k: string) => story.pins.find(p => p.kind === k)
  const P = (q: { x: number; y: number }) => [Math.round(q.x * W), Math.round(q.y * H)] as const
  const home = at('home'), you = at('you'), native = at('native'), work = at('work')
  const centre = home ?? story.pins[0]
  const [cx, cy] = centre ? P(centre) : [W / 2, H / 2]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`mj-st-map ${on ? 'is-on' : ''}`} role="img" aria-label="A map of their places, and yours">
      <defs>
        <pattern id="stGrid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#B98A2E" strokeOpacity=".12" /></pattern>
      </defs>
      <rect width={W} height={H} rx="18" fill="#FFFDF8" />
      <rect width={W} height={H} rx="18" fill="url(#stGrid)" />
      {[34, 70, 110].map(r => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#B98A2E" strokeOpacity=".3" strokeDasharray="2 5" />)}
      <g className="mj-st-sweep" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <path d={`M${cx} ${cy}L${cx + 120} ${cy}A120 120 0 0 0 ${cx + 104} ${cy - 60}Z`} fill="#E9C977" opacity=".16" />
      </g>
      {/* lines from home to the other places */}
      {home && [native, work, you].map((q, i) => q && (() => {
        const [x, y] = P(q)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="mj-st-line" stroke={q === you ? '#2E3A6E' : '#B98A2E'} strokeWidth="1.4" strokeDasharray="5 4" />
      })())}
      {story.pins.map(q => {
        const [x, y] = P(q), m = PIN[q.kind]
        const name = q.kind === 'you' ? 'You' : names[q.kind]
        const right = x < W - 100
        return (
          <g key={q.kind} className="mj-st-pin">
            <circle cx={x} cy={y} r="12" fill={m.color} opacity=".14" className="mj-st-pulse" style={{ transformOrigin: `${x}px ${y}px` }} />
            <circle cx={x} cy={y} r="5.5" fill={m.color} stroke="#FFFDF8" strokeWidth="2" />
            <text x={right ? x + 11 : x - 11} y={y - 3} textAnchor={right ? 'start' : 'end'} fontSize="10.5" fontWeight="600" fill="#2A1A16">{name}</text>
            <text x={right ? x + 11 : x - 11} y={y + 9} textAnchor={right ? 'start' : 'end'} fontSize="9" fill="#6B5A50">{q.kind === 'you' ? 'where you live' : m.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function ProfileStory({ p, story, prefs = null }: { p: StoryProfile; story: StoryData | null; prefs?: PartnerPreferencesDisplay | null }) {
  const first = p.display_name.split(' ')[0]
  const [speaking, setSpeaking] = useState(false)
  const [canSpeak, setCanSpeak] = useState(false)
  useEffect(() => { setCanSpeak(typeof window !== 'undefined' && 'speechSynthesis' in window) }, [])
  useEffect(() => () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel() }, [])

  const s = story
  const studied = p.degree || p.education_detail
  const works = p.job_title || p.profession_detail || p.employer
  const lifestyle = [p.diet, p.mother_tongue ? `Speaks ${p.mother_tongue}` : null, nice(p.marital_status)].filter(Boolean) as string[]
  const family = [nice(p.family_type) ? `${nice(p.family_type)} family` : null, nice(p.family_values) ? `${nice(p.family_values)} values` : null].filter(Boolean) as string[]

  const lookingFor = (prefs ? ([
    ['Age', prefs.ageRange], ['Looking for', prefs.lookingFor], ['Community', prefs.community], ['Marital status', prefs.maritalStatus],
    ['Education', prefs.education], ['Work', prefs.profession], ['Career', prefs.career], ['Location', prefs.location], ['Diet', prefs.diet],
    ['Marriage', prefs.marriageTimeline], ['Manglik', prefs.manglik], ['Children', prefs.children], ['Living', prefs.livingArrangement],
  ] as Array<[string, string | null]>) : []).filter((x): x is [string, string] => !!x[1])

  // The intro, read aloud on request — built only from what the chapters show.
  const intro = [
    `Namaste, I'm ${first}.`,
    studied ? `I studied ${[p.degree, p.specialization].filter(Boolean).join(' in ') || p.education_detail}${p.institution ? ` at ${p.institution}` : ''}.` : '',
    works ? `I work${p.job_title ? ` as ${p.job_title}` : ''}${p.employer ? ` at ${p.employer}` : ''}.` : '',
    p.current_loc_name ? `I live in ${p.current_loc_name}.` : '',
    p.native_place_name ? `My native place is ${p.native_place_name}.` : '',
    p.self_gotra ? `My gotra is ${p.self_gotra}.` : '',
  ].filter(Boolean).join(' ')
  function speak() {
    const ss = window.speechSynthesis
    if (speaking) { ss.cancel(); setSpeaking(false); return }
    const u = new SpeechSynthesisUtterance(intro)
    const v = ss.getVoices().find(x => x.lang === 'en-IN') ?? ss.getVoices().find(x => x.lang.startsWith('en'))
    if (v) u.voice = v
    u.lang = v?.lang ?? 'en-IN'
    u.rate = 0.95
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    ss.cancel(); ss.speak(u); setSpeaking(true)
  }

  let n = 0
  const next = () => ++n

  return (
    <div className="mj-story">
      {/* ── Namaste ── */}
      <Chapter n={next()} label="Namaste" art={() => (
        <div className="mj-st-arch">
          {p.photo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={p.photo} alt="" />
            : <span className="mj-st-mono">{first[0]?.toUpperCase()}</span>}
        </div>
      )}>
        {on => (
          <>
            <div className="flex items-center gap-3">
              <Namaste />
              <p className="font-deva text-[22px] text-[#9A6F1E]" lang="hi">नमस्ते</p>
            </div>
            <h2 className="mj-st-big"><Kinetic on={on}>{`I'm ${first}.`}</Kinetic></h2>
            <p className="mj-st-sub">{[p.age ? `${p.age} years` : null, p.height_cm ? `${p.height_cm} cm` : null, p.caste].filter(Boolean).join(' · ')}</p>
            {canSpeak && (
              <button type="button" onClick={speak} className="mj-st-voice" aria-pressed={speaking}>
                <span aria-hidden="true">{speaking ? '■' : '🔊'}</span> {speaking ? 'Stop' : `Hear ${first}'s intro`}
              </button>
            )}
          </>
        )}
      </Chapter>

      {/* ── Studies ── */}
      {studied && (
        <Chapter n={next()} label="Studies" art={on => (
          <svg viewBox="0 0 120 80" className="mj-st-cap-art">
            <g className={`mj-st-cap ${on ? 'is-on' : ''}`}>
              <path d="M60 14 104 32 60 50 16 32Z" fill="#7A1220" />
              <path d="M34 40v14c8 8 44 8 52 0V40L60 50Z" fill="#5A0E19" />
              <path d="M98 34v18" stroke="#B98A2E" strokeWidth="2" /><circle cx="98" cy="54" r="3" fill="#E9C977" />
            </g>
          </svg>
        )}>
          {on => (
            <>
              <h2 className="mj-st-big"><Kinetic on={on}>{`I did my ${p.degree || p.education_detail}`}</Kinetic></h2>
              {(p.specialization || p.institution) && <p className="mj-st-sub">{[p.specialization, p.institution].filter(Boolean).join(' · ')}</p>}
              {p.passing_year && (
                <div className="mj-st-timeline"><span className="mj-st-tl-bar" /><span className="mj-st-tl-dot" /><span className="mj-st-tl-year">{p.passing_year}</span></div>
              )}
            </>
          )}
        </Chapter>
      )}

      {/* ── Work ── */}
      {works && (
        <Chapter n={next()} label="Work" art={on => p.experience_years ? (
          <div className="mj-st-counter"><b><CountUp to={p.experience_years} on={on} /></b><span>years of<br />experience</span></div>
        ) : null}>
          {on => (
            <>
              <h2 className="mj-st-big"><Kinetic on={on}>{p.job_title ? `I work as ${p.job_title}` : `I work${p.employer ? ` at ${p.employer}` : ` in ${p.profession_detail}`}`}</Kinetic></h2>
              <p className="mj-st-sub">{[p.job_title && p.employer ? `at ${p.employer}` : null, p.industry, p.job_loc_name ? `in ${p.job_loc_name}` : null].filter(Boolean).join(' · ')}</p>
            </>
          )}
        </Chapter>
      )}

      {/* ── Home, on the map ── */}
      {p.current_loc_name && (
        <Chapter n={next()} label="Home" art={on => s && s.pins.length > 0 ? (
          <RadarMap story={s} on={on} names={{ home: p.current_loc_name, native: p.native_place_name, work: p.job_loc_name }} />
        ) : null}>
          {on => (
            <>
              <h2 className="mj-st-big"><Kinetic on={on}>{`I live in ${p.current_loc_name}`}</Kinetic></h2>
              {s?.hasViewer && (s.sameCity
                ? <p className="mj-st-callout">📍 We live in the same city!</p>
                : s.distanceKm != null && <p className="mj-st-callout">📍 Hey, we&rsquo;re just about {kmText(s.distanceKm)} apart</p>)}
            </>
          )}
        </Chapter>
      )}

      {/* ── Roots ── */}
      {(p.native_place_name || p.gram) && (
        <Chapter n={next()} label="Roots" art={() => (
          <svg viewBox="0 0 120 80" className="mj-st-hut">
            <path d="M22 70V44h76v26Z" fill="#F1DDB4" stroke="#3B0D12" strokeWidth="1.6" />
            <path d="M12 46C30 44 44 18 60 12c16 6 30 32 48 34-12 3-84 3-96 0Z" fill="#C79A55" stroke="#3B0D12" strokeWidth="1.6" />
            <path d="M52 70V54c0-6 16-6 16 0v16" fill="#3B1A12" />
            <path d="M22 66h76" stroke="#A3202A" strokeWidth="3" />
          </svg>
        )}>
          {on => (
            <>
              <h2 className="mj-st-big"><Kinetic on={on}>{`My roots are in ${p.native_place_name ?? p.gram}`}</Kinetic></h2>
              <p className="mj-st-sub">{[p.gram && p.native_place_name ? `Gram ${p.gram}` : null, s?.nativeToHomeKm ? `${kmText(s.nativeToHomeKm)} from where I live now` : null].filter(Boolean).join(' · ')}</p>
              {s?.hasViewer && (s.sameNative
                ? <p className="mj-st-callout">🏡 Our native places are the same!</p>
                : s.nativeDistanceKm != null && <p className="mj-st-callout">🏡 Our native places are about {kmText(s.nativeDistanceKm)} apart</p>)}
            </>
          )}
        </Chapter>
      )}

      {/* ── Gotra ── */}
      {p.self_gotra && (
        <Chapter n={next()} label="Gotra" art={on => (
          <div className={`mj-st-gotra ${on ? 'is-on' : ''}`}><span>{p.self_gotra}</span></div>
        )}>
          {on => (
            <>
              <h2 className="mj-st-big"><Kinetic on={on}>{`I'm from ${p.self_gotra} gotra`}</Kinetic></h2>
              <p className="mj-st-sub">{[p.mool ? `Mool: ${p.mool}` : null, p.maternal_gotra ? `Maternal gotra: ${p.maternal_gotra}` : null].filter(Boolean).join(' · ')}</p>
              {s?.hasViewer && (s.sameGotra ? (
                <p className="mj-st-callout is-warn">
                  😅 Same gotra as you — in Mithila tradition that makes us <b>bhai-behen</b>.
                  <span className="block text-[12.5px] font-normal opacity-80">Sagotra matches are traditionally avoided.</span>
                </p>
              ) : <p className="mj-st-callout">✓ A different gotra from yours</p>)}
            </>
          )}
        </Chapter>
      )}

      {/* ── Family & life ── */}
      {(family.length > 0 || p.parents_info || p.siblings_info || lifestyle.length > 0) && (
        <Chapter n={next()} label="Family & life">
          {on => (
            <>
              <h2 className="mj-st-big"><Kinetic on={on}>My family and my ways</Kinetic></h2>
              {[...family, ...lifestyle].length > 0 && (
                <ul className="mj-st-chips">{[...family, ...lifestyle].map(c => <li key={c}>{c}</li>)}</ul>
              )}
              {p.parents_info && <p className="mj-st-line">{p.parents_info}</p>}
              {p.siblings_info && <p className="mj-st-line">{p.siblings_info}</p>}
            </>
          )}
        </Chapter>
      )}

      {/* ── Looking for: their partner preferences, as they stated them.
             (gotraSafe is left out — it is true for everyone by default.) */}
      {lookingFor.length > 0 && (
        <Chapter n={next()} label="Looking for" art={on => (
          <svg viewBox="0 0 120 80" className={`mj-st-jodi ${on ? 'is-on' : ''}`}>
            <circle className="mj-st-jodi-a" cx="48" cy="40" r="24" fill="none" stroke="#7A1220" strokeWidth="2" />
            <circle className="mj-st-jodi-b" cx="72" cy="40" r="24" fill="none" stroke="#B98A2E" strokeWidth="2" />
            <path className="mj-st-jodi-h" d="M60 50c-5-3.6-8-6.4-8-9.6a4 4 0 0 1 8-1.6 4 4 0 0 1 8 1.6c0 3.2-3 6-8 9.6Z" fill="#A3202A" />
          </svg>
        )}>
          {on => (
            <>
              <h2 className="mj-st-big"><Kinetic on={on}>{"I'm hoping to meet someone"}</Kinetic></h2>
              <dl className="mj-st-prefs">
                {lookingFor.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
              {prefs?.notes && <p className="mj-st-line italic">&ldquo;{prefs.notes}&rdquo;</p>}
            </>
          )}
        </Chapter>
      )}

      {/* ── In my words ── */}
      {p.about_me && (
        <Chapter n={next()} label="In my words">
          {() => <blockquote className="mj-st-quote">&ldquo;{p.about_me}&rdquo;</blockquote>}
        </Chapter>
      )}

      <p className="mj-st-end">That&rsquo;s my story <span aria-hidden="true">🙏</span></p>
    </div>
  )
}
