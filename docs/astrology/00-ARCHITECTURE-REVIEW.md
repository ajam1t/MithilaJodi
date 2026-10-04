# Astrology Tools — Architecture Review (pre-implementation)

Response to the Master Product Vision & Architecture Brief. **Nothing implemented.**
Verified against the codebase and live DB on 2026-10-02.

---

## 1. CURRENT ARCHITECTURE RELEVANT TO THIS PROJECT

Next.js 15.4 App Router · React 19 · TS 5.7 · Tailwind 3.4 · Supabase (Postgres, `qhoebuzwmopivrujbnif`, ap-south-1) · Vercel (`rootDirectory: apps/web`, auto-deploy from `main` on remote **`mithila`**).

Full dependency list — deliberately minimal: `@supabase/ssr`, `@supabase/supabase-js`, `bcryptjs`, `clsx`, `nanoid`, `react-markdown`, `remark-gfm`, `tailwind-merge`, `zod`.
**No Framer Motion, no Lottie, no date/timezone lib, no chart lib, no ephemeris, no PDF lib.**

```
apps/web/src/
  app/        (auth) (main) admin legal + public routes at root; ~90 /api routes
  components/ ui/ motion/ home/ biodata/ festivals/ invitation/ music/ pwa/ whatsapp/
  lib/        auth.ts session.ts seo.ts constants.ts matchScore.ts biodata.ts
              supabase/{server,client}.ts utils/cn.ts hooks/ services/
  styles/globals.css
```

**Page pattern to follow** (`/marriage-biodata`, `/marriage-invitation` — the two existing free public tools): server component owns `metadata` + JSON-LD; a sibling `'use client'` component owns all interactivity. Public, no login.

**Authorization**: custom session auth (cookie `mj-session`, `account_sessions.token_hash = sha256(token)`); `getSessionAccount()` in `lib/auth.ts`. Nearly every route uses the service-role client, so **application code is the only authorization layer** — RLS is not a backstop.

### Precedent that matters most: a staged cinematic already exists

`components/home/hero/HeroCinematic.tsx` + `heroStages.ts` is a working, shipped version of exactly the animation architecture §11 of the brief describes:

- A single ordered timeline table (`HERO_TIMELINE: {stage, at}[]`) is the only source of truth; the orchestrator schedules one timer per row and clears them together on unmount.
- Stage is published as a `data-stage` attribute; CSS keyframes read it. No per-element JS animation.
- **Every stage's animation ends in its final resting position**, so jumping straight to `final` is always safe.
- `prefers-reduced-motion` and a `sessionStorage` "already seen" flag both short-circuit to the finished state on the first client effect.
- The score counter ticks in **discrete steps**, not a rAF tween — precisely the `01 → 03 → 06 → 10 → 15 → 21 → 28 → 32` read-out the brief asks for.
- **The animation never gates content**: headline, tagline and CTAs are server-rendered *outside* the cinematic and are clickable from first paint.

That last property is the one to carry into Kundli Match. It satisfies §24 by construction.

## 2. EXISTING NAVIGATION STRUCTURE

Three arrays, all in `components/home/`:

**`MithilaHeader.tsx` → `NAV_LINKS`** (public, desktop + hamburger):
`/` Home · `/about` About · `/marriage-biodata` Marriage Biodata · `/festivals` Festivals · `/festival-songs` Songs · `/marriage-invitation` Invitation · `/blogs` Blogs · `/contact` Contact · `/help` Help
Plus a separate authed array (`/search /messages /interests /shortlists /biodata /profile`).

**`MithilaFooter.tsx` → `GROUPS`** — 3 groups: Platform / Tools & Help / Legal. Tools belong in group 2.

**`MobileBottomNav.tsx`** — two 5-slot variants chosen by `useAuthState()`:
- public: `/` Home · `/marriage-biodata` Create Biodata · `/register` Join *(CTA, `flex-[1.3]`, maroon)* · `/explore` Search Profiles · **`/blogs` Blog**
- authed: `/` · `/search` · `/messages` *(CTA)* · `/interests` · `/profile`

Inline SVGs per tab, with separate filled/outline variants for active state.

> **Finding for the nav change in §2 of the brief:** `/blogs` is **already** in `NAV_LINKS`, i.e. already in the hamburger. So "move Blog into the hamburger" requires **no addition** — only replacing the 5th bottom-nav slot with Astrology. Lower risk than the brief assumes. Desktop header is already at 9 links and near capacity, so Astrology should go in as a single `/astrology` entry (a hub), not 8 tool links.

## 3. EXISTING REUSABLE COMPONENTS

`components/ui/` (barrel `index.ts`): `Button Input Field Badge Chip Modal Tabs Toast Skeleton Spinner EmptyState SectionHeading`.

Directly relevant to this project:

| Asset | Relevance |
|---|---|
| `components/home/hero/{HeroCinematic,heroStages}` | the staged-cinematic pattern (§1 above) — reuse for the cosmic sequence |
| `components/motion/RevealOnScroll` | per-element `data-mj-armed` + pathname-keyed IntersectionObserver; reduced-motion aware. Use for result-section reveals |
| `components/motion/PointerGlow` | pointer-reactive glow, gated on `(hover:hover) and (pointer:fine)` + reduced-motion |
| `components/biodata/BiodataDocument` + `window.print()` + `@media print` | **the entire PDF story** — no PDF library in the repo. Precedent in `marriage-biodata/BiodataBuilder.tsx:265` and `biodata/preview/[id]` |
| `components/LocationPicker` | typeahead over `/api/locations`, plus PIN → place via `/api/pincode` |
| `components/ShareProfileLinks` + `app/p/[token]` | tokenised share-link UX end to end |
| `MasterCombo` | the searchable master-data dropdown — **not extracted**, lives inside `app/(main)/profile/edit/page.tsx`. Extract to `components/ui/` if astrology forms need it |

## 4. EXISTING STYLING SYSTEM

`tailwind.config.ts` tokens — already the palette §12 asks for:
`paper #FCF5E7` (+`paper-2 #F7EBD3`, `paper-3 #ECDCC0`) · `cream #FFFAF0` · `maroon #7A1220` (+`maroon-2 #9B2233`, `maroon-deep #5A0E19`) · `terra #B34A24` · `marigold #E8912A` · `turmeric #D6A83C` · `gold #B98A2E` (+`gold-lt #E4C572`) · `green #1F5133` · `indigo #2E3A6E` · `ink #2B211C` (+`ink-soft #6A5A4E`) · semantic `success/warning/error/info` each with `.soft`/`.fg`.

Ivory/cream, deep maroon, muted gold and warm beige are all present. **The one thing §12 asks for that does not exist is a dark cosmic ground** — `indigo #2E3A6E` is the closest and is currently used only for `info`. A cosmic palette (2–3 tokens) is the single addition needed.

Fonts: `font-serif` Marcellus (elegant serif headings — as specified) · `font-sans` Mukta · `font-display` Rozha One · `.font-deva` for Devanagari.

`globals.css` classes to reuse rather than restyle: `.btn .btn-primary .btn-gold .btn-terra .btn-ghost .btn-sm .card .card-hover .input .select .textarea .field-label .field-hint .field-error .chip .badge .badge-gold .eyebrow .section-heading .ornament-line .gold-strip .wrap .prose-mj`. Radii/shadows `rounded-mj`, `rounded-pill`, `shadow-mj-*` are **safelisted** in the config because `globals.css` `@apply`s them.

Motion primitives already present: `.mj-lift .mj-zoom .mj-shine .mj-glow .mj-line .mj-page-enter .fade-up .float-anim .flame-anim .petal .gold-shimmer`.

**Reduced motion** is handled globally at `globals.css:245` — `*` animation-duration/transition-duration → `0.01ms !important`, iteration-count → 1. Consequences: (a) any CSS-driven cosmic stage must *end* in its resting state, or reduced-motion users land on a broken composition; (b) the global rule **does not touch canvas/rAF work**, so a canvas starfield must check `matchMedia` in JS itself — as `HeroCinematic`, `PointerGlow`, `ReadingProgress` and `RevealOnScroll` all already do.

## 5. EXISTING SUPABASE STRUCTURE RELEVANT TO ASTROLOGY

39 tables. Relevant subset:

**Astrology fields already exist on profiles** (capture only — no calculation anywhere):

| Table | Columns |
|---|---|
| `profile_private` | `rashi`, `nakshatra`, **`mangalik`**, `birth_time` (text), `birth_place` (text), `kundli_url` (text, **0 rows used**) |
| `profile_preferences` | `pref_manglik` (text), `pref_gotra_safe` (bool NOT NULL) |
| `profiles` | `self_gotra`, `maternal_gotra`, `mool`, dob, gender |

**Controlled vocabulary — `community_masters`** `(id, type, value, label_en, label_hi, label_mai, is_mithila, sort_order, is_active)`. Both astrology vocabularies are complete and canonically ordered; **the engine must emit these exact `value` slugs** or tool output will disagree with stored profile data and generated biodata:

- `rashi` (12, sort 1–12): `mesh vrishabh mithun kark simha kanya tula vrishchik dhanu makar kumbh meen`
- `nakshatra` (27, sort 1–27): `ashwini bharani krittika rohini mrigashira ardra punarvasu pushya ashlesha magha purva_phalguni uttara_phalguni hasta chitra swati vishakha anuradha jyeshtha mula purva_ashadha uttara_ashadha shravana dhanishta shatabhisha purva_bhadrapada uttara_bhadrapada revati`
- `manglik` (4): `no | yes | anshik | unknown` (labels `No / Yes / Anshik (Partial) / Don't Know`)
- `manglik_pref` (3) · also `gotra` (34), `mool` (146), `maithil_mool_gotra` (164 rows: `mool_value → gotra_value`)

No `pada` vocabulary exists — it would be new (padas are 1–4, so an integer is likely better than master data).

**Geography — `india_locations`** `(id, parent_id, level, name_en, name_hi, name_mai, state_code, pincode, is_mithila_region, latitude, longitude)`. **It already has coordinates**, coverage by level: country 1/1 · state 36/36 · district 38/40 · city 161/161. Total 238 rows. `pincode_lookups` caches PIN → state/district/places from a third party and holds **no coordinates**. **No timezone column exists anywhere in the schema.**

**Share-link pattern — `profile_shares`** `(id, profile_id, token, label, fields jsonb, expires_at, revoked_at, view_count, last_viewed_at, …)` + `record_share_view(p_token)` (SECURITY DEFINER, `search_path=public`, EXECUTE revoked from PUBLIC/anon/authenticated) + route `app/p/[token]`. This is the model for a shareable Kundli result: opaque token, a `fields` jsonb projection, explicit expiry and revocation, and server-side view counting.

**Match scoring — `lib/matchScore.ts`.** `WEIGHTS` sum to 100: `location 18, gotra 14, age 14, community 12, lifestyle 10, timeline 10, roots 8, education 8, family 6`. Two existing stances the astrology work must respect or explicitly overturn:
- **Manglik is reported, never scored** — the in-code reason is that the two sides record it too inconsistently for scoring to be signal.
- **Gotra is a gate, not a score** — identical self-gotra is a `blocker` that caps the score at `BLOCKED_CEILING = 40`.

**Editorial content already ranking**: `horoscope-marriage` category with 4 posts — `kundli-matching-explained`, `what-is-manglik`, `what-is-nakshatra`, `what-is-rashi`. These are the natural internal-link partners for `/astrology/*`.

### ⚠️ Two data facts that change the plan

1. **Stored astrology data is effectively empty.** Of 22 `profile_private` rows: `birth_time` 1, `birth_place` 3, `nakshatra` 1, `rashi` 4, `kundli_url` 0. Any feature that *reads members'* astrology data will look broken. Tools that *compute from typed input* are unaffected — another argument for the stateless public-tool shape.
2. **Spelling trap**: stored field is `profile_private.mangalik` (**-a-**); the preference is `pref_manglik` and the master-data type is `manglik` (**no -a-**). Both are live. Do not "fix" either without a migration plus updates to `matchScore.ts`, `profile/edit`, `admin/ProfileEditor`, `lib/biodata.ts`, `api/profile`, `api/account/export`.

## 6. RECOMMENDED ARCHITECTURE FOR THE ASTROLOGY ECOSYSTEM

### 6.1 Layering — enforced by directory, not by convention

The brief's `INPUT → ASTRONOMICAL → VEDIC → RULES → RESULT → UI` becomes:

```
lib/astrology/
  ephemeris/      ← ONLY place that computes planetary positions
    provider.ts     interface EphemerisProvider (the swap seam)
    <impl>.ts       chosen implementation (decision D2)
  vedic/          ← pure transforms on ephemeris output
    ayanamsha.ts  sidereal.ts  rashi.ts  nakshatra.ts  pada.ts  lagna.ts
  rules/          ← pure, data-driven, independently testable
    ashtakoota/   varna vashya tara yoni grahaMaitri gana bhakoot nadi
    manglik.ts    doshaCancellation.ts
    tables/       *.json  (the traditional lookup tables, data not code)
  methodology.ts  ← the frozen, documented ruleset (decision D1)
  types.ts        ← BirthInput, ChartData, KootaScore, MatchResult
```

Hard rules:
- Everything under `lib/astrology/` is **pure and framework-free**: no React, no `fetch`, no Supabase, no `Date.now()`, no `Math.random()`. Same input → same output, forever.
- **`rules/` may not import `ephemeris/`.** It consumes `ChartData`. That is what makes the rules testable against fixtures without an ephemeris.
- Traditional lookup tables (Varna by rashi, Yoni by nakshatra, Gana, Nadi, Tara counts, Graha Maitri lord friendships) live in `rules/tables/*.json` as **data**, so they are reviewable by a domain expert who does not read TypeScript.
- `methodology.ts` exports a single frozen `METHODOLOGY` object naming every choice (ayanamsha, node type, house system, manglik variant, dosha-cancellation set) **and a version string**. Every stored or shared result records that version, so a later rule change can never silently alter an already-shared result.

### 6.2 The presentation seam (§26 — calculation must not be determinable by UI)

```
POST /api/astrology/kundli-match   →  MatchResult (complete, authoritative)
       ↓
client holds the full result, then plays the cosmic sequence over it
```

The result is computed **first and in full**, server-side, in one request. The animation then *replays* known values. This makes "the animation fabricates results" structurally impossible, and it means a Skip control can reveal the real result instantly at any point — which is also how §24 is satisfied.

Reject the alternative (stream per-koota results to drive the animation): it couples timing to the network and makes a skip button hard.

Compute server-side rather than in the browser so the ephemeris bundle never ships to mobile clients, and so the methodology can be corrected without waiting for cache eviction.

### 6.3 Routes

`/astrology` hub + `/astrology/{kundli-match,nakshatra,manglik,janam-kundli,rashi,vivah-muhurat,baby-names,compatibility}` — each its own server component with `pageMetadata()` + `webAppJsonLd()` + `breadcrumbJsonLd()` + `organizationRef()` from `lib/seo.ts`. One shared `ComingSoon` component for the unbuilt tools (§3), each still a real indexable page with genuine explanatory content, **no fake calculator UI**.

### 6.4 Place of birth (§7)

Three-tier resolution behind one `resolvePlace()` interface, so the engine never knows which tier answered:
1. `/api/locations?q=` — already public, already returns `latitude`/`longitude`, 238 rows.
2. External geocoder for anything not in the table (**decision D4**) — birth villages are the common case and are *not* in those 238 rows.
3. Manual lat/long entry as the last resort, so no user is ever blocked.

**Timezone is a constant, not a lookup.** India is a single zone, IST = UTC+05:30, and has never observed DST. So §7's timezone requirement collapses to a constant for the target audience — no tz database, no tz library. One documented caveat: births **before 1955** may fall under the former Calcutta (+05:53:20) or Bombay (+04:51) local times. Irrelevant for a marriage-age cohort (born ~1985–2006); must be written down rather than silently assumed.

### 6.5 Privacy (§20, DPDP)

Default path: **compute → return → store nothing.** Birth date + exact time + place is sensitive personal data and is also sufficient to re-identify someone.

Persist only on an explicit user action (save or share), and then into a **new** table modelled on `profile_shares` — token, `fields` jsonb, `expires_at`, `revoked_at`, `view_count`, plus the `methodology_version`. Do **not** write to `profiles`/`profile_private`, and do not reuse `kundli_url`, until there is a stated reason. Log no birth details.

## 7. RECOMMENDED IMPLEMENTATION ORDER

The brief's 11 phases are sound; I'd make two changes, both to reduce rework:

**Change 1 — move the engine earlier.** The brief has UI (P3) and animation (P4) before the engine (P5). But the animation's stage list, the koota card set, and the result page's sections are all shaped by what the engine actually returns. Building the UI against an invented result shape guarantees rework in P6–P7.

Instead, land the **`types.ts` + `methodology.ts` contract** in Phase 1 — no calculation, just the frozen shape and documented ruleset — then build UI against a **fixture** that satisfies it. The UI then cannot drift from the engine, and the fixture doubles as the engine's first test case.

**Change 2 — decisions D1/D2 gate Phase 5**, and they are slow (they may need a domain expert). Start them now, in parallel with Phases 1–4.

| Phase | Deliverable | Gate |
|---|---|---|
| 1 | Nav change (bottom-nav slot 5 → `/astrology`) · `/astrology` hub · 8 routes with `ComingSoon` · SEO metadata · sitemap · **`types.ts` + `methodology.ts` skeleton** | — |
| 2 | Hub landing page content, internal links to the 4 `horoscope-marriage` posts | — |
| 3 | Kundli Match input UX — two person cards, place resolution tiers 1 & 3 | needs `types.ts` |
| 4 | Cosmic sequence, driven by a fixture `MatchResult`; skip + reduced-motion from the start | needs P3 |
| 5 | Ephemeris provider + `vedic/` transforms; verified against references | **D1, D2, D3** |
| 6 | `rules/ashtakoota/*` + `manglik.ts` against the frozen tables | **D1, D5, D6** |
| 7 | Full result experience; swap fixture → real API | needs P5+P6 |
| 8 | PDF (print CSS) + share links | **D7** |
| 9 | Validation suite vs. established calculators | needs P5+P6 |
| 10 | Nakshatra / Manglik / Rashi tools **reusing the same engine** (§17) | needs P5 |
| 11 | SEO expansion, FAQ blocks | — |

Phase 1 is deliberately small and ships a real user-visible change (the nav) with near-zero risk to existing functionality.

## 8. POTENTIAL TECHNICAL RISKS

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **Ephemeris on Vercel serverless.** Swiss Ephemeris is native C; `swisseph` needs a compiled binary that will not build reliably on Vercel's runtime | **High** | pick a pure-JS or WASM provider (D2); hide it behind `EphemerisProvider` so it is swappable |
| R2 | **Swiss Ephemeris licensing — AGPL-3.0 or a paid commercial licence.** AGPL on a hosted service has real obligations | **High** | legal decision before adoption; MIT-licensed pure-JS alternatives exist (D2) |
| R3 | **Methodology ambiguity.** Ayanamsha, node type, manglik houses, and Bhakoot/Nadi cancellation all vary by tradition. Picking silently = "AI invented the rules", which the brief forbids | **High** | D1 must be answered and frozen in `methodology.ts` before P5 |
| R4 | **No birth-village coordinates.** 238 locations cannot resolve a Mithila village; this is the single most likely user-facing failure | **High** | three-tier `resolvePlace()` with manual fallback (§6.4) + D4 |
| R5 | **`/api/options` and `/api/pincode` both return 401 to anonymous users.** Public astrology tools cannot use the existing master-data or PIN endpoints as they stand | **High** | add read-only public variants (or a type allowlist on `/api/options`) in P1/P3. **Must not** be done by loosening the shared session check — app code is the only authz layer |
| R6 | Canvas starfield battery/CPU cost on low-end Android | Medium | tiered particle counts; `matchMedia` checks in JS (the global CSS reduced-motion rule does not reach canvas); CSS-only fallback |
| R7 | Adding Framer Motion (~35 kB gz) for an effect the repo already achieves with `data-stage` + CSS keyframes | Medium | don't; follow the `HeroCinematic` precedent |
| R8 | **Pre-existing React #418 hydration error on every page**, root cause unknown | Medium | do not attribute new hydration warnings to astrology code without first reproducing on an untouched page |
| R9 | Unknown or approximate birth time → Lagna is unobtainable and Manglik-from-Lagna becomes unanswerable | Medium | explicit "time unknown" state; degrade to Moon-based values and **say so** in the UI rather than guessing |
| R10 | Rule changes silently altering an already-shared result | Medium | `methodology_version` stamped on every persisted/shared result |
| R11 | Engine output drifting from `community_masters` slugs, so the tool and the profile/biodata disagree | Medium | engine emits the canonical slugs in §5; add a test asserting all 12 + 27 exist in `community_masters` |
| R12 | DPDP exposure from storing birth date + exact time + place | Medium | store-nothing default (§6.5) |
| R13 | Scope pressure to wire astrology into `matchScore.ts` | Low | out of scope until explicitly decided; note the existing "manglik is reported, never scored" stance |

## 9. DEPENDENCIES WE MAY NEED

Current count is 9 runtime deps. Recommendation: **+1, maybe +2.**

| Need | Recommendation |
|---|---|
| **Ephemeris** (the one genuinely new capability) | Candidates: `astronomy-engine` (MIT, pure JS, zero deps, arc-second class for Sun/Moon/planets — enough for rashi/nakshatra/pada and house cusps) · a WASM Swiss Ephemeris build (highest fidelity, licence per R2) · an external astrology API (no local compute; adds latency, cost, a privacy boundary for birth data, and makes determinism depend on a third party). **Decision D2.** Note Rahu/Ketu are *computed* nodes (mean or true), not ephemeris bodies — that is a rules choice, not a library feature |
| **Timezone** | **None.** IST is a constant (§6.4) |
| **Date handling** | **None.** Julian Day conversion is ~20 lines and belongs in `vedic/`; avoid a date lib |
| **Geocoding** | Nominatim/OSM (free, ODbL, strict usage policy, attribution) · Google Geocoding (paid, excellent Indian village coverage) · seed our own village data into `india_locations`. **Decision D4.** Server-side only, so no key reaches the client |
| **Animation** | **None.** `data-stage` + CSS keyframes + a timeline table, per `HeroCinematic`. Canvas only for the starfield, hand-written |
| **PDF** | **None.** `window.print()` + `@media print`, per `BiodataDocument` |
| **Charts / chart diagrams** | **None.** North/South Indian kundli charts are straight lines and text — hand-rolled SVG |
| **Testing** | The repo has **no test runner**. A validation suite (§25) needs one — `node:test` is built into Node 22 and adds zero dependencies. Recommend that over Jest/Vitest |

## 10. DECISIONS REQUIRED BEFORE THE CALCULATION ENGINE

These are domain and legal decisions, not coding ones. **D1 and D2 block Phase 5. D5 and D6 block Phase 6.** Everything in Phases 1–4 can proceed without them.

**D1 — Methodology (must be frozen in `methodology.ts`)**
- **Ayanamsha**: Lahiri/Chitrapaksha (the Indian national standard, and the usual choice for marriage matching) vs Raman vs KP/Krishnamurti. Changes every rashi/nakshatra near a boundary.
- **Node calculation**: Mean vs True Rahu/Ketu.
- **House system**: whole-sign (rashi = bhava, the Vedic norm) vs Sripati vs KP.
- **Lagna** required, or Moon-based values only?
- **Which tradition's rulebook?** This is the product-defining one. Mithila/Maithil panchang convention can differ from generic North Indian practice, and the platform's entire positioning is Maithil-specific. Using a generic ruleset would undercut the differentiator. **Recommend a Maithil pandit or Mithila Panchang authority reviews and signs off on the frozen tables** — and that we publish the methodology on the site, which is also a trust and SEO asset.

**D2 — Ephemeris source**: pure-JS vs WASM Swiss Ephemeris vs external API. Drives R1, R2, accuracy, cost and privacy. *(The brief forbids invented calculations; this decision is how we comply.)*

**D3 — Accuracy target and tolerance**: what deviation from reference calculators counts as a pass in §25? (e.g. planetary longitude within 1 arc-minute; rashi/nakshatra/pada exact.) Without a number, "verified" is unfalsifiable.

**D4 — Geocoding provider** for birth places outside the 238 known locations, including licence and attribution.

**D5 — Manglik rules**: which houses (1/2/4/7/8/12 from Lagna is the common set) · reckoned from Lagna only, or also Moon and Venus · which cancellation (*dosha bhanga*) rules apply · how `anshik` (partial) is defined, given the vocabulary already offers it.

**D6 — Ashtakoota details**: the 36 total is fixed (Varna 1 · Vashya 2 · Tara 3 · Yoni 4 · Graha Maitri 5 · Gana 6 · Bhakoot 7 · Nadi 8), but the variable parts are: Bhakoot dosha and its exceptions · Nadi dosha and its exceptions · whether Graha Maitri uses lord friendship or Moon-sign lords · which score bands map to which verdict, and the exact wording of each verdict.

**D7 — Share/persistence policy**: does a shared Kundli result embed the birth details or only the computed output? Default expiry? Revocable? Who may open the link?

**D8 — Positioning and disclaimer**: astrology output is traditional guidance, never a guarantee of a match or marriage — consistent with the rule already applied to profiles. Needs agreed wording before anything is published or shared.

**D9 — Languages**: English only at first, or the 4-language treatment the biodata tool has? `community_masters.label_hi` and `label_mai` are **NULL today** for rashi and nakshatra, so a Hindi/Maithili UI needs that data populated first.

---

**Status: awaiting phase-specific prompts.** No code written. No dependency added. No existing route, component or DB object modified.
